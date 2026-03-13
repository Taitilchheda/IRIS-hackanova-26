"""
Trader Strategy Agent — executes the trader's exact strategy using the backtest engine.
"""
from __future__ import annotations
import time
from app.nlp.schema import StrategySpec, AgentResult
from app.data.loader import load_ohlcv
from app.engine.runner import BacktestRunner
from app.utils.logger import get_logger

log = get_logger(__name__)


class TraderStrategyAgent:
    name = "Trader Strategy"

    def run(self, spec: StrategySpec) -> AgentResult:
        t0 = time.time()
        log.info(f"[{self.name}] Running trader backtest on {spec.asset}")
        try:
            df = load_ohlcv(spec.asset, spec.start_date, spec.end_date)
            if df.empty:
                raise ValueError(f"No data for {spec.asset}")

            runner = BacktestRunner(spec=spec, data=df)
            equity_curve, dates, trade_log = runner.run()

            return AgentResult(
                agent_name=self.name,
                equity_curve=equity_curve,
                dates=dates,
                trade_log=trade_log,
                metrics={
                    "total_commission": round(runner.portfolio.total_commission, 2),
                    "total_slippage": round(runner.portfolio.total_slippage, 2),
                },
                elapsed_seconds=round(time.time() - t0, 2),
            )
        except Exception as e:
            log.error(f"[{self.name}] Error: {e}")
            return AgentResult(agent_name=self.name, error=str(e),
                               elapsed_seconds=round(time.time() - t0, 2))
