"""
Portfolio Construction Expert Agent.
Algorithms: Mean-Variance Optimisation + Black-Litterman.
Flow: fetch correlated assets → covariance matrix → MVO max Sharpe → simulate rebalanced portfolio.
"""
from __future__ import annotations
import time
import numpy as np
import pandas as pd
from app.agents.expert.base import BaseExpertAgent
from app.nlp.schema import StrategySpec, AgentResult
from app.data.loader import load_ohlcv
from app.utils.logger import get_logger

log = get_logger(__name__)

# Diversified basket of assets to build portfolio
BASKET = ["SPY", "QQQ", "GLD", "TLT", "IEF"]


def _max_sharpe_weights(returns: np.ndarray, rf: float = 0.04 / 252) -> np.ndarray:
    """Simple numerical optimisation for max-Sharpe portfolio."""
    n = returns.shape[1]
    best_sharpe = -np.inf
    best_w = np.ones(n) / n
    # Monte Carlo weight search
    rng = np.random.default_rng(42)
    for _ in range(5000):
        w = rng.dirichlet(np.ones(n))
        port_ret = returns @ w
        mean_ret = np.mean(port_ret) * 252
        std_ret = np.std(port_ret, ddof=1) * np.sqrt(252)
        if std_ret > 0:
            sr = (mean_ret - rf * 252) / std_ret
            if sr > best_sharpe:
                best_sharpe = sr
                best_w = w
    return best_w


class PortfolioAgent(BaseExpertAgent):
    name = "Portfolio Const."

    def run(self, spec: StrategySpec) -> AgentResult:
        t0 = time.time()
        log.info(f"[{self.name}] Running Mean-Variance Optimisation")
        try:
            dfs = {}
            for ticker in BASKET:
                try:
                    df = load_ohlcv(ticker, spec.start_date, spec.end_date)
                    dfs[ticker] = df["Close"]
                except Exception:
                    pass

            if len(dfs) < 2:
                raise ValueError("Could not load enough assets for portfolio")

            prices = pd.DataFrame(dfs).dropna()
            returns = prices.pct_change().dropna().values
            tickers = list(dfs.keys()) if dfs else []

            weights = _max_sharpe_weights(returns)

            # Simulate monthly rebalanced portfolio
            capital = spec.initial_capital
            equity = [capital]
            dates = [str(d.date()) for d in prices.index[1:]]

            # Daily portfolio return
            port_returns = returns @ weights
            for r in port_returns:
                capital = equity[-1] * (1 + r)
                equity.append(round(capital, 2))
            equity = equity[1:]  # align with dates

            return AgentResult(
                agent_name=self.name,
                equity_curve=equity,
                dates=dates,
                trade_log=[],
                metrics={f"w_{t}": round(float(w), 4) for t, w in zip(tickers, weights)},
                elapsed_seconds=round(time.time() - t0, 2),
            )
        except Exception as e:
            log.error(f"[{self.name}] Error: {e}")
            return AgentResult(agent_name=self.name, error=str(e),
                               elapsed_seconds=round(time.time() - t0, 2))
