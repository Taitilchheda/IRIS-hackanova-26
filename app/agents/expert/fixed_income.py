"""
Fixed Income & Rates Expert Agent.
Algorithms: Duration/Convexity + Vasicek short-rate model.
Simulates a bond portfolio valued along a simulated rate path.
"""
from __future__ import annotations
import time
import numpy as np
from app.agents.expert.base import BaseExpertAgent
from app.nlp.schema import StrategySpec, AgentResult
from app.data.loader import load_ohlcv
from app.utils.logger import get_logger

log = get_logger(__name__)


def _vasicek_path(r0: float, a: float, b: float, sigma: float,
                   T: int, seed: int = 42) -> np.ndarray:
    """Simulate Vasicek short rate path."""
    rng = np.random.default_rng(seed)
    dt = 1 / 252
    rates = [r0]
    r = r0
    for _ in range(T - 1):
        dr = a * (b - r) * dt + sigma * np.sqrt(dt) * rng.standard_normal()
        r = max(r + dr, 0.0)
        rates.append(r)
    return np.array(rates)


def _bond_price(ytm: float, coupon: float = 0.04, n_periods: int = 20,
                face: float = 1000.0) -> float:
    """Price a fixed coupon bond."""
    pv = 0.0
    for t in range(1, n_periods + 1):
        pv += coupon * face / (1 + ytm) ** t
    pv += face / (1 + ytm) ** n_periods
    return pv


class FixedIncomeAgent(BaseExpertAgent):
    name = "Fixed Income"

    def run(self, spec: StrategySpec) -> AgentResult:
        t0 = time.time()
        log.info(f"[{self.name}] Running Vasicek + Bond pricing")
        try:
            df = load_ohlcv("TLT", spec.start_date, spec.end_date)  # Bond ETF proxy
            close = df["Close"].values
            dates = [str(d.date()) for d in df.index]
            n = len(close)

            # Vasicek rate path (calibrated to typical parameters)
            r0 = 0.04   # initial short rate
            a = 0.3     # mean reversion speed
            b = 0.04    # long-run mean
            sigma_r = 0.01  # rate volatility

            rates = _vasicek_path(r0, a, b, sigma_r, n)

            # Bond portfolio value path
            base_bond_price = _bond_price(r0)
            capital = spec.initial_capital
            equity = [capital]

            for i in range(1, n):
                bond_price_t = _bond_price(rates[i])
                ret = (bond_price_t - _bond_price(rates[i - 1])) / _bond_price(rates[i - 1])
                # Also include TLT-like returns for realism
                tlt_ret = (close[i] - close[i - 1]) / close[i - 1]
                blended_ret = 0.6 * ret + 0.4 * tlt_ret
                equity.append(round(equity[-1] * (1 + blended_ret), 2))

            # Compute duration/DV01
            ytm = float(rates[-1])
            dur = sum(t * 0.04 * 1000 / (1 + ytm) ** t
                      for t in range(1, 21)) / _bond_price(ytm)
            mod_dur = dur / (1 + ytm)
            dv01 = mod_dur * _bond_price(ytm) / 10000

            # Generate Monte Carlo paths using multiple Vasicek rate paths
            n_paths = 100
            mc_paths = []
            for j in range(n_paths):
                path_rates = _vasicek_path(r0, a, b, sigma_r, n, seed=42 + j)
                path_equity = [spec.initial_capital]
                for k in range(1, n):
                    b_p_t = _bond_price(path_rates[k])
                    b_p_prev = _bond_price(path_rates[k-1])
                    r_ret = (b_p_t - b_p_prev) / b_p_prev
                    # Blend with a random walk centered on TLT return distribution for variety
                    r_noise = np.random.normal(0, 0.002)
                    path_equity.append(round(path_equity[-1] * (1 + 0.6 * r_ret + 0.4 * r_noise), 2))
                mc_paths.append(path_equity)

            return AgentResult(
                agent_name=self.name,
                equity_curve=equity,
                dates=dates,
                trade_log=[],
                paths=mc_paths,
                metrics={
                    "modified_duration": round(mod_dur, 3),
                    "dv01": round(dv01, 4),
                    "final_rate": round(float(rates[-1]), 4),
                    "vasicek_a": a, "vasicek_b": b,
                },
                elapsed_seconds=round(time.time() - t0, 2),
            )
        except Exception as e:
            log.error(f"[{self.name}] Error: {e}")
            return AgentResult(agent_name=self.name, error=str(e),
                               elapsed_seconds=round(time.time() - t0, 2))
