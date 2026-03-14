'use client'

import React from 'react'
import { cn } from '@/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div 
        className={cn(
          'border-2 border-border border-t-teal rounded-full animate-spin',
          sizeClasses[size]
        )}
      />
      {text && (
        <span className="text-sm text-text2">{text}</span>
      )}
    </div>
  )
}
