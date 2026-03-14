'use client'

import React, { useState, useEffect } from 'react'
import { AgentStatus } from '@/types'
import { cn } from '@/utils'

interface AgentPipelineProps {
  agents: AgentStatus[]
  className?: string
}

export function AgentPipeline({ agents, className }: AgentPipelineProps) {
  const [animatedAgents, setAnimatedAgents] = useState<AgentStatus[]>([])

  useEffect(() => {
    setAnimatedAgents(agents)
  }, [agents])

  const getStatusColor = (status: AgentStatus['status']) => {
    const colors = {
      idle: 'text-[#444]',
      running: 'text-amber animate-pulse',
      completed: 'text-[#00FF00]',
      error: 'text-red'
    }
    return colors[status]
  }

  const getStatusText = (status: AgentStatus['status']) => {
    const texts = {
      idle: 'WAITING',
      running: 'EXECUTING',
      completed: 'SUCCESS',
      error: 'FAILURE'
    }
    return texts[status]
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="grid grid-cols-[1fr_80px_70px] px-1 pb-1 border-b border-[#222] text-[8px] font-bold text-[#444] tracking-widest uppercase">
        <span>COGNITIVE AGENT</span>
        <span className="text-right">LATENCY</span>
        <span className="text-right">STATUS</span>
      </div>
      {animatedAgents.map((agent, index) => (
        <div
          key={agent.name}
          className={cn(
            'grid grid-cols-[1fr_80px_70px] items-center px-1 py-0.5 transition-all duration-300',
            'hover:bg-[#111]'
          )}
        >
          <span className="text-[10px] text-amber font-bold truncate">
            {agent.name.toUpperCase()}
          </span>
          
          <span className="text-[9px] text-[#444] font-mono text-right tabular-nums">
            {agent.time ? `${agent.time}s` : '--'}
          </span>
          
          <span className={cn(
            'text-[8px] font-bold text-right tracking-tighter',
            getStatusColor(agent.status)
          )}>
            {getStatusText(agent.status)}
          </span>
        </div>
      ))}
    </div>
  )
}
