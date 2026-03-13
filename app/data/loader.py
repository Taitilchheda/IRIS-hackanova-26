"""
Unified OHLCV loader. Auto-routes to correct provider. Caches result.
"""
from __future__ import annotations
import pandas as pd
from pathlib import Path
from app.utils.logger import get_logger

log = get_logger(__name__)

CACHE_DIR = Path(__file__).parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)


def _cache_key(ticker: str, start: str, end: str) -> Path:
    return CACHE_DIR / f"{ticker}_{start}_{end}.parquet"


def load_ohlcv(ticker: str, start: str, end: str) -> pd.DataFrame:
    """
    Load OHLCV data. Returns DataFrame with columns: Open, High, Low, Close, Volume.
    Falls back through: cache → yfinance → synthetic data.
    """
    cache_file = _cache_key(ticker, start, end)

    # Try cache first
    if cache_file.exists():
        log.info(f"Cache hit: {ticker} {start}→{end}")
        try:
            df = pd.read_parquet(cache_file)
            if not df.empty:
                return df
        except Exception as e:
            log.warning(f"Cache read failed: {e}")

    # Try yfinance
    try:
        import yfinance as yf
        log.info(f"Fetching {ticker} from yfinance {start}→{end}")
        df = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=True)
        if df.empty:
            raise ValueError(f"yfinance returned empty data for {ticker}")
        # Flatten multi-index if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.index = pd.to_datetime(df.index)
        df.dropna(inplace=True)
        # Save to cache
        try:
            df.to_parquet(cache_file)
        except Exception as e:
            log.warning(f"Cache write failed: {e}")
        return df
    except Exception as e:
        log.warning(f"yfinance failed for {ticker}: {e}. Using synthetic data.")

    # Synthetic fallback
    return _synthetic_ohlcv(ticker, start, end)


def _synthetic_ohlcv(ticker: str, start: str, end: str) -> pd.DataFrame:
    """Generate realistic synthetic OHLCV data for testing."""
    import numpy as np
    dates = pd.date_range(start=start, end=end, freq="B")  # business days
    n = len(dates)
    rng = np.random.default_rng(hash(ticker) % (2**32))
    returns = rng.normal(0.0003, 0.015, n)
    close = 100.0 * np.cumprod(1 + returns)
    spread = close * 0.005
    open_ = close - rng.uniform(-spread, spread)
    high = np.maximum(close, open_) + rng.uniform(0, spread)
    low = np.minimum(close, open_) - rng.uniform(0, spread)
    volume = rng.integers(1_000_000, 10_000_000, n).astype(float)
    df = pd.DataFrame({
        "Open": open_,
        "High": high,
        "Low": low,
        "Close": close,
        "Volume": volume,
    }, index=dates)
    log.info(f"Synthetic data generated: {ticker} {n} bars")
    return df
