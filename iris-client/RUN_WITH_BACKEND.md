# IRIS Client + Backend Setup Guide

## 🚀 Complete Step-by-Step Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

---

## Step 1: Backend Setup

First, let's set up the IRIS backend:

```bash
# Navigate to the main IRIS directory
cd "c:\Users\asaad\Documents\IRIS-hackanova-26"

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Create Backend Environment File

Create a `.env` file in the main directory:

```bash
# Create .env file
echo "JWT_SECRET=changeme
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct:free
admin_email=admin@iris.local
admin_password=ChangeMe123!" > .env
```

### Pre-cache Market Data (Important!)

```bash
# Run the data caching script
python - <<'PY'
import yfinance as yf, pathlib

# Download required data for AAPL and SPY
for t in ["AAPL","SPY","MSFT","TSLA","GS","JPM","QQQ"]:
    try:
        df = yf.download(t, start="2019-01-01", end="2024-12-31", progress=False, auto_adjust=True)
        p = pathlib.Path("app/data/cache") / f"{t}_2019-01-01_2024-12-31.parquet"
        p.parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(p)
        print(f"✅ Cached {t}: {len(df)} records")
    except Exception as e:
        print(f"❌ Error caching {t}: {e}")
PY
```

---

## Step 2: Start the Backend

```bash
# Start the FastAPI backend
uvicorn app.main:app --reload --port 8000
```

**Verify backend is running:**
- Open http://localhost:8000/health in your browser
- You should see: `{"status": "ok"}`

---

## Step 3: Frontend Setup

Now let's set up the React frontend:

```bash
# Navigate to the iris-client directory
cd iris-client

# Install Node.js dependencies
npm install
```

### Create Frontend Environment File

```bash
# Create environment file for frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws" > .env.local
```

---

## Step 4: Start the Frontend

```bash
# Start the Next.js development server
npm run dev
```

The frontend should now be running at: http://localhost:3000

---

## Step 5: Test the Connection

### 5.1 Check Backend Health
- Visit http://localhost:8000/health
- Should return: `{"status": "ok"}`

### 5.2 Check Frontend
- Visit http://localhost:3000
- You should see the IRIS Bloomberg Terminal interface

### 5.3 Test API Connection
Open browser developer console (F12) and check for any connection errors.

---

## Step 6: Run Your First Strategy

### 6.1 Login to IRIS
- Go to http://localhost:3000
- Use credentials:
  - Email: `admin@iris.local`
  - Password: `ChangeMe123!`

### 6.2 Enter a Strategy
In the "Strategy Input" box, paste this example:

```
Buy AAPL when 50-day MA crosses above 200-day MA. Sell when RSI > 70 or position drops 5% from entry. Risk 2% capital per trade.
```

### 6.3 Configure Parameters
- Asset: AAPL
- From: 2019-01-01
- To: 2024-12-31
- Capital: $100,000
- Commission: 10 bps
- Slippage: 5 bps

### 6.4 Run IRIS
- Click the "▶ RUN IRIS" button
- Watch the agent pipeline execute
- Charts should populate with real data

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Issue 1: Backend won't start
**Symptoms:** Port 8000 already in use or Python errors
**Solutions:**
```bash
# Check what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

#### Issue 2: Frontend can't connect to backend
**Symptoms:** Network errors in browser console
**Solutions:**
1. Check if backend is running on port 8000
2. Verify `.env.local` has correct API URL
3. Check for CORS errors in backend console

#### Issue 3: Charts show no data
**Symptoms:** Empty charts or loading indicators
**Solutions:**
1. Ensure market data was cached (Step 1.3)
2. Check backend logs for data loading errors
3. Try refreshing the page (Ctrl+Shift+R)

#### Issue 4: Strategy execution fails
**Symptoms:** Error messages or no results
**Solutions:**
1. Check OpenRouter API key is valid
2. Verify strategy syntax is correct
3. Check backend console for detailed error messages

#### Issue 5: WebSocket connection fails
**Symptoms:** Real-time updates not working
**Solutions:**
1. WebSocket may not be implemented in backend yet
2. Frontend will fall back to HTTP polling
3. This is normal for initial setup

---

## 📊 Expected Results

When everything is working correctly, you should see:

1. **Live Market Data Ticker** - Real-time prices for AAPL, VIX, SPY, USD/JPY
2. **Interactive Charts** - Equity curves, drawdowns, Monte Carlo simulations
3. **Agent Pipeline** - Watch AI agents process your strategy
4. **Performance Metrics** - Sharpe ratio, win rate, max drawdown
5. **Trade Log** - Detailed list of executed trades
6. **IRIS Analysis** - AI recommendations and insights

---

## 🎯 Quick Test Commands

```bash
# Terminal 1: Backend (in main IRIS directory)
source venv/Scripts/activate  # Windows
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend (in iris-client directory)
npm run dev
```

---

## 📱 Development Workflow

1. **Make changes** to frontend code
2. **Save files** - Next.js hot-reloads automatically
3. **Check browser** - Changes appear immediately
4. **Debug** - Use browser dev tools and backend console
5. **Test strategies** - Try different strategy descriptions

---

## 🔐 Security Notes

- Change default admin password before production use
- Keep OpenRouter API key secure
- Use HTTPS in production
- Enable proper CORS settings for production domains

---

## 📞 Need Help?

If you encounter issues:

1. **Check logs** - Both backend and frontend consoles
2. **Verify ports** - Ensure 8000 and 3000 are available
3. **Test API directly** - Use curl or Postman to test endpoints
4. **Check dependencies** - Ensure all packages are installed

The system should now be fully operational with both frontend and backend working together!
