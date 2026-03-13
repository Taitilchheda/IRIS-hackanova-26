"""
Tests for ManagerAgent end-to-end pipeline (mocked).
"""
import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from app.nlp.schema import AgentResult, StrategySpec, StrategyType


@pytest.fixture
def mock_agent_result():
    """A realistic AgentResult fixture."""
    rng = np.random.default_rng(42)
    n = 252
    eq = (100_000.0 * np.cumprod(1 + rng.normal(0.0005, 0.012, n))).tolist()
    dates = [f"2023-{str(i % 12 + 1).zfill(2)}-{str(i % 28 + 1).zfill(2)}"
             for i in range(n)]
    return AgentResult(
        agent_name="MockAgent",
        equity_curve=[round(e, 2) for e in eq],
        dates=dates,
        trade_log=[{"side": "SELL", "pnl_pct": 5.0}] * 3,
        metrics={},
        elapsed_seconds=0.1,
    )


@pytest.fixture
def mock_spec(sample_spec):
    return sample_spec


def test_manager_run_returns_tearsheet(mock_spec, mock_agent_result, sample_ohlcv):
    """ManagerAgent.run() should return a complete Tearsheet."""
    from app.agents.manager import ManagerAgent
    from app.nlp.schema import Tearsheet

    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv), \
         patch("app.nlp.parser.StrategyParser.parse", return_value=mock_spec), \
         patch("app.agents.trader_strategy.TraderStrategyAgent.run",
               return_value=mock_agent_result), \
         patch("app.agents.expert.alpha_signal.AlphaSignalAgent.run",
               return_value=mock_agent_result):

        manager = ManagerAgent()
        ts = manager.run(
            prompt="buy on 50-day MA cross above 200-day MA",
            asset="AAPL",
        )

    assert isinstance(ts, Tearsheet)
    assert ts.run_id != ""
    assert len(ts.trader.equity_curve) > 0
    assert len(ts.expert.equity_curve) > 0


def test_manager_run_has_metrics(mock_spec, mock_agent_result, sample_ohlcv):
    """Result should contain non-trivial metrics."""
    from app.agents.manager import ManagerAgent

    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv), \
         patch("app.nlp.parser.StrategyParser.parse", return_value=mock_spec), \
         patch("app.agents.trader_strategy.TraderStrategyAgent.run",
               return_value=mock_agent_result), \
         patch("app.agents.expert.alpha_signal.AlphaSignalAgent.run",
               return_value=mock_agent_result):

        manager = ManagerAgent()
        ts = manager.run(prompt="test prompt", asset="AAPL")

    assert ts.trader_metrics is not None
    assert ts.expert_metrics is not None
    assert 0.0 <= ts.trader_metrics.win_rate <= 1.0
    assert ts.trader_metrics.max_drawdown <= 0.0
