"""Algorithms module: Financial algorithms and quantitative models."""

# Alpha and signal processing algorithms
from app.algorithms.alpha.kalman_filter import KalmanHedgeFilter
from app.algorithms.alpha.pairs_trading import cointegration_test, spread_zscore

# Fixed income algorithms
from app.algorithms.fixed_income.duration_convexity import (
    price_from_yield,
    modified_duration,
    dv01,
    convexity,
    bond_price_change,
)
from app.algorithms.fixed_income.short_rate_models import VasicekModel, CIRModel

# Microstructure algorithms
from app.algorithms.microstructure.hmm import RegimeHMM
from app.algorithms.microstructure.vwap_twap import vwap, twap, execution_schedule, arrival_cost

# Portfolio construction algorithms
from app.algorithms.portfolio.mean_variance import efficient_frontier, max_sharpe_weights, min_variance_weights
from app.algorithms.portfolio.black_litterman import market_implied_returns, black_litterman_returns, black_litterman_weights

# Pricing algorithms
from app.algorithms.pricing.black_scholes import bsm_price, bsm_greeks, implied_volatility
from app.algorithms.pricing.binomial_tree import binomial_price

# Risk management algorithms
from app.algorithms.risk.garch import GARCHModel
from app.algorithms.risk.monte_carlo import simulate_gbm_paths, value_at_risk, cvar

__all__ = [
    # Alpha algorithms
    "KalmanHedgeFilter",
    "cointegration_test",
    "spread_zscore",

    # Fixed income algorithms
    "price_from_yield",
    "modified_duration",
    "dv01",
    "convexity",
    "bond_price_change",
    "VasicekModel",
    "CIRModel",

    # Microstructure algorithms
    "RegimeHMM",
    "vwap",
    "twap",
    "execution_schedule",
    "arrival_cost",

    # Portfolio algorithms
    "efficient_frontier",
    "max_sharpe_weights",
    "min_variance_weights",
    "market_implied_returns",
    "black_litterman_returns",
    "black_litterman_weights",

    # Pricing algorithms
    "bsm_price",
    "bsm_greeks",
    "implied_volatility",
    "binomial_price",

    # Risk algorithms
    "GARCHModel",
    "simulate_gbm_paths",
    "value_at_risk",
    "cvar",
]