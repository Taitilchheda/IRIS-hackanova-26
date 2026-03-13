"""Tests package for IRIS financial trading system."""

# Test configuration and utilities
import sys
import os
from pathlib import Path

# Add the app directory to the Python path for imports
app_path = Path(__file__).parent.parent / "app"
if str(app_path) not in sys.path:
    sys.path.insert(0, str(app_path))

# Import test fixtures to make them available globally
from tests.conftest import *

__all__ = [
    # Test fixtures will be automatically available
    "sample_ohlcv",
    "mock_strategy_spec", 
    "mock_data_loader"
]
