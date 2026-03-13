"""
Market Microstructure Expert Agent.
Algorithms: Hidden Markov Model (HMM) for regime detection + VWAP execution.
Flow: fit 2-state HMM (bull/bear) → trade only in bull regime → VWAP-sized orders.
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


def _fit_hmm_simple(returns: np.ndarray, n_states: int = 2) -> np.ndarray:
    """
    Simple 2-state Gaussian HMM via EM. Returns state sequence (0=bear, 1=bull).
    This is a lightweight implementation to avoid hmmlearn dependency for testing.
    """
    n = len(returns)
    # Initialize states by sign of return
    states = (returns > np.mean(returns)).astype(int)

    for _ in range(20):  # EM iterations
        # E-step: estimate state params
        mu = np.array([
            np.mean(returns[states == 0]) if np.any(states == 0) else -0.001,
            np.mean(returns[states == 1]) if np.any(states == 1) else 0.001,
        ])
        sigma = np.array([
            np.std(returns[states == 0]) + 1e-8 if np.any(states == 0) else 0.01,
            np.std(returns[states == 1]) + 1e-8 if np.any(states == 1) else 0.01,
        ])
        # M-step: reassign states
        prob0 = np.exp(-0.5 * ((returns - mu[0]) / sigma[0])**2) / sigma[0]
        prob1 = np.exp(-0.5 * ((returns - mu[1]) / sigma[1])**2) / sigma[1]
        states = (prob1 > prob0).astype(int)

    return states


class MicrostructureAgent(BaseExpertAgent):
    name = "Microstructure"

    def run(self, spec: StrategySpec) -> AgentResult:
        t0 = time.time()
        log.info(f"[{self.name}] Running HMM regime + VWAP execution")
        try:
            df = load_ohlcv(spec.asset, spec.start_date, spec.end_date)
            close = df["Close"].values
            volume = df.get("Volume", pd.Series(np.ones(len(close)))).values
            dates = [str(d.date()) for d in df.index]
            n = len(close)

            returns = np.diff(close) / close[:-1]
            returns = np.where(np.isfinite(returns), returns, 0.0)

            # Fit HMM on rolling 60-day windows
            states = np.zeros(n, dtype=int)
            for i in range(60, n):
                window_ret = returns[max(0, i - 60):i]
                s = _fit_hmm_simple(window_ret)
                # Identify bull = higher mean return
                mean0 = np.mean(window_ret[s == 0]) if np.any(s == 0) else -0.001
                mean1 = np.mean(window_ret[s == 1]) if np.any(s == 1) else 0.001
                bull_state = 1 if mean1 >= mean0 else 0
                current_regime = s[-1]
                states[i] = 1 if current_regime == bull_state else 0  # 1=bull

            # VWAP-based position sizing: use volume profile to scale in
            def vwap_weight(vol_window: np.ndarray) -> float:
                if vol_window.sum() == 0:
                    return 1.0
                return float(vol_window[-1] / vol_window.sum())

            capital = spec.initial_capital
            equity = [capital]
            in_position = False
            entry_price = 0.0
            trade_log = []

            for i in range(1, n):
                daily_ret = returns[i - 1]
                if in_position:
                    equity.append(round(equity[-1] * (1 + daily_ret), 2))
                    # Exit on regime change to bear
                    if states[i] == 0:
                        pnl_pct = (close[i] - entry_price) / entry_price
                        trade_log.append({"date": dates[i], "side": "SELL",
                                          "price": round(close[i], 2), "quantity": 100,
                                          "pnl_pct": round(pnl_pct * 100, 2)})
                        in_position = False
                else:
                    equity.append(equity[-1])
                    # Enter on regime change to bull
                    if states[i] == 1 and not in_position:
                        # VWAP sizing: weight by recent volume
                        vol_w = vwap_weight(volume[max(0, i - 20):i])
                        in_position = True
                        entry_price = close[i]
                        trade_log.append({"date": dates[i], "side": "BUY",
                                          "price": round(close[i], 2), "quantity": 100,
                                          "pnl_pct": None})

            return AgentResult(
                agent_name=self.name,
                equity_curve=equity,
                dates=dates,
                trade_log=trade_log,
                metrics={
                    "bull_regime_pct": round(float(np.mean(states)), 4),
                    "regime_switches": int(np.sum(np.diff(states) != 0)),
                },
                elapsed_seconds=round(time.time() - t0, 2),
            )
        except Exception as e:
            log.error(f"[{self.name}] Error: {e}")
            return AgentResult(agent_name=self.name, error=str(e),
                               elapsed_seconds=round(time.time() - t0, 2))
