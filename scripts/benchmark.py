"""
Algorithm performance benchmarks.
Usage: python scripts/benchmark.py
"""
import sys
import time
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


def bench(name: str, fn, *args, n: int = 5, **kwargs):
    times = []
    result = None
    for _ in range(n):
        t0 = time.perf_counter()
        result = fn(*args, **kwargs)
        times.append(time.perf_counter() - t0)
    avg_ms = np.mean(times) * 1000
    print(f"  {name:<45} {avg_ms:>8.2f} ms  (n={n})")
    return result


def main():
    print("\n" + "=" * 65)
    print("IRIS Algorithm Benchmarks")
    print("=" * 65)

    rng = np.random.default_rng(42)

    # ── Risk ────────────────────────────────────────────────────────────
    print("\n[Risk]")
    from app.algorithms.risk.monte_carlo import simulate_gbm_paths
    from app.algorithms.risk.garch import GARCHModel

    returns_500 = rng.normal(0.0005, 0.012, 500)
    bench("monte_carlo 1000 paths × 252 days",
          simulate_gbm_paths, 100_000, 0.08, 0.20, 252, 1000)
    bench("GARCH fit (500 returns)",
          lambda: GARCHModel().fit(returns_500))

    # ── Pricing ─────────────────────────────────────────────────────────
    print("\n[Pricing]")
    from app.algorithms.pricing.black_scholes import bsm_price, bsm_greeks
    from app.algorithms.pricing.binomial_tree import binomial_price

    bench("BSM price (call)", bsm_price, 100, 100, 1.0, 0.04, 0.20, "call")
    bench("BSM greeks (call)", bsm_greeks, 100, 100, 1.0, 0.04, 0.20, "call")
    bench("Binomial tree n=200 European call",
          binomial_price, 100, 100, 1.0, 0.04, 0.20, "call", "european", 200)
    bench("Binomial tree n=200 American put",
          binomial_price, 100, 100, 1.0, 0.04, 0.20, "put", "american", 200)

    # ── Portfolio ───────────────────────────────────────────────────────
    print("\n[Portfolio]")
    from app.algorithms.portfolio.mean_variance import max_sharpe_weights

    n_assets = 10
    mean_rets = rng.uniform(0.05, 0.15, n_assets)
    cov = rng.standard_normal((n_assets, n_assets))
    cov = cov @ cov.T * 0.01

    bench("Max Sharpe (10 assets)", max_sharpe_weights, mean_rets, cov)

    # ── Fixed Income ─────────────────────────────────────────────────────
    print("\n[Fixed Income]")
    from app.algorithms.fixed_income.duration_convexity import (
        modified_duration, dv01, convexity, make_bond_cashflows
    )
    cfs, ts_ = make_bond_cashflows(par=1000, coupon_rate=0.05, maturity_years=10)
    bench("Modified duration (10Y bond)", modified_duration, cfs, ts_, 0.04)
    bench("DV01 (10Y bond)", dv01, cfs, ts_, 0.04)
    bench("Convexity (10Y bond)", convexity, cfs, ts_, 0.04)

    # ── Microstructure ──────────────────────────────────────────────────
    print("\n[Microstructure]")
    from app.algorithms.microstructure.vwap_twap import execution_schedule

    bench("TWAP schedule (1000 intervals)",
          execution_schedule, 10_000, 1000, None, "twap")
    bench("VWAP schedule (1000 intervals)",
          execution_schedule, 10_000, 1000, rng.uniform(0.5, 2.0, 1000), "vwap")

    print("\n" + "=" * 65)
    print("Benchmarks complete.")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
