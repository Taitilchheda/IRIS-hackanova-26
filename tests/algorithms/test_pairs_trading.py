"""
Tests for Pairs Trading algorithm.
"""
import numpy as np
import pytest
from app.algorithms.alpha.pairs_trading import cointegration_test, spread_zscore, PairsTradingSignal


@pytest.fixture
def cointegrated_pair():
    """Generate a cointegrated pair y = 2*x + noise."""
    rng = np.random.default_rng(42)
    n = 300
    x = np.cumsum(rng.normal(0, 1, n)) + 100
    y = 2.0 * x + rng.normal(0, 0.5, n)
    return x, y


def test_cointegration_detects_cointegrated_pair(cointegrated_pair):
    x, y = cointegrated_pair
    result = cointegration_test(y, x)
    assert "cointegrated" in result
    assert "hedge_ratio" in result
    assert "pvalue" in result
    assert "spread" in result
    assert len(result["spread"]) == len(x)


def test_hedge_ratio_approx_correct(cointegrated_pair):
    x, y = cointegrated_pair
    result = cointegration_test(y, x)
    # y = 2*x + noise → hedge ratio ≈ 2.0
    assert abs(result["hedge_ratio"] - 2.0) < 0.1


def test_zscore_window(cointegrated_pair):
    x, y = cointegrated_pair
    result = cointegration_test(y, x)
    spread = result["spread"]
    z = spread_zscore(spread, window=30)
    assert len(z) == len(spread)
    # Z-score before window should be 0
    assert z[0] == 0.0
    assert z[29] == 0.0


def test_zscore_roughly_standard_normal(cointegrated_pair):
    """After window, z-scores should be roughly mean=0, std≈1."""
    x, y = cointegrated_pair
    result = cointegration_test(y, x)
    z = spread_zscore(result["spread"], window=30)
    active = z[30:]  # after warm-up
    assert abs(np.mean(active)) < 0.5
    assert 0.5 < np.std(active) < 2.0


def test_pairs_signal_fit(cointegrated_pair):
    x, y = cointegrated_pair
    sig = PairsTradingSignal(entry_z=1.0, exit_z=0.0, window=30)
    sig.fit(x, y)
    assert hasattr(sig, "hedge_ratio")
    assert abs(sig.hedge_ratio - 2.0) < 0.2


def test_pairs_signal_generate(cointegrated_pair):
    x, y = cointegrated_pair
    sig = PairsTradingSignal().fit(x, y)
    df = sig.generate_signals(x, y)
    assert set(df.columns) >= {"spread", "zscore", "position"}
    assert len(df) == len(x)
    assert set(df["position"].unique()).issubset({-1, 0, 1})
