"""
Verifier Agent — validates both AgentResults vs StrategySpec requirements.
"""
from __future__ import annotations
import numpy as np
from app.nlp.schema import AgentResult, StrategySpec, VerifierResult
from app.utils.logger import get_logger

log = get_logger(__name__)


class VerifierAgent:
    name = "Verifier"

    def verify(self, trader: AgentResult, expert: AgentResult,
               spec: StrategySpec) -> VerifierResult:
        issues = []
        agent_to_retry = None

        def _check(result: AgentResult) -> list[str]:
            errs = []
            if result.error:
                errs.append(f"{result.agent_name}: agent returned error — {result.error}")
                return errs
            if not result.equity_curve:
                errs.append(f"{result.agent_name}: equity curve is empty")
                return errs
            eq = np.array(result.equity_curve, dtype=float)
            if np.any(~np.isfinite(eq)):
                errs.append(f"{result.agent_name}: equity curve contains NaN/Inf")
            if len(eq) < 10:
                errs.append(f"{result.agent_name}: too few data points ({len(eq)})")
            if eq[0] <= 0:
                errs.append(f"{result.agent_name}: non-positive starting equity")
            return errs

        trader_issues = _check(trader)
        expert_issues = _check(expert)

        issues.extend(trader_issues)
        issues.extend(expert_issues)

        if trader_issues and not expert_issues:
            agent_to_retry = trader.agent_name
        elif expert_issues and not trader_issues:
            agent_to_retry = expert.agent_name

        ok = len(issues) == 0
        if ok:
            log.info("[Verifier] Both results pass verification ✓")
        else:
            log.warning(f"[Verifier] Issues found: {issues}")

        return VerifierResult(ok=ok, issues=issues, agent_to_retry=agent_to_retry)
