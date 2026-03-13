"""
Tests for FrictionModel — commission and slippage arithmetic.
"""
import pytest
from app.engine.friction import FrictionModel


@pytest.fixture
def friction():
    return FrictionModel(commission_pct=0.001, slippage_pct=0.0005)


def test_buy_fill_price_adverse(friction):
    """BUY fill_price should be higher than the raw price (slippage)."""
    fill_price, comm, slip = friction.apply(100.0, 10, "BUY")
    assert fill_price > 100.0


def test_sell_fill_price_adverse(friction):
    """SELL fill_price should be lower than the raw price (slippage)."""
    fill_price, comm, slip = friction.apply(100.0, 10, "SELL")
    assert fill_price < 100.0


def test_commission_positive(friction):
    _, comm, _ = friction.apply(100.0, 10, "BUY")
    assert comm > 0


def test_slippage_positive(friction):
    _, _, slip = friction.apply(100.0, 10, "BUY")
    assert slip > 0


def test_commission_arithmetic(friction):
    """Commission = fill_price * quantity * commission_pct."""
    price = 200.0
    qty = 5.0
    fill_price, comm, slip = friction.apply(price, qty, "BUY")
    expected_comm = fill_price * qty * 0.001
    assert abs(comm - expected_comm) < 1e-6


def test_slippage_arithmetic(friction):
    price = 100.0
    qty = 10.0
    fill_price, comm, slip = friction.apply(price, qty, "BUY")
    expected_slip = abs(fill_price - price) * qty
    assert abs(slip - expected_slip) < 1e-6


def test_zero_commission():
    fm = FrictionModel(commission_pct=0.0, slippage_pct=0.001)
    _, comm, _ = fm.apply(100.0, 10, "BUY")
    assert comm == 0.0


def test_zero_slippage():
    fm = FrictionModel(commission_pct=0.001, slippage_pct=0.0)
    fill_price, _, slip = fm.apply(100.0, 10, "BUY")
    assert fill_price == 100.0
    assert slip == 0.0
