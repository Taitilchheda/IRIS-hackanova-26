"""
Manager / Orchestrator Agent.
• Parses NL prompt via NLP parser
• Selects and instantiates Expert Agent
• Fires Trader + Expert in asyncio.gather()
• Passes to Verifier → Comparator
• Calls LLM to narrate tearsheet
• Triggers Automator if trader approves
"""
from __future__ import annotations
import asyncio
import os
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from app.nlp.parser import StrategyParser
from app.nlp.schema import StrategySpec, StrategyType, Tearsheet
from app.agents.trader_strategy import TraderStrategyAgent
from app.agents.verifier import VerifierAgent
from app.agents.comparator import ComparatorAgent
from app.agents.automator import AutomatorAgent
from app.agents.expert.risk_analysis import RiskAnalysisAgent
from app.agents.expert.alpha_signal import AlphaSignalAgent
from app.agents.expert.portfolio_construction import PortfolioAgent
from app.agents.expert.derivatives_pricing import DerivativesPricingAgent
from app.agents.expert.fixed_income import FixedIncomeAgent
from app.agents.expert.microstructure import MicrostructureAgent
from app.agents.expert.trend_following import TrendFollowingAgent
from app.utils.logger import get_logger, new_run_id
from app.config import settings
import httpx

log = get_logger(__name__)

MAX_RETRIES = 2

EXPERT_MAP = {
    StrategyType.RISK_ANALYSIS: RiskAnalysisAgent,
    StrategyType.ALPHA_SIGNAL: AlphaSignalAgent,
    StrategyType.PORTFOLIO: PortfolioAgent,
    StrategyType.DERIVATIVES: DerivativesPricingAgent,
    StrategyType.FIXED_INCOME: FixedIncomeAgent,
    StrategyType.MICROSTRUCTURE: MicrostructureAgent,
}

DEFAULT_EXPERT = TrendFollowingAgent

PROMPT_DIR = Path(__file__).parent.parent / "nlp" / "prompts"


def _load_prompt(name: str) -> str:
    return (PROMPT_DIR / name).read_text(encoding="utf-8")


def _call_llm(system: str, user: str, api_key: str | None = None) -> str:
    """Use Groq only as requested by user."""
    if not api_key:
        log.warning("Groq API key missing for narrative")
        return ""

    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "llama-3.3-70b-versatile", # Or another Groq model
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "max_tokens": 500,
            "temperature": 0.3,
        }
        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=25.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        log.warning(f"Groq narrative failed: {e}")
        return ""


class ManagerAgent:
    def __init__(self):
        self.parser = StrategyParser()
        self.verifier = VerifierAgent()
        self.comparator = ComparatorAgent()
        self.automator = AutomatorAgent()

    def run(
        self,
        prompt: str,
        asset: str = "SPY",
        start_date: str = "2019-01-01",
        end_date: str = "2024-12-31",
        initial_capital: float = 100_000.0,
        commission_bps: float = 10.0,
        slippage_bps: float = 5.0,
        max_position_pct: float = 1.0,
        expert_type: str | None = None,
        groq_api_key: str | None = None,
    ) -> Tearsheet:
        run_id = new_run_id()
        log.info(f"=== IRIS Run {run_id} | {asset} | {start_date}→{end_date} ===")
        t0 = time.time()

        # 1. Parse strategy
        spec = self.parser.parse(
            prompt=prompt,
            asset=asset,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            commission_pct=commission_bps / 10000,
            slippage_pct=slippage_bps / 10000,
            max_position_pct=max_position_pct,
        )

        # Override expert type if specified
        if expert_type:
            try:
                spec.strategy_type = StrategyType(expert_type)
            except ValueError:
                pass

        # 2. Select expert
        expert_cls = EXPERT_MAP.get(spec.strategy_type, DEFAULT_EXPERT)
        expert_agent = expert_cls()
        trader_agent = TraderStrategyAgent()

        log.info(f"Expert selected: {expert_agent.name}")

        # 3. Run trader + expert in parallel (using threads for sync code)
        with ThreadPoolExecutor(max_workers=2) as executor:
            trader_future = executor.submit(trader_agent.run, spec)
            expert_future = executor.submit(expert_agent.run, spec)
            trader_result = trader_future.result()
            expert_result = expert_future.result()

        # Fail fast if any agent errored so UI surfaces the issue
        if trader_result.error:
            raise ValueError(f"Trader agent failed: {trader_result.error}")
        if expert_result.error:
            raise ValueError(f"Expert agent failed: {expert_result.error}")

        log.info(f"Trader done in {trader_result.elapsed_seconds}s, "
                 f"Expert done in {expert_result.elapsed_seconds}s")

        # 4. Verify (with retry)
        for attempt in range(MAX_RETRIES):
            verification = self.verifier.verify(trader_result, expert_result, spec)
            if verification.ok:
                break
            log.warning(f"Verification failed (attempt {attempt + 1}): {verification.issues}")
            if verification.agent_to_retry == trader_agent.name:
                trader_result = trader_agent.run(spec)
            elif verification.agent_to_retry == expert_agent.name:
                expert_result = expert_agent.run(spec)
            else:
                break  # Can't recover

        # 5. Compare
        tearsheet = self.comparator.compare(trader_result, expert_result, spec, run_id)

        # 6. Narrate with LLM (best effort)
        narrative = self._narrate(tearsheet, groq_api_key)
        tearsheet.narrative = narrative

        log.info(f"=== Run {run_id} complete in {round(time.time() - t0, 2)}s ===")
        return tearsheet

    def _narrate(self, ts: Tearsheet, groq_api_key: str | None = None) -> str:
        system = _load_prompt("narrate_tearsheet.txt")
        tm = ts.trader_metrics
        em = ts.expert_metrics
        bm = ts.benchmark_metrics
        user = (
            f"Trader: CAGR={tm.cagr:.1%}, Sharpe={tm.sharpe:.2f}, "
            f"MaxDD={tm.max_drawdown:.1%}, WinRate={tm.win_rate:.1%}, "
            f"TotalReturn={tm.total_return:.1%}\n"
            f"Expert ({ts.expert_type}): CAGR={em.cagr:.1%}, Sharpe={em.sharpe:.2f}, "
            f"MaxDD={em.max_drawdown:.1%}\n"
            f"SPY Benchmark: CAGR={bm.cagr:.1%}, Sharpe={bm.sharpe:.2f}\n"
            f"Strategy: {ts.strategy_spec.parsed_rules_text}"
        )
        narrative = _call_llm(system, user, groq_api_key)
        if not narrative:
            # Fallback narrative
            narrative = (
                f"Your strategy returned {tm.total_return:.1%} total "
                f"(CAGR {tm.cagr:.1%}, Sharpe {tm.sharpe:.2f}, max drawdown {tm.max_drawdown:.1%}). "
                f"The {ts.expert_type} expert achieved CAGR {em.cagr:.1%} with Sharpe {em.sharpe:.2f}. "
                f"SPY benchmark: CAGR {bm.cagr:.1%}. "
                + ("Automate the expert strategy." if em.sharpe > tm.sharpe
                   else "Your strategy outperforms — consider automating it.")
            )
        return narrative

    def deploy(self, tearsheet: Tearsheet, use_expert: bool = False) -> dict:
        spec = tearsheet.strategy_spec
        return self.automator.deploy(spec, tearsheet.run_id)
