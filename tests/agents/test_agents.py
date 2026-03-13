"""
Tests for agent pipeline: trader_strategy, verifier, comparator.
"""
import pytest
import numpy as np
from unittest.mock import patch
from app.nlp.schema import AgentResult, StrategyType


@pytest.fixture
def good_agent_result():
    np.random.seed(42)
    eq = [100_000.0 * np.prod(1 + np.random.normal(0.0005, 0.012, i))
          for i in range(1, 253)]
    dates = [f"2023-{str(i % 12 + 1).zfill(2)}-{str(i % 28 + 1).zfill(2)}"
             for i in range(252)]
    return AgentResult(
        agent_name="TestAgent",
        equity_curve=[round(float(e), 2) for e in eq],
        dates=dates,
        trade_log=[{"side": "SELL", "pnl_pct": 3.0}] * 5,
        metrics={},
        elapsed_seconds=0.5,
    )


# ── Trader Strategy Agent ────────────────────────────────────────────────
def test_trader_agent_runs(sample_spec, sample_ohlcv):
    from app.agents.trader_strategy import TraderStrategyAgent
    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv):
        agent = TraderStrategyAgent()
        result = agent.run(sample_spec)
    assert result.error is None
    assert len(result.equity_curve) > 0
    assert all(e > 0 for e in result.equity_curve)


def test_trader_agent_returns_dates(sample_spec, sample_ohlcv):
    from app.agents.trader_strategy import TraderStrategyAgent
    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv):
        agent = TraderStrategyAgent()
        result = agent.run(sample_spec)
    assert len(result.dates) == len(result.equity_curve)


# ── Verifier Agent ───────────────────────────────────────────────────────
def test_verifier_passes_good_results(sample_spec, good_agent_result):
    from app.agents.verifier import VerifierAgent
    v = VerifierAgent()
    result = v.verify(good_agent_result, good_agent_result, sample_spec)
    assert result.ok is True
    assert result.issues == []


def test_verifier_catches_empty_equity(sample_spec, good_agent_result):
    from app.agents.verifier import VerifierAgent
    bad = AgentResult(agent_name="Bad", equity_curve=[], dates=[], trade_log=[])
    v = VerifierAgent()
    result = v.verify(bad, good_agent_result, sample_spec)
    assert result.ok is False
    assert len(result.issues) > 0


def test_verifier_catches_error_result(sample_spec, good_agent_result):
    from app.agents.verifier import VerifierAgent
    bad = AgentResult(agent_name="Bad", equity_curve=[], dates=[], error="Something failed")
    v = VerifierAgent()
    result = v.verify(good_agent_result, bad, sample_spec)
    assert result.ok is False


# ── Comparator Agent ─────────────────────────────────────────────────────
def test_comparator_produces_tearsheet(sample_spec, good_agent_result, sample_ohlcv):
    from app.agents.comparator import ComparatorAgent
    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv):
        comp = ComparatorAgent()
        ts = comp.compare(good_agent_result, good_agent_result, sample_spec, "RUN_TEST")
    assert ts.run_id == "RUN_TEST"
    assert ts.trader_metrics.sharpe != 0 or ts.trader_metrics.cagr is not None
    assert len(ts.trader.equity_curve) > 0


def test_comparator_metrics_bounds(sample_spec, good_agent_result, sample_ohlcv):
    from app.agents.comparator import ComparatorAgent
    with patch("app.data.loader.load_ohlcv", return_value=sample_ohlcv):
        comp = ComparatorAgent()
        ts = comp.compare(good_agent_result, good_agent_result, sample_spec, "RUN_TEST2")
    assert 0 <= ts.trader_metrics.win_rate <= 1.0
    assert ts.trader_metrics.max_drawdown <= 0.0
