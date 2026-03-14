
"""
GET /tearsheet/{run_id} — retrieves a stored tearsheet.
GET /tearsheets       — lists all past runs (summary only).
"""
from fastapi import APIRouter, HTTPException, Depends
from app.api.auth import get_current_user
from app.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter()


@router.get("/tearsheet/{run_id}")
async def get_tearsheet(run_id: str, current_user = Depends(get_current_user)):
    from app.models import TearsheetRecord
    from app.db import get_session
    from sqlmodel import select

    with get_session() as session:
        record = session.exec(select(TearsheetRecord).where(TearsheetRecord.run_id == run_id)).first()
        if record is None:
            raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
        return record.payload


@router.get("/tearsheets")
async def list_tearsheets(current_user = Depends(get_current_user)):
    from app.models import TearsheetRecord
    from app.db import get_session
    from sqlmodel import select

    with get_session() as session:
        records = session.exec(select(TearsheetRecord).order_by(TearsheetRecord.created_at.desc())).all()
        return [
            {
                "run_id": r.run_id,
                "asset": r.asset,
                "start_date": r.start_date,
                "end_date": r.end_date,
                "sharpe": r.trader_sharpe,
                "cagr": r.trader_cagr,
                "max_drawdown": r.trader_max_dd,
            }
            for r in records
        ]
