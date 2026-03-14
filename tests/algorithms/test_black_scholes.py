"""
Tests for Black-Scholes-Merton pricing and Greeks.
"""
import math
import pytest
from app.algorithms.pricing.black_scholes import bsm_price, bsm_greeks


S, K, T, r, sigma = 100.0, 100.0, 1.0, 0.04, 0.20


def test_call_is_positive():
    assert bsm_price(S, K, T, r, sigma, "call") > 0


def test_put_is_positive():
    assert bsm_price(S, K, T, r, sigma, "put") > 0


def test_put_call_parity():
    """C - P = S - K * exp(-rT)"""
    call = bsm_price(S, K, T, r, sigma, "call")
    put  = bsm_price(S, K, T, r, sigma, "put")
    lhs  = call - put
    rhs  = S - K * math.exp(-r * T)
    assert abs(lhs - rhs) < 1e-6


def test_call_intrinsic_floor():
    """Deep ITM call price >= intrinsic value."""
    call = bsm_price(150, 100, T, r, sigma, "call")
    assert call >= max(0, 150 - 100)


def test_put_intrinsic_floor():
    """Deep ITM European put price >= discounted intrinsic K*e^(-rT) - S."""
    deep_put = bsm_price(50, 100, T, r, sigma, "put")
    # European put lower bound is K*exp(-rT) - S, not K - S
    discounted_intrinsic = max(0, 100 * math.exp(-r * T) - 50)
    assert deep_put >= discounted_intrinsic - 1e-6


def test_call_price_zero_T():
    """At expiry, call = max(S-K, 0)."""
    price = bsm_price(110, 100, 0, r, sigma, "call")
    assert abs(price - 10.0) < 1e-6


def test_put_price_zero_T():
    price = bsm_price(90, 100, 0, r, sigma, "put")
    assert abs(price - 10.0) < 1e-6


def test_delta_call_in_range():
    greeks = bsm_greeks(S, K, T, r, sigma, "call")
    assert 0 < greeks["delta"] < 1


def test_delta_put_in_range():
    greeks = bsm_greeks(S, K, T, r, sigma, "put")
    assert -1 < greeks["delta"] < 0


def test_gamma_positive():
    greeks = bsm_greeks(S, K, T, r, sigma, "call")
    assert greeks["gamma"] > 0


def test_vega_positive():
    greeks = bsm_greeks(S, K, T, r, sigma, "call")
    assert greeks["vega"] > 0


def test_call_increases_with_sigma():
    c_low  = bsm_price(S, K, T, r, 0.10, "call")
    c_high = bsm_price(S, K, T, r, 0.40, "call")
    assert c_high > c_low


def test_call_increases_with_S():
    c1 = bsm_price(90, K, T, r, sigma, "call")
    c2 = bsm_price(110, K, T, r, sigma, "call")
    assert c2 > c1
