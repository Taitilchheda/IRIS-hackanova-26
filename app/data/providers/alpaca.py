"""
Alpaca Markets historical data provider.
Reads ALPACA_API_KEY and ALPACA_SECRET_KEY from environment.
"""
from __future__ import annotations
import os
import pandas as pd
from app.utils.logger import get_logger

log = get_logger(__name__)

_ALPACA_BASE_URL = "https://paper-api.alpaca.markets"


def fetch_alpaca(
    ticker: str,
    start: str,
    end: str,
    timeframe: str = "1Day",
) -> pd.DataFrame:
    """
    Fetch OHLCV bars from Alpaca Markets.

    Reads credentials from env: ALPACA_API_KEY, ALPACA_SECRET_KEY.

    Parameters
    ----------
    ticker    : symbol (e.g. 'AAPL')
    start     : 'YYYY-MM-DD'
    end       : 'YYYY-MM-DD'
    timeframe : Alpaca timeframe string (default '1Day')

    Returns
    -------
    DataFrame with columns [Open, High, Low, Close, Volume], DatetimeIndex
    """
    api_key = os.getenv("ALPACA_API_KEY", "")
    secret_key = os.getenv("ALPACA_SECRET_KEY", "")

    if not api_key or not secret_key:
        raise EnvironmentError(
            "ALPACA_API_KEY and ALPACA_SECRET_KEY must be set in environment"
        )

    try:
        from alpaca.data.historical import StockHistoricalDataClient
        from alpaca.data.requests import StockBarsRequest
        from alpaca.data.timeframe import TimeFrame, TimeFrameUnit
    except ImportError:
        # Try legacy alpaca-trade-api
        return _fetch_alpaca_legacy(ticker, start, end, api_key, secret_key)

    client = StockHistoricalDataClient(api_key, secret_key)
    request = StockBarsRequest(
        symbol_or_symbols=ticker,
        start=start,
        end=end,
        timeframe=TimeFrame.Day,
    )
    bars = client.get_stock_bars(request).df

    if bars.empty:
        raise ValueError(f"Alpaca returned no data for {ticker} ({start}→{end})")

    # Alpaca SDK returns MultiIndex (symbol, timestamp)
    if isinstance(bars.index, pd.MultiIndex):
        bars = bars.xs(ticker, level="symbol")

    bars.index = pd.to_datetime(bars.index)
    rename = {"open": "Open", "high": "High", "low": "Low",
               "close": "Close", "volume": "Volume"}
    bars = bars.rename(columns=rename)
    df = bars[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.dropna(inplace=True)
    log.info(f"[Alpaca] Got {len(df)} bars for {ticker}")
    return df


def _fetch_alpaca_legacy(
    ticker: str, start: str, end: str, api_key: str, secret_key: str
) -> pd.DataFrame:
    """Fallback using the older alpaca-trade-api SDK."""
    try:
        import alpaca_trade_api as tradeapi
    except ImportError as exc:
        raise ImportError(
            "alpaca-trade-api or alpaca-py is required. "
            "Run: pip install alpaca-py"
        ) from exc

    api = tradeapi.REST(api_key, secret_key, _ALPACA_BASE_URL, api_version="v2")
    bars = api.get_bars(ticker, "1D", start=start, end=end).df
    bars.index = pd.to_datetime(bars.index)
    rename = {"o": "Open", "h": "High", "l": "Low", "c": "Close", "v": "Volume"}
    bars = bars.rename(columns=rename)
    cols = [c for c in ["Open", "High", "Low", "Close", "Volume"] if c in bars.columns]
    return bars[cols].dropna()
