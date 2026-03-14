"""
Trader Strategy Agent — executes the trader's exact strategy using the backtest engine.
"""
from __future__ import annotations
import time
import numpy as np
from app.nlp.schema import StrategySpec, AgentResult
from app.data.loader import load_ohlcv
from app.engine.runner import BacktestRunner
from app.utils.logger import get_logger

log = get_logger(__name__)


class TraderStrategyAgent:
    name = "Trader Strategy"

    def run(self, spec: StrategySpec) -> AgentResult:
        t0 = time.time()
        log.info(f"[{self.name}] Running trader backtest on {spec.asset}")
        try:
            df = load_ohlcv(spec.asset, spec.start_date, spec.end_date)
            if df.empty:
                raise ValueError(f"No data for {spec.asset}")

            runner = BacktestRunner(spec=spec, data=df)
            equity, dates, trades = runner.run()
            
            # Simple MC for trader
            if len(equity) > 1:
                returns_arr = np.diff(equity) / equity[:-1]
                returns_arr = returns_arr[np.isfinite(returns_arr)]
            else:
                returns_arr = np.array([])

            if len(returns_arr) == 0 or np.all(returns_arr == 0):
                # Demo fallback: use asset returns if trader didn't trade
                close = df["Close"].values
                returns_arr = np.diff(close) / close[:-1]
                returns_arr = returns_arr[np.isfinite(returns_arr)]
            
            from app.agents.expert.risk_analysis import _simulate_gbm_paths
            mu = float(np.mean(returns_arr)) if len(returns_arr) > 0 else 0.0001
            sigma = float(np.std(returns_arr)) * np.sqrt(252) if len(returns_arr) > 0 else 0.2
            
            mc_paths = _simulate_gbm_paths(
                S0=spec.initial_capital,
                mu=mu,
                sigma=sigma,
                n_days=len(equity) - 1,
                n_paths=100
            )

            return AgentResult(
                agent_name="Trader",
                equity_curve=equity,
                dates=dates,
                trade_log=trades,
                paths=mc_paths.tolist(),
                metrics={},
                elapsed_seconds=round(time.time() - t0, 2),
            )
        except Exception as e:
            log.error(f"[{self.name}] Error: {e}")
            return AgentResult(agent_name=self.name, error=str(e),
                               elapsed_seconds=round(time.time() - t0, 2))
