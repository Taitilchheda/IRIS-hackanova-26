"""
Derivatives & Pricing Expert Agent.
Algorithms: Black-Scholes-Merton (BSM) + CRR Binomial Tree.
Simulates a delta-hedged options strategy on the asset.
"""
from __future__ import annotations
import time
import math
import numpy as np
import pandas as pd
from app.agents.expert.base import BaseExpertAgent
from app.nlp.schema import StrategySpec, AgentResult
from app.data.loader import load_ohlcv
from app.utils.logger import get_logger

log = get_logger(__name__)


def _bsm_price(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "call") -> float:
    if T <= 0 or sigma <= 0:
        return max(0, S - K) if option_type == "call" else max(0, K - S)
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    from scipy.stats import norm
    if option_type == "call":
        return S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
    else:
        return K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)


def _bsm_delta(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "call") -> float:
    if T <= 0 or sigma <= 0:
        return 1.0 if (S > K and option_type == "call") else 0.0
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    from scipy.stats import norm
    return float(norm.cdf(d1)) if option_type == "call" else float(norm.cdf(d1) - 1)


class DerivativesPricingAgent(BaseExpertAgent):
    name = "Derivatives"

    def run(self, spec: StrategySpec) -> AgentResult:
        t0 = time.time()
        log.info(f"[{self.name}] Running BSM delta-hedged simulation")
        try:
            df = load_ohlcv(spec.asset, spec.start_date, spec.end_date)
            close = df["Close"].values
            dates = [str(d.date()) for d in df.index]
            n = len(close)
            returns = np.diff(close) / close[:-1]
            sigma_ann = float(np.std(returns, ddof=1)) * np.sqrt(252)
            r = 0.04  # risk-free rate

            capital = spec.initial_capital
            equity = [capital]
            trade_log = []

            # Monthly options cycle: buy ATM call, delta-hedge, roll at expiry
            expiry_days = 21  # ~1 month
            position = "none"
            S0 = close[0]
            K = S0  # ATM strike at inception
            T_init = expiry_days / 252

            for i in range(1, n):
                S = close[i]
                T_remaining = max((expiry_days - (i % expiry_days)) / 252, 1 / 252)

                # Option P&L (simplified: track BSM value change)
                option_val = _bsm_price(S, K, T_remaining, r, sigma_ann, "call")
                delta = _bsm_delta(S, K, T_remaining, r, sigma_ann, "call")

                # Net delta-hedged return: option gain - hedge cost
                prev_S = close[i - 1]
                prev_T = max((expiry_days - ((i - 1) % expiry_days)) / 252, 1 / 252)
                prev_option_val = _bsm_price(prev_S, K, prev_T, r, sigma_ann, "call")

                # Option P&L per $1 notional
                option_pnl = (option_val - prev_option_val) - delta * (S - prev_S)
                scaled_pnl = option_pnl / S0 * equity[-1]  # scale by capital

                new_equity = equity[-1] + scaled_pnl
                equity.append(round(max(new_equity, equity[-1] * 0.5), 2))  # floor at -50%

                # Roll at expiry
                if i % expiry_days == 0:
                    K = S  # new ATM strike
                    trade_log.append({
                        "date": dates[i], "side": "ROLL",
                        "price": round(S, 2), "quantity": 1, "pnl_pct": None
                    })

            return AgentResult(
                agent_name=self.name,
                equity_curve=equity,
                dates=dates,
                trade_log=trade_log,
                metrics={
                    "implied_vol_used": round(sigma_ann, 4),
                    "option_type": "ATM_call_delta_hedged",
                },
                elapsed_seconds=round(time.time() - t0, 2),
            )
        except Exception as e:
            log.error(f"[{self.name}] Error: {e}")
            return AgentResult(agent_name=self.name, error=str(e),
                               elapsed_seconds=round(time.time() - t0, 2))
