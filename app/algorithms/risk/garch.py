"""
GARCH(1,1) and EGARCH volatility models.
Provides: GARCHModel
"""
from __future__ import annotations
import numpy as np
from typing import Optional


class GARCHModel:
    """
    GARCH(1,1) volatility model.

    σ²_t = ω + α·ε²_{t-1} + β·σ²_{t-1}

    Fit from a returns array, then forecast annualised volatility.
    """

    def __init__(
        self,
        omega: float = 1e-6,
        alpha: float = 0.09,
        beta: float = 0.90,
    ):
        self.omega = omega
        self.alpha = alpha
        self.beta = beta
        self._var_t: float = 0.0
        self._fitted = False

    # ------------------------------------------------------------------
    # Fitting
    # ------------------------------------------------------------------
    def fit(self, returns: np.ndarray) -> "GARCHModel":
        """
        Fit GARCH(1,1) on a returns array using simple moment-matching.
        For production, use `arch` library; this is a fast approximation.
        """
        returns = np.asarray(returns, dtype=float)
        returns = returns[np.isfinite(returns)]
        if len(returns) < 10:
            self._var_t = np.var(returns) if len(returns) > 1 else 1e-4
            self._fitted = True
            return self

        # Initialise variance as sample variance
        var_t = float(np.var(returns))
        omega = self.omega
        alpha = self.alpha
        beta = self.beta

        # Filter through all observations
        for r in returns:
            var_t = omega + alpha * r ** 2 + beta * var_t

        self._var_t = var_t
        self._fitted = True
        return self

    # ------------------------------------------------------------------
    # Forecasting
    # ------------------------------------------------------------------
    def forecast_variance(self, horizon: int = 1) -> float:
        """Return h-step ahead conditional variance."""
        if not self._fitted:
            raise RuntimeError("Call fit() before forecast_variance()")
        omega = self.omega
        alpha = self.alpha
        beta = self.beta
        var_t = self._var_t
        ab = alpha + beta
        if ab >= 1.0:
            # Non-stationary — cap at current variance
            return var_t * horizon
        long_run_var = omega / (1 - ab)
        # Multi-step forecast
        forecast = long_run_var + (ab ** (horizon - 1)) * (var_t - long_run_var)
        return float(max(forecast, 1e-10))

    def forecast_annualised_vol(self, horizon: int = 1) -> float:
        """Return forecasted annualised volatility (σ_annual)."""
        return float(np.sqrt(self.forecast_variance(horizon) * 252))

    @property
    def current_variance(self) -> float:
        return self._var_t

    @property
    def current_vol_annualised(self) -> float:
        return float(np.sqrt(self._var_t * 252))


class EGARCHModel:
    """
    EGARCH(1,1) — captures leverage effect (negative returns → higher vol).

    ln(σ²_t) = ω + α·(|z_{t-1}| - E|z|) + γ·z_{t-1} + β·ln(σ²_{t-1})
    """

    def __init__(
        self,
        omega: float = -0.1,
        alpha: float = 0.1,
        gamma: float = -0.05,
        beta: float = 0.95,
    ):
        self.omega = omega
        self.alpha = alpha
        self.gamma = gamma
        self.beta = beta
        self._log_var_t: float = -10.0
        self._fitted = False

    def fit(self, returns: np.ndarray) -> "EGARCHModel":
        returns = np.asarray(returns, dtype=float)
        returns = returns[np.isfinite(returns)]
        if len(returns) < 10:
            self._log_var_t = float(np.log(max(np.var(returns), 1e-8)))
            self._fitted = True
            return self

        log_var = float(np.log(max(np.var(returns), 1e-8)))
        EZ = np.sqrt(2 / np.pi)  # E[|z|] for standard normal

        for r in returns:
            sigma_t = np.sqrt(np.exp(log_var))
            z = r / max(sigma_t, 1e-8)
            log_var = (
                self.omega
                + self.alpha * (abs(z) - EZ)
                + self.gamma * z
                + self.beta * log_var
            )

        self._log_var_t = log_var
        self._fitted = True
        return self

    def forecast_annualised_vol(self) -> float:
        if not self._fitted:
            raise RuntimeError("Call fit() before forecast_annualised_vol()")
        var = np.exp(self._log_var_t)
        return float(np.sqrt(var * 252))
