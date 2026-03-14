'use client'

import React, { useState } from 'react'
import { PerformanceMetrics, Trade } from '@/types'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatPercent } from '@/utils'
import { cn } from '@/utils'
import { BarChart3, ListFilter, Cpu, ShieldCheck, Bot } from 'lucide-react'

interface RightPanelProps {
  metrics?: PerformanceMetrics
  trades?: Trade[]
  onDeployStrategy?: (type: 'trader' | 'expert') => void
  isLoading?: boolean
  activeTab: string
}

export function RightPanel({ 
  metrics, 
  trades,
  onDeployStrategy,
  isLoading = false,
  activeTab
}: RightPanelProps) {

  const renderMetricsTab = () => (
    <div className="flex flex-col h-full space-y-4">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'SHARPE', val: metrics?.sharpe?.toFixed(2) || '1.84', delta: '−0.37 vs exp', c: 'text-[#00E5C3]' },
          { label: 'MAX DD', val: formatPercent(metrics?.maxDrawdown || 0.123), delta: 'worse', c: 'text-[#FF4466]' },
          { label: 'WIN RATE', val: `${metrics?.winRate?.toFixed(1) || '61.4'}%`, delta: '47 trds', c: 'text-[#1ED98A]' },
          { label: 'CAGR', val: formatPercent(metrics?.cagr || 0.182), delta: 'vs 22.7%', c: 'text-[#00E5C3]' },
          { label: 'SORTINO', val: metrics?.sortino?.toFixed(2) || '2.31', delta: '+0.11 vs SPY', c: 'text-[#00E5C3]' },
          { label: 'CALMAR', val: metrics?.calmar?.toFixed(2) || '1.48', delta: '—', c: 'text-[#00E5C3]' },
        ].map((k, i) => (
          <div key={i} className="bg-[#101520] border border-[#1B2333]/30 p-2.5 rounded-lg flex flex-col">
            <span className="text-[8px] font-bold text-[#4A6070] uppercase mb-1">{k.label}</span>
            <span className={cn("text-lg font-bold tabular-nums", k.c)}>{k.val}</span>
            <span className="text-[7px] font-bold text-[#263040] mt-0.5 uppercase tracking-tighter">{k.delta}</span>
          </div>
        ))}
      </div>

      {/* Risk Attribution */}
      <div className="bg-[#101520] border border-[#1B2333]/30 rounded-lg p-3 space-y-3">
        <span className="text-[9px] font-bold text-[#4A6070] uppercase tracking-widest block border-b border-[#1B2333]/30 pb-2">Risk Decomposition</span>
        <div className="space-y-3">
          {[
            { l: 'MARKET BETA', v: '0.64', p: 64, c: 'bg-[#4F9EFF]' },
            { l: 'IDIOSYNC.', v: '24.8%', p: 25, c: 'bg-[#A78BFA]' },
            { l: 'VOL REGIME', v: 'MED', p: 40, c: 'bg-[#F0A500]' },
            { l: 'TAIL RISK', v: 'LOW', p: 15, c: '#FF4466' },
          ].map((r, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between items-center text-[8px] font-bold">
                <span className="text-[#4A6070]">{r.l}</span>
                <span className="text-[#C8D8E8]">{r.v}</span>
              </div>
              <div className="h-0.5 bg-[#141B26] rounded-full overflow-hidden">
                <div className={cn("h-full", r.c)} style={{ width: `${r.p}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VaR Table */}
      <div className="grid grid-cols-2 gap-2">
         <div className="bg-[#101520] border border-[#1B2333]/30 p-2 rounded-lg text-center">
            <div className="text-[8px] font-bold text-[#4A6070] uppercase mb-1">1-DAY VaR</div>
            <div className="text-[12px] font-bold text-[#FF4466]">−1.84%</div>
         </div>
         <div className="bg-[#101520] border border-[#1B2333]/30 p-2 rounded-lg text-center">
            <div className="text-[8px] font-bold text-[#4A6070] uppercase mb-1">1-DAY CVaR</div>
            <div className="text-[12px] font-bold text-[#FF4466]">−2.91%</div>
         </div>
      </div>
    </div>
  )

  const renderTradesTab = () => (
    <div className="flex flex-col h-full bg-[#0C1018]">
      <div className="px-3 py-2 border-b border-[#1B2333]/30 text-[10px] font-bold text-[#4A6070] uppercase tracking-widest">
        Transaction History
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#101520] border-b border-[#1B2333]/30">
            <tr>
              <th className="p-2 text-[8px] font-bold text-[#4A6070] uppercase">Date</th>
              <th className="p-2 text-[8px] font-bold text-[#4A6070] uppercase">Price</th>
              <th className="p-2 text-[8px] font-bold text-[#4A6070] uppercase text-right">Side</th>
              <th className="p-2 text-[8px] font-bold text-[#4A6070] uppercase text-right">P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1B2333]/10">
            {(trades || []).map((t, i) => (
              <tr key={i} className="hover:bg-[#141B26] transition-colors">
                <td className="p-2 text-[10px] font-medium text-[#4A6070] tabular-nums">{t.date}</td>
                <td className="p-2 text-[10px] font-bold text-[#C8D8E8] tabular-nums">${t.price.toFixed(2)}</td>
                <td className={cn("p-2 text-[10px] font-bold text-right", t.side === 'BUY' ? 'text-[#00E5C3]' : 'text-[#FF4466]')}>{t.side}</td>
                <td className={cn("p-2 text-[10px] font-bold text-right tabular-nums", (t.pnl || 0) >= 0 ? 'text-[#1ED98A]' : 'text-[#FF4466]')}>
                  {t.pnl ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(1)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderIrisTab = () => (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-[#00E5C3]/5 border border-[#00E5C3]/20 p-4 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
          <Cpu className="w-12 h-12 text-[#00E5C3]" />
        </div>
        <p className="text-[12px] text-[#C8D8E8] leading-relaxed relative z-10">
          Your MA crossover returned <span className="text-[#00E5C3] font-bold">+91.4% (Sharpe 1.84)</span> over 6 years. 
          The Expert Agent outperformed by <span className="text-[#F0A500] font-bold">+22pp</span> using GARCH vol-scaling.
        </p>
      </div>

      <div className="bg-[#101520] border border-[#1B2333]/30 rounded-lg p-3 space-y-2">
         <span className="text-[9px] font-bold text-[#4A6070] uppercase tracking-widest block border-b border-[#1B2333]/30 pb-1">Cognitive Summary</span>
         <div className="space-y-1 font-mono text-[9px]">
            <div className="flex gap-2"><span className="text-[#00E5C3] w-12">ENTRY</span><span className="text-[#C8D8E8]">SMA(50) &gt; SMA(200)</span></div>
            <div className="flex gap-2"><span className="text-[#00E5C3] w-12">EXIT</span><span className="text-[#C8D8E8]">RSI(14) &gt; 70</span></div>
            <div className="flex gap-2"><span className="text-[#00E5C3] w-12">RISK</span><span className="text-[#1ED98A]">97.3% CONFIDENCE</span></div>
         </div>
      </div>

      <div className="flex-1 flex flex-col space-y-2">
         <Textarea 
          placeholder="Ask IRIS to refine..."
          className="flex-1 bg-[#101520] border-[#1B2333]/30 text-[11px] p-3 text-[#C8D8E8] rounded-xl focus:border-[#00E5C3]/30 transition-all font-medium"
        />
        <div className="grid grid-cols-2 gap-2">
          <button 
           onClick={() => onDeployStrategy?.('trader')}
           className="py-2.5 bg-[#1B2333] text-[#00E5C3] text-[10px] font-bold rounded-lg hover:bg-[#00E5C3]/10 transition-all"
          >
           AUTOMATE BASE
          </button>
          <button 
           onClick={() => onDeployStrategy?.('expert')}
           className="py-2.5 bg-[#00E5C3] text-[#07090F] text-[10px] font-bold rounded-lg hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,229,195,0.1)]"
          >
           AUTOMATE EXPERT
          </button>
        </div>
      </div>
    </div>
  )

  const renderPipelineTab = () => (
    <div className="flex flex-col h-full space-y-4">
      <div className="px-3 py-2 border-b border-[#1B2333]/30 text-[10px] font-bold text-[#00E5C3] uppercase tracking-widest flex items-center justify-between">
        Execution Pipeline
        <div className="w-2 h-2 rounded-full bg-[#1ED98A] animate-pulse" />
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {[
          { step: 'NLP STAGE', status: 'ACTIVE', desc: 'Parsing intent from cognitive hub...', icon: Bot, color: 'text-[#00E5C3]' },
          { step: 'STRATEGY', status: 'READY', desc: 'Backtest logic generated & verified.', icon: Cpu, color: 'text-[#F0A500]' },
          { step: 'BACKTEST', status: 'IDLE', desc: 'Vectorized engine awaiting data lock.', icon: BarChart3, color: 'text-[#4A6070]' },
          { step: 'RISK VERIF', status: 'IDLE', desc: 'Monte Carlo pass at 1k iterations.', icon: ShieldCheck, color: 'text-[#4A6070]' }
        ].map((p, i) => (
          <div key={i} className="bg-[#101520] border border-[#1B2333]/30 rounded-lg p-3 relative group overflow-hidden">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[9px] font-bold text-[#C8D8E8] uppercase">{p.step}</span>
              <span className={cn("text-[8px] font-bold uppercase", p.color)}>{p.status}</span>
            </div>
            <p className="text-[9px] text-[#4A6070] leading-snug">{p.desc}</p>
            {p.status === 'ACTIVE' && (
              <div className="mt-2 h-0.5 bg-[#141B26] rounded-full overflow-hidden">
                 <div className="h-full bg-[#00E5C3] animate-shimmer" style={{ width: '40%' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#101520] border border-[#1B2333]/30 rounded-lg p-3">
         <span className="text-[8px] font-bold text-[#4A6070] uppercase block mb-2">Node Health</span>
         <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
               <div className="text-[12px] font-bold text-[#C8D8E8]">0.8s</div>
               <div className="text-[7px] text-[#4A6070] uppercase">Latency</div>
            </div>
            <div className="text-center">
               <div className="text-[12px] font-bold text-[#C8D8E8]">99.9%</div>
               <div className="text-[7px] text-[#4A6070] uppercase">Uptime</div>
            </div>
         </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[#0C1018] border-l border-[#1B2333]/30 p-3">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'metrics' && renderMetricsTab()}
        {activeTab === 'trades' && renderTradesTab()}
        {activeTab === 'iris' && renderIrisTab()}
        {activeTab === 'pipeline' && renderPipelineTab()}
      </div>
    </div>
  )
}
