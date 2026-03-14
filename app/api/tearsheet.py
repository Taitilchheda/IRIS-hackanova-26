from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select, Session
from app.utils.logger import get_logger
from app.models import TearsheetRecord
from app.db import get_session

log = get_logger(__name__)
router = APIRouter()

@router.get("/tearsheet/{run_id}")
async def get_tearsheet(run_id: str, session: Session = Depends(get_session)):
    """Retrieve a full tearsheet by run ID."""
    ts = session.exec(select(TearsheetRecord).where(TearsheetRecord.run_id == run_id)).first()
    if ts is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return ts.payload

@router.get("/tearsheets")
async def list_tearsheets(session: Session = Depends(get_session)):
    """List all past run summaries."""
    records = session.exec(select(TearsheetRecord).order_by(TearsheetRecord.created_at.desc())).all()
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
