'use client'

import React from 'react'
import { cn } from '@/utils'

interface PulseIndicatorProps {
  status: 'idle' | 'running' | 'completed' | 'error'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PulseIndicator({ status, size = 'md', className }: PulseIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const statusColors = {
    idle: 'bg-text3',
    running: 'bg-teal animate-pulse',
    completed: 'bg-green',
    error: 'bg-red'
  }

  return (
    <div className={cn(
      'rounded-full',
      sizeClasses[size],
      statusColors[status],
      className
    )} />
  )
}
