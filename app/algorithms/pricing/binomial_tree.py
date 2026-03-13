"""
CRR Binomial Tree option pricing (American and European).
Provides: binomial_price
"""
from __future__ import annotations
import math
import numpy as np
from typing import Literal


OptionType = Literal["call", "put"]
ExerciseType = Literal["european", "american"]


def binomial_price(
    S: float,
    K: float,
    T: float,
    r: float,
    sigma: float,
    option_type: OptionType = "call",
    exercise: ExerciseType = "european",
    n_steps: int = 200,
) -> float:
    """
    Cox-Ross-Rubinstein (CRR) binomial tree option pricing.

    Parameters
    ----------
    S         : spot price
    K         : strike price
    T         : time to expiration in years
    r         : risk-free rate (annualised)
    sigma     : volatility (annualised)
    option_type  : 'call' | 'put'
    exercise  : 'european' | 'american'
    n_steps   : number of time steps in the tree

    Returns
    -------
    float — option value
    """
    if T <= 0 or sigma <= 0:
        intrinsic = max(0.0, S - K) if option_type == "call" else max(0.0, K - S)
        return float(intrinsic)

    dt = T / n_steps
    u = math.exp(sigma * math.sqrt(dt))   # up factor
    d = 1.0 / u                            # down factor (CRR)
    disc = math.exp(-r * dt)
    # Risk-neutral probability
    p = (math.exp(r * dt) - d) / (u - d)
    q = 1.0 - p

    # Build terminal asset prices
    # S_T(j) = S * u^j * d^(n-j) for j = 0..n
    j_values = np.arange(n_steps + 1)
    S_T = S * (u ** j_values) * (d ** (n_steps - j_values))

    # Terminal payoffs
    if option_type == "call":
        option_values = np.maximum(S_T - K, 0.0)
    else:
        option_values = np.maximum(K - S_T, 0.0)

    # Backwards induction
    for i in range(n_steps - 1, -1, -1):
        # Asset prices at step i
        j_vals_i = np.arange(i + 1)
        S_i = S * (u ** j_vals_i) * (d ** (i - j_vals_i))

        # Risk-neutral expectation
        option_values = disc * (p * option_values[1:i+2] + q * option_values[0:i+1])

        if exercise == "american":
            # Early exercise check
            if option_type == "call":
                intrinsic = np.maximum(S_i - K, 0.0)
            else:
                intrinsic = np.maximum(K - S_i, 0.0)
            option_values = np.maximum(option_values, intrinsic)

    return float(option_values[0])


def binomial_delta(
    S: float,
    K: float,
    T: float,
    r: float,
    sigma: float,
    option_type: OptionType = "call",
    exercise: ExerciseType = "european",
    n_steps: int = 200,
) -> float:
    """Finite-difference delta from the binomial tree."""
    dS = S * 0.001
    V_up = binomial_price(S + dS, K, T, r, sigma, option_type, exercise, n_steps)
    V_dn = binomial_price(S - dS, K, T, r, sigma, option_type, exercise, n_steps)
    return float((V_up - V_dn) / (2 * dS))
