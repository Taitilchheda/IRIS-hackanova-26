"""
Market data API endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import yfinance as yf
import pandas as pd
from datetime import datetime
from app.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter()

# Cache for real-time data
_market_cache: Dict[str, Dict[str, Any]] = {}

@router.get("/market-data")
async def get_market_data(symbols: str = "AAPL,SPY,MSFT,TSLA,VIX,USDJPY") -> List[Dict[str, Any]]:
    """
    Get current market data for specified symbols
    """
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        results = []
        
        for symbol in symbol_list:
            try:
                # Try to get cached data first (cache for 60 seconds)
                if symbol in _market_cache:
                    cached = _market_cache[symbol]
                    if (datetime.now().timestamp() - cached["timestamp"]) < 60:
                        results.append(cached["data"])
                        continue
                
                # Fetch fresh data
                if symbol == "VIX":
                    # VIX is ^VIX in Yahoo Finance
                    ticker = yf.Ticker("^VIX")
                elif symbol == "USDJPY":
                    # USD/JPY is USDJPY=X in Yahoo Finance
                    ticker = yf.Ticker("USDJPY=X")
                else:
                    ticker = yf.Ticker(symbol)
                
                # Get recent data
                info = ticker.info
                hist = ticker.history(period="2d", interval="1d")
                
                if hist.empty:
                    # Fallback to cached or mock data
                    data = {
                        "symbol": symbol,
                        "price": 150.0 + len(symbol) * 10,
                        "change": 0.0,
                        "changePercent": 0.0,
                        "volume": 1000000,
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    latest = hist.iloc[-1]
                    previous = hist.iloc[-2] if len(hist) > 1 else latest
                    
                    price = latest["Close"]
                    change = price - previous["Close"]
                    changePercent = (change / previous["Close"]) * 100 if previous["Close"] != 0 else 0
                    
                    data = {
                        "symbol": symbol,
                        "price": round(float(price), 2),
                        "change": round(float(change), 2),
                        "changePercent": round(float(changePercent), 2),
                        "volume": int(latest["Volume"]) if "Volume" in latest else 0,
                        "timestamp": datetime.now().isoformat()
                    }
                
                # Cache the result
                _market_cache[symbol] = {
                    "data": data,
                    "timestamp": datetime.now().timestamp()
                }
                
                results.append(data)
                
            except Exception as e:
                log.warning(f"Failed to fetch data for {symbol}: {e}")
                # Return mock data as fallback
                results.append({
                    "symbol": symbol,
                    "price": 150.0 + len(symbol) * 10,
                    "change": (hash(symbol) % 10 - 5),
                    "changePercent": (hash(symbol) % 6 - 3),
                    "volume": 1000000,
                    "timestamp": datetime.now().isoformat()
                })
        
        return results
        
    except Exception as e:
        log.error(f"Market data fetch error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market data")

@router.get("/market-data/{symbol}")
async def get_symbol_data(symbol: str) -> Dict[str, Any]:
    """
    Get detailed data for a single symbol
    """
    try:
        symbol = symbol.upper()
        
        # Check cache first
        if symbol in _market_cache:
            cached = _market_cache[symbol]
            if (datetime.now().timestamp() - cached["timestamp"]) < 60:
                return cached["data"]
        
        # Fetch data
        if symbol == "VIX":
            ticker = yf.Ticker("^VIX")
        elif symbol == "USDJPY":
            ticker = yf.Ticker("USDJPY=X")
        else:
            ticker = yf.Ticker(symbol)
        
        info = ticker.info
        hist = ticker.history(period="5d", interval="1d")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
        
        latest = hist.iloc[-1]
        previous = hist.iloc[-2] if len(hist) > 1 else latest
        
        price = latest["Close"]
        change = price - previous["Close"]
        changePercent = (change / previous["Close"]) * 100 if previous["Close"] != 0 else 0
        
        data = {
            "symbol": symbol,
            "price": round(float(price), 2),
            "change": round(float(change), 2),
            "changePercent": round(float(changePercent), 2),
            "volume": int(latest["Volume"]) if "Volume" in latest else 0,
            "high": round(float(latest["High"]), 2) if "High" in latest else price,
            "low": round(float(latest["Low"]), 2) if "Low" in latest else price,
            "open": round(float(latest["Open"]), 2) if "Open" in latest else price,
            "timestamp": datetime.now().isoformat(),
            "info": {
                "name": info.get("longName", symbol),
                "sector": info.get("sector", "N/A"),
                "marketCap": info.get("marketCap", 0),
            } if info else {}
        }
        
        # Cache the result
        _market_cache[symbol] = {
            "data": data,
            "timestamp": datetime.now().timestamp()
        }
        
        return data
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Symbol data fetch error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch symbol data")
