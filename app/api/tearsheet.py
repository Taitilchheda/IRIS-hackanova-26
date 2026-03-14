"""
GET /tearsheet/{run_id} — retrieves a stored tearsheet.
GET /tearsheets        — lists all past runs (summary only).
Supports both DB persistence and in-memory cache.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select, Session

from app.api.auth import get_current_user
from app.api.strategy import _tearsheets
from app.utils.logger import get_logger
from app.models import TearsheetRecord
from app.db import get_session

log = get_logger(__name__)
router = APIRouter()


@router.get("/tearsheet/{run_id}")
async def get_tearsheet(
    run_id: str,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user),
):
    """Retrieve a full tearsheet by run ID."""

    # ---------- TRY DATABASE ----------
    ts = session.exec(
        select(TearsheetRecord).where(TearsheetRecord.run_id == run_id)
    ).first()

    if ts:
        return ts.payload

    # ---------- FALLBACK MEMORY ----------
    ts_mem = _tearsheets.get(run_id)

    if ts_mem:
        return ts_mem

    raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")


@router.get("/tearsheets")
async def list_tearsheets(
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user),
):
    """List all past run summaries."""

    # ---------- TRY DATABASE ----------
    try:
        records = session.exec(
            select(TearsheetRecord).order_by(TearsheetRecord.created_at.desc())
        ).all()

        if records:
            result = []
            for r in records:
                result.append({
                    "run_id": r.run_id,
                    "asset": r.asset,
                    "start_date": r.start_date,
                    "end_date": r.end_date,
                    "sharpe": r.trader_sharpe,
                    "cagr": r.trader_cagr,
                    "max_drawdown": r.trader_max_dd,
                })
            return result
    except Exception as e:
        log.warning(f"DB history fetch failed: {e}")

    # ---------- FALLBACK MEMORY ----------
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