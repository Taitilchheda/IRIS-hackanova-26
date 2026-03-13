"""
Pairs Trading — cointegration testing and spread z-score signal generation.
Provides: cointegration_test, spread_zscore, PairsTradingSignal
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Optional
from statsmodels.tsa.stattools import adfuller
import statsmodels.api as sm


def cointegration_test(
    y: np.ndarray,
    x: np.ndarray,
    significance: float = 0.05,
) -> dict:
    """
    Engle-Granger two-step cointegration test.

    Returns
    -------
    dict with:
        cointegrated : bool
        pvalue       : float (ADF p-value on the residual)
        hedge_ratio  : float (OLS beta)
        spread       : np.ndarray (residual series)
    """

    y = np.asarray(y, dtype=float)
    x = np.asarray(x, dtype=float)

    # Step 1: OLS regression y ~ x
    X = sm.add_constant(x)
    model = sm.OLS(y, X).fit()
    hedge_ratio = float(model.params[1])
    spread = y - hedge_ratio * x

    # Step 2: ADF test on residual
    adf_result = adfuller(spread, autolag="AIC")
    pvalue = float(adf_result[1])
    cointegrated = pvalue < significance

    return {
        "cointegrated": cointegrated,
        "pvalue": round(pvalue, 6),
        "hedge_ratio": round(hedge_ratio, 6),
        "spread": spread,
        "adf_stat": round(float(adf_result[0]), 4),
    }


def spread_zscore(
    spread: np.ndarray,
    window: int = 30,
) -> np.ndarray:
    """
    Rolling z-score of the spread series.

    z_t = (spread_t - mean_{t-window:t}) / std_{t-window:t}
    """
    spread = np.asarray(spread, dtype=float)
    z = np.zeros(len(spread))
    for i in range(window, len(spread)):
        sl = spread[i - window:i]
        std = np.std(sl, ddof=1)
        if std > 1e-10:
            z[i] = (spread[i] - np.mean(sl)) / std
    return z


class PairsTradingSignal:
    """
    Encapsulates a complete pairs-trading strategy signal generator.

    Parameters
    ----------
    entry_z  : z-score threshold to enter a position (default 1.0)
    exit_z   : z-score threshold to exit (default 0.0)
    window   : rolling window for z-score normalisation (bars)
    """

    def __init__(
        self,
        entry_z: float = 1.0,
        exit_z: float = 0.0,
        window: int = 30,
    ):
        self.entry_z = entry_z
        self.exit_z = exit_z
        self.window = window
        self.hedge_ratio: float = 1.0

    def fit(self, x: np.ndarray, y: np.ndarray) -> "PairsTradingSignal":
        """Fit OLS hedge ratio and check cointegration."""
        result = cointegration_test(y, x)
        self.hedge_ratio = result["hedge_ratio"]
        self._spread = result["spread"]
        return self

    def generate_signals(
        self, x: np.ndarray, y: np.ndarray
    ) -> pd.DataFrame:
        """
        Generate long/short signals from the spread z-score.

        Returns DataFrame with columns:
            spread, zscore, position
            position: +1 = long Y / short X, -1 = short Y / long X, 0 = flat
        """
        x = np.asarray(x, dtype=float)
        y = np.asarray(y, dtype=float)
        spread = y - self.hedge_ratio * x
        z = spread_zscore(spread, self.window)
        n = len(z)
        position = np.zeros(n, dtype=int)

        for i in range(1, n):
            prev_pos = position[i - 1]
            if prev_pos == 1:
                # Currently long Y / short X: exit when z crosses above exit_z
                position[i] = 0 if z[i] >= self.exit_z else 1
            elif prev_pos == -1:
                # Currently short Y / long X: exit when z crosses below -exit_z
                position[i] = 0 if z[i] <= -self.exit_z else -1
            else:
                # Flat: enter on z-score extremes
                if z[i] < -self.entry_z:
                    position[i] = 1   # spread too low → long y/short x
                elif z[i] > self.entry_z:
                    position[i] = -1  # spread too high → short y/long x
                else:
                    position[i] = 0

        return pd.DataFrame({
            "spread": spread,
            "zscore": z,
            "position": position,
        })
