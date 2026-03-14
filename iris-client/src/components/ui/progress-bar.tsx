'use client'

import React from 'react'
import { cn } from '@/utils'

interface ProgressBarProps {
  value: number
  max?: number
  color?: 'teal' | 'blue' | 'red' | 'amber' | 'green' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
}

export function ProgressBar({ 
  value, 
  max = 100, 
  color = 'teal',
  size = 'md',
  showLabel = false,
  label,
  className 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    teal: 'bg-teal',
    blue: 'bg-blue',
    red: 'bg-red',
    amber: 'bg-amber',
    green: 'bg-green',
    purple: 'bg-purple'
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-text2">{label}</span>
          <span className="text-xs text-text">{value}/{max}</span>
        </div>
      )}
      <div className={cn(
        'w-full bg-elevated rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div 
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
