"""API module: FastAPI routes for strategy execution and management."""
from app.api.strategy import router as strategy_router
from app.api.tearsheet import router as tearsheet_router
from app.api.backtest import router as backtest_router
from app.api.automator import router as automator_router

__all__ = [
    "strategy_router",
    "tearsheet_router", 
    "backtest_router",
    "automator_router"
]