"""
Disk-based Parquet cache with TTL for OHLCV data.
Provides: DataCache
"""
from __future__ import annotations
import time
from pathlib import Path
from typing import Optional
import pandas as pd
from app.utils.logger import get_logger

log = get_logger(__name__)

_DEFAULT_CACHE_DIR = Path(__file__).parent / "cache"
_DEFAULT_TTL_SECONDS = 86_400  # 24 hours


class DataCache:
    """
    Simple file-based Parquet cache for OHLCV DataFrames.

    Usage
    -----
    cache = DataCache()
    df = cache.get("AAPL", "2020-01-01", "2023-12-31")
    if df is None:
        df = fetch_from_provider(...)
        cache.put("AAPL", "2020-01-01", "2023-12-31", df)
    """

    def __init__(
        self,
        cache_dir: Path | str | None = None,
        ttl_seconds: int = _DEFAULT_TTL_SECONDS,
    ):
        self.cache_dir = Path(cache_dir) if cache_dir else _DEFAULT_CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl = ttl_seconds

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _key_path(self, ticker: str, start: str, end: str) -> Path:
        safe = ticker.replace("/", "_").replace("\\", "_")
        return self.cache_dir / f"{safe}_{start}_{end}.parquet"

    def _meta_path(self, key_path: Path) -> Path:
        return key_path.with_suffix(".meta")

    def _is_fresh(self, key_path: Path) -> bool:
        meta = self._meta_path(key_path)
        if not meta.exists():
            return False
        try:
            written_at = float(meta.read_text())
            return (time.time() - written_at) < self.ttl
        except Exception:
            return False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def get(
        self, ticker: str, start: str, end: str
    ) -> Optional[pd.DataFrame]:
        """Return cached DataFrame or None if missing / expired."""
        kp = self._key_path(ticker, start, end)
        if not kp.exists():
            return None
        if not self._is_fresh(kp):
            log.debug(f"[Cache] Stale: {kp.name}")
            return None
        try:
            df = pd.read_parquet(kp)
            log.info(f"[Cache] Hit: {ticker} {start}→{end} ({len(df)} bars)")
            return df
        except Exception as e:
            log.warning(f"[Cache] Read error for {kp}: {e}")
            return None

    def put(
        self, ticker: str, start: str, end: str, df: pd.DataFrame
    ) -> None:
        """Store a DataFrame in the cache."""
        kp = self._key_path(ticker, start, end)
        try:
            df.to_parquet(kp)
            self._meta_path(kp).write_text(str(time.time()))
            log.info(f"[Cache] Stored: {ticker} {start}→{end} ({len(df)} bars)")
        except Exception as e:
            log.warning(f"[Cache] Write error for {kp}: {e}")

    def invalidate(self, ticker: str, start: str, end: str) -> None:
        """Remove a specific entry from the cache."""
        kp = self._key_path(ticker, start, end)
        for f in [kp, self._meta_path(kp)]:
            try:
                f.unlink(missing_ok=True)
            except Exception:
                pass

    def clear_all(self) -> int:
        """Delete all cache files. Returns number of files deleted."""
        count = 0
        for f in self.cache_dir.glob("*.parquet"):
            f.unlink(missing_ok=True)
            count += 1
        for f in self.cache_dir.glob("*.meta"):
            f.unlink(missing_ok=True)
        log.info(f"[Cache] Cleared {count} entries")
        return count


# Module-level singleton
_default_cache = DataCache()


def get(ticker: str, start: str, end: str) -> Optional[pd.DataFrame]:
    """Get from default cache."""
    return _default_cache.get(ticker, start, end)


def put(ticker: str, start: str, end: str, df: pd.DataFrame) -> None:
    """Put into default cache."""
    _default_cache.put(ticker, start, end, df)
