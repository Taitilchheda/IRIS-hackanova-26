"""Tearsheet package helpers (builder, metrics, serialiser)."""
from app.tearsheet.builder import build_tearsheet
from app.tearsheet.metrics import compute_metrics, sharpe, sortino, max_drawdown, cagr, win_rate, volatility_annualised
from app.tearsheet.serialiser import (
    tearsheet_to_json,
    tearsheet_from_json,
    tearsheet_to_dict,
    summary_dict,
)

__all__ = [
    "build_tearsheet",
    "compute_metrics",
    "sharpe",
    "sortino",
    "max_drawdown",
    "cagr",
    "win_rate",
    "volatility_annualised",
    "tearsheet_to_json",
    "tearsheet_from_json",
    "tearsheet_to_dict",
    "summary_dict",
]
