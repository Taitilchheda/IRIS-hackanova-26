"""
Kalman Filter for dynamic hedge ratio / signal extraction.
Provides: KalmanHedgeFilter
"""
from __future__ import annotations
import numpy as np


class KalmanHedgeFilter:
    """
    State-space Kalman filter for estimating a dynamic linear relationship:

        y_t = beta_t * x_t + epsilon_t     (observation equation)
        beta_{t+1} = beta_t + delta_t       (state transition)

    Parameters
    ----------
    process_noise : Q — variance of state innovations (smaller = slower adaptation)
    obs_noise     : R — variance of observation noise (larger = more smoothing)
    init_beta     : initial hedge ratio estimate
    init_P        : initial state variance

    Usage
    -----
    kf = KalmanHedgeFilter()
    kf.fit(x_series, y_series)
    hedge_ratios = kf.beta_history  # array of length n
    signal = y - kf.beta_history * x
    """

    def __init__(
        self,
        process_noise: float = 1e-4,
        obs_noise: float = 1e-3,
        init_beta: float = 1.0,
        init_P: float = 1.0,
    ):
        self.Q = process_noise
        self.R = obs_noise
        self._init_beta = init_beta
        self._init_P = init_P

        # State
        self.beta_history: np.ndarray = np.array([])
        self.P_history: np.ndarray = np.array([])

    def fit(self, x: np.ndarray, y: np.ndarray) -> "KalmanHedgeFilter":
        """
        Run Kalman filter over observations (x, y).

        Parameters
        ----------
        x : regressor time series (e.g. SPY prices)
        y : response time series  (e.g. AAPL prices)
        """
        x = np.asarray(x, dtype=float)
        y = np.asarray(y, dtype=float)
        assert len(x) == len(y), "x and y must have equal length"
        n = len(x)

        beta = self._init_beta
        P = self._init_P
        betas = np.zeros(n)
        Ps = np.zeros(n)

        for i in range(n):
            # Predict
            P_pred = P + self.Q

            x_i = x[i]
            y_i = y[i]

            if abs(x_i) < 1e-10:
                # Degenerate: skip update
                beta_up = beta
                P_up = P_pred
            else:
                # Innovation / residual
                S_i = x_i ** 2 * P_pred + self.R  # innovation variance
                K_i = P_pred * x_i / S_i           # Kalman gain

                # Update
                innovation = y_i - beta * x_i
                beta_up = beta + K_i * innovation
                P_up = (1 - K_i * x_i) * P_pred

            beta = beta_up
            P = P_up
            betas[i] = beta
            Ps[i] = P

        self.beta_history = betas
        self.P_history = Ps
        return self

    def spread(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        """Return the residual spread: y - beta * x."""
        if len(self.beta_history) == 0:
            self.fit(x, y)
        return np.asarray(y) - self.beta_history * np.asarray(x)

    def zscore(self, x: np.ndarray, y: np.ndarray, window: int = 30) -> np.ndarray:
        """Compute rolling z-score of the Kalman spread."""
        spr = self.spread(x, y)
        z = np.zeros(len(spr))
        for i in range(window, len(spr)):
        	sl = spr[i - window:i]
        	std = np.std(sl)
        	if std > 0:
        		z[i] = (spr[i] - np.mean(sl)) / std
        return z
