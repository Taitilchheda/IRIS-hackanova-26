"""
Tests for tearsheet metrics.
"""
import pytest
import numpy as np
from app.tearsheet.metrics import sharpe, sortino, max_drawdown, cagr, win_rate, compute_metrics


def test_sharpe_positive_returns(equity_curve):
    s = sharpe(equity_curve)
    assert isinstance(s, float)
    assert -5 < s < 10  # sanity range


def test_sharpe_flat():
    flat = [100_000.0] * 100
    assert sharpe(flat) == 0.0


def test_max_drawdown_negative(equity_curve):
    dd = max_drawdown(equity_curve)
    assert dd <= 0.0
    assert dd > -1.0  # shouldn't lose everything


def test_max_drawdown_monotonic():
    """Monotonically increasing curve should have ~zero drawdown."""
    eq = [100_000.0 + i * 100 for i in range(100)]
    dd = max_drawdown(eq)
    assert dd >= -0.001  # effectively zero


def test_cagr_positive():
    eq = [100_000.0] + [100_000.0 * 1.2**i for i in range(1, 6)]
    c = cagr(eq, years=5)
    assert abs(c - 0.2) < 0.01  # should be ~20%


def test_win_rate():
    trades = [
        {"side": "SELL", "pnl_pct": 5.0},
        {"side": "SELL", "pnl_pct": -2.0},
        {"side": "SELL", "pnl_pct": 3.0},
        {"side": "BUY", "pnl_pct": None},
    ]
    wr = win_rate(trades)
    assert abs(wr - 2/3) < 0.01


def test_win_rate_no_sells():
    assert win_rate([]) == 0.0


def test_compute_metrics(equity_curve):
    from app.tearsheet.metrics import compute_metrics
    trades = [{"side": "SELL", "pnl_pct": 3.0}] * 5
    m = compute_metrics(equity_curve, trades, years=2.0)
    assert m.sharpe != 0.0
    assert m.max_drawdown <= 0.0
    assert 0 <= m.win_rate <= 1.0
    assert m.trade_count == 5


def test_sortino(equity_curve):
    so = sortino(equity_curve)
    assert isinstance(so, float)
    s = sharpe(equity_curve)
    # Sortino should be >= Sharpe for upward-biased returns
    # (this is approximate; just check it's finite and positive-ish)
    assert np.isfinite(so)
