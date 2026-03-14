'use client'

import React from 'react'
import { cn } from '@/utils'

interface TerminalCursorProps {
  visible?: boolean
  className?: string
}

export function TerminalCursor({ visible = true, className }: TerminalCursorProps) {
  return (
    <span 
      className={cn(
        'inline-block w-[6px] h-[12px] bg-teal animate-pulse',
        !visible && 'opacity-0',
        className
      )} 
    />
  )
}
