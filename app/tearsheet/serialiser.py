"""
Tearsheet serialiser: JSON-safe serialisation/deserialisation helpers.
"""
from __future__ import annotations
import json
from typing import Any
from app.nlp.schema import Tearsheet


def _default_encoder(obj: Any) -> Any:
    """Handle non-serialisable types (numpy floats, datetimes, etc.)."""
    import numpy as np
    import datetime
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serialisable")


def tearsheet_to_json(ts: Tearsheet, indent: int = 2) -> str:
    """
    Serialise a Tearsheet to a JSON string.

    Uses Pydantic's model_dump for correctness, then applies
    a custom encoder to handle any remaining numpy types.
    """
    data = ts.model_dump()
    return json.dumps(data, default=_default_encoder, indent=indent)


def tearsheet_from_json(raw: str | dict) -> Tearsheet:
    """
    Deserialise a Tearsheet from a JSON string or dict.
    """
    if isinstance(raw, str):
        data = json.loads(raw)
    else:
        data = raw
    return Tearsheet.model_validate(data)


def tearsheet_to_dict(ts: Tearsheet) -> dict:
    """Return Tearsheet as a plain Python dict (JSON-compatible)."""
    return json.loads(tearsheet_to_json(ts))


def summary_dict(ts: Tearsheet) -> dict:
    """
    Return a compact summary dict for quick display (metrics only).
    """
    tm = ts.trader_metrics
    em = ts.expert_metrics
    bm = ts.benchmark_metrics
    return {
        "run_id": ts.run_id,
        "asset": ts.strategy_spec.asset,
        "period": f"{ts.strategy_spec.start_date} → {ts.strategy_spec.end_date}",
        "trader": {
            "sharpe": tm.sharpe,
            "cagr": tm.cagr,
            "max_drawdown": tm.max_drawdown,
            "win_rate": tm.win_rate,
            "total_return": tm.total_return,
            "trade_count": tm.trade_count,
        },
        "expert": {
            "name": ts.expert_type,
            "sharpe": em.sharpe,
            "cagr": em.cagr,
            "max_drawdown": em.max_drawdown,
        },
        "benchmark_spy": {
            "sharpe": bm.sharpe,
            "cagr": bm.cagr,
        },
        "narrative": ts.narrative,
    }
