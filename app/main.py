from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.strategy import router as strategy_router
from app.api.backtest import router as backtest_router
from app.api.tearsheet import router as tearsheet_router
from app.api.automator import router as automator_router

app = FastAPI(
    title="IRIS — Intelligent Reasoning & Inferential Simulator",
    description="Agentic AI Backtesting Tool",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes ───────────────────────────────────────────────────────────────
app.include_router(strategy_router, prefix="/api", tags=["Strategy"])
app.include_router(backtest_router, prefix="/api", tags=["Backtest"])
app.include_router(tearsheet_router, prefix="/api", tags=["Tearsheet"])
app.include_router(automator_router, prefix="/api", tags=["Automator"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
