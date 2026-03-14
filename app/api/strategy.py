"""
FastAPI routes: POST /run, POST /parse, GET /tearsheet, GET /history, POST /automate
Supports both DB persistence and in-memory cache.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select

from app.nlp.schema import RunRequest
from app.agents.manager import ManagerAgent
from app.utils.logger import get_logger
from app.db import get_session
from app.models import TearsheetRecord

log = get_logger(__name__)
router = APIRouter()

_manager = ManagerAgent()

# in-memory cache
_tearsheets: dict[str, dict] = {}


def _persist_tearsheet(session: Session | None, ts_dict: dict):
    """
    Persist tearsheet to both:
    - database
    - in-memory cache
    """

    run_id = ts_dict.get("run_id")

    # ---------- MEMORY CACHE ----------
    _tearsheets[run_id] = ts_dict

    # ---------- DATABASE ----------
    if session:
        try:
            spec = ts_dict.get("strategy_spec", {})
            tm = ts_dict.get("trader_metrics", {})

            record = TearsheetRecord(
                run_id=run_id,
                user_id=1,  # default user
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

        except Exception as e:
            log.warning(f"DB persist failed for {run_id}: {e}")


@router.post("/run", response_model=None)
async def run_strategy(req: RunRequest, session: Session = Depends(get_session)):
    """Full pipeline: parse → trader + expert → verify → compare → narrate."""

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
            groq_api_key=req.groq_api_key,
        )

        result = ts.model_dump()

        _persist_tearsheet(session, result)

        return result

    except ValueError as e:
        log.error(f"/run value error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        log.error(f"/run error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal error during run. Check backend logs."
        )


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
async def get_tearsheet(run_id: str, session: Session = Depends(get_session)):

    # ---------- TRY DATABASE ----------
    ts = session.exec(
        select(TearsheetRecord).where(TearsheetRecord.run_id == run_id)
    ).first()

    if ts:
        return ts.payload

    # ---------- FALLBACK MEMORY ----------
    ts_mem = _tearsheets.get(run_id)

    if ts_mem:
        return ts_mem

    raise HTTPException(status_code=404, detail=f"Run {run_id} not found")


@router.get("/history")
async def get_history(session: Session = Depends(get_session)):

    try:
        records = session.exec(
            select(TearsheetRecord).order_by(TearsheetRecord.created_at.desc())
        ).all()

        if records:
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
    except Exception:
        pass

    # ---------- FALLBACK MEMORY ----------
    return [
        {
            "run_id": rid,
            "asset": v["strategy_spec"]["asset"],
            "start_date": v["strategy_spec"]["start_date"],
            "end_date": v["strategy_spec"]["end_date"],
            "sharpe": v.get("trader_metrics", {}).get("sharpe"),
            "cagr": v.get("trader_metrics", {}).get("cagr"),
            "max_drawdown": v.get("trader_metrics", {}).get("max_drawdown"),
        }
        for rid, v in _tearsheets.items()
    ]


@router.post("/automate/{run_id}")
async def automate(run_id: str, use_expert: bool = False, session: Session = Depends(get_session)):

    ts_data = None

    # ---------- TRY DATABASE ----------
    ts_record = session.exec(
        select(TearsheetRecord).where(TearsheetRecord.run_id == run_id)
    ).first()

    if ts_record:
        ts_data = ts_record.payload

    # ---------- FALLBACK MEMORY ----------
    if not ts_data:
        ts_data = _tearsheets.get(run_id)

    if not ts_data:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    from app.nlp.schema import StrategySpec
    from app.agents.automator import AutomatorAgent

    spec = StrategySpec(**ts_data["strategy_spec"])

    auto = AutomatorAgent()

    return auto.deploy(spec, run_id)