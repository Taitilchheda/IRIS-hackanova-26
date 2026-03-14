import pytest
from app.api.strategy import _persist_tearsheet
from app.models import TearsheetRecord
from app.db import get_session
from sqlmodel import select

def test_tearsheet_persistence():
    run_id = "test_run_123"
    ts_dict = {
        "run_id": run_id,
        "strategy_spec": {
            "asset": "AAPL",
            "start_date": "2020-01-01",
            "end_date": "2020-12-31"
        },
        "trader_metrics": {
            "sharpe": 1.5,
            "cagr": 0.25,
            "max_drawdown": 0.1
        }
    }
    
    # Persist
    _persist_tearsheet(ts_dict, user_id=1)
    
    # Retrieve and verify
    with get_session() as session:
        record = session.exec(select(TearsheetRecord).where(TearsheetRecord.run_id == run_id)).first()
        assert record is not None
        assert record.asset == "AAPL"
        assert record.trader_sharpe == 1.5
        assert record.payload["run_id"] == run_id
        
        # Cleanup
        session.delete(record)
        session.commit()
