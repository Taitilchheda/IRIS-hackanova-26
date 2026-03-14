'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RangeSlider } from '@/components/ui/range-slider'
import { StrategyInput } from '@/types'
import { cn } from '@/utils'

interface LeftPanelProps {
  onRunStrategy: (strategy: StrategyInput) => void
  isLoading?: boolean
}

const algorithms = [
  { id: 'risk', name: 'Risk Analysis', tag: 'MONTE CARLO', color: 'red' },
  { id: 'alpha', name: 'Alpha / Signal', tag: 'KALMAN', color: 'teal' },
  { id: 'port', name: 'Portfolio Const.', tag: 'BLACK-LITTERMAN', color: 'blue' },
  { id: 'deriv', name: 'Derivatives', tag: 'BLACK-SCHOLES', color: 'amber' },
  { id: 'micro', name: 'Microstructure', tag: 'HMM + VWAP', color: 'teal' },
  { id: 'fi', name: 'Fixed Income', tag: 'VASICEK', color: 'blue' }
]

const assets = [
  'AAPL', 'SPY', 'MSFT', 'TSLA', 'GS', 'JPM', 'QQQ', 'BTC-USD'
]

const agentPipeline = [
  { name: 'Manager Agent', time: '0.3s', status: 'completed' },
  { name: 'Trader Strategy', time: '1.2s', status: 'completed' },
  { name: 'Risk Analysis', time: '0.9s', status: 'completed' },
  { name: 'Verifier', time: '0.1s', status: 'completed' },
  { name: 'Comparator', time: '0.2s', status: 'completed' }
]

