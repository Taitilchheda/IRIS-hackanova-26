"""Agents module: Core trading and analysis agents."""
from app.agents.manager import ManagerAgent
from app.agents.trader_strategy import TraderStrategyAgent
from app.agents.verifier import VerifierAgent
from app.agents.comparator import ComparatorAgent
from app.agents.automator import AutomatorAgent

# Expert agents
from app.agents.expert.base import BaseExpertAgent
from app.agents.expert.alpha_signal import AlphaSignalAgent
from app.agents.expert.derivatives_pricing import DerivativesPricingAgent
from app.agents.expert.fixed_income import FixedIncomeAgent
from app.agents.expert.microstructure import MicrostructureAgent
from app.agents.expert.portfolio_construction import PortfolioAgent
from app.agents.expert.risk_analysis import RiskAnalysisAgent

__all__ = [
    # Core agents
    "ManagerAgent",
    "TraderStrategyAgent",
    "VerifierAgent",
    "ComparatorAgent",
    "AutomatorAgent",

    # Expert agents
    "BaseExpertAgent",
    "AlphaSignalAgent",
    "DerivativesPricingAgent",
    "FixedIncomeAgent",
    "MicrostructureAgent",
    "PortfolioAgent",
    "RiskAnalysisAgent",
]