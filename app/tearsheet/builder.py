"""
Tearsheet builder: assembles TearsheetResult from AgentResults.
"""
from __future__ import annotations
from app.nlp.schema import AgentResult, StrategySpec, Tearsheet, TearsheetMetrics
from app.tearsheet.metrics import compute_metrics
from app.utils.dates import years_between
from app.utils.logger import get_logger
import pandas as pd
import numpy as np

log = get_logger(__name__)


def _align_to_ref(
    equity: list[float],
    dates: list[str],
    ref_dates: list[str],
) -> list[float]:
    """Forward-fill an equity curve to align to ref_dates."""
    if not equity or not dates:
        return [0.0] * len(ref_dates)
    s = pd.Series(equity, index=pd.to_datetime(dates))
    target_idx = pd.to_datetime(ref_dates)
    aligned = s.reindex(target_idx).ffill().bfill()
    return [round(float(v), 2) for v in aligned.values]


def build_tearsheet(
    trader: AgentResult,
    expert: AgentResult,
    spec: StrategySpec,
    run_id: str,
    benchmark_equity: list[float] | None = None,
    narrative: str = "",
) -> Tearsheet:
    """
    Assemble a complete Tearsheet from two AgentResults.

    Parameters
    ----------
    trader          : AgentResult from TraderStrategyAgent
    expert          : AgentResult from an ExpertAgent
    spec            : StrategySpec used for the run
    run_id          : unique run identifier
    benchmark_equity: equity curve for SPY/benchmark (optional)
    narrative       : LLM-generated narrative string (optional)

    Returns
    -------
    Tearsheet pydantic model
    """
    years = years_between(spec.start_date, spec.end_date)
    ref_dates = trader.dates if trader.dates else expert.dates

    # Align expert equity to trader dates
    expert_eq_aligned = _align_to_ref(expert.equity_curve, expert.dates, ref_dates)

    # Benchmark fallback
    if benchmark_equity is None or len(benchmark_equity) == 0:
        benchmark_equity = [spec.initial_capital] * len(ref_dates)
    else:
        benchmark_equity = _align_to_ref(benchmark_equity, ref_dates, ref_dates)

    # Compute metrics
    trader_m = compute_metrics(trader.equity_curve, trader.trade_log, years)
    expert_m = compute_metrics(expert_eq_aligned, expert.trade_log, years)
    bench_m = compute_metrics(benchmark_equity, [], years)

    log.info(
        f"[TearsheetBuilder] run_id={run_id} | "
        f"Trader Sharpe={trader_m.sharpe} | Expert Sharpe={expert_m.sharpe}"
    )

    return Tearsheet(
        run_id=run_id,
        strategy_spec=spec,
        trader=AgentResult(
            agent_name=trader.agent_name,
            equity_curve=trader.equity_curve,
            dates=ref_dates,
            trade_log=trader.trade_log,
            metrics=trader.metrics,
            elapsed_seconds=trader.elapsed_seconds,
        ),
        expert=AgentResult(
            agent_name=expert.agent_name,
            equity_curve=expert_eq_aligned,
            dates=ref_dates,
            trade_log=expert.trade_log,
            metrics=expert.metrics,
            elapsed_seconds=expert.elapsed_seconds,
        ),
        trader_metrics=trader_m,
        expert_metrics=expert_m,
        benchmark_equity=benchmark_equity,
        benchmark_metrics=bench_m,
        narrative=narrative,
        expert_type=expert.agent_name,
    )
