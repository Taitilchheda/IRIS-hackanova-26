'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/utils'

interface AnimatedNumberProps {
  value: number
  previousValue?: number
  duration?: number
  className?: string
  format?: (value: number) => string
  decimals?: number
}

export function AnimatedNumber({ 
  value, 
  previousValue = value, 
  duration = 300, 
  className,
  format,
  decimals = 2
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(previousValue)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (value === previousValue) return

    setIsAnimating(true)
    const startTime = Date.now()
    const startValue = displayValue
    const endValue = value
    const change = endValue - startValue

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (change * easeOutQuart)
      
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }, [value, previousValue, duration, displayValue])

  const formatValue = (num: number) => {
    if (format) return format(num)
    return num.toFixed(decimals)
  }

  return (
    <span className={cn(
      'transition-all duration-150',
      isAnimating && 'scale-105',
      className
    )}>
      {formatValue(displayValue)}
    </span>
  )
}
