"""
FastAPI routes: POST /run, POST /parse, POST /automate
"""
from fastapi import APIRouter, HTTPException
from app.nlp.schema import RunRequest, Tearsheet
from app.agents.manager import ManagerAgent
from app.utils.logger import get_logger
import json

log = get_logger(__name__)
router = APIRouter()

_manager = ManagerAgent()
_tearsheets: dict[str, dict] = {}  # in-memory store for tearsheets


@router.post("/run", response_model=None)
async def run_strategy(req: RunRequest):
    """Full pipeline: parse → run trader + expert → verify → compare → narrate."""
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
        _tearsheets[ts.run_id] = result
        return result
    except Exception as e:
        log.error(f"/run error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse")
async def parse_strategy(req: RunRequest):
    """Parse-only endpoint for debugging."""
    from app.nlp.parser import StrategyParser
    parser = StrategyParser()
    spec = parser.parse(
        prompt=req.prompt,
        asset=req.asset,
        start_date=req.start_date,
        end_date=req.end_date,
        initial_capital=req.initial_capital,
    )
    return spec.model_dump()


@router.get("/tearsheet/{run_id}")
async def get_tearsheet(run_id: str):
    ts = _tearsheets.get(run_id)
    if not ts:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return ts


@router.get("/history")
async def get_history():
    return [
        {"run_id": rid, "asset": v["strategy_spec"]["asset"],
         "start_date": v["strategy_spec"]["start_date"],
         "end_date": v["strategy_spec"]["end_date"]}
        for rid, v in _tearsheets.items()
    ]


@router.post("/automate/{run_id}")
async def automate(run_id: str, use_expert: bool = False):
    ts_data = _tearsheets.get(run_id)
    if not ts_data:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    from app.nlp.schema import StrategySpec
    from app.agents.automator import AutomatorAgent
    spec = StrategySpec(**ts_data["strategy_spec"])
    auto = AutomatorAgent()
    return auto.deploy(spec, run_id)
