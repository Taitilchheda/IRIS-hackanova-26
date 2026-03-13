"""
Risk Analysis Expert Agent.
Algorithms: Monte Carlo GBM paths + GARCH(1,1) volatility estimation.
Flow: fit GARCH on historical returns → vol-scale positions → MC median as equity curve.
"""
from __future__ import annotations
import time
import numpy as np
from app.agents.expert.base import BaseExpertAgent
from app.nlp.schema import StrategySpec, AgentResult
from app.data.loader import load_ohlcv
from app.utils.logger import get_logger

log = get_logger(__name__)


def _garch_vol_forecast(returns: np.ndarray, horizon: int = 1) -> float:
    """Simplified GARCH(1,1) vol forecast."""
    omega = 0.000001
    alpha = 0.09
    beta = 0.90
    var_t = np.var(returns)
    for r in returns[-60:]:
        var_t = omega + alpha * r**2 + beta * var_t
    # Forecast horizon steps ahead
    long_run_var = omega / (1 - alpha - beta) if (alpha + beta) < 1 else var_t
    forecast_var = var_t
    for _ in range(horizon - 1):
        forecast_var = omega + (alpha + beta) * forecast_var
    return float(np.sqrt(forecast_var * 252))


def _simulate_gbm_paths(S0: float, mu: float, sigma: float,
                         n_days: int, n_paths: int, seed: int = 42) -> np.ndarray:
    """Simulate GBM paths. Returns array of shape (n_paths, n_days)."""
    rng = np.random.default_rng(seed)
    dt = 1 / 252
    drift = (mu - 0.5 * sigma**2) * dt
    vol = sigma * np.sqrt(dt)
    z = rng.standard_normal((n_paths, n_days))
    log_returns = drift + vol * z
    paths = S0 * np.exp(np.cumsum(log_returns, axis=1))
    return np.column_stack([np.full(n_paths, S0), paths])


class RiskAnalysisAgent(BaseExpertAgent):
    name = "Risk Analysis"

    def run(self, spec: StrategySpec) -> AgentResult:
        t0 = time.time()
        log.info(f"[{self.name}] Running Monte Carlo + GARCH")
        try:
            df = load_ohlcv(spec.asset, spec.start_date, spec.end_date)
            close = df["Close"].values
            returns = np.diff(close) / close[:-1]
            returns = returns[np.isfinite(returns)]

            mu = float(np.mean(returns)) * 252
            sigma = _garch_vol_forecast(returns)
            n_days = len(close)
            n_paths = 200  # reduced for speed; use 10k in prod

            paths = _simulate_gbm_paths(
                S0=spec.initial_capital,
                mu=mu / 252,
                sigma=sigma / np.sqrt(252),
                n_days=n_days,
                n_paths=n_paths
            )
            # Use the median path as the "equity curve"
            median_path = np.median(paths, axis=0)
            equity_curve = [round(float(v), 2) for v in median_path[:n_days]]
            dates = [str(d.date()) for d in df.index[:n_days]]

            # Sample paths for UI visualization
            # Take 50 paths or total available, evenly spaced
            stride = max(1, n_paths // 50)
            sampled_paths = paths[::stride, :n_days].tolist()

            # Compute VaR/CVaR as extras
            final_values = paths[:, -1]
            var_95 = float(np.percentile(final_values, 5))
            cvar_95 = float(np.mean(final_values[final_values <= var_95]))

            return AgentResult(
                agent_name=self.name,
                equity_curve=equity_curve,
                dates=dates,
                trade_log=[],
                paths=sampled_paths,
                metrics={
                    "garch_vol": round(sigma, 4),
                    "mu_annual": round(mu, 4),
                    "var_95_final": round(var_95, 2),
                    "cvar_95_final": round(cvar_95, 2),
                    "p5": round(float(np.percentile(final_values, 5)) / spec.initial_capital - 1, 4),
                    "p50": round(float(np.percentile(final_values, 50)) / spec.initial_capital - 1, 4),
                    "p95": round(float(np.percentile(final_values, 95)) / spec.initial_capital - 1, 4),
                },
                elapsed_seconds=round(time.time() - t0, 2),
            )
        except Exception as e:
            log.error(f"[{self.name}] Error: {e}")
            return AgentResult(agent_name=self.name, error=str(e),
                               elapsed_seconds=round(time.time() - t0, 2))
