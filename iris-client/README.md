# IRIS Client - Bloomberg Terminal Inspired Frontend

A modern, interactive React Next.js TypeScript frontend for the IRIS quantitative trading platform, designed with a Bloomberg Terminal aesthetic.

## Features

### 🎯 Bloomberg Terminal-Inspired Design
- Dark theme with terminal-style aesthetics
- Scanline overlay effects
- Monospace fonts and terminal-style animations
- Real-time data visualization
- Professional financial interface

### 📊 Advanced Charting
- Interactive equity curves
- Drawdown visualization
- Monte Carlo simulations
- Volume and signal strength charts
- Rolling metrics analysis

### 🚀 Core Functionality
- **Strategy Input**: Natural language strategy description
- **Backtesting**: Real-time backtest execution with agent pipeline
- **Performance Metrics**: Comprehensive performance analytics
- **Trade Analysis**: Detailed trade log with P&L tracking
- **Risk Analysis**: Monte Carlo simulation and risk decomposition
- **Deployment**: Paper trading automation

### 🎨 Interactive Components
- Live market data ticker
- Agent pipeline status monitoring
- Interactive chart toggles
- Real-time parameter adjustments
- Strategy iteration interface

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Interactive charting library
- **Lucide React** - Modern icon library
- **Framer Motion** - Smooth animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend Integration

The frontend is designed to connect to the IRIS backend API. Ensure the backend is running and accessible at the configured API URL.

## Component Structure

```
src/
├── components/
│   ├── Terminal/
│   │   ├── TopBar.tsx          # Market ticker and navigation
│   │   ├── LeftPanel.tsx       # Strategy input and controls
│   │   ├── CenterPanel.tsx     # Charts and visualizations
│   │   └── RightPanel.tsx      # Metrics and analysis
│   └── ui/                     # Reusable UI components
├── hooks/
│   └── useStrategy.ts          # Strategy management hook
├── api/
│   └── client.ts               # API client with typed endpoints
├── types/
│   └── index.ts                # TypeScript type definitions
└── utils.ts                    # Utility functions
```

## Key Features

### Strategy Development
- Natural language strategy input
- Parameter configuration (capital, commission, slippage)
- Expert benchmark selection
- Real-time backtest execution

### Performance Analytics
- Sharpe, Sortino, Calmar ratios
- Maximum drawdown analysis
- Win rate and volatility metrics
- Value at Risk (VaR) and Conditional VaR

### Risk Management
- Monte Carlo simulation (1,000+ paths)
- Risk decomposition analysis
- Market regime detection
- Portfolio optimization

### Visualization
- Interactive equity curves
- Drawdown charts
- Monte Carlo path visualization
- Trade execution analysis

## API Integration

The frontend connects to the IRIS backend through these main endpoints:

- `POST /api/strategy` - Submit strategy
- `POST /api/backtest/{run_id}` - Execute backtest
- `GET /api/tearsheet/{run_id}` - Get results
- `GET /api/status/{run_id}` - Agent pipeline status
- `POST /api/automate` - Deploy strategy

## Design Philosophy

### Bloomberg Terminal Aesthetic
- Professional dark theme optimized for extended viewing
- High contrast for readability
- Terminal-style animations and transitions
- Information-dense layout

### Real-Time Data
- No hardcoded or synthetic data
- Live market data integration
- Real-time backtest results
- Dynamic chart updates

### User Experience
- Intuitive workflow for strategy development
- Clear visual feedback
- Responsive interactions
- Professional trading interface

## Development

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component-based architecture

### Performance
- Optimized chart rendering
- Efficient data fetching
- Minimal re-renders
- Lazy loading where appropriate

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the IRIS quantitative trading platform.
