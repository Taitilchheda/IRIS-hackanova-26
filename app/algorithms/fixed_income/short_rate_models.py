"""
Short Rate Models: Vasicek and CIR.
Provides: VasicekModel, CIRModel
"""
from __future__ import annotations
import numpy as np
from typing import Optional


class VasicekModel:
    """
    Vasicek mean-reverting short rate model.

    dr_t = kappa * (theta - r_t) * dt + sigma * dW_t

    Parameters
    ----------
    kappa : mean-reversion speed (e.g. 0.1)
    theta : long-run mean rate (e.g. 0.04 = 4%)
    sigma : volatility of rate changes (e.g. 0.01)
    r0    : initial short rate
    """

    def __init__(
        self,
        kappa: float = 0.1,
        theta: float = 0.04,
        sigma: float = 0.01,
        r0: float = 0.03,
    ):
        self.kappa = kappa
        self.theta = theta
        self.sigma = sigma
        self.r0 = r0

    def simulate(
        self,
        T: float = 1.0,
        n_steps: int = 252,
        n_paths: int = 1000,
        seed: Optional[int] = 42,
    ) -> np.ndarray:
        """
        Simulate Vasicek paths using Euler-Maruyama discretisation.

        Returns
        -------
        np.ndarray of shape (n_paths, n_steps + 1)
        """
        rng = np.random.default_rng(seed)
        dt = T / n_steps
        paths = np.zeros((n_paths, n_steps + 1))
        paths[:, 0] = self.r0

        for t in range(1, n_steps + 1):
            z = rng.standard_normal(n_paths)
            r_prev = paths[:, t - 1]
            drift = self.kappa * (self.theta - r_prev) * dt
            diffusion = self.sigma * np.sqrt(dt) * z
            paths[:, t] = r_prev + drift + diffusion

        return paths

    def zero_coupon_price(
        self, r: float, T: float
    ) -> float:
        """
        Closed-form zero-coupon bond price P(t, T) under Vasicek.

        P(0, T) = A(T) * exp(-B(T) * r_0)
        """
        kappa, theta, sigma = self.kappa, self.theta, self.sigma
        if kappa == 0:
            B = T
        else:
            B = (1 - np.exp(-kappa * T)) / kappa

        A_exp = np.exp(
            (theta - sigma ** 2 / (2 * kappa ** 2)) * (B - T)
            - sigma ** 2 * B ** 2 / (4 * kappa)
        )
        return float(A_exp * np.exp(-B * r))

    def yield_curve(
        self, r: float, maturities: np.ndarray
    ) -> np.ndarray:
        """Return the zero-coupon yield for each maturity."""
        prices = np.array([self.zero_coupon_price(r, T) for T in maturities])
        yields = -np.log(prices) / maturities
        return yields


class CIRModel:
    """
    Cox-Ingersoll-Ross (CIR) short rate model.

    dr_t = kappa * (theta - r_t) * dt + sigma * sqrt(r_t) * dW_t

    Ensures non-negative rates when 2*kappa*theta >= sigma² (Feller condition).

    Parameters
    ----------
    kappa : mean-reversion speed
    theta : long-run mean rate
    sigma : volatility coefficient
    r0    : initial short rate
    """

    def __init__(
        self,
        kappa: float = 0.15,
        theta: float = 0.04,
        sigma: float = 0.08,
        r0: float = 0.03,
    ):
        self.kappa = kappa
        self.theta = theta
        self.sigma = sigma
        self.r0 = r0

    def simulate(
        self,
        T: float = 1.0,
        n_steps: int = 252,
        n_paths: int = 1000,
        seed: Optional[int] = 42,
    ) -> np.ndarray:
        """
        Simulate CIR paths using Euler-Maruyama with rate floor at 0.

        Returns
        -------
        np.ndarray of shape (n_paths, n_steps + 1)
        """
        rng = np.random.default_rng(seed)
        dt = T / n_steps
        paths = np.zeros((n_paths, n_steps + 1))
        paths[:, 0] = max(self.r0, 1e-6)

        for t in range(1, n_steps + 1):
            z = rng.standard_normal(n_paths)
            r_prev = paths[:, t - 1]
            sqrt_r = np.sqrt(np.maximum(r_prev, 0))
            drift = self.kappa * (self.theta - r_prev) * dt
            diffusion = self.sigma * sqrt_r * np.sqrt(dt) * z
            paths[:, t] = np.maximum(r_prev + drift + diffusion, 0.0)

        return paths

    def zero_coupon_price(self, r: float, T: float) -> float:
        """
        Closed-form zero-coupon bond price under CIR.
        """
        kappa, theta, sigma = self.kappa, self.theta, self.sigma
        gamma = np.sqrt(kappa ** 2 + 2 * sigma ** 2)

        exp_gT = np.exp(gamma * T)
        B = 2 * (exp_gT - 1) / ((gamma + kappa) * (exp_gT - 1) + 2 * gamma)
        A_exp = (
            (2 * gamma * np.exp((kappa + gamma) * T / 2))
            / ((gamma + kappa) * (exp_gT - 1) + 2 * gamma)
        ) ** (2 * kappa * theta / sigma ** 2)

        return float(A_exp * np.exp(-B * r))

    def yield_curve(self, r: float, maturities: np.ndarray) -> np.ndarray:
        """Return zero-coupon yields for each maturity."""
        prices = np.array([self.zero_coupon_price(r, T) for T in maturities])
        yields = -np.log(np.maximum(prices, 1e-10)) / maturities
        return yields
