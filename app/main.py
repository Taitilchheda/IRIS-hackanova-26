from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.strategy import router as strategy_router
from app.api.backtest import router as backtest_router
from app.api.tearsheet import router as tearsheet_router
from app.api.automator import router as automator_router
from app.api.market import router as market_router
from app.api.websocket import manager, market_data_updater
from app.db import init_db, get_session
import asyncio

app = FastAPI(
    title="IRIS — Intelligent Reasoning & Inferential Simulator",
    description="Agentic AI Backtesting Tool",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables and seed admin at startup
@app.on_event("startup")
def on_startup():
    init_db()

# ── API routes ───────────────────────────────────────────────────────────────
app.include_router(strategy_router, prefix="/api", tags=["Strategy"])
app.include_router(backtest_router, prefix="/api", tags=["Backtest"])
app.include_router(tearsheet_router, prefix="/api", tags=["Tearsheet"])
app.include_router(automator_router, prefix="/api", tags=["Automator"])
app.include_router(market_router, prefix="/api", tags=["Market"])

# ── WebSocket endpoint ───────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            # Echo back or handle client messages if needed
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Start background market data updater
@app.on_event("startup")
async def startup_event():
    init_db()
    # Start market data updater in background
    asyncio.create_task(market_data_updater())


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "0.2.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
