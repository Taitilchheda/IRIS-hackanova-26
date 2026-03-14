"""
GET /tearsheet/{run_id} — retrieves a stored tearsheet.
GET /tearsheets       — lists all past runs (summary only).
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from app.utils.logger import get_logger
from app.models import TearsheetRecord, User
from app.db import get_session
from app.api.auth import get_current_user
from sqlmodel import Session

log = get_logger(__name__)
router = APIRouter()


@router.get("/tearsheet/{run_id}")
async def get_tearsheet(run_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Retrieve a full tearsheet by run ID."""
    ts = session.exec(select(TearsheetRecord).where(TearsheetRecord.run_id == run_id, TearsheetRecord.user_id == current_user.id)).first()
    if ts is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return ts.payload


@router.get("/tearsheets")
async def list_tearsheets(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """List all past run summaries for the authenticated user."""
    records = session.exec(select(TearsheetRecord).where(TearsheetRecord.user_id == current_user.id).order_by(TearsheetRecord.created_at.desc())).all()
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
