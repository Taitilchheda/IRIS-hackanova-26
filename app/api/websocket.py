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

async def fetch_market_data(symbol: str) -> Dict[str, Any]:
    """Fetch real market data for a symbol"""
    try:
        if symbol == "VIX":
            ticker = yf.Ticker("^VIX")
        elif symbol == "USDJPY":
            ticker = yf.Ticker("USDJPY=X")
        else:
            ticker = yf.Ticker(symbol)
        
        hist = ticker.history(period="1d", interval="1m")
        if hist.empty:
            return None
        
        latest = hist.iloc[-1]
        return {
            "symbol": symbol,
            "price": round(float(latest["Close"]), 2),
            "volume": int(latest["Volume"]) if "Volume" in latest else 0,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        log.error(f"Error fetching market data for {symbol}: {e}")
        return None

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
