"""
FastAPI routes: POST /run, POST /parse, POST /automate
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.nlp.schema import RunRequest
from app.agents.manager import ManagerAgent
from app.utils.logger import get_logger
from app.db import get_session
from app.api.auth import get_current_user
from app.models import TearsheetRecord, User
import json

log = get_logger(__name__)
router = APIRouter()

_manager = ManagerAgent()


def _persist_tearsheet(session: Session, user: User, ts_dict: dict):
    spec = ts_dict.get("strategy_spec", {})
    tm = ts_dict.get("trader_metrics", {})
    record = TearsheetRecord(
        run_id=ts_dict.get("run_id"),
        user_id=user.id,
        asset=spec.get("asset", ""),
        start_date=spec.get("start_date", ""),
        end_date=spec.get("end_date", ""),
        payload=ts_dict,
        trader_sharpe=tm.get("sharpe"),
        trader_cagr=tm.get("cagr"),
        trader_max_dd=tm.get("max_drawdown"),
    )
    session.add(record)
    session.commit()


@router.post("/run", response_model=None)
async def run_strategy(req: RunRequest, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
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
        _persist_tearsheet(session, current_user, result)
        return result
    except ValueError as e:
        log.error(f"/run value error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log.error(f"/run error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail='Internal error during run. Check backend logs.')


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
async def get_tearsheet(run_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    ts = session.exec(select(TearsheetRecord).where(TearsheetRecord.run_id == run_id, TearsheetRecord.user_id == current_user.id)).first()
    if not ts:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return ts.payload


@router.get("/history")
async def get_history(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    records = session.exec(select(TearsheetRecord).where(TearsheetRecord.user_id == current_user.id).order_by(TearsheetRecord.created_at.desc())).all()
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


@router.post("/automate/{run_id}")
async def automate(run_id: str, use_expert: bool = False, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    ts_data = session.exec(select(TearsheetRecord).where(TearsheetRecord.run_id == run_id, TearsheetRecord.user_id == current_user.id)).first()
    if not ts_data:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    from app.nlp.schema import StrategySpec
    from app.agents.automator import AutomatorAgent
    spec = StrategySpec(**ts_data.payload["strategy_spec"])
    auto = AutomatorAgent()
    return auto.deploy(spec, run_id)