export function LeftPanel({ onRunStrategy, isLoading = false }: LeftPanelProps) {
  const [strategy, setStrategy] = useState('')
  const [selectedAlgo, setSelectedAlgo] = useState('risk')
  const [parameters, setParameters] = useState({
    asset: 'AAPL',
    startDate: '2019-01-01',
    endDate: '2024-12-31',
    capital: 100000,
    commission: 10,
    slippage: 5,
    maxPosition: 100,
    monteCarloPaths: 1000
  })

  const handleRun = () => {
    const strategyInput: StrategyInput = {
      description: strategy,
      ...parameters
    }
    onRunStrategy(strategyInput)
  }

  const loadExample = () => {
    setStrategy('Long AAPL when 50d MA > 200d MA. Short when RSI(14) > 70 or price drops 5%. Kelly-size positions based on recent volatility.')
  }

  const getTagColor = (color: string) => {
    const colors = {
      red: 'bg-red/10 text-red border-red/20',
      teal: 'bg-teal/10 text-teal border-teal/20',
      blue: 'bg-blue/10 text-blue border-blue/20',
      amber: 'bg-amber/10 text-amber border-amber/20'
    }
    return colors[color as keyof typeof colors] || colors.teal
  }

  const getStatusDot = (status: string) => {
    const statusColors = {
      completed: 'bg-green',
      running: 'bg-teal animate-pulse',
      idle: 'bg-text3',
      error: 'bg-red'
    }
    return statusColors[status as keyof typeof statusColors] || statusColors.idle
  }

  const getStatusText = (status: string) => {
    const statusTexts = {
      completed: 'DONE',
      running: 'RUN',
      idle: 'WAIT',
      error: 'ERR'
    }
    return statusTexts[status as keyof typeof statusTexts] || statusTexts.idle
  }

  return (
    <div className="w-[280px] border-r border-border bg-surface flex flex-col overflow-hidden">
      {/* Strategy Input */}
      <div className="border-b border-border p-[12px_14px]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[9px] tracking-wider text-text3">STRATEGY INPUT</span>
          <button 
            onClick={loadExample}
            className="text-[8px] px-1.5 py-0.5 border border-border2 text-text2 hover:border-teal2 hover:text-teal transition-colors rounded-sm"
          >
            EXAMPLE
          </button>
        </div>
        <Textarea
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          placeholder="Describe strategy in plain English..."
          className="h-[90px] text-[10px]"
        />
      </div>

      {/* Universe & Period */}
      <div className="border-b border-border p-[12px_14px]">
        <div className="text-[9px] tracking-wider text-text3 mb-2.5">UNIVERSE & PERIOD</div>
        
        <div className="mb-2">
          <div className="text-[9px] text-text2 tracking-wide mb-1">ASSET</div>
          <Select
            value={parameters.asset}
            onChange={(e) => setParameters(prev => ({ ...prev, asset: e.target.value }))}
          >
            {assets.map(asset => (
              <option key={asset} value={asset}>{asset}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <div className="text-[9px] text-text2 tracking-wide mb-1">FROM</div>
            <Input
              type="date"
              value={parameters.startDate}
              onChange={(e) => setParameters(prev => ({ ...prev, startDate: e.target.value }))}
              className="text-[10px] h-8"
            />
          </div>
          <div>
            <div className="text-[9px] text-text2 tracking-wide mb-1">TO</div>
            <Input
              type="date"
              value={parameters.endDate}
              onChange={(e) => setParameters(prev => ({ ...prev, endDate: e.target.value }))}
              className="text-[10px] h-8"
            />
          </div>
        </div>
      </div>

      {/* Parameters */}
      <div className="border-b border-border p-[12px_14px]">
        <div className="text-[9px] tracking-wider text-text3 mb-2.5">PARAMETERS</div>
        
        <div className="space-y-3">
          <RangeSlider
            title="CAPITAL"
            min={10000}
            max={1000000}
            step={10000}
            value={parameters.capital}
            onValueChange={(value) => setParameters(prev => ({ ...prev, capital: value }))}
            displayValue={`$${parameters.capital.toLocaleString('en-US')}`}
          />

          <RangeSlider
            title="COMMISSION bps"
            min={0}
            max={50}
            step={1}
            value={parameters.commission}
            onValueChange={(value) => setParameters(prev => ({ ...prev, commission: value }))}
            displayValue={`${parameters.commission} bps`}
          />

          <RangeSlider
            title="SLIPPAGE bps"
            min={0}
            max={30}
            step={1}
            value={parameters.slippage}
            onValueChange={(value) => setParameters(prev => ({ ...prev, slippage: value }))}
            displayValue={`${parameters.slippage} bps`}
          />

          <RangeSlider
            title="MAX POSITION %"
            min={10}
            max={100}
            step={5}
            value={parameters.maxPosition}
            onValueChange={(value) => setParameters(prev => ({ ...prev, maxPosition: value }))}
            displayValue={`${parameters.maxPosition}%`}
          />

          <RangeSlider
            title="MONTE CARLO PATHS"
            min={100}
            max={10000}
            step={100}
            value={parameters.monteCarloPaths}
            onValueChange={(value) => setParameters(prev => ({ ...prev, monteCarloPaths: value }))}
            displayValue={parameters.monteCarloPaths.toLocaleString('en-US')}
          />
        </div>
      </div>

      {/* Expert Benchmark */}
      <div className="border-b border-border p-[12px_14px]">
        <div className="text-[9px] tracking-wider text-text3 mb-2.5">EXPERT BENCHMARK</div>
        
        <div className="space-y-1 mb-2">
          {algorithms.map((algo) => (
            <button
              key={algo.id}
              onClick={() => setSelectedAlgo(algo.id)}
              className={cn(
                "w-full flex items-center justify-between p-1.5 border rounded-sm transition-all",
                selectedAlgo === algo.id
                  ? "border-teal bg-teal/10"
                  : "border-border hover:border-teal2"
              )}
            >
              <span className="text-[9px] text-text tracking-wide">{algo.name}</span>
              <span className={cn("text-[8px] px-1 py-0.5 rounded-sm border", getTagColor(algo.color))}>
                {algo.tag}
              </span>
            </button>
          ))}
        </div>

        <Button
          onClick={handleRun}
          disabled={isLoading || !strategy.trim()}
          className="w-full py-2 text-[10px] font-bold tracking-wider mt-2"
        >
          {isLoading ? 'RUNNING...' : '▶ RUN IRIS'}
        </Button>
      </div>

      {/* Agent Pipeline */}
      <div className="flex-1 overflow-hidden flex flex-col p-[12px_14px]">
        <div className="text-[9px] tracking-wider text-text3 mb-2.5">AGENT PIPELINE</div>
        
        <div className="flex-1 overflow-y-auto space-y-0.5 max-h-[180px]">
          {agentPipeline.map((agent, index) => (
            <div key={agent.name} className="flex items-center gap-2 p-1 rounded-sm transition-all">
              <div className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${getStatusDot(agent.status)}`} />
              <span className="text-[9px] text-text2 flex-1 tracking-wide">{agent.name}</span>
              <span className="text-[8px] text-text3">{agent.time}</span>
              <span className="text-[8px] px-1 py-0.5 rounded-sm bg-teal/10 text-teal">
                {getStatusText(agent.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
