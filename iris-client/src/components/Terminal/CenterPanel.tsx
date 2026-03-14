'use client'

import React, { useState } from 'react'
import { EquityPoint, DrawdownPoint } from '@/types'
import { cn } from '@/utils'
import { InteractiveChart } from './InteractiveChart'
import { Maximize2, Settings2, Share2, Layers } from 'lucide-react'

interface CenterPanelProps {
  equityData?: EquityPoint[]
  drawdownData?: DrawdownPoint[]
  mcPaths?: number[][]
  isLoading?: boolean
  viewMode?: string
}

const chartTabs = [
  { id: 'equity', label: '11 GP', subLabel: 'EQUITY CURVE' },
  { id: 'drawdown', label: '12 DD', subLabel: 'DRAWDOWN' },
  { id: 'montecarlo', label: '13 MC', subLabel: 'MONTE CARLO' },
  { id: 'rolling', label: '14 RS', subLabel: 'ROLLING SHARPE' },
]

export function CenterPanel({ 
  equityData = [],
  drawdownData = [],
  mcPaths = [],
  isLoading = false,
  viewMode = 'STRATEGY LAB'
}: CenterPanelProps) {
  const [activeTab, setActiveTab ] = useState('equity')
  const [showTrader, setShowTrader] = useState(true)
  const [showExpert, setShowExpert] = useState(true)
  const [showSpy, setShowSpy] = useState(true)

  const currentTab = chartTabs.find(tab => tab.id === activeTab)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#07090F]">
      {/* Bloomberg Sub-Header */}
      <div className="h-[36px] flex items-center px-4 bg-[#0C1018] border-b border-[#1B2333]/30 flex-shrink-0">
        <div className="flex h-full">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 h-full flex items-center transition-all text-[11px] font-bold border-r border-[#1B2333]/30",
                activeTab === tab.id
                  ? "bg-[#00E5C3]/10 text-[#00E5C3] border-b-2 border-b-[#00E5C3]"
                  : "text-[#4A6070] hover:text-[#C8D8E8]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {[
            { id: 'trader', label: 'Trader', state: showTrader, set: setShowTrader, color: 'bg-[#00E5C3]' },
            { id: 'expert', label: 'Expert', state: showExpert, set: setShowExpert, color: 'bg-[#F0A500]' },
            { id: 'spy', label: 'SPY', state: showSpy, set: setShowSpy, color: 'bg-[#2E4A60]' },
          ].map(btn => (
             <button
              key={btn.id}
              onClick={() => btn.set(!btn.state)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded transition-all border text-[9px] font-bold",
                btn.state 
                  ? "border-[#1B2333] bg-[#141B26] text-[#C8D8E8]" 
                  : "border-transparent text-[#4A6070]"
              )}
            >
              <div className={cn("w-2 h-0.5 rounded-full", btn.state ? btn.color : "bg-[#263040]")} />
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Display */}
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        {viewMode === 'PORTFOLIO' ? (
           <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="bg-[#0C1018] border border-[#1B2333]/30 rounded-lg p-6 flex flex-col items-center justify-center">
                 <div className="text-[10px] font-bold text-[#4A6070] uppercase mb-4">Current Allocation</div>
                 <div className="w-32 h-32 rounded-full border-4 border-[#00E5C3] border-t-transparent animate-spin-slow" />
                 <div className="mt-4 text-[11px] text-[#C8D8E8]">Optimizing Weights...</div>
              </div>
              <div className="bg-[#0C1018] border border-[#1B2333]/30 rounded-lg p-4">
                 <div className="text-[10px] font-bold text-[#4A6070] uppercase mb-4">Risk Contribution</div>
                 <div className="space-y-3">
                    {['AAPL', 'SPY', 'USD/JPY'].map(s => (
                       <div key={s} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[9px] font-bold uppercase">
                             <span>{s}</span>
                             <span>33%</span>
                          </div>
                          <div className="w-full h-1 bg-[#141B26] rounded-full overflow-hidden">
                             <div className="h-full bg-[#00E5C3] w-[33%]" />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        ) : viewMode === 'RISK DESK' ? (
           <div className="flex-1 flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                 {[
                   { l: 'VaR (95%)', v: '-2.4%' },
                   { l: 'Expected Shortfall', v: '-3.1%' },
                   { l: 'Stress Delta', v: '0.14' }
                 ].map(i => (
                    <div key={i.l} className="bg-[#0C1018] border border-[#1B2333]/30 rounded-lg p-3 text-center">
                       <div className="text-[8px] font-bold text-[#4A6070] uppercase mb-1">{i.l}</div>
                       <div className="text-xl font-bold text-red tabular-nums">{i.v}</div>
                    </div>
                 ))}
              </div>
              <div className="flex-1 bg-[#0C1018] border border-[#1B2333]/30 rounded-lg relative">
                 <div className="absolute top-3 left-4 text-[9px] font-bold text-[#4A6070] uppercase">Stress Test Surface</div>
                 <div className="w-full h-full flex items-center justify-center opacity-30">
                    <Layers size={40} className="text-[#00E5C3]" />
                 </div>
              </div>
           </div>
        ) : viewMode === 'EXECUTION' ? (
           <div className="flex-1 flex flex-col gap-3">
              <div className="bg-[#0C1018] border border-[#1B2333]/30 rounded-lg p-3 flex flex-col flex-1">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-[#4A6070] uppercase">Active Execution Blotter</span>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-[#1ED98A] animate-pulse" />
                       <span className="text-[9px] text-[#C8D8E8] font-bold">ALGO: RUNNING</span>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="text-[9px] text-[#4A6070] border-b border-[#1B2333]/30 uppercase font-bold">
                             <th className="pb-2">Time</th>
                             <th className="pb-2">Asset</th>
                             <th className="pb-2">Side</th>
                             <th className="pb-2">Size</th>
                             <th className="pb-2">Price</th>
                             <th className="pb-2">Status</th>
                          </tr>
                       </thead>
                       <tbody className="text-[10px] font-medium text-[#C8D8E8]">
                          {[
                            { t: '16:04:12', a: 'AAPL', s: 'BUY', z: '100', p: '192.42', st: 'FILLED' },
                            { t: '16:04:15', a: 'AAPL', s: 'SELL', z: '50', p: '192.51', st: 'PENDING' },
                          ].map((row, i) => (
                             <tr key={i} className="border-b border-[#1B2333]/10 hover:bg-[#141B26]/50 transition-colors">
                                <td className="py-2 text-[#4A6070]">{row.t}</td>
                                <td className="py-2 font-bold">{row.a}</td>
                                <td className={`py-2 font-bold ${row.s === 'BUY' ? 'text-[#1ED98A]' : 'text-red'}`}>{row.s}</td>
                                <td className="py-2">{row.z}</td>
                                <td className="py-2 tabular-nums">{row.p}</td>
                                <td className="py-2"><span className="px-1.5 py-0.5 bg-[#1ED98A]/10 text-[#1ED98A] rounded-[2px] text-[8px] font-bold uppercase">{row.st}</span></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        ) : (
          <>
            {/* Primary Chart Area */}
            <div className="flex-[2] bg-[#0C1018] border border-[#1B2333]/30 rounded-lg relative overflow-hidden">
              <div className="absolute top-3 left-4 z-10">
                <span className="text-[10px] font-bold text-[#4A6070] uppercase tracking-widest leading-none">
                  {currentTab?.subLabel} · <span className="text-[#C8D8E8]">ACTIVE ANALYSIS</span>
                </span>
              </div>
              <InteractiveChart 
                type={activeTab as any}
                data={activeTab === 'rolling' ? equityData.map(pt => ({ ...pt, value: pt.trader / 100000 })) : (activeTab === 'drawdown' ? drawdownData : equityData)}
                mcPaths={mcPaths}
                showTrader={showTrader}
                showExpert={showExpert}
                showSpy={showSpy}
                height={0}
                className="h-full"
              />
            </div>

            {/* Secondary Grid Area */}
            <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden min-h-[180px]">
              <div className="bg-[#0C1018] border border-[#1B2333]/30 rounded-lg p-3 flex flex-col">
                <span className="text-[9px] font-bold text-[#4A6070] uppercase tracking-widest mb-3">Volatility Attribution</span>
                <InteractiveChart 
                  type="drawdown"
                  data={drawdownData}
                  className="flex-1"
                />
              </div>
              <div className="bg-[#0C1018] border border-[#1B2333]/30 rounded-lg p-3 flex flex-col text-center justify-center">
                <span className="text-[9px] font-bold text-[#4A6070] uppercase tracking-widest mb-2">Signal Conviction</span>
                <div className="text-3xl font-bold text-[#00E5C3] tabular-nums tracking-tighter mb-2">
                  0.824
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-32 h-1 bg-[#141B26] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E5C3] w-[82%] shadow-[0_0_10px_#00E5C3]" />
                  </div>
                  <span className="text-[9px] font-bold text-[#1ED98A]">STRONG BUY</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
