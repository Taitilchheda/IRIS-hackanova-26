"""
End-to-end example run of the IRIS pipeline (no HTTP server needed).
Usage: python scripts/run_example.py [--prompt "..."] [--asset SPY]
"""
import sys
import json
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.agents.manager import ManagerAgent
from app.tearsheet.serialiser import summary_dict
from app.utils.logger import get_logger

log = get_logger("run_example")


DEFAULT_PROMPT = (
    "Buy when the 50-day simple moving average crosses above the 200-day SMA. "
    "Sell when RSI exceeds 70."
)


def main():
    parser = argparse.ArgumentParser(description="IRIS end-to-end example")
    parser.add_argument("--prompt", default=DEFAULT_PROMPT)
    parser.add_argument("--asset", default="SPY")
    parser.add_argument("--start", default="2019-01-01")
    parser.add_argument("--end", default="2023-12-31")
    parser.add_argument("--capital", type=float, default=100_000.0)
    parser.add_argument("--expert", default=None,
                        help="Expert type (risk_analysis, alpha_signal, portfolio, ...)")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("IRIS — Intelligent Reasoning & Inferential Simulator")
    print("=" * 60)
    print(f"Asset  : {args.asset}")
    print(f"Period : {args.start} → {args.end}")
    print(f"Capital: ${args.capital:,.0f}")
    print(f"Prompt : {args.prompt}")
    print("=" * 60 + "\n")

    manager = ManagerAgent()
    ts = manager.run(
        prompt=args.prompt,
        asset=args.asset,
        start_date=args.start,
        end_date=args.end,
        initial_capital=args.capital,
        expert_type=args.expert,
    )

    summary = summary_dict(ts)
    print("\n── RESULTS ──────────────────────────────────────────────")
    print(json.dumps(summary, indent=2))
    print("\n── NARRATIVE ────────────────────────────────────────────")
    print(ts.narrative or "(No LLM narrative — set ANTHROPIC_API_KEY)")
    print("─" * 60 + "\n")

    return ts


if __name__ == "__main__":
    main()
