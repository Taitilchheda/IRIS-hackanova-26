"""
WebSocket API for real-time updates
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, Any
import json
import asyncio
from datetime import datetime
import yfinance as yf
from app.utils.logger import get_logger

log = get_logger(__name__)

import requests

_session = requests.Session()
_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
})

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.market_data_cache: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        log.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        log.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            log.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: str):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                log.error(f"Error broadcasting message: {e}")
                disconnected.add(connection)
        
        # Remove dead connections
        for connection in disconnected:
            self.disconnect(connection)
    
    async def send_market_data_update(self, symbol: str, data: Dict[str, Any]):
        message = {
            "type": "market_data",
            "symbol": symbol,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast(json.dumps(message))
    
    async def send_strategy_update(self, run_id: str, status: str, progress: float = None):
        message = {
            "type": "strategy_update",
            "run_id": run_id,
            "status": status,
            "progress": progress,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast(json.dumps(message))

manager = ConnectionManager()

# State for persistent synthetic jitter
_price_state: Dict[str, float] = {}

async def fetch_market_data(symbol: str) -> Dict[str, Any]:
    """Fetch real market data for a symbol. Synthetic fallback if needed."""
    try:
        ticker_sym = symbol
        if symbol == "VIX": ticker_sym = "^VIX"
        elif symbol == "USDJPY": ticker_sym = "USDJPY=X"
        
        # Explicit check for rate limiting or session issues
        try:
            ticker = yf.Ticker(ticker_sym, session=_session)
            # Try a very small history fetch to see if we're rate limited
            hist = ticker.history(period="1d", interval="1m")
            
            if not hist.empty:
                latest = hist.iloc[-1]
                price = round(float(latest["Close"]), 2)
                volume = int(latest["Volume"]) if "Volume" in latest else 100000
                _price_state[symbol] = price # Update base price
                
                return {
                    "symbol": symbol,
                    "price": price,
                    "volume": volume,
                    "timestamp": datetime.now().isoformat()
                }
        except Exception as inner_e:
            msg = str(inner_e)
            if "Too Many Requests" in msg or "429" in msg or "Rate limited" in msg:
                log.warning(f"Rate limited for {symbol}, switching to synthetic.")
            else:
                log.debug(f"YFinance silent fail for {symbol}: {inner_e}")
                
        # --- Fallback: Persistent Synthetic Walk ---
        import random
        base_price = _price_state.get(symbol)
        
        if base_price is None:
            # Seed based on symbol hash for stability across restarts
            seed = sum(ord(c) for c in symbol) % 500
            base_price = 100.0 + (seed % 200)
            _price_state[symbol] = base_price
            
        # Add a random walk step (-0.2% to +0.22% for slight upward bias)
        jitter = random.uniform(-0.002, 0.0022)
        new_price = base_price * (1 + jitter)
        _price_state[symbol] = new_price
        
        return {
            "symbol": symbol,
            "price": round(new_price, 2),
            "volume": random.randint(10000, 50000),
            "timestamp": datetime.now().isoformat(),
            "status": "synthetic" # Mark as synthetic for internal debugging if needed
        }
    except Exception as e:
        log.error(f"Critical error in fetch_market_data for {symbol}: {e}")
        return {
            "symbol": symbol,
            "price": _price_state.get(symbol, 100.0),
            "volume": 0,
            "timestamp": datetime.now().isoformat()
        }

async def market_data_updater():
    """Background task to update market data and broadcast to clients"""
    symbols = ["AAPL", "SPY", "MSFT", "TSLA", "VIX", "USDJPY"]
    
    while True:
        try:
            for symbol in symbols:
                data = await fetch_market_data(symbol)
                if data:
                    await manager.send_market_data_update(symbol, data)
            
            # Wait 30 seconds before next update
            await asyncio.sleep(30)
        except Exception as e:
            log.error(f"Error in market data updater: {e}")
            await asyncio.sleep(30)
