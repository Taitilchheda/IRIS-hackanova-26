"""
Pre-download and cache historical OHLCV data for common dev tickers.
Usage: python scripts/seed_cache.py
"""
import sys
from pathlib import Path

# Ensure app is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.data.loader import load_ohlcv
from app.utils.logger import get_logger

log = get_logger("seed_cache")

TICKERS = ["SPY", "AAPL", "MSFT", "GOOGL", "TSLA", "QQQ", "GLD", "TLT"]
START = "2018-01-01"
END   = "2024-12-31"


def main():
    log.info(f"Seeding cache for {len(TICKERS)} tickers: {START} → {END}")
    failed = []
    for ticker in TICKERS:
        try:
            df = load_ohlcv(ticker, START, END)
            log.info(f"  ✓ {ticker}: {len(df)} bars")
        except Exception as e:
            log.error(f"  ✗ {ticker}: {e}")
            failed.append(ticker)

    if failed:
        log.warning(f"Failed tickers: {failed}")
    else:
        log.info("All tickers cached successfully.")


if __name__ == "__main__":
    main()
