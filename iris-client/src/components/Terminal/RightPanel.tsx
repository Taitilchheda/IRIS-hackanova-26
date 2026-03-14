'use client'

import React, { useState } from 'react'
import { PerformanceMetrics, Trade } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatPercent } from '@/utils'
import { cn } from '@/utils'

interface RightPanelProps {
  metrics?: PerformanceMetrics
  trades?: Trade[]
  onDeployStrategy?: (type: 'trader' | 'expert') => void
  isLoading?: boolean
}

const tabs = [
  { id: 'metrics', label: 'METRICS' },
  { id: 'analysis', label: 'ANALYSIS' },
  { id: 'trades', label: 'TRADES' },
  { id: 'iris', label: 'IRIS' }
]

// Sample metrics data
const defaultMetrics: PerformanceMetrics = {
  sharpe: 1.84,
  sortino: 2.31,
  calmar: 1.48,
  maxDrawdown: -12.3,
  cagr: 18.2,
  totalReturn: 91.4,
  winRate: 61.4,
  volatility: 14.2,
  var: -1.84,
  cvar: -2.91
}

// Sample trades data
const defaultTrades: Trade[] = [
  { date: '2019-01', side: 'BUY', price: 150.23, size: 100 },
  { date: '2019-02', side: 'SELL', price: 158.91, size: 100, pnl: 5.8 },
  { date: '2019-03', side: 'BUY', price: 162.45, size: 150 },
  { date: '2019-04', side: 'SELL', price: 171.12, size: 150, pnl: 5.3 },
  { date: '2019-05', side: 'BUY', price: 168.90, size: 120 },
  { date: '2019-06', side: 'SELL', price: 175.34, size: 120, pnl: 3.8 },
]

