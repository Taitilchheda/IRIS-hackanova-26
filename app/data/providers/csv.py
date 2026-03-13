"""
Local CSV data provider.
Auto-detects date column and OHLCV columns.
"""
from __future__ import annotations
import pandas as pd
from pathlib import Path
from app.utils.logger import get_logger

log = get_logger(__name__)

_COL_ALIASES = {
    "open":   ["open", "o", "open_price"],
    "high":   ["high", "h", "high_price"],
    "low":    ["low", "l", "low_price"],
    "close":  ["close", "c", "close_price", "adj close", "adj_close"],
    "volume": ["volume", "v", "vol"],
}

_DATE_ALIASES = ["date", "datetime", "time", "timestamp", "index"]


def _find_col(df: pd.DataFrame, target: str) -> str | None:
    """Case-insensitive column lookup using aliases."""
    lower_cols = {c.lower().strip(): c for c in df.columns}
    for alias in _COL_ALIASES.get(target, [target]):
        if alias in lower_cols:
            return lower_cols[alias]
    return None


def fetch_csv(
    path: str | Path,
    ticker: str | None = None,
    start: str | None = None,
    end: str | None = None,
) -> pd.DataFrame:
    """
    Load OHLCV data from a local CSV file.

    Parameters
    ----------
    path   : path to CSV file
    ticker : ignored (for API consistency)
    start  : optional filter start date 'YYYY-MM-DD'
    end    : optional filter end date   'YYYY-MM-DD'

    Returns
    -------
    DataFrame with columns [Open, High, Low, Close, Volume], DatetimeIndex
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")

    log.info(f"[CSV] Loading {path}")
    df = pd.read_csv(path)

    # Detect and set date index
    date_col = None
    lower_cols = {c.lower().strip(): c for c in df.columns}
    for alias in _DATE_ALIASES:
        if alias in lower_cols:
            date_col = lower_cols[alias]
            break

    if date_col:
        df[date_col] = pd.to_datetime(df[date_col])
        df = df.set_index(date_col)
    else:
        # Try parsing the existing index
        try:
            df.index = pd.to_datetime(df.index)
        except Exception:
            raise ValueError("Could not find or parse a date column in CSV")

    df.index = pd.to_datetime(df.index)
    df = df.sort_index()

    # Map columns to standard names
    rename = {}
    for std_name in ["open", "high", "low", "close", "volume"]:
        found = _find_col(df, std_name)
        if found:
            rename[found] = std_name.capitalize()

    df = df.rename(columns=rename)

    required = ["Open", "High", "Low", "Close", "Volume"]
    missing = [c for c in required if c not in df.columns]
    if "Volume" in missing and len(missing) == 1:
        # Volume is optional — fill with zeros
        df["Volume"] = 0.0
        missing = []

    if missing:
        raise ValueError(f"CSV is missing required OHLCV columns: {missing}")

    df = df[required].copy()
    df = df.apply(pd.to_numeric, errors="coerce")
    df.dropna(inplace=True)

    # Apply date filter
    if start:
        df = df[df.index >= pd.Timestamp(start)]
    if end:
        df = df[df.index <= pd.Timestamp(end)]

    log.info(f"[CSV] Loaded {len(df)} bars from {path.name}")
    return df
