'use client'

import React, { useState, useEffect } from 'react'
import { AgentStatus } from '@/types'
import { PulseIndicator } from '@/components/ui/pulse-indicator'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { cn } from '@/utils'

interface AgentPipelineProps {
  agents: AgentStatus[]
  className?: string
}

export function AgentPipeline({ agents, className }: AgentPipelineProps) {
  const [animatedAgents, setAnimatedAgents] = useState<AgentStatus[]>([])

  useEffect(() => {
    // Trigger animation when agents change
    setAnimatedAgents(agents)
  }, [agents])

  const getStatusColor = (status: AgentStatus['status']) => {
    const colors = {
      idle: 'text-text3',
      running: 'text-teal',
      completed: 'text-green',
      error: 'text-red'
    }
    return colors[status]
  }

  const getStatusBg = (status: AgentStatus['status']) => {
    const backgrounds = {
      idle: 'bg-transparent',
      running: 'bg-teal/10',
      completed: 'bg-green/10',
      error: 'bg-red/10'
    }
    return backgrounds[status]
  }

  const getStatusText = (status: AgentStatus['status']) => {
    const texts = {
      idle: 'WAIT',
      running: 'RUN',
      completed: 'DONE',
      error: 'ERR'
    }
    return texts[status]
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      {animatedAgents.map((agent, index) => (
        <div
          key={agent.name}
          className={cn(
            'flex items-center gap-2 p-1 rounded-sm transition-all duration-300',
            'hover:bg-elevated',
            agent.status === 'running' && 'animate-pulse bg-teal/5'
          )}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <PulseIndicator status={agent.status} size="sm" />
          
          <span className="text-[9px] text-text2 flex-1 tracking-wide font-mono">
            {agent.name}
          </span>
          
          {agent.time && (
            <span className="text-[8px] text-text3 font-mono min-w-[40px] text-right">
              <AnimatedNumber 
                value={parseFloat(agent.time)} 
                decimals={1}
                format={(value) => `${value}s`}
              />
            </span>
          )}
          
          <span className={cn(
            'text-[8px] px-1.5 py-0.5 rounded-sm font-mono tracking-wide',
            getStatusBg(agent.status),
            getStatusColor(agent.status)
          )}>
            {getStatusText(agent.status)}
          </span>
        </div>
      ))}
    </div>
  )
}
