"""
POST /backtest — triggers a backtest run given a strategy spec dict.
"""
from fastapi import APIRouter, HTTPException
from app.nlp.schema import RunRequest
from app.agents.manager import ManagerAgent
from app.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter()

_manager = ManagerAgent()
_runs: dict[str, dict] = {}


@router.post("/backtest", response_model=None)
async def run_backtest(req: RunRequest):
    """
    Run a full backtest pipeline: parse → trader + expert → verify → compare → narrate.
    Identical to /run but lives under /backtest for semantic clarity.
    """
    try:
        ts = _manager.run(
            prompt=req.prompt,
            asset=req.asset,
            start_date=req.start_date,
            end_date=req.end_date,
            initial_capital=req.initial_capital,
            commission_bps=req.commission_bps,
            slippage_bps=req.slippage_bps,
            max_position_pct=req.max_position_pct,
            expert_type=req.expert_type,
        )
        result = ts.model_dump()
        _runs[ts.run_id] = result
        return result
    except Exception as e:
        log.error(f"/backtest error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
