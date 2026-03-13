"""
Abstract base class for all expert benchmark agents.
"""
from abc import ABC, abstractmethod
from app.nlp.schema import StrategySpec, AgentResult


class BaseExpertAgent(ABC):
    name: str = "BaseExpert"

    @abstractmethod
    def run(self, spec: StrategySpec) -> AgentResult:
        """
        Execute the expert strategy and return an AgentResult.
        Must populate: equity_curve, dates, trade_log, metrics.
        """
        ...
