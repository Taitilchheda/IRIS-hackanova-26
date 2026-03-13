"""
Tests for Kalman Filter hedge ratio estimation.
"""
import numpy as np
import pytest
from app.algorithms.alpha.kalman_filter import KalmanHedgeFilter


@pytest.fixture
def linear_pair():
    """y ≈ 1.5*x with noise — should converge to hedge ratio ≈ 1.5."""
    rng = np.random.default_rng(7)
    n = 250
    x = np.cumsum(rng.normal(0, 1, n)) + 100
    y = 1.5 * x + rng.normal(0, 0.5, n)
    return x, y


def test_output_length(linear_pair):
    x, y = linear_pair
    kf = KalmanHedgeFilter().fit(x, y)
    assert len(kf.beta_history) == len(x)


def test_hedge_converges(linear_pair):
    """Hedge ratio should converge to approximately 1.5 after warm-up."""
    x, y = linear_pair
    kf = KalmanHedgeFilter(process_noise=1e-4, obs_noise=1e-3).fit(x, y)
    final_beta = kf.beta_history[-1]
    assert abs(final_beta - 1.5) < 0.5


def test_no_nans(linear_pair):
    x, y = linear_pair
    kf = KalmanHedgeFilter().fit(x, y)
    assert not np.any(np.isnan(kf.beta_history))
    assert not np.any(np.isnan(kf.P_history))


def test_spread_length(linear_pair):
    x, y = linear_pair
    kf = KalmanHedgeFilter().fit(x, y)
    spread = kf.spread(x, y)
    assert len(spread) == len(x)


def test_zscore_length(linear_pair):
    x, y = linear_pair
    kf = KalmanHedgeFilter().fit(x, y)
    z = kf.zscore(x, y, window=20)
    assert len(z) == len(x)


def test_p_variance_non_negative(linear_pair):
    x, y = linear_pair
    kf = KalmanHedgeFilter().fit(x, y)
    assert np.all(kf.P_history >= 0)
