"""
NLP Parser: translates plain English strategy → StrategySpec
Falls back to rule-based parsing when no LLM key is available.
"""
from __future__ import annotations
import json
import os
import re
from pathlib import Path

from app.nlp.schema import (
    StrategySpec, TradeCondition, StrategyType
)
from app.utils.logger import get_logger

log = get_logger(__name__)

PROMPT_DIR = Path(__file__).parent / "prompts"


def _load_prompt(name: str) -> str:
    return (PROMPT_DIR / name).read_text(encoding="utf-8")


def _call_llm(system: str, user: str) -> str:
    """Call Anthropic Claude. Returns raw text."""
    try:
        import anthropic
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise ValueError("No ANTHROPIC_API_KEY set")
        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return msg.content[0].text.strip()
    except Exception as e:
        log.warning(f"LLM call failed: {e}")
        return ""


# ── Rule-based fallback parser ────────────────────────────────────────────
_INDICATOR_PATTERNS = {
    "SMA": re.compile(r'(\d+)[-\s]?(?:day\s+)?(?:SMA|MA|moving average)', re.I),
    "EMA": re.compile(r'(\d+)[-\s]?(?:day\s+)?EMA', re.I),
    "RSI": re.compile(r'RSI\s*(?:\((\d+)\))?', re.I),
    "MACD": re.compile(r'MACD', re.I),
    "ATR": re.compile(r'ATR', re.I),
    "BOLLINGER": re.compile(r'bollinger|band', re.I),
    "VWAP": re.compile(r'VWAP', re.I),
}


def _rule_based_parse(prompt: str, asset: str) -> dict:
    """Simple regex-based strategy parser when LLM is unavailable."""
    prompt_lower = prompt.lower()
    entry = []
    exit_ = []
    strategy_type = "alpha_signal"

    # Detect MA crossover
    mas = re.findall(r'(\d+)[-\s]?(?:day\s+)?(?:SMA|MA|moving average)', prompt, re.I)
    if len(mas) >= 2:
        entry.append({
            "indicator": "SMA",
            "params": {"window": int(mas[0])},
            "operator": "crosses_above",
            "value": {"indicator": "SMA", "params": {"window": int(mas[1])}}
        })

    # Detect RSI exit
    rsi_m = re.search(r'RSI\s*(?:\((\d+)\))?\s*(?:>|exceeds|above)\s*(\d+)', prompt, re.I)
    if rsi_m:
        period = int(rsi_m.group(1) or 14)
        threshold = int(rsi_m.group(2))
        exit_.append({
            "indicator": "RSI",
            "params": {"period": period},
            "operator": ">",
            "value": threshold
        })

    # Detect stop loss
    stop_m = re.search(r'(?:stop|drops?|loss)\s*(?:of\s*)?(\d+)\s*%', prompt, re.I)
    if stop_m:
        pct = float(stop_m.group(1)) / 100
        exit_.append({
            "indicator": "POSITION_PNL",
            "params": {},
            "operator": "<",
            "value": -pct
        })

    # Detect strategy type
    if any(w in prompt_lower for w in ['risk', 'monte carlo', 'var', 'drawdown']):
        strategy_type = "risk_analysis"
    elif any(w in prompt_lower for w in ['option', 'call', 'put', 'greek', 'delta']):
        strategy_type = "derivatives"
    elif any(w in prompt_lower for w in ['portfolio', 'allocat', 'rebalanc']):
        strategy_type = "portfolio"
    elif any(w in prompt_lower for w in ['bond', 'yield', 'duration', 'rate']):
        strategy_type = "fixed_income"
    elif any(w in prompt_lower for w in ['vwap', 'twap', 'execution', 'regime']):
        strategy_type = "microstructure"

    # Default entry: buy and hold if no conditions found
    if not entry:
        entry.append({
            "indicator": "SMA",
            "params": {"window": 50},
            "operator": "crosses_above",
            "value": {"indicator": "SMA", "params": {"window": 200}}
        })

    rules_parts = [f"Strategy type: {strategy_type.replace('_', ' ').title()}"]
    for e in entry:
        rules_parts.append(f"ENTRY: {e['indicator']}({e.get('params', {})}) {e['operator']} {e['value']}")
    for ex in exit_:
        rules_parts.append(f"EXIT: {ex['indicator']}({ex.get('params', {})}) {ex['operator']} {ex['value']}")

    return {
        "asset": asset,
        "entry_conditions": entry,
        "exit_conditions": exit_,
        "risk_per_trade_pct": 0.02,
        "strategy_type": strategy_type,
        "confidence": 0.72,
        "parsed_rules_text": "\n".join(rules_parts)
    }


class StrategyParser:
    def parse(
        self,
        prompt: str,
        asset: str = "SPY",
        start_date: str = "2019-01-01",
        end_date: str = "2024-12-31",
        initial_capital: float = 100_000.0,
        commission_pct: float = 0.001,
        slippage_pct: float = 0.0005,
        max_position_pct: float = 1.0,
    ) -> StrategySpec:
        log.info(f"Parsing strategy: {prompt[:80]}...")

        parsed = {}
        has_llm = bool(os.getenv("ANTHROPIC_API_KEY"))

        if has_llm:
            system = _load_prompt("parse_strategy.txt")
            raw = _call_llm(system, prompt)
            try:
                # Strip markdown code fences if present
                raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.M)
                raw = re.sub(r'```\s*$', '', raw, flags=re.M)
                parsed = json.loads(raw)
            except Exception as e:
                log.warning(f"LLM JSON parse failed ({e}), falling back to rule-based")
                parsed = {}

        if not parsed:
            parsed = _rule_based_parse(prompt, asset)

        # Build entry conditions
        entry_conds = []
        for c in parsed.get("entry_conditions", []):
            try:
                entry_conds.append(TradeCondition(
                    indicator=c["indicator"],
                    params=c.get("params", {}),
                    operator=c["operator"],
                    value=c["value"]
                ))
            except Exception as e:
                log.warning(f"Skipping invalid entry condition: {e}")

        # Build exit conditions
        exit_conds = []
        for c in parsed.get("exit_conditions", []):
            try:
                exit_conds.append(TradeCondition(
                    indicator=c["indicator"],
                    params=c.get("params", {}),
                    operator=c["operator"],
                    value=c["value"]
                ))
            except Exception as e:
                log.warning(f"Skipping invalid exit condition: {e}")

        strategy_type_str = parsed.get("strategy_type", "alpha_signal")
        try:
            strategy_type = StrategyType(strategy_type_str)
        except ValueError:
            strategy_type = StrategyType.ALPHA_SIGNAL

        spec = StrategySpec(
            raw_prompt=prompt,
            asset=parsed.get("asset", asset),
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            commission_pct=commission_pct,
            slippage_pct=slippage_pct,
            max_position_pct=max_position_pct,
            risk_per_trade_pct=parsed.get("risk_per_trade_pct", 0.02),
            entry_conditions=entry_conds,
            exit_conditions=exit_conds,
            strategy_type=strategy_type,
            confidence=parsed.get("confidence", 0.72),
            parsed_rules_text=parsed.get("parsed_rules_text", ""),
        )
        log.info(f"Parsed: type={spec.strategy_type}, confidence={spec.confidence:.2f}")
        return spec
