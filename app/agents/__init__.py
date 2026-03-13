"""Agents module: Core trading and analysis agents."""
from app.agents.manager import ManagerAgent
from app.agents.trader_strategy import TraderStrategyAgent
from app.agents.verifier import VerifierAgent
from app.agents.comparator import ComparatorAgent
from app.agents.automator import AutomatorAgent

# Expert agents
from app.agents.expert.base import ExpertAgent
from app.agents.expert.alpha_signal import AlphaSignalExpert
from app.agents.expert.derivatives_pricing import DerivativesPricingExpert
from app.agents.expert.fixed_income import FixedIncomeExpert
from app.agents.expert.microstructure import MicrostructureExpert
from app.agents.expert.portfolio_construction import PortfolioConstructionExpert
from app.agents.expert.risk_analysis import RiskAnalysisExpert

__all__ = [
    # Core agents
    "ManagerAgent",
    "TraderStrategyAgent", 
    "VerifierAgent",
    "ComparatorAgent",
    "AutomatorAgent",
    
    # Expert agents
    "ExpertAgent",
    "AlphaSignalExpert",
    "DerivativesPricingExpert", 
    "FixedIncomeExpert",
    "MicrostructureExpert",
    "PortfolioConstructionExpert",
    "RiskAnalysisExpert"
]