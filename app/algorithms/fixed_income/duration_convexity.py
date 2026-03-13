"""
Fixed Income: Modified Duration, DV01, Convexity.
Provides: modified_duration, dv01, convexity, price_from_yield
"""
from __future__ import annotations
import numpy as np
from typing import List, Optional


def price_from_yield(
    cashflows: List[float],
    times: List[float],
    ytm: float,
) -> float:
    """
    Price a fixed-income instrument from its cash flows and YTM.

    Parameters
    ----------
    cashflows : list of cash flows (e.g. [coupon, coupon, ..., coupon+par])
    times     : list of time points in years (same length)
    ytm       : yield to maturity (annualised, continuously compounded)

    Returns
    -------
    float — present value / dirty price
    """
    cfs = np.asarray(cashflows, dtype=float)
    ts = np.asarray(times, dtype=float)
    discount_factors = np.exp(-ytm * ts)
    return float(np.sum(cfs * discount_factors))


def modified_duration(
    cashflows: List[float],
    times: List[float],
    ytm: float,
) -> float:
    """
    Modified duration: %ΔP per 1 unit change in yield.

    D_mod = (1 / P) * Σ t_i * CF_i * e^{-y*t_i}
    """
    cfs = np.asarray(cashflows, dtype=float)
    ts = np.asarray(times, dtype=float)
    discount_factors = np.exp(-ytm * ts)
    P = float(np.sum(cfs * discount_factors))
    if P <= 0:
        return 0.0
    D = float(np.sum(ts * cfs * discount_factors))
    return D / P


def dv01(
    cashflows: List[float],
    times: List[float],
    ytm: float,
    dy: float = 0.0001,
) -> float:
    """
    DV01 (Dollar Value of a 1bp move).

    DV01 = |P(y + dy) - P(y - dy)| / 2
    """
    P_up = price_from_yield(cashflows, times, ytm + dy)
    P_dn = price_from_yield(cashflows, times, ytm - dy)
    return float(abs(P_up - P_dn) / 2)


def convexity(
    cashflows: List[float],
    times: List[float],
    ytm: float,
) -> float:
    """
    Convexity: second-order price/yield sensitivity.

    C = (1 / P) * Σ t_i^2 * CF_i * e^{-y*t_i}
    """
    cfs = np.asarray(cashflows, dtype=float)
    ts = np.asarray(times, dtype=float)
    discount_factors = np.exp(-ytm * ts)
    P = float(np.sum(cfs * discount_factors))
    if P <= 0:
        return 0.0
    C = float(np.sum(ts ** 2 * cfs * discount_factors))
    return C / P


def bond_price_change(
    duration: float,
    convexity_: float,
    ytm: float,
    delta_y: float,
) -> float:
    """
    Approximate percentage price change using Taylor expansion.

    ΔP/P ≈ -D_mod * Δy + 0.5 * C * Δy²
    """
    return -duration * delta_y + 0.5 * convexity_ * delta_y ** 2


def make_bond_cashflows(
    par: float = 1000.0,
    coupon_rate: float = 0.05,
    maturity_years: int = 10,
    freq: int = 2,
) -> tuple[List[float], List[float]]:
    """
    Helper: generate cash flows and times for a standard coupon bond.

    Parameters
    ----------
    par           : face value
    coupon_rate   : annual coupon rate (e.g. 0.05 for 5%)
    maturity_years: years to maturity
    freq          : coupon payments per year (2 = semiannual)

    Returns
    -------
    (cashflows, times)
    """
    n_periods = maturity_years * freq
    coupon = par * coupon_rate / freq
    times = [(i + 1) / freq for i in range(n_periods)]
    cashflows = [coupon] * n_periods
    cashflows[-1] += par  # add par at maturity
    return cashflows, times
