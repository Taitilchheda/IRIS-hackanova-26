import asyncio
from app.agents.manager import ManagerAgent
import numpy as np

async def main():
    manager = ManagerAgent()
    try:
        print("Running strategy...")
        ts = manager.run(
            prompt="Buy AAPL when SMA 50 crosses above SMA 200",
            asset="AAPL",
            start_date="2023-01-01",
            end_date="2023-12-31"
        )
        print("Success!")
        print(f"Sharpe: {ts.trader_metrics.sharpe}")
    except Exception as e:
        print(f"Error caught: {e}")

if __name__ == "__main__":
    asyncio.run(main())
