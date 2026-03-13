"""
Alpha Generation & Signal Research Expert Agent.
Algorithms: Kalman Filter for dynamic hedge ratio + Pairs Trading / Stat Arb.
Flow: find cointegrated pair → kalman hedge ratio → spread z-score → trade on threshold.
Uses the asset paired against SPY as the companion.
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


def _kalman_hedge_ratio(x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Simple Kalman filter for dynamic OLS hedge ratio."""
    n = len(x)
    beta = np.zeros(n)
    P = 1.0
    Q = 0.0001  # process noise
    R = 0.001   # observation noise
    beta_t = 0.0
    for i in range(n):
        # Predict
        P_pred = P + Q
        # Update
        x_i = x[i]
        y_i = y[i]
        K = P_pred * x_i / (x_i**2 * P_pred + R)
        innovation = y_i - beta_t * x_i
        beta_t = beta_t + K * innovation
        P = (1 - K * x_i) * P_pred
        beta[i] = beta_t
    return beta


def _zscore(spread: np.ndarray, window: int = 30) -> np.ndarray:
    z = np.zeros(len(spread))
    for i in range(window, len(spread)):
        sl = spread[i - window:i]
        std = np.std(sl)
        if std > 0:
            z[i] = (spread[i] - np.mean(sl)) / std
    return z


class AlphaSignalAgent(BaseExpertAgent):
    name = "Alpha / Signal"

    def run(self, spec: StrategySpec) -> AgentResult:
        t0 = time.time()
        log.info(f"[{self.name}] Running Kalman Filter + Pairs Trading")
        try:
            df_x = load_ohlcv("SPY", spec.start_date, spec.end_date)
            df_y = load_ohlcv(spec.asset, spec.start_date, spec.end_date)

            # Align on common dates
            combined = pd.concat([df_x["Close"].rename("SPY"), df_y["Close"].rename(spec.asset)], axis=1).dropna()
            x = combined["SPY"].values
            y = combined[spec.asset].values
            dates = [str(d.date()) for d in combined.index]
            n = len(x)

            hedge = _kalman_hedge_ratio(x, y)
            spread = y - hedge * x
            z = _zscore(spread, window=30)

            # Strategy: enter long y/short x when z < -1, exit at 0; reverse at z > 1
            capital = spec.initial_capital
            equity = [capital]
            position = 0  # +1 long asset, -1 short asset
            entry_price = 0.0
            trade_log = []
            entry_date = ""

            for i in range(1, n):
                ret = (y[i] - y[i - 1]) / y[i - 1] if y[i - 1] > 0 else 0
                if position == 1:
                    capital_new = equity[-1] * (1 + ret)
                    equity.append(round(capital_new, 2))
                    # Exit
                    if z[i] >= 0:
                        pnl_pct = (y[i] - entry_price) / entry_price if entry_price > 0 else 0
                        trade_log.append({"date": dates[i], "side": "SELL",
                                          "price": round(y[i], 2), "quantity": 100,
                                          "pnl_pct": round(pnl_pct * 100, 2)})
                        position = 0
                elif position == -1:
                    capital_new = equity[-1] * (1 - ret)
                    equity.append(round(capital_new, 2))
                    if z[i] <= 0:
                        pnl_pct = (entry_price - y[i]) / entry_price if entry_price > 0 else 0
                        trade_log.append({"date": dates[i], "side": "SELL",
                                          "price": round(y[i], 2), "quantity": 100,
                                          "pnl_pct": round(pnl_pct * 100, 2)})
                        position = 0
                else:
                    equity.append(equity[-1])
                    if z[i] < -1.0 and position == 0:
                        position = 1
                        entry_price = y[i]
                        entry_date = dates[i]
                        trade_log.append({"date": dates[i], "side": "BUY",
                                          "price": round(y[i], 2), "quantity": 100, "pnl_pct": None})
                    elif z[i] > 1.0 and position == 0:
                        position = -1
                        entry_price = y[i]
                        trade_log.append({"date": dates[i], "side": "BUY",
                                          "price": round(y[i], 2), "quantity": 100, "pnl_pct": None})

            return AgentResult(
                agent_name=self.name,
                equity_curve=equity,
                dates=dates,
                trade_log=trade_log,
                metrics={"kalman_final_hedge": round(float(hedge[-1]), 4)},
                elapsed_seconds=round(time.time() - t0, 2),
            )
        except Exception as e:
            log.error(f"[{self.name}] Error: {e}")
            return AgentResult(agent_name=self.name, error=str(e),
                               elapsed_seconds=round(time.time() - t0, 2))
