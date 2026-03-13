"""
Black-Scholes-Merton closed-form option pricing and Greeks.
Provides: bsm_price, bsm_greeks
"""
from __future__ import annotations
import math
from typing import Literal
from scipy.stats import norm


OptionType = Literal["call", "put"]


def _d1_d2(
    S: float, K: float, T: float, r: float, sigma: float
) -> tuple[float, float]:
    """Compute d1 and d2 from BSM parameter set."""
    if T <= 0 or sigma <= 0:
        raise ValueError("T and sigma must be positive")
    sqrt_T = math.sqrt(T)
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * sqrt_T)
    d2 = d1 - sigma * sqrt_T
    return d1, d2


def bsm_price(
    S: float,
    K: float,
    T: float,
    r: float,
    sigma: float,
    option_type: OptionType = "call",
) -> float:
    """
    Black-Scholes-Merton closed-form option price.

    Parameters
    ----------
    S           : current spot price
    K           : strike price
    T           : time to expiration in years
    r           : risk-free rate (annualised, continuously compounded)
    sigma       : implied / historical volatility (annualised)
    option_type : 'call' or 'put'

    Returns
    -------
    float — option fair value
    """
    if T <= 0 or sigma <= 0:
        intrinsic = max(0.0, S - K) if option_type == "call" else max(0.0, K - S)
        return float(intrinsic)

    d1, d2 = _d1_d2(S, K, T, r, sigma)
    disc = math.exp(-r * T)

    if option_type == "call":
        return float(S * norm.cdf(d1) - K * disc * norm.cdf(d2))
    else:
        return float(K * disc * norm.cdf(-d2) - S * norm.cdf(-d1))


def bsm_greeks(
    S: float,
    K: float,
    T: float,
    r: float,
    sigma: float,
    option_type: OptionType = "call",
) -> dict[str, float]:
    """
    Compute all first-order BSM Greeks plus gamma and vega.

    Returns
    -------
    dict with keys: delta, gamma, theta, vega, rho
    """
    if T <= 0 or sigma <= 0:
        return {"delta": 1.0 if S > K and option_type == "call" else 0.0,
                "gamma": 0.0, "theta": 0.0, "vega": 0.0, "rho": 0.0}

    d1, d2 = _d1_d2(S, K, T, r, sigma)
    sqrt_T = math.sqrt(T)
    disc = math.exp(-r * T)
    pdf_d1 = norm.pdf(d1)

    # Delta
    if option_type == "call":
        delta = float(norm.cdf(d1))
    else:
        delta = float(norm.cdf(d1) - 1)

    # Gamma (same for call and put)
    gamma = float(pdf_d1 / (S * sigma * sqrt_T))

    # Vega (same for call and put) — per 1% change in vol
    vega = float(S * pdf_d1 * sqrt_T * 0.01)

    # Theta — per calendar day
    theta_common = -(S * pdf_d1 * sigma) / (2 * sqrt_T) - r * K * disc
    if option_type == "call":
        theta = float((theta_common - r * K * disc * (norm.cdf(d2) - 1)) / 365)
        theta = float(-(S * pdf_d1 * sigma / (2 * sqrt_T) + r * K * disc * norm.cdf(d2)) / 365)
    else:
        theta = float(-(S * pdf_d1 * sigma / (2 * sqrt_T) - r * K * disc * norm.cdf(-d2)) / 365)

    # Rho — per 1% change in r
    if option_type == "call":
        rho = float(K * T * disc * norm.cdf(d2) * 0.01)
    else:
        rho = float(-K * T * disc * norm.cdf(-d2) * 0.01)

    return {
        "delta": round(delta, 6),
        "gamma": round(gamma, 6),
        "theta": round(theta, 6),
        "vega": round(vega, 6),
        "rho": round(rho, 6),
    }


def implied_volatility(
    market_price: float,
    S: float,
    K: float,
    T: float,
    r: float,
    option_type: OptionType = "call",
    tol: float = 1e-6,
    max_iter: int = 200,
) -> float:
    """
    Newton-Raphson implied volatility solver.

    Returns NaN if it fails to converge.
    """
    sigma = 0.20  # initial guess
    for _ in range(max_iter):
        price = bsm_price(S, K, T, r, sigma, option_type)
        greeks = bsm_greeks(S, K, T, r, sigma, option_type)
        vega_raw = greeks["vega"] * 100  # undo the 0.01 scaling
        if abs(vega_raw) < 1e-10:
            return float("nan")
        diff = price - market_price
        if abs(diff) < tol:
            return float(sigma)
        sigma -= diff / vega_raw
        sigma = max(sigma, 1e-6)
    return float("nan")
