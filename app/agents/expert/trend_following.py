import time
import numpy as np
import pandas as pd
from app.agents.expert.base import BaseExpertAgent
from app.nlp.schema import StrategySpec, AgentResult
from app.data.loader import load_ohlcv
from app.utils.logger import get_logger

log = get_logger(__name__)

class TrendFollowingAgent(BaseExpertAgent):
    name = "Trend Following"

    def run(self, spec: StrategySpec) -> AgentResult:
        t0 = time.time()
        log.info(f"[{self.name}] Running SMA Crossover (20/50)")
        try:
            df = load_ohlcv(spec.asset, spec.start_date, spec.end_date)
            if df.empty:
                raise ValueError("No data returned for asset")
            
            close = df["Close"]
            sma_fast = close.rolling(20).mean()
            sma_slow = close.rolling(50).mean()
            
            dates = [str(d.date()) for d in df.index]
            n = len(close)
            
            capital = spec.initial_capital
            equity = [capital]
            position = 0
            trade_log = []
            
            for i in range(1, n):
                ret = (close[i] - close[i-1]) / close[i-1] if close[i-1] > 0 else 0
                
                if position == 1:
                    equity.append(round(equity[-1] * (1 + ret), 2))
                    if sma_fast[i] < sma_slow[i]: # Death Cross
                        position = 0
                        trade_log.append({"date": dates[i], "side": "SELL", "price": round(close[i], 2), "quantity": 100, "pnl_pct": round(((close[i]-entry_price)/entry_price)*100, 2)})
                else:
                    equity.append(equity[-1])
                    if sma_fast[i] > sma_slow[i] and not pd.isna(sma_slow[i]): # Golden Cross
                        position = 1
                        entry_price = close[i]
                        trade_log.append({"date": dates[i], "side": "BUY", "price": round(close[i], 2), "quantity": 100, "pnl_pct": None})
            
            return AgentResult(
                agent_name=self.name,
                equity_curve=equity,
                dates=dates,
                trade_log=trade_log,
                metrics={
                    "trades": len(trade_log),
                    "final_equity": equity[-1]
                },
                elapsed_seconds=round(time.time() - t0, 2),
            )
        except Exception as e:
            log.error(f"[{self.name}] Error: {e}")
            return AgentResult(agent_name=self.name, error=str(e), elapsed_seconds=round(time.time() - t0, 2))
