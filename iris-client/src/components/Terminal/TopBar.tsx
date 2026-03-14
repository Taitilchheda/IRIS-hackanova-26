'use client'

import React, { useState } from 'react'
import { Search, Command, HelpCircle, Power } from 'lucide-react'
import { useMarketData } from '@/hooks/useMarketData'
import { MarketData } from '@/types'

interface TopBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onSearch?: (symbol: string) => void
}

const functionKeys = [
  { label: 'LAB', key: '1<GO>', tab: 'STRATEGY LAB' },
  { label: 'PORT', key: '2<GO>', tab: 'PORTFOLIO' }, 
  { label: 'RISK', key: '3<GO>', tab: 'RISK DESK' },
  { label: 'EXEC', key: '4<GO>', tab: 'EXECUTION' }
]

const defaultSymbols = ['AAPL', 'VIX', 'SPY', 'USD/JPY']

export function TopBar({ activeTab, onTabChange }: TopBarProps) {
  const [command, setCommand] = useState('')
  const { data: marketDataMap, loading } = useMarketData({ 
    symbols: defaultSymbols,
    enabled: true 
  })

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green'
    if (change < 0) return 'text-red'
    return 'text-amber'
  }

  const formatMarketValue = (symbol: string, data: MarketData) => {
    if (!data) return '...'
    const price = data.price ?? 0
    return price.toFixed(2)
  }

  return (
    <div className="h-[32px] bg-black border-b border-border flex items-center px-2 gap-0 flex-shrink-0 relative z-50">
      {/* Left: Terminal Info */}
      <div className="flex items-center gap-4 mr-6">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-bold text-orange tracking-tighter">IRIS</span>
          <div className="w-[1px] h-4 bg-border2" />
          <span className="text-[9px] text-amber font-bold">TERMINAL</span>
        </div>
      </div>

      {/* Center: Command Bar */}
      <div className="flex-1 flex items-center h-[24px] bg-[#0c0c0c] border border-border2 px-2 gap-2 relative group hover:border-orange transition-colors">
        <Search className="w-3 h-3 text-amber" />
        <input 
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && command.trim()) {
              if (onSearch) onSearch(command.trim())
              onTabChange('STRATEGY LAB')
              setCommand('')
            }
          }}
          placeholder="ENTER COMMAND OR TICKER..."
          className="bg-transparent border-none outline-none text-[10px] text-amber w-full placeholder:text-text3 font-bold"
        />
        <div className="flex items-center gap-1">
          <kbd className="text-[8px] px-1 bg-border2 text-text2 rounded-[1px]">F12</kbd>
          <kbd className="text-[8px] px-1 bg-orange/20 text-orange rounded-[1px] font-bold">HELP</kbd>
        </div>
      </div>

      {/* Right: Function Keys as Navigation */}
      <div className="flex h-full ml-4 border-l border-border">
        {functionKeys.map((fk) => (
          <button
            key={fk.tab}
            onClick={() => onTabChange(fk.tab)}
            className={`
              px-3 h-full flex flex-col justify-center items-center text-[8px] transition-all relative min-w-[60px]
              ${activeTab === fk.tab 
                ? 'bg-amber/10 text-amber' 
                : 'text-text2 hover:bg-elevated hover:text-text'
              }
              border-r border-border
            `}
          >
            <span className="font-bold tracking-widest">{fk.label}</span>
            <span className={`text-[7px] ${activeTab === fk.tab ? 'text-orange' : 'text-text3'}`}>{fk.key}</span>
          </button>
        ))}
      </div>

      {/* Market Ticker */}
      <div className="flex items-center gap-4 px-4 bg-[#0a0a0a] border-l border-border h-full text-[9px]">
        {defaultSymbols.slice(0, 3).map(symbol => {
          const data = marketDataMap.get(symbol)
          return (
            <div key={symbol} className="flex items-center gap-2">
              <span className="text-text3">{symbol}</span>
              <span className={`font-bold ${data ? getChangeColor(data.change) : 'text-text3'}`}>
                {formatMarketValue(symbol, data as MarketData)}
              </span>
            </div>
          )
        })}
        <div className="flex items-center gap-1 ml-2 text-orange animate-pulse">
          <Power className="w-2.5 h-2.5" />
          <span className="font-bold text-[8px]">LIVE</span>
        </div>
      </div>
    </div>
  )
}
