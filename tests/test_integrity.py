import os
from pathlib import Path
import pandas as pd
import pytest

from app.data import loader
from app.tearsheet.metrics import compute_metrics
from app.tearsheet.builder import build_tearsheet
from app.nlp.schema import AgentResult, StrategySpec, StrategyType

CACHE_DIR = Path(loader.CACHE_DIR)


def test_loader_raises_when_providers_fail(monkeypatch, tmp_path):
    """If all providers return empty, loader must raise (no synthetic/hardcode)."""
    ticker = "TEST"
    start, end = "2020-01-01", "2020-01-10"
    cache_file = CACHE_DIR / f"{ticker}_{start}_{end}.parquet"
    if cache_file.exists():
        cache_file.unlink()

    # Patch yfinance download to empty DF (module-level)
    monkeypatch.setattr("yfinance.download", lambda *args, **kwargs: pd.DataFrame())

    # Patch stooq fetch to empty
    monkeypatch.setattr(loader, "_fetch_stooq", lambda *args, **kwargs: pd.DataFrame())

    with pytest.raises(ValueError):
        loader.load_ohlcv(ticker, start, end)


def test_metrics_zero_on_empty_equity():
    m = compute_metrics([], [], years=1)
    assert m.total_return == 0
    assert m.sharpe == 0
    assert m.trade_count == 0


def test_build_tearsheet_uses_real_curves_alignment():
    spec = StrategySpec(raw_prompt="test", asset="ABC", start_date="2020-01-01", end_date="2020-01-10", initial_capital=100000, strategy_type=StrategyType.ALPHA_SIGNAL)
    trader_eq = [100000, 101000, 102500, 101800, 103200, 104000, 105500]
    expert_eq = [100000, 100700, 101300, 102200, 102900, 103400, 104200]
    dates = ["2020-01-01","2020-01-02","2020-01-03","2020-01-04","2020-01-05","2020-01-06","2020-01-07"]
    trader = AgentResult(agent_name="trader", equity_curve=trader_eq, dates=dates, trade_log=[{"side":"SELL","pnl_pct":1.0}], metrics={}, elapsed_seconds=0.1)
    expert = AgentResult(agent_name="expert", equity_curve=expert_eq, dates=dates, trade_log=[{"side":"SELL","pnl_pct":0.5}], metrics={}, elapsed_seconds=0.1)
    bench = [100000,100800,101200,101000,101500,102000,102400]
    ts = build_tearsheet(trader, expert, spec, run_id="TEST123", benchmark_equity=bench)
    assert ts.trader_metrics.total_return > 0
    assert ts.expert_metrics.total_return > 0
    assert len(ts.trader.equity_curve) == len(ts.expert.equity_curve) == len(ts.benchmark_equity)