export function RightPanel({ 
  metrics = defaultMetrics, 
  trades = defaultTrades,
  onDeployStrategy,
  isLoading = false
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState('metrics')
  const [deployStatus, setDeployStatus] = useState<string | null>(null)

  const handleDeploy = (type: 'trader' | 'expert') => {
    onDeployStrategy?.(type)
    setDeployStatus(type === 'trader' 
      ? '✓ Your strategy deployed to paper trading.' 
      : '✓ Expert strategy deployed to paper trading.'
    )
    setTimeout(() => setDeployStatus(null), 5000)
  }

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green'
    if (value < 0) return 'text-red'
    return 'text-amber'
  }

  const getSideColor = (side: string) => {
    return side === 'BUY' ? 'text-teal' : 'text-red'
  }

  const getPnlColor = (pnl?: number) => {
    if (!pnl) return ''
    return pnl >= 0 ? 'text-green' : 'text-red'
  }

  const renderMetricsTab = () => (
    <div className="space-y-3">
      {/* Performance KPIs */}
      <div>
        <div className="text-[8px] tracking-wider text-text3 mb-2 pb-1 border-b border-border">
          PERFORMANCE · YOUR STRATEGY
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">SHARPE</div>
            <div className="text-[16px] font-bold leading-none text-green">{metrics.sharpe.toFixed(2)}</div>
            <div className="text-[8px] text-amber mt-0.5">−0.37 vs expert</div>
          </div>
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">MAX DD</div>
            <div className="text-[16px] font-bold leading-none text-red">{formatPercent(metrics.maxDrawdown)}</div>
            <div className="text-[8px] text-red mt-0.5">−4.2pp vs expert</div>
          </div>
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">WIN RATE</div>
            <div className="text-[16px] font-bold leading-none text-green">{metrics.winRate.toFixed(1)}%</div>
            <div className="text-[8px] text-amber mt-0.5">47 trades</div>
          </div>
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">CAGR</div>
            <div className="text-[16px] font-bold leading-none text-green">{formatPercent(metrics.cagr)}</div>
            <div className="text-[8px] text-amber mt-0.5">vs 11.4% SPY</div>
          </div>
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">SORTINO</div>
            <div className="text-[16px] font-bold leading-none text-green">{metrics.sortino.toFixed(2)}</div>
            <div className="text-[8px] text-green mt-0.5">+0.11 vs SPY</div>
          </div>
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">CALMAR</div>
            <div className="text-[16px] font-bold leading-none text-green">{metrics.calmar.toFixed(2)}</div>
            <div className="text-[8px] text-amber mt-0.5">good</div>
          </div>
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">TOTAL RETURN</div>
            <div className="text-[16px] font-bold leading-none text-green">{formatPercent(metrics.totalReturn)}</div>
            <div className="text-[8px] text-text mt-0.5">$91,400</div>
          </div>
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">VOLATILITY</div>
            <div className="text-[16px] font-bold leading-none text-amber">{formatPercent(metrics.volatility)}</div>
            <div className="text-[8px] text-text3 mt-0.5">annualised</div>
          </div>
        </div>
      </div>

      {/* Monte Carlo Section */}
      <div>
        <div className="text-[8px] tracking-wider text-text3 mb-2 pb-1 border-b border-border">
          MONTE CARLO · 1,000 PATHS
        </div>
        <div className="h-[120px] bg-elevated border border-border rounded-sm mb-2 flex items-center justify-center">
          <div className="text-text3 text-[10px]">Monte Carlo Visualization</div>
        </div>
        <div className="grid grid-cols-3 gap-1 mb-3">
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">P5</div>
            <div className="text-[12px] font-bold leading-none text-red">$71.2k</div>
          </div>
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">MEDIAN</div>
            <div className="text-[12px] font-bold leading-none text-green">$191k</div>
          </div>
          <div className="bg-elevated border border-border rounded-sm p-2">
            <div className="text-[8px] text-text3 tracking-wide mb-0.5">P95</div>
            <div className="text-[12px] font-bold leading-none text-green">$318k</div>
          </div>
        </div>
      </div>

      {/* Risk Decomposition */}
      <div>
        <div className="text-[8px] tracking-wider text-text3 mb-2 pb-1 border-b border-border">
          RISK DECOMPOSITION
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="text-[8px] text-text2 w-[60px]">Market β</div>
            <div className="flex-1 h-1 bg-elevated rounded-sm overflow-hidden">
              <div className="h-full bg-blue" style={{ width: '65%' }} />
            </div>
            <div className="text-[8px] text-text w-[30px] text-right">0.64</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="text-[8px] text-text2 w-[60px]">Idiosync.</div>
            <div className="flex-1 h-1 bg-elevated rounded-sm overflow-hidden">
              <div className="h-full bg-purple" style={{ width: '25%' }} />
            </div>
            <div className="text-[8px] text-text w-[30px] text-right">24.8%</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="text-[8px] text-text2 w-[60px]">Vol Regime</div>
            <div className="flex-1 h-1 bg-elevated rounded-sm overflow-hidden">
              <div className="h-full bg-amber" style={{ width: '40%' }} />
            </div>
            <div className="text-[8px] text-text w-[30px] text-right">Med</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="text-[8px] text-text2 w-[60px]">Tail Risk</div>
            <div className="flex-1 h-1 bg-elevated rounded-sm overflow-hidden">
              <div className="h-full bg-red" style={{ width: '15%' }} />
            </div>
            <div className="text-[8px] text-text w-[30px] text-right">Low</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTradesTab = () => (
    <div>
      <div className="text-[8px] tracking-wider text-text3 mb-2 pb-1 border-b border-border">
        TRADE LOG · {trades.length} TRADES
      </div>
      <div className="space-y-0.5">
        <div className="grid grid-cols-[60px_40px_70px_60px_50px] gap-1 p-1 text-[8px] text-text3 tracking-wide border-b border-border">
          <div>DATE</div>
          <div>SIDE</div>
          <div>PRICE</div>
          <div>SIZE</div>
          <div>P&L</div>
        </div>
        <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
          {trades.map((trade, index) => (
            <div key={index} className="grid grid-cols-[60px_40px_70px_60px_50px] gap-1 p-1 text-[8px] border-b border-border/50 hover:bg-elevated transition-colors">
              <div>{trade.date}</div>
              <div className={getSideColor(trade.side)}>{trade.side}</div>
              <div>${trade.price.toFixed(2)}</div>
              <div>{trade.size}</div>
              <div className={getPnlColor(trade.pnl)}>
                {trade.pnl ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(1)}%` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderIrisTab = () => (
    <div className="space-y-3">
      <div>
        <div className="text-[8px] tracking-wider text-text3 mb-2 pb-1 border-b border-border">
          IRIS ANALYSIS
        </div>
        <div className="text-[10px] text-text2 leading-relaxed border-l-2 border-teal p-2 bg-teal/10 mb-3">
          Your MA crossover returned <span className="text-teal font-medium">+91.4% (CAGR 18.2%, Sharpe 1.84)</span> — solid alpha vs SPY&apos;s 11.4%. The Risk Analysis expert outperformed by <span className="text-teal font-medium">+22pp</span> using GARCH-adjusted position sizing. Key edge: dynamic vol-scaled exposure cut drawdown from −12.3% to −8.1%. <span className="text-teal font-medium">Recommendation: automate the expert strategy.</span>
        </div>
      </div>

      <div>
        <div className="text-[8px] tracking-wider text-text3 mb-2 pb-1 border-b border-border">
          STRATEGY PARSE
        </div>
        <div className="bg-elevated border border-border p-2 text-[9px] text-text2 leading-relaxed mb-3">
          <div className="text-teal mb-1">PARSED RULES</div>
          <div>ENTRY: SMA(50) crosses_above SMA(200)</div>
          <div>EXIT:  RSI(14) &gt; 70</div>
          <div>EXIT:  position_pnl &lt; -5%</div>
          <div className="mt-1.5 text-text3">ASSET: AAPL · TYPE: ALPHA/SIGNAL</div>
          <div className="text-text3">CONFIDENCE: <span className="text-green">97.3%</span></div>
        </div>
      </div>

      <div>
        <div className="text-[8px] tracking-wider text-text3 mb-2 pb-1 border-b border-border">
          ITERATE STRATEGY
        </div>
        <Textarea
          placeholder="Ask IRIS: 'What if I tighten the stop to 3%?' or 'Add a momentum filter...'"
          className="h-[60px] text-[9px] mb-1.5"
        />
        <Button className="w-full py-1.5 text-[9px] border border-teal2 text-teal bg-elevated hover:bg-teal/10">
          ITERATE ↗
        </Button>
      </div>

      <div>
        <div className="text-[8px] tracking-wider text-text3 mb-2 pb-1 border-b border-border">
          DEPLOY
        </div>
        <div className="flex gap-1.5">
          <Button 
            onClick={() => handleDeploy('trader')}
            className="flex-1 py-1.5 text-[9px] bg-teal text-void hover:bg-teal2"
          >
            AUTOMATE MINE
          </Button>
          <Button 
            onClick={() => handleDeploy('expert')}
            className="flex-1 py-1.5 text-[9px] border border-amber/30 text-amber bg-transparent hover:bg-amber/10"
          >
            AUTOMATE EXPERT
          </Button>
        </div>
        {deployStatus && (
          <div className="mt-2 text-[9px] text-green animate-slide-up">
            {deployStatus}
          </div>
        )}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'metrics':
        return renderMetricsTab()
      case 'trades':
        return renderTradesTab()
      case 'iris':
        return renderIrisTab()
      default:
        return <div className="text-text2 text-center py-8">Analysis tab coming soon...</div>
    }
  }

  return (
    <div className="w-[300px] border-l border-border bg-surface flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="h-[32px] flex border-b border-border flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center text-[9px] tracking-wider transition-all duration-150 border-r border-border last:border-r-0",
              activeTab === tab.id
                ? "text-teal bg-teal/10"
                : "text-text2 hover:text-text hover:bg-elevated"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {renderContent()}
      </div>
    </div>
  )
}
