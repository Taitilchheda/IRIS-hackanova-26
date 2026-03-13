"""
VWAP and TWAP execution scheduling.
Provides: vwap, twap, execution_schedule
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from typing import List, Optional


def vwap(
    close: np.ndarray,
    volume: np.ndarray,
    window: Optional[int] = None,
) -> np.ndarray:
    """
    Volume-Weighted Average Price.

    Parameters
    ----------
    close  : 1-D array of closing prices
    volume : 1-D array of volume (same length)
    window : if provided, rolling VWAP over this window of bars; else cumulative

    Returns
    -------
    1-D array of VWAP values
    """
    close = np.asarray(close, dtype=float)
    volume = np.asarray(volume, dtype=float)

    if window is None:
        # Cumulative VWAP from start of series
        cum_vol = np.cumsum(volume)
        cum_pvol = np.cumsum(close * volume)
        with np.errstate(invalid="ignore", divide="ignore"):
            result = np.where(cum_vol > 0, cum_pvol / cum_vol, close)
        return result
    else:
        # Rolling VWAP
        series_pv = pd.Series(close * volume)
        series_v = pd.Series(volume)
        rolling_pv = series_pv.rolling(window, min_periods=1).sum()
        rolling_v = series_v.rolling(window, min_periods=1).sum()
        result = (rolling_pv / rolling_v.replace(0, np.nan)).fillna(method="bfill")
        return result.values


def twap(
    close: np.ndarray,
    window: Optional[int] = None,
) -> np.ndarray:
    """
    Time-Weighted Average Price.

    Parameters
    ----------
    close  : 1-D array of prices
    window : rolling window (None = expanding from start)

    Returns
    -------
    1-D array of TWAP values
    """
    s = pd.Series(np.asarray(close, dtype=float))
    if window is None:
        return s.expanding(min_periods=1).mean().values
    else:
        return s.rolling(window, min_periods=1).mean().values


def execution_schedule(
    total_quantity: float,
    n_intervals: int,
    volume_profile: Optional[np.ndarray] = None,
    algo: str = "twap",
) -> np.ndarray:
    """
    Generate an execution schedule that spreads a parent order over intervals.

    Parameters
    ----------
    total_quantity  : total shares / contracts to execute
    n_intervals     : number of execution intervals
    volume_profile  : historical volume weights per interval (for VWAP scheduling)
                      If None, uses uniform TWAP schedule.
    algo            : 'twap' (uniform) | 'vwap' (volume-weighted)

    Returns
    -------
    1-D array of quantity per interval (sums to total_quantity)
    """
    if algo == "vwap" and volume_profile is not None:
        w = np.asarray(volume_profile, dtype=float)
        w = w[:n_intervals]
        if w.sum() <= 0:
            w = np.ones(n_intervals)
        w = w / w.sum()
        schedule = total_quantity * w
    else:
        # TWAP: uniform split
        schedule = np.full(n_intervals, total_quantity / n_intervals)

    return np.round(schedule, 4)


def arrival_cost(
    executed_prices: np.ndarray,
    quantities: np.ndarray,
    arrival_price: float,
) -> float:
    """
    Implementation shortfall (arrival cost) in basis points.

    IS = Σ (p_i - p_arrival) * q_i / (p_arrival * Σ q_i) * 10000
    """
    executed_prices = np.asarray(executed_prices, dtype=float)
    quantities = np.asarray(quantities, dtype=float)
    total_qty = quantities.sum()
    if total_qty == 0 or arrival_price == 0:
        return 0.0
    shortfall = np.sum((executed_prices - arrival_price) * quantities)
    return float(shortfall / (arrival_price * total_qty) * 10000)
