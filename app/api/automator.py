"""
POST /automate/{run_id} — deploys an approved strategy via AutomatorAgent.
POST /automate/strategy  — deploy from raw StrategySpec JSON.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from app.nlp.schema import StrategySpec
from app.agents.automator import AutomatorAgent
from app.utils.logger import get_logger
from app.db import get_session
from app.api.auth import get_current_user
from app.models import TearsheetRecord, User
from sqlmodel import Session

log = get_logger(__name__)
router = APIRouter()

_automator = AutomatorAgent()


@router.post("/automate/{run_id}")
async def automate_from_run(run_id: str, use_expert: bool = False, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    ts_data = session.exec(select(TearsheetRecord).where(TearsheetRecord.run_id == run_id, TearsheetRecord.user_id == current_user.id)).first()
    if not ts_data:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    try:
        spec = StrategySpec(**ts_data.payload["strategy_spec"])
        result = _automator.deploy(spec, run_id)
        return result
    except Exception as e:
        log.error(f"/automate/{run_id} error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/automate/strategy")
async def automate_from_spec(spec: StrategySpec, current_user: User = Depends(get_current_user)):
    """Deploy a strategy directly from a StrategySpec payload."""
    from app.utils.logger import new_run_id
    run_id = new_run_id()
    try:
        result = _automator.deploy(spec, run_id)
        return result
    except Exception as e:
        log.error(f"/automate/strategy error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
