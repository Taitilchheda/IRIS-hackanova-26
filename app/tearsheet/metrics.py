"""
Performance metrics: Sharpe, Sortino, max_drawdown, CAGR, win_rate, Calmar.
"""
import numpy as np
import pandas as pd
from app.nlp.schema import TearsheetMetrics
from typing import List, Dict, Any


def _returns(equity_curve: List[float]) -> np.ndarray:
    eq = np.array(equity_curve, dtype=float)
    returns = np.diff(eq) / eq[:-1]
    return returns[np.isfinite(returns)]


def sharpe(equity_curve: List[float], rf: float = 0.04) -> float:
    rets = _returns(equity_curve)
    if len(rets) < 2:
        return 0.0
    excess = rets - rf / 252
    std = np.std(excess, ddof=1)
    if std == 0:
        return 0.0
    return float(np.mean(excess) / std * np.sqrt(252))


def sortino(equity_curve: List[float], rf: float = 0.04) -> float:
    rets = _returns(equity_curve)
    if len(rets) < 2:
        return 0.0
    excess = rets - rf / 252
    downside = excess[excess < 0]
    if len(downside) == 0:
        return 0.0
    downside_std = np.std(downside, ddof=1)
    if downside_std == 0:
        return 0.0
    return float(np.mean(excess) / downside_std * np.sqrt(252))


def max_drawdown(equity_curve: List[float]) -> float:
    eq = np.array(equity_curve, dtype=float)
    if len(eq) < 2:
        return 0.0
    rolling_max = np.maximum.accumulate(eq)
    dd = (eq - rolling_max) / rolling_max
    return float(np.min(dd))


def cagr(equity_curve: List[float], years: float) -> float:
    if len(equity_curve) < 2 or years <= 0:
        return 0.0
    start = equity_curve[0]
    end = equity_curve[-1]
    if start <= 0:
        return 0.0
    return float((end / start) ** (1 / years) - 1)


def win_rate(trade_log: List[Dict]) -> float:
    sells = [t for t in trade_log if t.get("side") == "SELL" and t.get("pnl_pct") is not None]
    if not sells:
        return 0.0
    wins = sum(1 for t in sells if t.get("pnl_pct", 0) > 0)
    return float(wins / len(sells))


def volatility_annualised(equity_curve: List[float]) -> float:
    rets = _returns(equity_curve)
    if len(rets) < 2:
        return 0.0
    return float(np.std(rets, ddof=1) * np.sqrt(252))


def compute_metrics(
    equity_curve: List[float],
    trade_log: List[Dict],
    years: float,
    rf: float = 0.04,
) -> TearsheetMetrics:
    if not equity_curve or equity_curve[0] == 0:
        return TearsheetMetrics()

    s = sharpe(equity_curve, rf)
    so = sortino(equity_curve, rf)
    md = max_drawdown(equity_curve)
    c = cagr(equity_curve, years)
    wr = win_rate(trade_log)
    vol = volatility_annualised(equity_curve)
    total_ret = (equity_curve[-1] - equity_curve[0]) / equity_curve[0] if equity_curve[0] > 0 else 0
    calmar = abs(c / md) if md != 0 else 0.0
    trade_count = len([t for t in trade_log if t.get("side") == "SELL"])

    return TearsheetMetrics(
        sharpe=round(s, 3),
        sortino=round(so, 3),
        max_drawdown=round(md, 4),
        win_rate=round(wr, 4),
        cagr=round(c, 4),
        calmar=round(calmar, 3),
        total_return=round(total_ret, 4),
        volatility=round(vol, 4),
        trade_count=trade_count,
    )
