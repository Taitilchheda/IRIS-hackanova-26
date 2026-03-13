"""
Tests for Monte Carlo simulation.
"""
import numpy as np
import pytest
from app.algorithms.risk.monte_carlo import simulate_gbm_paths, value_at_risk, cvar


def test_paths_shape():
    paths = simulate_gbm_paths(S0=100, mu=0.08, sigma=0.20, n_days=252, n_paths=100)
    assert paths.shape == (100, 253)  # 252 steps + initial


def test_paths_initial_value():
    paths = simulate_gbm_paths(100, 0.08, 0.20, 252, 50)
    assert np.allclose(paths[:, 0], 100.0)


def test_paths_non_negative():
    paths = simulate_gbm_paths(100, 0.08, 0.20, 252, 200)
    assert np.all(paths >= 0)


def test_paths_deterministic_seed():
    p1 = simulate_gbm_paths(100, 0.08, 0.20, 50, 10, seed=99)
    p2 = simulate_gbm_paths(100, 0.08, 0.20, 50, 10, seed=99)
    np.testing.assert_array_equal(p1, p2)


def test_paths_different_seeds():
    p1 = simulate_gbm_paths(100, 0.08, 0.20, 50, 10, seed=1)
    p2 = simulate_gbm_paths(100, 0.08, 0.20, 50, 10, seed=2)
    assert not np.allclose(p1, p2)


def test_var_ordering():
    """95% VaR should be larger than 99% VaR (more conservative cutoff → smaller VaR)."""
    paths = simulate_gbm_paths(100_000, 0.05, 0.20, 252, 1000)
    var_95 = value_at_risk(paths, 0.95)
    var_99 = value_at_risk(paths, 0.99)
    # 99% VaR is larger (more extreme loss)
    assert var_99 >= var_95


def test_cvar_exceeds_var():
    paths = simulate_gbm_paths(100_000, 0.05, 0.20, 252, 500)
    v = value_at_risk(paths, 0.95)
    c = cvar(paths, 0.95)
    assert c >= v - 1  # CVaR should be at least as large as VaR
