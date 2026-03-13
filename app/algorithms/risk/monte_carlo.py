"""
Monte Carlo GBM path simulation.
Provides: simulate_gbm_paths, value_at_risk, cvar
"""
from __future__ import annotations
import numpy as np
from typing import Optional


def simulate_gbm_paths(
    S0: float,
    mu: float,
    sigma: float,
    n_days: int,
    n_paths: int,
    seed: Optional[int] = 42,
) -> np.ndarray:
    """
    Simulate Geometric Brownian Motion paths.

    Parameters
    ----------
    S0       : initial price / portfolio value
    mu       : annualised drift (e.g. 0.08 for 8%)
    sigma    : annualised volatility (e.g. 0.20 for 20%)
    n_days   : number of trading days to simulate
    n_paths  : number of Monte Carlo paths
    seed     : random seed for reproducibility

    Returns
    -------
    np.ndarray of shape (n_paths, n_days + 1) — column 0 is S0
    """
    rng = np.random.default_rng(seed)
    dt = 1 / 252
    drift = (mu - 0.5 * sigma ** 2) * dt
    diffusion = sigma * np.sqrt(dt)
    z = rng.standard_normal((n_paths, n_days))
    log_returns = drift + diffusion * z
    # Prepend zeros so cumsum gives log-price relative to S0
    paths = S0 * np.exp(np.cumsum(log_returns, axis=1))
    # Prepend initial value
    return np.column_stack([np.full(n_paths, S0), paths])


def value_at_risk(
    paths: np.ndarray, confidence: float = 0.95, horizon: int = -1
) -> float:
    """
    Compute Value-at-Risk from a set of GBM paths.

    Parameters
    ----------
    paths      : (n_paths, n_days+1) array of portfolio values
    confidence : VaR confidence level (e.g. 0.95 = 95 %)
    horizon    : column index for terminal step (default -1 = last)

    Returns
    -------
    VaR as a positive dollar loss (e.g. 5000 means "lose up to $5,000")
    """
    terminal = paths[:, horizon]
    initial = paths[:, 0]
    pnl = terminal - initial
    var_threshold = np.percentile(pnl, (1 - confidence) * 100)
    return float(-var_threshold)


def cvar(
    paths: np.ndarray, confidence: float = 0.95, horizon: int = -1
) -> float:
    """
    Compute Conditional VaR (Expected Shortfall) from paths.

    Returns the expected loss given that the loss exceeds VaR.
    """
    terminal = paths[:, horizon]
    initial = paths[:, 0]
    pnl = terminal - initial
    cutoff = np.percentile(pnl, (1 - confidence) * 100)
    tail = pnl[pnl <= cutoff]
    return float(-np.mean(tail)) if len(tail) > 0 else 0.0


def annualised_return_distribution(
    paths: np.ndarray, years: float
) -> dict:
    """Summary statistics of the distribution of annualised returns."""
    terminal = paths[:, -1]
    initial = paths[:, 0]
    cagr_paths = (terminal / initial) ** (1 / years) - 1
    return {
        "p5":  float(np.percentile(cagr_paths, 5)),
        "p25": float(np.percentile(cagr_paths, 25)),
        "p50": float(np.percentile(cagr_paths, 50)),
        "p75": float(np.percentile(cagr_paths, 75)),
        "p95": float(np.percentile(cagr_paths, 95)),
        "mean": float(np.mean(cagr_paths)),
    }
