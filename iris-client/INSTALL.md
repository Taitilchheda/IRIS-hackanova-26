# IRIS Client Installation Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## Quick Start

### 1. Install Dependencies

```bash
cd iris-client
npm install
```

### 2. Environment Configuration

Copy the environment template:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues

#### 1. TypeScript Errors
```bash
npm install --save-dev @types/node
```

#### 2. Missing Dependencies
```bash
npm install lucide-react recharts class-variance-authority clsx tailwind-merge
```

#### 3. Tailwind CSS Issues
Ensure `tailwind.config.js` and `postcss.config.js` are present.

#### 4. WebSocket Connection Issues
- Check if backend is running on the configured port
- Verify firewall settings
- Ensure WebSocket endpoint is accessible

### Development Mode Features

When `NEXT_PUBLIC_DEV_MODE=true`, the frontend includes:

- Mock data for development
- Enhanced error logging
- Debug information in console
- Fallback data when backend is unavailable

## Backend Integration

### Required API Endpoints

The frontend expects these backend endpoints:

#### Strategy Management
- `POST /api/strategy` - Submit strategy
- `POST /api/backtest/{run_id}` - Execute backtest
- `GET /api/tearsheet/{run_id}` - Get results

#### Market Data
- `GET /api/market-data?symbols=AAPL,VIX,SPY` - Market data
- `WS /ws` - Real-time WebSocket updates

#### Agent Pipeline
- `GET /api/status/{run_id}` - Agent status
- `POST /api/automate` - Deploy strategy

### Data Formats

#### Strategy Input
```json
{
  "description": "Buy AAPL when 50-day MA crosses above 200-day MA",
  "asset": "AAPL",
  "startDate": "2019-01-01",
  "endDate": "2024-12-31",
  "capital": 100000,
  "commission": 10,
  "slippage": 5,
  "maxPosition": 100,
  "monteCarloPaths": 1000
}
```

#### Market Data
```json
{
  "symbol": "AAPL",
  "price": 213.47,
  "change": 2.34,
  "changePercent": 1.11,
  "volume": 1000000
}
```

#### Backtest Result
```json
{
  "id": "run_123",
  "status": "completed",
  "trader": {
    "sharpe": 1.84,
    "maxDrawdown": -12.3,
    "cagr": 18.2
  },
  "equityCurve": [
    {
      "date": "2019-01-01",
      "trader": 100000,
      "expert": 100000,
      "spy": 100000
    }
  ]
}
```

## Feature Overview

### 🎯 Bloomberg Terminal Design
- Professional dark theme optimized for trading
- Terminal-style animations and effects
- High contrast for extended viewing sessions
- Information-dense layout

### 📊 Interactive Charts
- Real-time equity curve visualization
- Interactive drawdown charts
- Monte Carlo simulation display
- Volume and signal strength indicators
- Crosshair tooltips with detailed data

### 🚀 Strategy Development
- Natural language strategy input
- Parameter configuration controls
- Expert benchmark selection
- Real-time backtest execution
- Agent pipeline monitoring

### ⚡ Real-Time Features
- Live market data ticker
- WebSocket-based updates
- Animated number transitions
- Progress indicators
- Status monitoring

### ⌨️ Keyboard Shortcuts
- `Ctrl+Enter` - Run strategy
- `Ctrl+Shift+D` - Deploy trader strategy
- `Ctrl+Shift+E` - Deploy expert strategy
- `Alt+S` - Focus strategy input
- `?` - Show keyboard shortcuts

## Performance Optimization

### Chart Rendering
- Efficient data sampling for large datasets
- Debounced resize handlers
- Optimized re-rendering with React.memo

### Memory Management
- Cleanup of WebSocket connections
- Proper event listener removal
- Efficient state management

### Network Optimization
- Request deduplication
- Connection pooling
- Fallback to HTTP polling

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test with both mock and real data
4. Update documentation for API changes

## License

This project is part of the IRIS quantitative trading platform.
