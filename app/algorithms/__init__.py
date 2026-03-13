"""Algorithms module: Financial algorithms and quantitative models."""

# Alpha and signal processing algorithms
from app.algorithms.alpha import (
    KalmanHedgeFilter,
    cointegration_test, 
    spread_zscore
)

# Fixed income algorithms
from app.algorithms.fixed_income import (
    DurationConvexityCalculator,
    VasicekModel,
    CIRModel
)

# Microstructure algorithms
from app.algorithms.microstructure import (
    HiddenMarkovModel,
    VWAPCalculator,
    TWAPCalculator
)

# Portfolio construction algorithms
from app.algorithms.portfolio import (
    MeanVarianceOptimizer,
    BlackLittermanModel
)

# Pricing algorithms
from app.algorithms.pricing import (
    BlackScholesPricer,
    BinomialTreePricer
)

# Risk management algorithms
from app.algorithms.risk import (
    GARCHModel,
    MonteCarloSimulator
)

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
    "BlackLittermanModel",
    
    # Pricing algorithms
    "BlackScholesPricer",
    "BinomialTreePricer",
    
    # Risk algorithms
    "GARCHModel",
    "MonteCarloSimulator"
]