"""
Tests for backtest engine components.
"""
import pytest
import pandas as pd
import numpy as np
from app.engine.friction import FrictionModel
from app.engine.portfolio import Portfolio
from app.engine.event import Fill, Position
from app.engine.runner import BacktestRunner


def test_friction_buy_increases_price():
    fm = FrictionModel(commission_pct=0.001, slippage_pct=0.001)
    fill_price, comm, slip = fm.apply(100.0, 10, "BUY")
    assert fill_price > 100.0
    assert comm > 0
    assert slip > 0


def test_friction_sell_decreases_price():
    fm = FrictionModel(commission_pct=0.001, slippage_pct=0.001)
    fill_price, comm, slip = fm.apply(100.0, 10, "SELL")
    assert fill_price < 100.0


def test_portfolio_buy_reduces_cash():
    p = Portfolio(initial_capital=100_000.0)
    fill = Fill(date="2020-01-01", ticker="AAPL", side="BUY",
                quantity=100, fill_price=150.0, commission=15.0, slippage=0.0)
    p.apply_fill(fill)
    assert p.cash < 100_000.0
    assert p.in_position("AAPL")


def test_portfolio_buy_sell_pnl():
    p = Portfolio(initial_capital=100_000.0)
    # Buy 100 shares at $100
    buy = Fill("2020-01-01", "TEST", "BUY", 100, 100.0, 0.0, 0.0)
    p.apply_fill(buy)
    # Sell at $110 (profit)
    sell = Fill("2020-06-01", "TEST", "SELL", 100, 110.0, 0.0, 0.0)
    p.apply_fill(sell)
    # Cash should have grown
    assert p.cash > 100_000.0
    assert p.positions["TEST"].realised_pnl > 0


def test_backtest_runner_buy_and_hold(sample_ohlcv, sample_spec):
    """Buy-and-hold (no conditions) should produce monotonically reasonable curve."""
    from app.nlp.schema import StrategySpec, StrategyType
    spec = sample_spec.model_copy(update={"entry_conditions": [], "exit_conditions": []})

    # Use a real-ish data slice
    runner = BacktestRunner(spec=spec, data=sample_ohlcv)
    eq, dates, trades = runner.run()

    assert len(eq) == len(sample_ohlcv)
    assert eq[0] > 0
    assert len(dates) == len(sample_ohlcv)
    # Should have entered and closed
    assert len(trades) >= 1


def test_backtest_runner_with_ma_crossover(sample_ohlcv, sample_spec):
    """MA crossover spec should produce trades on sample data."""
    runner = BacktestRunner(spec=sample_spec, data=sample_ohlcv)
    eq, dates, trades = runner.run()

    assert len(eq) > 0
    assert all(e > 0 for e in eq)
    assert len(dates) == len(sample_ohlcv)


def test_portfolio_equity_tracks_mark(sample_spec):
    p = Portfolio(initial_capital=50_000.0)
    assert p.equity == 50_000.0
    fill = Fill("2020-01-01", "TEST", "BUY", 100, 100.0, 0.0, 0.0)
    p.apply_fill(fill)
    marked = p.mark_to_market({"TEST": 120.0})
    expected_equity = p.cash + 100 * 120.0
    assert abs(marked - expected_equity) < 0.01
