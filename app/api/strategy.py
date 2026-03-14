
"""
FastAPI routes: POST /run, POST /parse, POST /automate
"""
from fastapi import APIRouter, HTTPException
from app.nlp.schema import RunRequest
from app.agents.manager import ManagerAgent
from app.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter()

_manager = ManagerAgent()


def _persist_tearsheet(ts_dict: dict, user_id: int = 1):
    from app.models import TearsheetRecord
    from app.db import get_session
    
    with get_session() as session:
        record = TearsheetRecord(
            run_id=ts_dict["run_id"],
            user_id=user_id,
            asset=ts_dict["strategy_spec"]["asset"],
            start_date=ts_dict["strategy_spec"]["start_date"],
            end_date=ts_dict["strategy_spec"]["end_date"],
            payload=ts_dict,
            trader_sharpe=ts_dict.get("trader_metrics", {}).get("sharpe"),
            trader_cagr=ts_dict.get("trader_metrics", {}).get("cagr"),
            trader_max_dd=ts_dict.get("trader_metrics", {}).get("max_drawdown"),
        )
        session.add(record)
        session.commit()


@router.post("/run", response_model=None)
async def run_strategy(req: RunRequest):
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
        commission_pct=req.commission_bps / 10000,
        slippage_pct=req.slippage_bps / 10000,
    )
    return spec.model_dump()


@router.get("/tearsheet/{run_id}")
async def get_tearsheet(run_id: str):
    from app.models import TearsheetRecord
    from app.db import get_session
    from sqlmodel import select
    
    with get_session() as session:
        record = session.exec(select(TearsheetRecord).where(TearsheetRecord.run_id == run_id)).first()
        if not record:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
        return record.payload


@router.get("/history")
async def get_history():
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


@router.post("/automate/{run_id}")
async def automate(run_id: str, use_expert: bool = False):
    from app.models import TearsheetRecord
    from app.db import get_session
    from sqlmodel import select
    from app.nlp.schema import StrategySpec
    from app.agents.automator import AutomatorAgent
    
    with get_session() as session:
        record = session.exec(select(TearsheetRecord).where(TearsheetRecord.run_id == run_id)).first()
        if not record:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
        
        spec = StrategySpec(**record.payload["strategy_spec"])
        auto = AutomatorAgent()
        return auto.deploy(spec, run_id)
@router.post("/chat")
async def chat(messages: list[dict]):
    """Conversational endpoint for strategy refinement."""
    from app.nlp.parser import StrategyParser
    system = "You are IRIS, an expert quantitative research assistant. Help the user refine their trading strategy. Be concise, professional, and focus on technical parameters (assets, indicators, risk). If the user seems ready, suggest running the simulation."
    # Extract last user message
    user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    
    # Use Manager's LLM caller (already has logic for Anthropic/OpenRouter)
    from app.agents.manager import _call_llm
    response = _call_llm(system, user_msg)
    
    if not response:
        response = "I'm ready to help you build or refine your strategy. What objective are we targeting today?"
        
    return {"role": "assistant", "content": response}
