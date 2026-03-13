"""
Tests for VerifierAgent.
"""
import pytest
import numpy as np
from app.nlp.schema import AgentResult


@pytest.fixture
def good_result():
    rng = np.random.default_rng(10)
    n = 252
    eq = (100_000.0 * np.cumprod(1 + rng.normal(0.0005, 0.012, n))).tolist()
    return AgentResult(
        agent_name="GoodAgent",
        equity_curve=[round(e, 2) for e in eq],
        dates=[f"2023-01-{str(i+1).zfill(2)}" for i in range(n)],
        trade_log=[{"side": "SELL", "pnl_pct": 2.0}],
    )


@pytest.fixture
def empty_result():
    return AgentResult(agent_name="EmptyAgent", equity_curve=[], dates=[], trade_log=[])


@pytest.fixture
def error_result():
    return AgentResult(agent_name="ErrorAgent", error="Simulation failed")


def test_verifier_passes_two_good_results(sample_spec, good_result):
    from app.agents.verifier import VerifierAgent
    v = VerifierAgent()
    r = v.verify(good_result, good_result, sample_spec)
    assert r.ok is True
    assert r.issues == []


def test_verifier_fails_empty_trader(sample_spec, good_result, empty_result):
    from app.agents.verifier import VerifierAgent
    v = VerifierAgent()
    r = v.verify(empty_result, good_result, sample_spec)
    assert r.ok is False
    assert any("empty" in issue.lower() for issue in r.issues)


def test_verifier_fails_empty_expert(sample_spec, good_result, empty_result):
    from app.agents.verifier import VerifierAgent
    v = VerifierAgent()
    r = v.verify(good_result, empty_result, sample_spec)
    assert r.ok is False


def test_verifier_fails_error_result(sample_spec, good_result, error_result):
    from app.agents.verifier import VerifierAgent
    v = VerifierAgent()
    r = v.verify(error_result, good_result, sample_spec)
    assert r.ok is False
    assert any("error" in issue.lower() for issue in r.issues)


def test_verifier_identifies_retry_agent(sample_spec, good_result, empty_result):
    from app.agents.verifier import VerifierAgent
    v = VerifierAgent()
    r = v.verify(empty_result, good_result, sample_spec)
    assert r.agent_to_retry == "EmptyAgent"


def test_verifier_nan_equity_fails(sample_spec, good_result):
    import math
    from app.agents.verifier import VerifierAgent
    bad = AgentResult(
        agent_name="Nan",
        equity_curve=[float("nan")] * 252,
        dates=["2023-01-01"] * 252,
    )
    v = VerifierAgent()
    r = v.verify(bad, good_result, sample_spec)
    assert r.ok is False
