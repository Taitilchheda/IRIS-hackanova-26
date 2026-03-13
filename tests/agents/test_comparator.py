"""
Tests for ComparatorAgent.
"""
import pytest
import numpy as np
from unittest.mock import patch
from app.nlp.schema import AgentResult


@pytest.fixture
def agent_result():
    rng = np.random.default_rng(55)
    n = 252
    eq = (100_000.0 * np.cumprod(1 + rng.normal(0.0005, 0.012, n))).tolist()
    dates = [f"2023-{str(i % 12 + 1).zfill(2)}-{str(i % 28 + 1).zfill(2)}"
             for i in range(n)]
    return AgentResult(
        agent_name="TestAgent",
        equity_curve=[round(e, 2) for e in eq],
        dates=dates,
        trade_log=[{"side": "SELL", "pnl_pct": 3.0}] * 5,
        metrics={},
        elapsed_seconds=0.2,
    )


def test_comparator_returns_tearsheet(sample_spec, agent_result, sample_ohlcv):
    from app.agents.comparator import ComparatorAgent
    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv):
        comp = ComparatorAgent()
        ts = comp.compare(agent_result, agent_result, sample_spec, "TEST-001")
    assert ts.run_id == "TEST-001"
    assert len(ts.trader.equity_curve) > 0
    assert len(ts.expert.equity_curve) > 0


def test_comparator_metrics_in_valid_range(sample_spec, agent_result, sample_ohlcv):
    from app.agents.comparator import ComparatorAgent
    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv):
        comp = ComparatorAgent()
        ts = comp.compare(agent_result, agent_result, sample_spec, "TEST-002")
    assert 0 <= ts.trader_metrics.win_rate <= 1.0
    assert ts.trader_metrics.max_drawdown <= 0.0


def test_comparator_benchmark_present(sample_spec, agent_result, sample_ohlcv):
    from app.agents.comparator import ComparatorAgent
    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv):
        comp = ComparatorAgent()
        ts = comp.compare(agent_result, agent_result, sample_spec, "TEST-003")
    assert len(ts.benchmark_equity) > 0


def test_comparator_expert_dates_aligned(sample_spec, agent_result, sample_ohlcv):
    """Expert equity curve should be aligned to trader dates."""
    from app.agents.comparator import ComparatorAgent
    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv):
        comp = ComparatorAgent()
        ts = comp.compare(agent_result, agent_result, sample_spec, "TEST-004")
    assert len(ts.trader.equity_curve) == len(ts.expert.equity_curve)


def test_comparator_strategy_spec_preserved(sample_spec, agent_result, sample_ohlcv):
    from app.agents.comparator import ComparatorAgent
    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv):
        comp = ComparatorAgent()
        ts = comp.compare(agent_result, agent_result, sample_spec, "TEST-005")
    assert ts.strategy_spec.asset == sample_spec.asset
