"""
Volume signals: OBV, rolling VWAP, Accumulation/Distribution Line.
"""
import numpy as np
import pandas as pd


def obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    """
    On-Balance Volume (OBV).

    OBV increases by volume on up-days, decreases by volume on down-days.
    """
    sign = np.sign(close.diff().fillna(0))
    return (sign * volume).cumsum()


def rolling_vwap(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    volume: pd.Series,
    window: int = 14,
) -> pd.Series:
    """
    Rolling VWAP (typical price × volume, normalised by rolling volume).

    Typical price = (H + L + C) / 3
    """
    typical = (high + low + close) / 3
    pv = typical * volume
    return pv.rolling(window).sum() / volume.rolling(window).sum()


def accumulation_distribution(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    volume: pd.Series,
) -> pd.Series:
    """
    Accumulation / Distribution Line (A/D Line).

    Money Flow Multiplier = [(C - L) - (H - C)] / (H - L)
    Money Flow Volume     = MFM × Volume
    A/D Line              = cumsum(MFV)
    """
    hl_range = (high - low).replace(0, np.nan)
    mfm = ((close - low) - (high - close)) / hl_range
    mfm = mfm.fillna(0)
    mfv = mfm * volume
    return mfv.cumsum()


def chaikin_money_flow(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    volume: pd.Series,
    period: int = 20,
) -> pd.Series:
    """
    Chaikin Money Flow (CMF) — rolling version of A/D.

    CMF = Σ(MFV, period) / Σ(Vol, period)  — bounded [-1, 1]
    """
    hl_range = (high - low).replace(0, np.nan)
    mfm = ((close - low) - (high - close)) / hl_range
    mfm = mfm.fillna(0)
    mfv = mfm * volume
    return (
        mfv.rolling(period).sum()
        / volume.rolling(period).sum().replace(0, np.nan)
    )
