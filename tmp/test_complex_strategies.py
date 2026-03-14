import sys
import os
from pathlib import Path

# Add root to path
sys.path.append(str(Path(__file__).parent.parent))

from app.nlp.parser import StrategyParser
from app.engine.runner import BacktestRunner
from app.data.loader import load_ohlcv
from app.agents.expert.alpha_signal import AlphaSignalAgent
from app.agents.expert.risk_analysis import RiskAnalysisAgent
from app.agents.expert.portfolio_construction import PortfolioAgent
from app.agents.expert.derivatives_pricing import DerivativesPricingAgent
from app.agents.expert.fixed_income import FixedIncomeAgent
from app.agents.expert.microstructure import MicrostructureAgent

strategies = [
    {
        "name": "Risk Analysis",
        "asset": "SPY",
        "prompt": "Trade SPY daily. Go long when price is above the 100-day SMA and 20-day ATR is below its 6-month median (low vol). Exit when price closes below the 50-day SMA or ATR spikes 30% above its 6‑month median. Cap position at 60% of equity; 10 bps commission, 5 bps slippage."
    },
    {
        "name": "Alpha & Signal",
        "asset": "QQQ",
        "prompt": "Trade QQQ daily. Go long when RSI(14) crosses above 40 and closes back inside the lower Bollinger Band (20,2) after a pierce. Exit when RSI(14) crosses above 65 or price tags the upper Bollinger Band. Max position 50% of equity; 10 bps commission, 5 bps slippage."
    },
    {
        "name": "Portfolio Construction",
        "asset": "SPY",
        "prompt": "Trade SPY daily using trend-and-cash toggling: hold SPY when price is above the 200-day SMA; move to cash when below. Re-enter only after 3 consecutive closes back above the 200-day SMA. Max position 100%; commission 5 bps, slippage 5 bps."
    },
    {
        "name": "Derivatives & Pricing",
        "asset": "MSFT",
        "prompt": "Trade MSFT daily. Go long when the 20-day SMA crosses above the 50-day SMA and 14-day ATR as a % of price is below 2%. Exit when price closes below the 20-day SMA or ATR% rises above 3%. Max position 50%; commission 10 bps; slippage 5 bps."
    },
    {
        "name": "Fixed Income & Rates",
        "asset": "TLT",
        "prompt": "Trade TLT daily. Go long when price is above the 100-day SMA and 14-day RSI is between 45 and 60 (steady regime). Exit when price closes below the 50-day SMA or RSI drops below 40. Max position 70%; commission 5 bps; slippage 5 bps."
    },
    {
        "name": "Market Microstructure",
        "asset": "AAPL",
        "prompt": "Trade AAPL daily. Enter long when price closes above the 20-day SMA and the 5-day average volume is at least 110% of its 60-day average (strong flow). Exit when price closes below the 20-day SMA or 5-day volume falls back below the 60-day average. Max position 50%; commission 10 bps; slippage 5 bps."
    }
]

parser = StrategyParser()

for s in strategies:
    print(f"\n--- Testing Strategy: {s['name']} ---")
    try:
        spec = parser.parse(
            prompt=s['prompt'],
            asset=s['asset'],
            start_date="2020-01-01",
            end_date="2023-12-31"
        )
        print(f"Parsed Type: {spec.strategy_type}")
        print(f"Entry Conditions: {len(spec.entry_conditions)}")
        print(f"Exit Conditions: {len(spec.exit_conditions)}")
        
        # Test Runner
        df = load_ohlcv(spec.asset, spec.start_date, spec.end_date)
        runner = BacktestRunner(spec=spec, data=df)
        equity, dates, trades = runner.run()
        print(f"Backtest completed: {len(equity)} days, {len(trades)} trades")
        
        # Test Expert
        expert_map = {
            "Risk Analysis": RiskAnalysisAgent(),
            "Alpha & Signal": AlphaSignalAgent(),
            "Portfolio Construction": PortfolioAgent(),
            "Derivatives & Pricing": DerivativesPricingAgent(),
            "Fixed Income & Rates": FixedIncomeAgent(),
            "Market Microstructure": MicrostructureAgent(),
        }
        agent = expert_map[s['name']]
        res = agent.run(spec)
        print(f"Expert run completed: paths={len(res.paths) if res.paths else 0}")
        
    except Exception as e:
        print(f"Error testing {s['name']}: {e}")
        import traceback
        traceback.print_exc()

print("\n--- Validation Finished ---")
