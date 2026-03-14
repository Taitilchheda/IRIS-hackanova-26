'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Play, ChevronRight } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/button'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  onRunStrategy: (prompt: string) => void
  isLoading?: boolean
}

export function ChatPanel({ onRunStrategy, isLoading }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am IRIS. I can help you design, backtest, and optimize quantitative trading strategies. What are we looking at today?' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMsg = input.trim()
    setInput('')
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
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error connecting to the IRIS node. Please ensure the backend is running." }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0C1018] border-r border-[#1B2333]/30">
      <div className="bg-[#101520] px-3 py-2 border-b border-[#1B2333]/30 flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#00E5C3] uppercase tracking-widest leading-none">
          IRIS COGNITIVE CHAT
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1ED98A] shadow-[0_0_8px_#1ED98A]" />
          <span className="text-[8px] text-[#4A6070] font-bold">NODE: ONLINE</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#1B2333] scrollbar-track-transparent"
      >
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex gap-3 max-w-[90%]",
            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
          )}>
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
              msg.role === 'assistant' ? "bg-[#00E5C3]/20 text-[#00E5C3]" : "bg-[#4A6070]/20 text-[#C8D8E8]"
            )}>
              {msg.role === 'assistant' ? <Bot size={12} /> : <User size={12} />}
            </div>
            <div className={cn(
              "px-3 py-2 rounded-lg text-[11px] leading-relaxed shadow-sm",
              msg.role === 'assistant' 
                ? "bg-[#141B26] text-[#C8D8E8] border border-[#1B2333]/30" 
                : "bg-[#00E5C3] text-[#07090F] font-medium"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
             <div className="w-6 h-6 rounded-full bg-[#00E5C3]/20 text-[#00E5C3] flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot size={12} />
            </div>
            <div className="px-3 py-2 bg-[#141B26] border border-[#1B2333]/30 rounded-lg flex gap-1 items-center">
              <span className="w-1 h-1 bg-[#4A6070] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-[#4A6070] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-[#4A6070] rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-[#101520] border-t border-[#1B2333]/30 space-y-3">
        {messages.length > 2 && (
          <button
            onClick={() => {
              const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content
              if (lastUserMsg) onRunStrategy(lastUserMsg)
            }}
            disabled={isLoading}
            className="w-full py-1.5 flex items-center justify-center gap-2 bg-[#00E5C3]/10 border border-[#00E5C3]/30 text-[#00E5C3] rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-[#00E5C3]/20 transition-all"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            Execute Finalized Strategy
          </button>
        )}
        
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your strategy..."
            className="w-full bg-[#141B26] border border-[#1B2333]/30 rounded-md py-2.5 pl-3 pr-10 text-[11px] text-[#C8D8E8] outline-none focus:border-[#00E5C3]/50 transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#4A6070] hover:text-[#00E5C3] transition-all"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-[8px] text-[#4A6070] text-center font-bold tracking-tight">
          IRIS AI MAY PROVIDE HALLUCINATIONS. VERIFY WITH EXPLICIT BACKTESTS.
        </p>
      </div>
    </div>
  )
}
