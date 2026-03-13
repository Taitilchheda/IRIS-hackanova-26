"""
Yahoo Finance data provider (yfinance wrapper).
"""
from __future__ import annotations
import pandas as pd
from app.utils.logger import get_logger

log = get_logger(__name__)


def fetch_yahoo(
    ticker: str,
    start: str,
    end: str,
    auto_adjust: bool = True,
) -> pd.DataFrame:
    """
    Fetch OHLCV data from Yahoo Finance via yfinance.

    Parameters
    ----------
    ticker      : Yahoo ticker symbol (e.g. 'AAPL', 'SPY')
    start       : start date string 'YYYY-MM-DD'
    end         : end date string   'YYYY-MM-DD'
    auto_adjust : adjust for splits/dividends (default True)

    Returns
    -------
    DataFrame with columns [Open, High, Low, Close, Volume], DatetimeIndex
    Raises ValueError if no data returned.
    """
    try:
        import yfinance as yf
    except ImportError as exc:
        raise ImportError("yfinance is not installed. Run: pip install yfinance") from exc

    log.info(f"[Yahoo] Fetching {ticker} {start}→{end}")
    df = yf.download(
        ticker,
        start=start,
        end=end,
        progress=False,
        auto_adjust=auto_adjust,
    )

    if df.empty:
        raise ValueError(f"yfinance returned empty data for {ticker} ({start}→{end})")

    # Flatten MultiIndex columns if present (happens when downloading multiple tickers)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    required = {"Open", "High", "Low", "Close", "Volume"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"yfinance response missing columns: {missing}")

    df = df[list(required)].copy()
    df.index = pd.to_datetime(df.index)
    df.dropna(inplace=True)

    log.info(f"[Yahoo] Got {len(df)} bars for {ticker}")
    return df
