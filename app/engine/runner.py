"""
BacktestRunner: core event-driven simulation loop.
"""
from __future__ import annotations
import pandas as pd
import numpy as np
from typing import List, Dict, Any

from app.engine.event import Bar, Order, Fill
from app.engine.friction import FrictionModel
from app.engine.portfolio import Portfolio
from app.nlp.schema import StrategySpec, TradeCondition
from app.signals.moving_averages import sma, ema, crossover_signal
from app.signals.oscillators import rsi, macd
from app.utils.logger import get_logger

log = get_logger(__name__)


def _compute_indicator(series: pd.Series, high: pd.Series, low: pd.Series,
                       indicator: str, params: Dict) -> pd.Series:
    ind = indicator.upper()
    if ind == "SMA":
        return sma(series, params.get("window", 20))
    if ind == "EMA":
        return ema(series, params.get("span", params.get("window", 20)))
    if ind == "RSI":
        return rsi(series, params.get("period", 14))
    if ind == "MACD":
        ml, sl, _ = macd(series)
        return ml - sl  # histogram as signal
    if ind == "ATR":
        tr = pd.DataFrame({
            'hl': high - low,
            'hc': (high - series.shift(1)).abs(),
            'lc': (low - series.shift(1)).abs()
        }).max(axis=1)
        return tr.rolling(params.get("period", 14)).mean()
    if ind == "BOLLINGER_UPPER":
        w = params.get("window", 20)
        n = params.get("n_std", 2)
        return sma(series, w) + n * series.rolling(w).std()
    if ind == "BOLLINGER_LOWER":
        w = params.get("window", 20)
        n = params.get("n_std", 2)
        return sma(series, w) - n * series.rolling(w).std()
    if ind == "PRICE":
        return series
    # Fallback: return price
    return series


def _eval_condition(close: pd.Series, high: pd.Series, low: pd.Series,
                    cond: TradeCondition, portfolio: Portfolio,
                    ticker: str, idx: int) -> bool:
    """Evaluate a single TradeCondition at bar `idx`."""
    if idx < 1:
        return False

    ind = cond.indicator.upper()
    if ind == "POSITION_PNL":
        current_price = close.iloc[idx]
        pnl = portfolio.position_pnl_pct(ticker, current_price)
        op = cond.operator
        val = float(cond.value)
        if op == "<":
            return pnl < val
        if op == ">":
            return pnl > val
        return False

    lhs = _compute_indicator(close, high, low, cond.indicator, cond.params)

    # Value can be a scalar or another indicator dict
    if isinstance(cond.value, dict):
        rhs = _compute_indicator(close, high, low,
                                 cond.value["indicator"],
                                 cond.value.get("params", {}))
    else:
        rhs = cond.value

    op = cond.operator
    try:
        l_val = float(lhs.iloc[idx])
        if isinstance(rhs, pd.Series):
            r_val = float(rhs.iloc[idx])
            r_prev = float(rhs.iloc[idx - 1]) if hasattr(rhs, 'iloc') and idx > 0 else r_val
        else:
            r_val = float(rhs)
            r_prev = r_val
        l_prev = float(lhs.iloc[idx - 1]) if hasattr(lhs, 'iloc') and idx > 0 else l_val

        if op == ">":
            return l_val > r_val
        if op == "<":
            return l_val < r_val
        if op == ">=":
            return l_val >= r_val
        if op == "<=":
            return l_val <= r_val
        if op == "=":
            return abs(l_val - r_val) < 1e-6
        if op == "crosses_above":
            return l_prev <= r_prev and l_val > r_val
        if op == "crosses_below":
            return l_prev >= r_prev and l_val < r_val
    except Exception:
        pass
    return False


