"""
Mean-Variance Portfolio Optimisation (Markowitz Efficient Frontier).
Provides: efficient_frontier, max_sharpe_weights, min_variance_weights
"""
from __future__ import annotations
import numpy as np
from typing import Optional
from scipy.optimize import minimize


def _portfolio_stats(
    weights: np.ndarray,
    mean_returns: np.ndarray,
    cov_matrix: np.ndarray,
    rf: float = 0.04,
) -> tuple[float, float, float]:
    """Return (expected_return, volatility, sharpe) for a weight vector."""
    port_return = float(np.dot(weights, mean_returns))
    port_var = float(weights @ cov_matrix @ weights)
    port_std = float(np.sqrt(max(port_var, 1e-12)))
    sharpe = (port_return - rf) / port_std if port_std > 0 else 0.0
    return port_return, port_std, sharpe


def max_sharpe_weights(
    mean_returns: np.ndarray,
    cov_matrix: np.ndarray,
    rf: float = 0.04,
    allow_short: bool = False,
) -> np.ndarray:
    """
    Find portfolio weights that maximise the Sharpe ratio.

    Parameters
    ----------
    mean_returns : 1-D array of annualised expected returns per asset
    cov_matrix   : (n x n) annualised covariance matrix
    rf           : risk-free rate
    allow_short  : if True, shorting is permitted (weights in [-1, 1])

    Returns
    -------
    1-D array of optimal weights (sum to 1)
    """
    n = len(mean_returns)
    bounds = ((-1.0, 1.0) if allow_short else (0.0, 1.0),) * n
    constraints = {"type": "eq", "fun": lambda w: np.sum(w) - 1.0}
    x0 = np.full(n, 1.0 / n)

    def neg_sharpe(w):
        ret, std, _ = _portfolio_stats(w, mean_returns, cov_matrix, rf)
        return -(ret - rf) / (std + 1e-10)

    result = minimize(
        neg_sharpe, x0,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"ftol": 1e-9, "maxiter": 1000},
    )
    return result.x if result.success else x0


def min_variance_weights(
    cov_matrix: np.ndarray,
    allow_short: bool = False,
) -> np.ndarray:
    """Find the global minimum-variance portfolio weights."""
    n = cov_matrix.shape[0]
    bounds = ((-1.0, 1.0) if allow_short else (0.0, 1.0),) * n
    constraints = {"type": "eq", "fun": lambda w: np.sum(w) - 1.0}
    x0 = np.full(n, 1.0 / n)

    def portfolio_variance(w):
        return float(w @ cov_matrix @ w)

    result = minimize(
        portfolio_variance, x0,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"ftol": 1e-9, "maxiter": 1000},
    )
    return result.x if result.success else x0


def efficient_frontier(
    mean_returns: np.ndarray,
    cov_matrix: np.ndarray,
    n_points: int = 50,
    rf: float = 0.04,
) -> dict:
    """
    Compute the efficient frontier.

    Returns
    -------
    dict with keys:
        returns    : list of portfolio expected returns
        vols       : list of portfolio volatilities
        sharpes    : list of Sharpe ratios
        max_sharpe_weights : array of max-Sharpe weights
        min_var_weights    : array of min-var weights
    """
    n = len(mean_returns)
    target_returns = np.linspace(
        float(np.min(mean_returns)),
        float(np.max(mean_returns)),
        n_points,
    )
    frontier_vols = []
    frontier_rets = []
    frontier_sharpes = []

    for target in target_returns:
        constraints = [
            {"type": "eq", "fun": lambda w: np.sum(w) - 1.0},
            {"type": "eq", "fun": lambda w, t=target: float(np.dot(w, mean_returns)) - t},
        ]
        bounds = ((0.0, 1.0),) * n
        x0 = np.full(n, 1.0 / n)

        res = minimize(
            lambda w: float(w @ cov_matrix @ w),
            x0, method="SLSQP",
            bounds=bounds, constraints=constraints,
            options={"ftol": 1e-9, "maxiter": 500},
        )
        if res.success:
            ret, vol, sharpe = _portfolio_stats(res.x, mean_returns, cov_matrix, rf)
            frontier_rets.append(round(ret, 6))
            frontier_vols.append(round(vol, 6))
            frontier_sharpes.append(round(sharpe, 4))

    return {
        "returns": frontier_rets,
        "vols": frontier_vols,
        "sharpes": frontier_sharpes,
        "max_sharpe_weights": max_sharpe_weights(mean_returns, cov_matrix, rf).tolist(),
        "min_var_weights": min_variance_weights(cov_matrix).tolist(),
    }
