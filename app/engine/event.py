"""
Event-driven data classes: Bar, Order, Fill, Position.
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Bar:
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass
class Order:
    date: str
    ticker: str
    side: str          # "BUY" | "SELL"
    quantity: float
    order_type: str = "MARKET"
    limit_price: Optional[float] = None


@dataclass
class Fill:
    date: str
    ticker: str
    side: str
    quantity: float
    fill_price: float
    commission: float
    slippage: float


@dataclass
class Position:
    ticker: str
    quantity: float = 0.0
    avg_cost: float = 0.0
    unrealised_pnl: float = 0.0
    realised_pnl: float = 0.0

    @property
    def market_value(self) -> float:
        return self.quantity * self.avg_cost
