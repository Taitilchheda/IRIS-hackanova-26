export interface StrategyInput {
  description: string
  asset: string
  startDate: string
  endDate: string
  capital: number
  commission: number
  slippage: number
  maxPosition: number
  monteCarloPaths: number
}

export interface BacktestResult {
  id: string
  strategy: StrategyInput
  trader: PerformanceMetrics
  expert: PerformanceMetrics
  trades: Trade[]
  equityCurve: EquityPoint[]
  drawdown: DrawdownPoint[]
  status: 'running' | 'completed' | 'error'
}

export interface PerformanceMetrics {
  sharpe: number
  sortino: number
  calmar: number
  maxDrawdown: number
  cagr: number
  totalReturn: number
  winRate: number
  volatility: number
  var: number
  cvar: number
}

export interface Trade {
  date: string
  side: 'BUY' | 'SELL'
  price: number
  size: number
  pnl?: number
}

export interface EquityPoint {
  date: string
  trader: number
  expert: number
  spy: number
}

export interface DrawdownPoint {
  date: string
  trader: number
  expert: number
}

export interface AgentStatus {
  name: string
  status: 'idle' | 'running' | 'completed' | 'error'
  time?: string
  progress?: number
}

export interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
}
