"""
Volatility signals: ATR, Bollinger Bands, Keltner Channel.
"""
import numpy as np
import pandas as pd


def atr(high: pd.Series, low: pd.Series, close: pd.Series,
        period: int = 14) -> pd.Series:
    """
    Average True Range (ATR).

    True Range = max(H-L, |H-C_prev|, |L-C_prev|)
    """
    hl = high - low
    hc = (high - close.shift(1)).abs()
    lc = (low - close.shift(1)).abs()
    tr = pd.concat([hl, hc, lc], axis=1).max(axis=1)
    return tr.ewm(span=period, min_periods=period, adjust=False).mean()


def bollinger_bands(
    series: pd.Series,
    window: int = 20,
    n_std: float = 2.0,
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """
    Bollinger Bands.

    Returns (upper, middle, lower) as a tuple of Series.
    """
    middle = series.rolling(window).mean()
    std = series.rolling(window).std()
    upper = middle + n_std * std
    lower = middle - n_std * std
    return upper, middle, lower


def keltner_channel(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    ema_period: int = 20,
    atr_period: int = 10,
    multiplier: float = 2.0,
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """
    Keltner Channel.

    middle = EMA(close, ema_period)
    upper  = middle + multiplier * ATR(atr_period)
    lower  = middle - multiplier * ATR(atr_period)

    Returns (upper, middle, lower).
    """
    middle = close.ewm(span=ema_period, adjust=False).mean()
    atr_val = atr(high, low, close, atr_period)
    upper = middle + multiplier * atr_val
    lower = middle - multiplier * atr_val
    return upper, middle, lower


def historical_volatility(
    series: pd.Series, window: int = 20, annualise: bool = True
) -> pd.Series:
    """
    Annualised rolling historical volatility (close-to-close log returns).
    """
    log_returns = np.log(series / series.shift(1))
    vol = log_returns.rolling(window).std()
    if annualise:
        vol = vol * np.sqrt(252)
    return vol
