"""
POST /automate/{run_id} — deploys an approved strategy via AutomatorAgent.
POST /automate/strategy  — deploy from raw StrategySpec JSON.
"""
from fastapi import APIRouter, HTTPException
from app.nlp.schema import StrategySpec
from app.agents.automator import AutomatorAgent
from app.utils.logger import get_logger
from app.api.strategy import _tearsheets

log = get_logger(__name__)
router = APIRouter()

_automator = AutomatorAgent()


@router.post("/automate/{run_id}")
async def automate_from_run(run_id: str, use_expert: bool = False):
    """
    Deploy the strategy from an existing tearsheet run.

    Parameters
    ----------
    run_id     : ID returned from /run or /backtest
    use_expert : if True, uses the expert spec instead of trader spec
                 (ignored for now — spec is the same in both cases)
    """
    ts_data = _tearsheets.get(run_id)
    if not ts_data:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    try:
        spec = StrategySpec(**ts_data["strategy_spec"])
        result = _automator.deploy(spec, run_id)
        return result
    except Exception as e:
        log.error(f"/automate/{run_id} error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/automate/strategy")
async def automate_from_spec(spec: StrategySpec):
    """Deploy a strategy directly from a StrategySpec payload."""
    from app.utils.logger import new_run_id
    run_id = new_run_id()
    try:
        result = _automator.deploy(spec, run_id)
        return result
    except Exception as e:
        log.error(f"/automate/strategy error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
