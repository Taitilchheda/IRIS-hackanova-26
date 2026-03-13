"""
Comparator Agent — aligns equity curves, computes metrics, builds Tearsheet.
"""
from __future__ import annotations
import pandas as pd
import numpy as np
from app.nlp.schema import AgentResult, StrategySpec, Tearsheet, TearsheetMetrics
from app.tearsheet.metrics import compute_metrics
from app.data.loader import load_ohlcv
from app.utils.dates import years_between
from app.utils.logger import get_logger

log = get_logger(__name__)


def _align_curves(equity: list[float], dates: list[str],
                  target_dates: list[str]) -> list[float]:
    """Align an equity curve to target_dates by forward-fill."""
    if not equity or not dates:
        return [0.0] * len(target_dates)
    s = pd.Series(equity, index=pd.to_datetime(dates))
    target_idx = pd.to_datetime(target_dates)
    aligned = s.reindex(target_idx).ffill().bfill()
    return [round(float(v), 2) for v in aligned.values]


class ComparatorAgent:
    name = "Comparator"

    def compare(self, trader: AgentResult, expert: AgentResult,
                spec: StrategySpec, run_id: str) -> Tearsheet:
        log.info(f"[{self.name}] Comparing trader vs expert")
        years = years_between(spec.start_date, spec.end_date)

        # Use trader dates as canonical
        ref_dates = trader.dates if trader.dates else expert.dates

        # Align expert curve to trader dates
        expert_eq = _align_curves(expert.equity_curve, expert.dates, ref_dates)

        # Fetch SPY benchmark
        benchmark_equity = []
        try:
            spy = load_ohlcv("SPY", spec.start_date, spec.end_date)
            spy_close = spy["Close"].values
            spy_dates = [str(d.date()) for d in spy.index]
            spy_returns = np.diff(spy_close) / spy_close[:-1]
            capital = spec.initial_capital
            spy_equity = [capital]
            for r in spy_returns:
                capital = spy_equity[-1] * (1 + r)
                spy_equity.append(round(capital, 2))
            benchmark_equity = _align_curves(spy_equity, spy_dates, ref_dates)
        except Exception as e:
            log.warning(f"Could not load SPY benchmark: {e}")
            benchmark_equity = [spec.initial_capital] * len(ref_dates)

        # Compute metrics
        trader_metrics = compute_metrics(trader.equity_curve, trader.trade_log, years)
        expert_metrics = compute_metrics(expert_eq, expert.trade_log, years)
        bench_metrics = compute_metrics(benchmark_equity, [], years)

        log.info(f"[{self.name}] Trader Sharpe={trader_metrics.sharpe}, "
                 f"Expert Sharpe={expert_metrics.sharpe}")

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
                equity_curve=expert_eq,
                dates=ref_dates,
                trade_log=expert.trade_log,
                metrics=expert.metrics,
                elapsed_seconds=expert.elapsed_seconds,
            ),
            trader_metrics=trader_metrics,
            expert_metrics=expert_metrics,
            benchmark_equity=benchmark_equity,
            benchmark_metrics=bench_metrics,
            expert_type=expert.agent_name,
        )
