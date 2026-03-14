'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RangeSlider } from '@/components/ui/range-slider'
import { cn } from '@/utils'
import { ChevronRight, Play, Database, Shield, Zap, Send, Bot, User, History as HistoryIcon, Search } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface LeftPanelProps {
  onRunStrategy: (strategy: any) => void
  isLoading?: boolean
  activeSection: string
  asset?: string
}

const algorithms = [
  { id: 'risk', name: 'Risk Analysis', tag: 'MONTE CARLO', color: 'red' },
  { id: 'alpha', name: 'Alpha / Signal', tag: 'KALMAN', color: 'green' },
  { id: 'port', name: 'Portfolio Constr.', tag: 'BLACK-LITTERMAN', color: 'blue' },
  { id: 'deriv', name: 'Derivatives', tag: 'BLACK-SCHOLES', color: 'amber' },
  { id: 'micro', name: 'Microstructure', tag: 'HMM + VWAP', color: 'purple' },
]

const assets = [
  'AAPL', 'SPY', 'MSFT', 'TSLA', 'GS', 'JPM', 'QQQ', 'BTC-USD'
]

export function LeftPanel({ onRunStrategy, isLoading = false, activeSection, asset }: LeftPanelProps) {
  const [strategy, setStrategy] = useState('')
  const [selectedAlgo, setSelectedAlgo] = useState('risk')
  const [parameters, setParameters] = useState({
    asset: asset || 'AAPL',
    startDate: '2019-01-01',
    endDate: '2024-12-31',
    capital: 100000,
    commission: 10,
    slippage: 5,
    maxPosition: 100,
    monteCarloPaths: 1000
  })

  React.useEffect(() => {
    if (asset) setParameters(prev => ({ ...prev, asset }))
  }, [asset])

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am IRIS. I can help you design, backtest, and optimize quantitative trading strategies. What are we looking at today?' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // History State
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  React.useEffect(() => {
    if (activeSection === 'history') {
      fetchHistory()
    }
  }, [activeSection])

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const resp = await fetch('http://localhost:8000/api/history')
      const data = await resp.json()
      setHistory(data)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim() || isTyping) return

    const userMsg = chatInput.trim()
    setChatInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsTyping(true)

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([...messages, { role: 'user', content: userMsg }])
      })
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error connecting to the IRIS node." }])
    } finally {
      setIsTyping(false)
    }
  }

  // Analysis State
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([
    'Initializing research engine...',
    `> Scanning asset: ${parameters.asset}`,
    '> System ready for telemetry.'
  ])

  const triggerAnalysis = async (type: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setAnalysisLogs(prev => [...prev, `[${timestamp}] REQUEST: ${type} for ${parameters.asset}...`]);
    
    try {
      const response = await fetch('http://localhost:8000/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset: parameters.asset, type })
      });
      const data = await response.json();
      setAnalysisLogs(prev => [...prev, ...data]);
    } catch (error) {
      setAnalysisLogs(prev => [...prev, `[${timestamp}] ERROR: Remote engine unreachable.`]);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0C1018] border-r border-[#1B2333]/30">
      {/* Dynamic Header */}
      <div className="bg-[#101520] px-3 py-2 border-b border-[#1B2333]/30 flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#00E5C3] uppercase tracking-widest leading-none">
          {activeSection === 'strategy' ? 'COGNITIVE ENGINE' : activeSection}
        </span>
        {activeSection === 'strategy' && (
           <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1ED98A] shadow-[0_0_8px_#1ED98A]" />
            <span className="text-[8px] text-[#4A6070] font-bold">LIVE</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* STRATEGY & CHAT CONSOLIDATED */}
        {activeSection === 'strategy' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none"
            >
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex gap-2 max-w-[95%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}>
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    msg.role === 'assistant' ? "bg-[#00E5C3]/10 text-[#00E5C3]" : "bg-[#4A6070]/10 text-[#4A6070]"
                  )}>
                    {msg.role === 'assistant' ? <Bot size={10} /> : <User size={10} />}
                  </div>
                  <div className={cn(
                    "px-2.5 py-1.5 rounded-md text-[10px] leading-tight",
                    msg.role === 'assistant' 
                      ? "bg-[#141B26] text-[#C8D8E8] border border-[#1B2333]/30" 
                      : "bg-[#00E5C3] text-[#07090F] font-bold"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[8px] text-[#4A6070] animate-pulse pl-7 animate-bounce">IRIS is thinking...</div>}
            </div>

            {/* Input & Quick Form */}
            <div className="p-3 bg-[#101520] border-t border-[#1B2333]/30 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                       // Try to detect if it's a ticker search
                       const possibleTicker = chatInput.trim().toUpperCase()
                       if (possibleTicker.length <= 5 && !possibleTicker.includes(' ')) {
                         setParameters(prev => ({ ...prev, asset: possibleTicker }))
                       }
                       handleChatSend()
                    }
                  }}
                  placeholder="Search Ticker or ask IRIS..."
                  className="w-full bg-[#141B26] border border-[#1B2333]/30 rounded-md py-2 pl-3 pr-8 text-[10px] text-[#C8D8E8] outline-none focus:border-[#00E5C3]/40"
                />
                <button 
                  onClick={() => {
                     const possibleTicker = chatInput.trim().toUpperCase()
                     if (possibleTicker.length <= 5 && !possibleTicker.includes(' ')) {
                       setParameters(prev => ({ ...prev, asset: possibleTicker }))
                     }
                     handleChatSend()
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4A6070] hover:text-[#00E5C3]"
                >
                  <Search size={12} />
                </button>
              </div>

              <div className="h-px bg-[#1B2333]/30 my-2" />

              <div className="space-y-1.5">
                <label className="text-[8px] font-bold text-[#4A6070] uppercase">Manual Override / Prompt</label>
                <Textarea
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full bg-[#101520] border-[#1B2333]/30 text-[10px] text-[#C8D8E8] h-[60px] resize-none font-medium"
                  placeholder="Or enter prompt directly..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-[#4A6070] uppercase">Asset</label>
                  <select
                    value={parameters.asset}
                    onChange={(e) => setParameters(prev => ({ ...prev, asset: e.target.value }))}
                    className="w-full bg-[#101520] border border-[#1B2333]/30 text-[10px] text-[#C8D8E8] px-2 py-1 outline-none rounded"
                  >
                    {assets.map(asset => <option key={asset} value={asset}>{asset}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-[#4A6070] uppercase">Expert Override</label>
                  <select
                    value={selectedAlgo}
                    onChange={(e) => setSelectedAlgo(e.target.value)}
                    className="w-full bg-[#101520] border border-[#1B2333]/30 text-[10px] text-[#C8D8E8] px-2 py-1 outline-none rounded"
                  >
                    {algorithms.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PARAMETERS SECTION */}
        {activeSection === 'params' && (
          <div className="p-3 space-y-6">
            <RangeSlider
              title="INITIAL CAPITAL"
              min={10000}
              max={1000000}
              step={10000}
              value={parameters.capital}
              onValueChange={(value) => setParameters(prev => ({ ...prev, capital: value }))}
              displayValue={`$${(parameters.capital/1000).toFixed(0)}K`}
            />
            <RangeSlider
              title="COMMISSION (BPS)"
              min={0}
              max={50}
              step={1}
              value={parameters.commission}
              onValueChange={(value) => setParameters(prev => ({ ...prev, commission: value }))}
              displayValue={`${parameters.commission}`}
            />
            <RangeSlider
              title="SLIPPAGE (BPS)"
              min={0}
              max={30}
              step={1}
              value={parameters.slippage}
              onValueChange={(value) => setParameters(prev => ({ ...prev, slippage: value }))}
              displayValue={`${parameters.slippage}`}
            />
            <RangeSlider
              title="MC SIMULATIONS"
              min={100}
              max={5000}
              step={100}
              value={parameters.monteCarloPaths}
              onValueChange={(value) => setParameters(prev => ({ ...prev, monteCarloPaths: value }))}
              displayValue={`${parameters.monteCarloPaths}`}
            />
          </div>
        )}

        {/* ALGOS SECTION */}
        {activeSection === 'algos' && (
           <div className="p-3 space-y-3">
              {algorithms.map(algo => (
                <div key={algo.id} className="p-3 bg-[#101520] border border-[#1B2333]/30 rounded-lg group hover:border-[#00E5C3]/30 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-[10px] font-bold text-[#C8D8E8] uppercase">{algo.name}</h4>
                      <p className="text-[8px] text-[#4A6070] mt-0.5">{algo.tag}</p>
                    </div>
                    <div className={cn("w-1.5 h-1.5 rounded-full", `bg-${algo.color}`)} />
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-1 bg-[#141B26] border border-[#1B2333]/30 text-[8px] font-bold text-[#4A6070] rounded hover:text-[#00E5C3] transition-all">TUNE</button>
                    <button 
                      onClick={() => setSelectedAlgo(algo.id)}
                      className={cn(
                        "flex-1 py-1 border rounded text-[8px] font-bold transition-all",
                        selectedAlgo === algo.id 
                          ? "bg-[#00E5C3]/10 border-[#00E5C3]/30 text-[#00E5C3]" 
                          : "bg-transparent border-[#1B2333]/30 text-[#4A6070] hover:border-[#4A6070]"
                      )}
                    >
                      {selectedAlgo === algo.id ? 'SELECTED' : 'SELECT'}
                    </button>
                  </div>
                </div>
              ))}
           </div>
        )}

        {/* ANALYSIS SECTION */}
        {activeSection === 'analysis' && (
          <div className="p-3 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Regime Detect', icon: Zap },
                { label: 'Factor Exposure', icon: Shield },
                { label: 'GARCH Vol', icon: Database },
                { label: 'Correlation', icon: Search }
              ].map(item => (
                <button 
                  key={item.label} 
                  className="flex flex-col items-center gap-2 p-3 bg-[#101520] border border-[#1B2333]/30 rounded-md text-[9px] font-bold text-[#4A6070] hover:text-[#00E5C3] hover:border-[#00E5C3]/30 transition-all group"
                  onClick={() => triggerAnalysis(item.label)}
                >
                  <item.icon size={14} className="group-hover:text-[#00E5C3]" />
                  {item.label}
                </button>
              ))}
            </div>
            
            <div className="mt-6 flex flex-col flex-1 min-h-0">
               <label className="text-[8px] font-bold text-[#4A6070] uppercase mb-2">Analysis Logs</label>
               <div className="bg-[#07090F] border border-[#1B2333]/30 rounded p-2 h-48 font-mono text-[8px] text-[#00E5C3]/70 overflow-y-auto">
                  {analysisLogs.map((log, i) => (
                    <div key={i} className="mb-0.5">{log}</div>
                  ))}
                  <div className="animate-pulse">_</div>
               </div>
            </div>
          </div>
        )}

        {/* HISTORY SECTION */}
        {activeSection === 'history' && (
          <div className="p-3 space-y-2">
            {loadingHistory ? (
              <div className="text-center py-10 animate-pulse text-[10px] text-[#4A6070]">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 text-[10px] text-[#4A6070]">No transactions found</div>
            ) : (
              history.map((run) => (
                <div key={run.run_id} className="p-2 bg-[#101520] border border-[#1B2333]/30 rounded-md hover:border-[#00E5C3]/30 transition-all cursor-pointer group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[#C8D8E8]">{run.asset}</span>
                    <span className="text-[8px] text-[#00E5C3] font-bold">#{run.run_id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[8px] text-[#4A6070]">
                    <div>CAGR: <span className="text-[#C8D8E8]">{(run.cagr * 100).toFixed(1)}%</span></div>
                    <div>SHARPE: <span className="text-[#C8D8E8]">{run.sharpe?.toFixed(2)}</span></div>
                    <div>DD: <span className="text-[#C8D8E8]">{(run.max_drawdown * 100).toFixed(1)}%</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Main Action Bar */}
      <div className="p-3 bg-[#101520] border-t border-[#1B2333]/30">
        <button
          onClick={() => {
            const finalPrompt = strategy.trim() || (messages.length > 2 ? [...messages].reverse().find(m => m.role === 'user')?.content : '')
            if (finalPrompt) onRunStrategy({ description: finalPrompt, ...parameters, expertType: selectedAlgo })
          }}
          disabled={isLoading}
          className={cn(
            "w-full py-2 flex items-center justify-center gap-2 rounded-md transition-all font-bold",
            isLoading
              ? "bg-[#1B2333] text-[#4A6070] cursor-not-allowed"
              : "bg-[#00E5C3] text-[#07090F] hover:opacity-90 shadow-[0_0_15px_rgba(0,229,195,0.2)]"
          )}
        >
          <Play className="w-2.5 h-2.5 fill-current" />
          <span className="text-[10px] tracking-widest uppercase">Execute Engine</span>
        </button>
      </div>
    </div>
  )
}
