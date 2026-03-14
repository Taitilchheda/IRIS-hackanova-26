'use client'

import React, { useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useMarketData } from '@/hooks/useMarketData'
import { MarketData } from '@/types'

interface TopBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  'STRATEGY LAB',
  'PORTFOLIO', 
  'RISK DESK',
  'SIGNALS',
  'EXECUTION'
]

const defaultSymbols = ['AAPL', 'VIX', 'SPY', 'USD/JPY']

export function TopBar({ activeTab, onTabChange }: TopBarProps) {
  const { data: marketDataMap, loading } = useMarketData({ 
    symbols: defaultSymbols,
    enabled: true 
  })

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3" />
    if (change < 0) return <TrendingDown className="w-3 h-3" />
    return <Minus className="w-3 h-3" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green'
    if (change < 0) return 'text-red'
    return 'text-amber'
  }

  const formatMarketValue = (symbol: string, data: MarketData) => {
    switch (symbol) {
      case 'VIX':
        return data.price.toFixed(2)
      case 'SPY':
        return `${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%`
      case 'USD/JPY':
        return data.price.toFixed(2)
      default:
        return `$${data.price.toFixed(2)}`
    }
  }

  const marketStats = defaultSymbols.map(symbol => {
    const data = marketDataMap.get(symbol)
    if (!data) {
      // Fallback data for development
      return {
        symbol,
        value: symbol === 'VIX' ? '18.32' : symbol === 'SPY' ? '+0.84%' : symbol === 'USD/JPY' ? '148.92' : '$213.47',
        change: symbol === 'VIX' ? -0.15 : symbol === 'SPY' ? 0.84 : symbol === 'USD/JPY' ? 0.12 : 2.34,
        changePercent: symbol === 'VIX' ? -0.81 : symbol === 'SPY' ? 0.84 : symbol === 'USD/JPY' ? 0.08 : 1.11
      }
    }

    return {
      symbol,
      value: formatMarketValue(symbol, data),
      change: data.change,
      changePercent: data.changePercent
    }
  })

  return (
    <div className="h-[38px] bg-surface border-b border-border flex items-center px-4 gap-0 flex-shrink-0 relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-8">
        <div className="w-[6px] h-[6px] rounded-full bg-teal animate-pulse" />
        <span className="font-sans text-[15px] font-extrabold text-teal tracking-wider">
          IRIS
        </span>
      </div>

      {/* Tabs */}
      <div className="flex h-full">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`
              px-[18px] h-full flex items-center text-[10px] tracking-wider transition-all duration-150 relative
              ${activeTab === tab 
                ? 'text-teal' 
                : 'text-text2 hover:text-text hover:bg-teal/10'
              }
              border-r border-border
            `}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal" />
            )}
          </button>
        ))}
      </div>

      {/* Right side stats */}
      <div className="ml-auto flex items-center gap-4">
        {marketStats.map((stat) => (
          <React.Fragment key={stat.symbol}>
            <div className="flex items-center gap-[6px]">
              <span className="text-[10px] text-text3 tracking-wide">
                {stat.symbol}
              </span>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-medium ${getChangeColor(stat.change)}`}>
                  {loading ? '...' : stat.value}
                </span>
                {!loading && getChangeIcon(stat.change)}
              </div>
            </div>
            <div className="w-[1px] h-5 bg-border" />
          </React.Fragment>
        ))}
        
        <div className="text-[9px] px-2 py-1 rounded-sm border border-teal/25 text-teal tracking-wide">
          PAPER ACTIVE
        </div>
      </div>
    </div>
  )
}
