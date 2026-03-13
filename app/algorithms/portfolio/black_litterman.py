"""
Black-Litterman portfolio model.
Blends market equilibrium returns with investor views.
Provides: black_litterman_weights
"""
from __future__ import annotations
import numpy as np
from typing import Optional
from app.algorithms.portfolio.mean_variance import max_sharpe_weights


def market_implied_returns(
    weights_mkt: np.ndarray,
    cov_matrix: np.ndarray,
    delta: float = 2.5,
    rf: float = 0.04,
) -> np.ndarray:
    """
    Compute market-implied equilibrium excess returns (Pi) via reverse optimisation.

    Pi = delta * Sigma * w_mkt
    """
    return delta * cov_matrix @ weights_mkt


def black_litterman_returns(
    cov_matrix: np.ndarray,
    weights_mkt: np.ndarray,
    P: Optional[np.ndarray] = None,
    Q: Optional[np.ndarray] = None,
    omega: Optional[np.ndarray] = None,
    delta: float = 2.5,
    tau: float = 0.05,
) -> np.ndarray:
    """
    Compute Black-Litterman posterior expected returns.

    Parameters
    ----------
    cov_matrix   : (n x n) asset covariance matrix
    weights_mkt  : (n,) market capitalisation weights
    P            : (k x n) views matrix (each row is an asset combination)
    Q            : (k,) view expected returns
    omega        : (k x k) view uncertainty (diagonal); defaults to tau*P*Sigma*P'
    delta        : risk aversion coefficient (default 2.5)
    tau          : scaling parameter (default 0.05)

    Returns
    -------
    (n,) array of posterior expected returns (mu_BL)
    """
    Pi = market_implied_returns(weights_mkt, cov_matrix, delta)
    Sigma = cov_matrix
    tau_Sigma = tau * Sigma

    if P is None or Q is None:
        # No views: return equilibrium
        return Pi

    P = np.atleast_2d(P)
    Q = np.atleast_1d(Q)
    k = P.shape[0]

    if omega is None:
        # Proportional to prior uncertainty
        omega = np.diag(np.diag(tau * P @ Sigma @ P.T))

    # BL posterior
    # mu_BL = [(tau*Sigma)^{-1} + P' * Omega^{-1} * P]^{-1}
    #          * [(tau*Sigma)^{-1} * Pi + P' * Omega^{-1} * Q]
    tau_Sigma_inv = np.linalg.inv(tau_Sigma)
    omega_inv = np.linalg.inv(omega)

    left = np.linalg.inv(tau_Sigma_inv + P.T @ omega_inv @ P)
    right = tau_Sigma_inv @ Pi + P.T @ omega_inv @ Q
    mu_bl = left @ right
    return mu_bl


def black_litterman_weights(
    cov_matrix: np.ndarray,
    weights_mkt: np.ndarray,
    P: Optional[np.ndarray] = None,
    Q: Optional[np.ndarray] = None,
    omega: Optional[np.ndarray] = None,
    delta: float = 2.5,
    tau: float = 0.05,
    rf: float = 0.04,
) -> np.ndarray:
    """
    Full Black-Litterman pipeline: equilibrium + views → posterior → max-Sharpe weights.

    Returns
    -------
    (n,) array of portfolio weights (sum to 1, long-only)
    """
    mu_bl = black_litterman_returns(
        cov_matrix, weights_mkt, P, Q, omega, delta, tau
    )
    # Annualise if needed (BL returns are already in consistent units)
    weights = max_sharpe_weights(mu_bl, cov_matrix, rf=rf)
    return weights
