"""
GET /tearsheet/{run_id} — retrieves a stored tearsheet.
GET /tearsheets       — lists all past runs (summary only).
"""
from fastapi import APIRouter, HTTPException
from app.utils.logger import get_logger
from app.api.strategy import _tearsheets  # shared in-memory store

log = get_logger(__name__)
router = APIRouter()


@router.get("/tearsheet/{run_id}")
async def get_tearsheet(run_id: str):
    """Retrieve a full tearsheet by run ID."""
    ts = _tearsheets.get(run_id)
    if ts is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return ts


@router.get("/tearsheets")
async def list_tearsheets():
    """List all past run summaries."""
    result = []
    for rid, ts in _tearsheets.items():
        spec = ts.get("strategy_spec", {})
        tm = ts.get("trader_metrics", {})
        result.append({
            "run_id": rid,
            "asset": spec.get("asset", "?"),
            "start_date": spec.get("start_date", "?"),
            "end_date": spec.get("end_date", "?"),
            "sharpe": tm.get("sharpe"),
            "cagr": tm.get("cagr"),
            "max_drawdown": tm.get("max_drawdown"),
        })
    return result
