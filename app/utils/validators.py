import re
from app.utils.dates import date_range_valid

KNOWN_TICKERS = {
    "AAPL","MSFT","GOOGL","AMZN","META","TSLA","NVDA","SPY","QQQ",
    "GS","JPM","BAC","MS","V","MA","BRK-B","XOM","CVX","JNJ","WMT",
    "BTC-USD","ETH-USD","GLD","TLT","IEF","HYG","LQD"
}

def validate_ticker(ticker: str) -> bool:
    t = ticker.upper().strip()
    if t in KNOWN_TICKERS:
        return True
    # basic pattern: 1-5 uppercase letters optionally followed by -USD
    return bool(re.match(r'^[A-Z]{1,5}(-[A-Z]{1,3})?$', t))

def validate_date_range(start: str, end: str) -> tuple[bool, str]:
    if not date_range_valid(start, end):
        return False, f"Invalid date range: {start} → {end}"
    return True, ""

def validate_capital(capital: float) -> tuple[bool, str]:
    if capital < 1000:
        return False, "Capital must be at least $1,000"
    if capital > 1e9:
        return False, "Capital too large (max $1B)"
    return True, ""
