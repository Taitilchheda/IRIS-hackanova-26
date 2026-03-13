"""
Shared pytest fixtures for IRIS tests.
"""
import pytest
import numpy as np
import pandas as pd
from unittest.mock import patch


@pytest.fixture
def sample_ohlcv():
    """Generate 252 bars of synthetic OHLCV data."""
    np.random.seed(42)
    n = 252
    dates = pd.date_range("2023-01-01", periods=n, freq="B")
    close = 100.0 * np.cumprod(1 + np.random.normal(0.0005, 0.015, n))
    spread = close * 0.003
    rng = np.random.default_rng(42)
    df = pd.DataFrame({
        "Open":   close - rng.uniform(-spread, spread),
        "High":   close + rng.uniform(0, spread),
        "Low":    close - rng.uniform(0, spread),
        "Close":  close,
        "Volume": rng.integers(1_000_000, 5_000_000, n).astype(float),
    }, index=dates)
    return df


@pytest.fixture
def sample_spec():
    """Minimal StrategySpec for testing."""
    from app.nlp.schema import StrategySpec, TradeCondition, StrategyType
    return StrategySpec(
        raw_prompt="Buy when 50-day MA crosses above 200-day MA. Sell when RSI > 70.",
        asset="AAPL",
        start_date="2019-01-01",
        end_date="2024-12-31",
        initial_capital=100_000.0,
        commission_pct=0.001,
        slippage_pct=0.0005,
        strategy_type=StrategyType.ALPHA_SIGNAL,
        entry_conditions=[
            TradeCondition(
                indicator="SMA", params={"window": 50},
                operator="crosses_above",
                value={"indicator": "SMA", "params": {"window": 200}}
            )
        ],
        exit_conditions=[
            TradeCondition(
                indicator="RSI", params={"period": 14},
                operator=">", value=70.0
            )
        ],
    )


@pytest.fixture
def equity_curve():
    """A realistic equity curve for metric testing."""
    np.random.seed(99)
    n = 500
    returns = np.random.normal(0.0006, 0.012, n)
    eq = 100_000.0 * np.cumprod(1 + returns)
    return eq.tolist()
