'use client'

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { EquityPoint, DrawdownPoint } from '@/types'
import { cn } from '@/utils'

interface CenterPanelProps {
  equityData?: EquityPoint[]
  drawdownData?: DrawdownPoint[]
  volumeData?: any[]
  isLoading?: boolean
}

interface ToggleState {
  id: string
  label: string
  on: boolean
}

const chartTabs = [
  { id: 'equity', label: 'EQUITY CURVE', subLabel: 'TRADER vs EXPERT vs SPY' },
  { id: 'drawdown', label: 'DRAWDOWN', subLabel: 'PEAK-TO-TROUGH DECLINE' },
  { id: 'rolling', label: 'ROLLING METRICS', subLabel: '90-DAY ROLLING SHARPE' },
  { id: 'waterfall', label: 'P&L WATERFALL', subLabel: 'MONTHLY P&L ATTRIBUTION' }
]

const togglesConfig = [
  { id: 'trader', label: 'TRADER', defaultOn: true },
  { id: 'expert', label: 'EXPERT', defaultOn: true },
  { id: 'spy', label: 'SPY', defaultOn: true },
  { id: 'dd', label: 'DRAWDOWN FILL', defaultOn: false }
]

export function CenterPanel({ 
  equityData = [],
  drawdownData = [],
  volumeData = [],
  isLoading = false
}: CenterPanelProps) {
  const [activeTab, setActiveTab] = useState('equity')
  const [toggles, setToggles] = useState<ToggleState[]>(
    togglesConfig.map(t => ({ id: t.id, label: t.label, on: t.defaultOn }))
  )

  const handleToggle = (id: string) => {
    setToggles(prev => 
      prev.map(toggle => 
        toggle.id === id ? { ...toggle, on: !toggle.on } : toggle
      )
    )
  }

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-elevated border border-border2 p-2 text-[9px] text-text">
          <div className="text-text3 mb-1">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.dataKey.includes('Value') ? formatCurrency(entry.value) : formatPercent(entry.value)}
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data: activeTab === 'drawdown' ? drawdownData : equityData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    }

    switch (activeTab) {
      case 'equity':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3048" />
            <XAxis 
              dataKey="date" 
              stroke="#2e4a60" 
              fontSize={9}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
            />
            <YAxis 
              stroke="#2e4a60" 
              fontSize={9}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            {toggles.find(t => t.id === 'trader')?.on && (
              <Line 
                type="monotone" 
                dataKey="trader" 
                stroke="#00ffe0" 
                strokeWidth={1.5} 
                dot={false}
                name="Trader"
              />
            )}
            {toggles.find(t => t.id === 'expert')?.on && (
              <Line 
                type="monotone" 
                dataKey="expert" 
                stroke="#ffb800" 
                strokeWidth={1.5} 
                dot={false}
                name="Expert"
              />
            )}
            {toggles.find(t => t.id === 'spy')?.on && (
              <Line 
                type="monotone" 
                dataKey="spy" 
                stroke="#2e4a60" 
                strokeWidth={1} 
                dot={false}
                strokeDasharray="3 3"
                name="SPY"
              />
            )}
          </LineChart>
        )

      case 'drawdown':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3048" />
            <XAxis 
              dataKey="date" 
              stroke="#2e4a60" 
              fontSize={9}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
            />
            <YAxis 
              stroke="#2e4a60" 
              fontSize={9}
              tickFormatter={formatPercent}
              domain={[0, 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="trader"
              stroke="rgba(255,61,90,0.8)"
              fill="rgba(255,61,90,0.07)"
              strokeWidth={1}
              name="Trader DD"
            />
            <Area
              type="monotone"
              dataKey="expert"
              stroke="rgba(255,184,0,0.5)"
              fill="transparent"
              strokeWidth={1}
              name="Expert DD"
            />
          </AreaChart>
        )

      case 'rolling':
        return (
          <div className="flex items-center justify-center h-full text-text3">
            <div className="text-center">
              <div className="text-sm mb-2">Rolling Metrics</div>
              <div className="text-xs">90-day rolling Sharpe ratio analysis</div>
              <div className="text-xs mt-2 text-text2">Available after strategy execution</div>
            </div>
          </div>
        )

      case 'waterfall':
        return (
          <div className="flex items-center justify-center h-full text-text3">
            <div className="text-center">
              <div className="text-sm mb-2">P&L Waterfall</div>
              <div className="text-xs">Monthly P&L attribution analysis</div>
              <div className="text-xs mt-2 text-text2">Available after strategy execution</div>
            </div>
          </div>
        )

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3048" />
            <XAxis dataKey="date" stroke="#2e4a60" fontSize={9} />
            <YAxis stroke="#2e4a60" fontSize={9} />
            <Tooltip content={<CustomTooltip />} />
          </LineChart>
        )
    }
  }

  const currentTab = chartTabs.find(tab => tab.id === activeTab)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-panel">
      {/* Chart Tabs */}
      <div className="h-[32px] flex items-center px-4 border-b border-border bg-surface flex-shrink-0">
        <div className="flex h-full">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3.5 h-full flex items-center text-[9px] tracking-wider transition-all duration-150 border-r border-border",
                activeTab === tab.id
                  ? "text-teal"
                  : "text-text2 hover:text-text hover:bg-teal/10"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {toggles.map((toggle) => (
            <button
              key={toggle.id}
              onClick={() => handleToggle(toggle.id)}
              className={cn(
                "text-[8px] px-2 py-0.5 border transition-all duration-150",
                toggle.on
                  ? "border-teal2 text-teal bg-teal/10"
                  : "border-border2 text-text2 hover:border-teal2 hover:text-teal"
              )}
            >
              {toggle.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Area */}
      <div className="flex-1 grid grid-rows-[1fr_180px_120px] overflow-hidden gap-px bg-border">
        {/* Main Chart */}
        <div className="bg-panel relative overflow-hidden">
          <div className="absolute top-2 left-3 text-[9px] text-text2 tracking-wider z-10 pointer-events-none">
            {currentTab?.label} · <span className="text-teal font-medium">{currentTab?.subLabel}</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Drawdown Chart */}
        <div className="bg-panel relative overflow-hidden">
          <div className="absolute top-2 left-3 text-[9px] text-text2 tracking-wider z-10 pointer-events-none">
            DRAWDOWN <span className="text-red">█</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drawdownData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3048" />
              <XAxis dataKey="date" stroke="#2e4a60" fontSize={9} hide />
              <YAxis 
                stroke="#2e4a60" 
                fontSize={9}
                tickFormatter={formatPercent}
                domain={[0, 'dataMax']}
              />
              <Area
                type="monotone"
                dataKey="trader"
                stroke="rgba(255,61,90,0.8)"
                fill="rgba(255,61,90,0.07)"
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Volume/Signal Chart */}
        <div className="bg-panel relative overflow-hidden">
          <div className="absolute top-2 left-3 text-[9px] text-text2 tracking-wider z-10 pointer-events-none">
            VOLUME · <span className="text-text2">SIGNAL STRENGTH</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3048" />
              <XAxis dataKey="date" stroke="#2e4a60" fontSize={9} hide />
              <YAxis stroke="#2e4a60" fontSize={9} />
              <Bar 
                dataKey="signal" 
                fill="rgba(0,255,224,0.5)"
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
