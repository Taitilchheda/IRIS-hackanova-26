"""
Pydantic models: StrategySpec, TradeCondition, AgentResult,
Tearsheet, RunRequest, VerifierResult
"""
from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class StrategyType(str, Enum):
    RISK_ANALYSIS = "risk_analysis"
    DERIVATIVES = "derivatives"
    PORTFOLIO = "portfolio"
    ALPHA_SIGNAL = "alpha_signal"
    FIXED_INCOME = "fixed_income"
    MICROSTRUCTURE = "microstructure"


class TradeCondition(BaseModel):
    indicator: str        # e.g. "SMA", "RSI", "MACD"
    params: Dict[str, Any] = {}
    operator: str         # e.g. "crosses_above", ">", "<", "crosses_below"
    value: Any            # threshold or another indicator


class StrategySpec(BaseModel):
    raw_prompt: str
    asset: str = "SPY"
    start_date: str = "2019-01-01"
    end_date: str = "2024-12-31"
    initial_capital: float = 100_000.0
    commission_pct: float = 0.001
    slippage_pct: float = 0.0005
    max_position_pct: float = 1.0
    risk_per_trade_pct: float = 0.02
    entry_conditions: List[TradeCondition] = []
    exit_conditions: List[TradeCondition] = []
    strategy_type: StrategyType = StrategyType.ALPHA_SIGNAL
    confidence: float = 0.0
    parsed_rules_text: str = ""


class AgentResult(BaseModel):
    agent_name: str
    equity_curve: List[float] = []
    dates: List[str] = []
    trade_log: List[Dict[str, Any]] = []
    metrics: Dict[str, float] = {}
    paths: List[List[float]] = []  # Supports Monte Carlo, Walk-forward, etc.
    error: Optional[str] = None
    elapsed_seconds: float = 0.0


class VerifierResult(BaseModel):
    ok: bool
    issues: List[str] = []
    agent_to_retry: Optional[str] = None


class TearsheetMetrics(BaseModel):
    sharpe: float = 0.0
    sortino: float = 0.0
    max_drawdown: float = 0.0
    win_rate: float = 0.0
    cagr: float = 0.0
    calmar: float = 0.0
    total_return: float = 0.0
    volatility: float = 0.0
    trade_count: int = 0


class Tearsheet(BaseModel):
    run_id: str
    strategy_spec: StrategySpec
    trader: AgentResult
    expert: AgentResult
    trader_metrics: TearsheetMetrics = TearsheetMetrics()
    expert_metrics: TearsheetMetrics = TearsheetMetrics()
    benchmark_equity: List[float] = []
    benchmark_metrics: TearsheetMetrics = TearsheetMetrics()
    narrative: str = ""
    expert_type: str = ""


class RunRequest(BaseModel):
    prompt: str
    asset: str = "SPY"
    start_date: str = "2019-01-01"
    end_date: str = "2024-12-31"
    initial_capital: float = 100_000.0
    commission_bps: float = 10.0
    slippage_bps: float = 5.0
    max_position_pct: float = 1.0
    monte_carlo_paths: int = 1000
    expert_type: Optional[str] = None
