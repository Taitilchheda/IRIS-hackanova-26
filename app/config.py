from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    
    # Data Providers
    alpaca_api_key: Optional[str] = None
    alpaca_secret_key: Optional[str] = None
    
    # Backtest Defaults
    backtest_default_capital: float = 100000.0
    backtest_commission_pct: float = 0.001
    backtest_slippage_pct: float = 0.0005
    backtest_default_asset: str = "SPY"
    
    # Server configuration
    port: int = 8000
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