class BacktestRunner:
    def __init__(self, spec: StrategySpec, data: pd.DataFrame):
        self.spec = spec
        self.data = data.copy()
        self.friction = FrictionModel(
            commission_pct=spec.commission_pct,
            slippage_pct=spec.slippage_pct
        )
        self.portfolio = Portfolio(initial_capital=spec.initial_capital)
        self.equity_curve: List[float] = []
        self.trade_log: List[Dict[str, Any]] = []

    def run(self) -> tuple[List[float], List[str], List[Dict]]:
        close = self.data["Close"]
        high = self.data.get("High", close)
        low = self.data.get("Low", close)
        dates = [str(d.date()) for d in self.data.index]
        ticker = self.spec.asset

        entry_conds = self.spec.entry_conditions
        exit_conds = self.spec.exit_conditions

        # If no conditions parsed, default to buy-and-hold
        if not entry_conds and not exit_conds:
            entry_conds = []
            log.warning("No conditions parsed; using simple buy-and-hold baseline")

        equity_curve = []
        for i in range(len(close)):
            current_price = float(close.iloc[i])
            date = dates[i]
            prices = {ticker: current_price}
            equity = self.portfolio.mark_to_market(prices)
            equity_curve.append(round(equity, 2))

            in_pos = self.portfolio.in_position(ticker)

            # Check exit conditions
            if in_pos and exit_conds:
                exit_triggered = all(
                    _eval_condition(close, high, low, c, self.portfolio, ticker, i)
                    for c in exit_conds
                )
                if exit_triggered:
                    pos = self.portfolio.positions[ticker]
                    if pos.quantity > 0:
                        fill_price, comm, slip = self.friction.apply(
                            current_price, pos.quantity, "SELL"
                        )
                        fill = Fill(date=date, ticker=ticker, side="SELL",
                                   quantity=pos.quantity, fill_price=fill_price,
                                   commission=comm, slippage=slip)
                        entry_cost = pos.avg_cost
                        self.portfolio.apply_fill(fill)
                        pnl_pct = (fill_price - entry_cost) / entry_cost if entry_cost else 0
                        self.trade_log.append({
                            "date": date, "side": "SELL", "price": round(fill_price, 2),
                            "quantity": round(pos.quantity, 0),
                            "pnl_pct": round(pnl_pct * 100, 2)
                        })
                        continue

            # Check entry conditions (only if not in position)
            if not in_pos:
                if entry_conds:
                    entry_triggered = all(
                        _eval_condition(close, high, low, c, self.portfolio, ticker, i)
                        for c in entry_conds
                    )
                elif i == 0:
                    entry_triggered = True  # buy-and-hold enters on day 1
                else:
                    entry_triggered = False

                if entry_triggered and self.portfolio.cash > 0:
                    # Position sizing: risk-based or full capital
                    invest = self.portfolio.cash * min(self.spec.max_position_pct, 1.0)
                    quantity = invest / current_price
                    fill_price, comm, slip = self.friction.apply(
                        current_price, quantity, "BUY"
                    )
                    fill = Fill(date=date, ticker=ticker, side="BUY",
                               quantity=quantity, fill_price=fill_price,
                               commission=comm, slippage=slip)
                    self.portfolio.apply_fill(fill)
                    self.trade_log.append({
                        "date": date, "side": "BUY", "price": round(fill_price, 2),
                        "quantity": round(quantity, 0), "pnl_pct": None
                    })

        # Close any open position at end
        if self.portfolio.in_position(ticker) and len(close) > 0:
            final_price = float(close.iloc[-1])
            pos = self.portfolio.positions[ticker]
            fill_price, comm, slip = self.friction.apply(final_price, pos.quantity, "SELL")
            fill = Fill(date=dates[-1], ticker=ticker, side="SELL",
                       quantity=pos.quantity, fill_price=fill_price,
                       commission=comm, slippage=slip)
            pnl_pct = (fill_price - pos.avg_cost) / pos.avg_cost if pos.avg_cost else 0
            self.portfolio.apply_fill(fill)
            self.trade_log.append({
                "date": dates[-1], "side": "SELL", "price": round(fill_price, 2),
                "quantity": round(pos.quantity, 0),
                "pnl_pct": round(pnl_pct * 100, 2)
            })
            # Update final equity
            equity_curve[-1] = round(self.portfolio.equity, 2)

        self.equity_curve = equity_curve
        return equity_curve, dates, self.trade_log
