'use client'

import React, { useState, useRef, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { EquityPoint, DrawdownPoint } from '@/types'
import { cn } from '@/utils'

interface InteractiveChartProps {
  data: EquityPoint[] | DrawdownPoint[]
  type: 'equity' | 'drawdown' | 'volume'
  height?: number
  showGrid?: boolean
  showTooltip?: boolean
  className?: string
  onCrosshairMove?: (data: any) => void
}

export function InteractiveChart({ 
  data, 
  type, 
  height = 300, 
  showGrid = true,
  showTooltip = true,
  className,
  onCrosshairMove
}: InteractiveChartProps) {
  const [crosshairData, setCrosshairData] = useState<any>(null)
  const [isHovering, setIsHovering] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (data: any) => {
    if (data && data.activePayload) {
      setCrosshairData(data.activePayload[0])
      onCrosshairMove?.(data.activePayload[0])
    }
  }

  const handleMouseLeave = () => {
    setCrosshairData(null)
    setIsHovering(false)
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && showTooltip) {
      return (
        <div className="bg-elevated border border-border2 p-3 rounded-sm shadow-lg">
          <div className="text-text3 text-xs mb-2">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-text2">{entry.name}:</span>
              <span className="text-text font-mono">
                {type === 'drawdown' ? formatPercent(entry.value) : formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      onMouseEnter: handleMouseEnter
    }

    if (type === 'drawdown') {
      return (
        <AreaChart {...commonProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1a3048" />}
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
            strokeWidth={1.5}
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
    }

    return (
      <LineChart {...commonProps}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1a3048" />}
        <XAxis 
          dataKey="date" 
          stroke="#2e4a60" 
          fontSize={9}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
        />
        <YAxis 
          stroke="#2e4a60" 
          fontSize={9}
          tickFormatter={type === 'volume' ? undefined : formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {(data as EquityPoint[])[0]?.trader && (
          <Line 
            type="monotone" 
            dataKey="trader" 
            stroke="#00ffe0" 
            strokeWidth={1.5} 
            dot={false}
            name="Trader"
            animationDuration={1000}
          />
        )}
        
        {(data as EquityPoint[])[0]?.expert && (
          <Line 
            type="monotone" 
            dataKey="expert" 
            stroke="#ffb800" 
            strokeWidth={1.5} 
            dot={false}
            name="Expert"
            animationDuration={1200}
          />
        )}
        
        {(data as EquityPoint[])[0]?.spy && (
          <Line 
            type="monotone" 
            dataKey="spy" 
            stroke="#2e4a60" 
            strokeWidth={1} 
            dot={false}
            strokeDasharray="3 3"
            name="SPY"
            animationDuration={1400}
          />
        )}
      </LineChart>
    )
  }

  return (
    <div 
      ref={chartRef}
      className={cn(
        'relative w-full transition-all duration-200',
        isHovering && 'z-10',
        className
      )}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
      
      {/* Crosshair overlay */}
      {isHovering && crosshairData && (
        <div 
          className="absolute top-0 right-0 bg-elevated border border-border2 p-2 text-xs rounded-sm pointer-events-none z-20"
          style={{ transform: 'translateY(-100%)' }}
        >
          <div className="text-text3 mb-1">
            {new Date(crosshairData.payload.date).toLocaleDateString()}
          </div>
          <div className="space-y-1">
            {Object.keys(crosshairData.payload)
              .filter((key) => key !== 'date')
              .map((key) => {
                const value = crosshairData.payload[key as keyof typeof crosshairData.payload]
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-text2 capitalize">{key}:</span>
                    <span className="text-text font-mono">
                      {type === 'drawdown' ? formatPercent(value as number) : formatCurrency(value as number)}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
