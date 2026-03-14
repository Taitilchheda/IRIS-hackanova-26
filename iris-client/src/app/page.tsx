'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/Terminal/TopBar'
import { LeftPanel } from '@/components/Terminal/LeftPanel'
import { CenterPanel } from '@/components/Terminal/CenterPanel'
import { RightPanel } from '@/components/Terminal/RightPanel'
import { useStrategy } from '@/hooks/useStrategy'

export default function Home() {
  const [activeTab, setActiveTab] = useState('STRATEGY LAB')
  const { submitStrategy, deployStrategy, isLoading, currentResult, error } = useStrategy()

  const handleRunStrategy = async (strategy: any) => {
    try {
      await submitStrategy(strategy)
    } catch (err) {
      console.error('Strategy execution failed:', err)
    }
  }

  const handleDeployStrategy = (type: 'trader' | 'expert') => {
    if (currentResult) {
      deployStrategy(currentResult.run_id, type === 'expert')
    }
  }

  return (
    <div className="w-full h-screen bg-void flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 flex-shrink-0">
        <TopBar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-[280px_1fr_300px] overflow-hidden">
        {/* Left Panel */}
        <div className="overflow-y-auto border-r border-border">
          <LeftPanel 
            onRunStrategy={handleRunStrategy}
            isLoading={isLoading}
          />
        </div>

        {/* Center Panel */}
        <div className="overflow-y-auto">
          <CenterPanel 
            isLoading={isLoading}
            equityData={currentResult?.trader?.equity_curve ? 
              currentResult.trader.equity_curve.map((val: number, idx: number) => ({
                date: currentResult.trader.dates[idx] || '',
                trader: val,
                expert: currentResult.expert?.equity_curve?.[idx] || val,
                spy: val * 0.95
              })) : []
            }
            drawdownData={currentResult?.trader?.equity_curve ? 
              currentResult.trader.equity_curve.map((val: number, idx: number) => ({
                date: currentResult.trader.dates[idx] || '',
                trader: 0,
                expert: 0
              })) : []
            }
          />
        </div>

        {/* Right Panel */}
        <div className="overflow-y-auto border-l border-border">
          <RightPanel 
            metrics={currentResult?.trader_metrics}
            trades={currentResult?.trader?.trade_log || []}
            onDeployStrategy={handleDeployStrategy}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red/10 border border-red/30 text-red p-3 rounded-sm max-w-md animate-slide-up">
          <div className="text-sm font-medium mb-1">Error</div>
          <div className="text-xs">{error}</div>
        </div>
      )}
    </div>
  )
}
