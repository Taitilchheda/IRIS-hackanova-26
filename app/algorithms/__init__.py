"""Algorithms module: Financial algorithms and quantitative models."""

# Alpha and signal processing algorithms
from app.algorithms.alpha.kalman_filter import KalmanHedgeFilter
from app.algorithms.alpha.pairs_trading import cointegration_test, spread_zscore

# Fixed income algorithms
from app.algorithms.fixed_income.duration_convexity import DurationConvexityCalculator
from app.algorithms.fixed_income.short_rate_models import VasicekModel, CIRModel

# Microstructure algorithms
from app.algorithms.microstructure.hmm import HiddenMarkovModel
from app.algorithms.microstructure.vwap_twap import VWAPCalculator, TWAPCalculator

# Portfolio construction algorithms
from app.algorithms.portfolio.mean_variance import MeanVarianceOptimizer, efficient_frontier, max_sharpe_weights
from app.algorithms.portfolio.black_litterman import BlackLittermanModel, black_litterman_weights

# Pricing algorithms
from app.algorithms.pricing.black_scholes import BlackScholesPricer
from app.algorithms.pricing.binomial_tree import BinomialTreePricer

# Risk management algorithms
from app.algorithms.risk.garch import GARCHModel
from app.algorithms.risk.monte_carlo import MonteCarloSimulator

__all__ = [
    # Alpha algorithms
    "KalmanHedgeFilter",
    "cointegration_test",
    "spread_zscore",
    
    # Fixed income algorithms
    "DurationConvexityCalculator",
    "VasicekModel", 
    "CIRModel",
    
    # Microstructure algorithms
    "HiddenMarkovModel",
    "VWAPCalculator",
    "TWAPCalculator",
    
    # Portfolio algorithms
    "MeanVarianceOptimizer",
    "efficient_frontier",
    "max_sharpe_weights",
    "BlackLittermanModel",
    "black_litterman_weights",
    
    # Pricing algorithms
    "BlackScholesPricer",
    "BinomialTreePricer",
    
    # Risk algorithms
    "GARCHModel",
    "MonteCarloSimulator"
]