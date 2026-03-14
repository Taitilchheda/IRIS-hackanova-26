"""
Comparator Agent — aligns equity curves, computes metrics, builds Tearsheet.
"""
from __future__ import annotations
import pandas as pd
import numpy as np
from app.nlp.schema import AgentResult, StrategySpec, Tearsheet
from app.tearsheet.builder import build_tearsheet
from app.data.loader import load_ohlcv
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

        # Use trader dates as canonical
        ref_dates = trader.dates if trader.dates else expert.dates

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

        tearsheet = build_tearsheet(trader, expert, spec, run_id, benchmark_equity=benchmark_equity)

        return tearsheet
