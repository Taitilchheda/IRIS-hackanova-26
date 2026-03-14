'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/Terminal/TopBar'
import { LeftPanel } from '@/components/Terminal/LeftPanel'
import { CenterPanel } from '@/components/Terminal/CenterPanel'
import { RightPanel } from '@/components/Terminal/RightPanel'
import { useStrategy } from '@/hooks/useStrategy'
import { cn } from '@/utils'

import { Sidebar } from '@/components/Terminal/Sidebar'

export default function Home() {
  const [activeTab, setActiveTab] = useState('STRATEGY LAB')
  const [activeDrawer, setActiveDrawer] = useState<string | null>('strategy')
  const [activeRight, setActiveRight] = useState<string | null>('metrics')
  const [selectedAsset, setSelectedAsset] = useState('AAPL')
  const { submitStrategy, deployStrategy, isLoading, currentResult, error } = useStrategy()

  const handleSearch = (symbol: string) => {
    setSelectedAsset(symbol)
    setActiveDrawer('strategy')
  }

  const handleRunStrategy = async (strategy: any) => {
    try {
      // payload is already normalized from LeftPanel
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
    <div className="w-full h-screen bg-[#07090F] flex flex-col overflow-hidden text-[#C8D8E8] font-sans">
      {/* Top Bar */}
      <div className="h-[44px] flex-shrink-0">
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSearch={handleSearch}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Icon Sidebar */}
        <Sidebar
          activeDrawer={activeDrawer}
          setActiveDrawer={setActiveDrawer}
          activeRight={activeRight}
          setActiveRight={setActiveRight}
        />

        {/* Workspace: Drawer + Chart + RightPanel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Drawer */}
          <div
            className={cn(
              "overflow-y-auto border-r border-[#1B2333]/30 bg-[#0C1018] transition-all duration-300 ease-in-out",
              activeDrawer ? "w-[300px]" : "w-0 border-r-0"
            )}
          >
            <div className="w-[300px] h-full">
              <LeftPanel
                activeSection={activeDrawer || 'strategy'}
                onRunStrategy={handleRunStrategy}
                isLoading={isLoading}
                asset={selectedAsset}
              />
            </div>
          </div>

          {/* Center Panel (Chart Zone) */}
          <div className="flex-1 overflow-hidden min-w-0">
            <CenterPanel
              isLoading={isLoading}
              viewMode={activeTab}
              equityData={currentResult?.trader?.equity_curve ? 
                currentResult.trader.equity_curve.map((val: number, idx: number) => ({
                  date: currentResult.trader.dates[idx] || '',
                  trader: val,
                  expert: currentResult.expert?.equity_curve?.[idx] || val,
                  spy: currentResult.benchmark_equity?.[idx] || (currentResult.trader.equity_curve[0] || 100000)
                })) : []
              }
              drawdownData={currentResult?.trader?.equity_curve ? 
                (() => {
                  let max = -Infinity;
                  return currentResult.trader.equity_curve.map((val: number, idx: number) => {
                    max = Math.max(max, val);
                    const dd = max > 0 ? (val - max) / max : 0;
                    return {
                      date: currentResult.trader.dates[idx] || '',
                      trader: Math.abs(dd) * 100,
                      expert: Math.abs(dd * 0.8) * 100 
                    };
                  });
                })() : []
              }
              mcPaths={currentResult?.paths || []}
            />
          </div>

          {/* Right Drawer */}
          <div 
            className={cn(
              "overflow-y-auto border-l border-[#1B2333]/30 bg-[#0C1018] transition-all duration-300 ease-in-out",
              activeRight ? "w-[300px]" : "w-0 border-l-0"
            )}
          >
            <div className="w-[300px]">
              <RightPanel 
                activeTab={activeRight || 'metrics'}
                metrics={currentResult?.trader_metrics}
                trades={currentResult?.trader?.trade_log || []}
                onDeployStrategy={handleDeployStrategy}
                isLoading={isLoading}
              />
            </div>
          </div>
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
