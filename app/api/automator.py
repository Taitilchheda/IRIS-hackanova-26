
"""
POST /automate/{run_id} — deploys an approved strategy via AutomatorAgent.
POST /automate/strategy  — deploy from raw StrategySpec JSON.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.nlp.schema import StrategySpec
from app.agents.automator import AutomatorAgent
from app.api.auth import get_current_user
from app.api.auth import get_current_user
from app.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter()

_automator = AutomatorAgent()


@router.post("/automate/{run_id}")
async def automate_from_run(run_id: str, use_expert: bool = False, current_user = Depends(get_current_user)):
    from app.models import TearsheetRecord
    from app.db import get_session
    from sqlmodel import select

    with get_session() as session:
        record = session.exec(select(TearsheetRecord).where(TearsheetRecord.run_id == run_id)).first()
        if not record:
            raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
        try:
            spec = StrategySpec(**record.payload["strategy_spec"])
            result = _automator.deploy(spec, run_id)
            return result
        except Exception as e:
            log.error(f"/automate/{run_id} error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/automate/strategy")
async def automate_from_spec(spec: StrategySpec, current_user = Depends(get_current_user)):
    from app.utils.logger import new_run_id
    run_id = new_run_id()
    try:
        result = _automator.deploy(spec, run_id)
        return result
    except Exception as e:
        log.error(f"/automate/strategy error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
