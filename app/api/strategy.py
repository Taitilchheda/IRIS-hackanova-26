
"""
FastAPI routes: POST /run, POST /parse, POST /automate
"""
from fastapi import APIRouter, HTTPException, Depends
from app.nlp.schema import RunRequest
from app.agents.manager import ManagerAgent
from app.utils.logger import get_logger
from app.api.auth import get_current_user

log = get_logger(__name__)
router = APIRouter()

_manager = ManagerAgent()
_tearsheets: dict[str, dict] = {}


def _persist_tearsheet(ts_dict: dict):
    _tearsheets[ts_dict.get("run_id")] = ts_dict


@router.post("/run", response_model=None)
async def run_strategy(req: RunRequest, current_user = Depends(get_current_user)):
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
        _persist_tearsheet(result)
        return result
    except ValueError as e:
        log.error(f"/run value error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log.error(f"/run error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal error during run")


@router.post("/parse")
async def parse_strategy(req: RunRequest):
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
async def get_tearsheet(run_id: str, current_user = Depends(get_current_user)):
    ts = _tearsheets.get(run_id)
    if not ts:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return ts


@router.get("/history")
async def get_history(current_user = Depends(get_current_user)):
    return [
        {"run_id": rid, "asset": v["strategy_spec"]["asset"],
         "start_date": v["strategy_spec"]["start_date"],
         "end_date": v["strategy_spec"]["end_date"],
         "sharpe": v.get("trader_metrics", {}).get("sharpe"),
         "cagr": v.get("trader_metrics", {}).get("cagr"),
         "max_drawdown": v.get("trader_metrics", {}).get("max_drawdown"),
        }
        for rid, v in _tearsheets.items()
    ]


@router.post("/automate/{run_id}")
async def automate(run_id: str, use_expert: bool = False, current_user = Depends(get_current_user)):
    ts_data = _tearsheets.get(run_id)
    if not ts_data:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    from app.nlp.schema import StrategySpec
    from app.agents.automator import AutomatorAgent
    spec = StrategySpec(**ts_data["strategy_spec"])
    auto = AutomatorAgent()
    return auto.deploy(spec, run_id)
