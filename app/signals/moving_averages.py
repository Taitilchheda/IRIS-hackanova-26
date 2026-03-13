"""
Technical signal library — moving averages.
"""
import numpy as np
import pandas as pd


def sma(series: pd.Series, window: int) -> pd.Series:
    return series.rolling(window).mean()


def ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def crossover_signal(fast: pd.Series, slow: pd.Series) -> pd.Series:
    """Returns +1 at upward cross, -1 at downward cross, 0 otherwise."""
    above = (fast > slow).astype(int)
    signal = above.diff().fillna(0)
    return signal  # +1 = bullish cross, -1 = bearish cross
