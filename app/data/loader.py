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

def _fetch_stooq(ticker: str, start: str, end: str) -> pd.DataFrame:
    try:
        from pandas_datareader import data as pdr
        df = pdr.DataReader(ticker, 'stooq', start=start, end=end)
        if df.empty:
            raise ValueError("stooq returned empty data")
        df = df.sort_index()
        df.index = pd.to_datetime(df.index)
        df = df.rename(columns={"Open": "Open", "High": "High", "Low": "Low", "Close": "Close", "Volume": "Volume"})
        df = df[["Open", "High", "Low", "Close", "Volume"]]
        return df
    except Exception as e:
        log.warning(f"stooq failed for {ticker}: {e}")
        return pd.DataFrame()

def load_ohlcv(ticker: str, start: str, end: str) -> pd.DataFrame:
    """
    Load OHLCV data. Returns DataFrame with columns: Open, High, Low, Close, Volume.
    Flow: cache → yfinance (persist) → stooq fallback → cached copy → error.
    """
    cache_file = _cache_key(ticker, start, end)

    if cache_file.exists():
        log.info(f"Cache hit: {ticker} {start}→{end}")
        try:
            df = pd.read_parquet(cache_file)
            if not df.empty:
                return df
        except Exception as e:
            log.warning(f"Cache read failed: {e}")
            # try csv fallback
            try:
                df = pd.read_csv(cache_file.with_suffix(".csv"), index_col=0, parse_dates=True)
                if not df.empty:
                    return df
            except Exception:
                pass

    try:
        import yfinance as yf
        log.info(f"Fetching {ticker} from yfinance {start}→{end}")
        df = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=True)
        if df.empty:
            raise ValueError(f"yfinance returned empty data for {ticker}")
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.index = pd.to_datetime(df.index)
        df.dropna(inplace=True)
        try:
            df.to_parquet(cache_file)
        except Exception as e:
            log.warning(f"Cache write failed: {e}")
            try:
                df.to_csv(cache_file.with_suffix(".csv"))
            except Exception:
                pass
        return df
    except Exception as e:
        log.warning(f"yfinance failed for {ticker}: {e}")

    stq = _fetch_stooq(ticker, start, end)
    if not stq.empty:
        try:
            stq.to_parquet(cache_file)
        except Exception as e:
            log.warning(f"Cache write failed (stooq): {e}")
            try:
                stq.to_csv(cache_file.with_suffix(".csv"))
            except Exception:
                pass
        return stq

    if cache_file.exists():
        log.info("Using last cached copy after provider failure")
        df = pd.read_parquet(cache_file)
        if not df.empty:
            return df

    raise ValueError(f"Failed to load OHLCV for {ticker} {start}→{end}")
