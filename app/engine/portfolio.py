"""
Portfolio: tracks cash, positions, P&L.
"""
from app.engine.event import Position, Fill
from app.utils.logger import get_logger

log = get_logger(__name__)


class Portfolio:
    def __init__(self, initial_capital: float = 100_000.0):
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.positions: dict[str, Position] = {}
        self.total_commission = 0.0
        self.total_slippage = 0.0

    @property
    def equity(self) -> float:
        pos_value = sum(p.quantity * p.avg_cost for p in self.positions.values())
        return self.cash + pos_value

    def mark_to_market(self, prices: dict[str, float]) -> float:
        total = self.cash
        for ticker, pos in self.positions.items():
            price = prices.get(ticker, pos.avg_cost)
            pos.unrealised_pnl = (price - pos.avg_cost) * pos.quantity
            total += price * pos.quantity
        return total

    def apply_fill(self, fill: Fill) -> None:
        ticker = fill.ticker
        if ticker not in self.positions:
            self.positions[ticker] = Position(ticker=ticker)

        pos = self.positions[ticker]
        notional = fill.fill_price * fill.quantity

        if fill.side == "BUY":
            # Update average cost
            old_value = pos.quantity * pos.avg_cost
            pos.quantity += fill.quantity
            if pos.quantity > 0:
                pos.avg_cost = (old_value + notional) / pos.quantity
            self.cash -= notional + fill.commission
        else:  # SELL
            if pos.quantity > 0:
                realised = (fill.fill_price - pos.avg_cost) * fill.quantity
                pos.realised_pnl += realised
                pos.quantity -= fill.quantity
                if pos.quantity <= 1e-9:
                    pos.quantity = 0.0
            self.cash += notional - fill.commission

        self.total_commission += fill.commission
        self.total_slippage += fill.slippage

    def position_pnl_pct(self, ticker: str, current_price: float) -> float:
        pos = self.positions.get(ticker)
        if pos is None or pos.avg_cost == 0 or pos.quantity == 0:
            return 0.0
        return (current_price - pos.avg_cost) / pos.avg_cost

    def in_position(self, ticker: str) -> bool:
        pos = self.positions.get(ticker)
        return pos is not None and pos.quantity > 0
