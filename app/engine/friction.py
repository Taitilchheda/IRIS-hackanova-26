"""
FrictionModel: commission, slippage, market impact.
"""
import numpy as np


class FrictionModel:
    def __init__(self, commission_pct: float = 0.001, slippage_pct: float = 0.0005):
        self.commission_pct = commission_pct
        self.slippage_pct = slippage_pct

    def apply(self, price: float, quantity: float, side: str) -> tuple[float, float, float]:
        """
        Returns (fill_price, commission, slippage) after applying friction.
        """
        # Slippage: adverse price movement
        slip_factor = self.slippage_pct * (1 if side == "BUY" else -1)
        fill_price = price * (1 + slip_factor)

        # Commission: flat bps on notional
        notional = fill_price * quantity
        commission = notional * self.commission_pct

        slippage = abs(fill_price - price) * quantity
        return fill_price, commission, slippage
