'use client'

import React from 'react'
import { cn } from '@/utils'

interface HeatmapProps {
  data: number[][]
  labels: string[]
  className?: string
}

export function Heatmap({ data, labels, className }: HeatmapProps) {
  const getColor = (value: number) => {
    // Bloomberg style heatmap: Green for positive, Red for negative
    if (value > 0) return `rgba(0, 255, 0, ${value * 0.8 + 0.1})`
    if (value < 0) return `rgba(255, 0, 0, ${Math.abs(value) * 0.8 + 0.1})`
    return 'rgba(21, 21, 21, 1)'
  }

  return (
    <div className={cn("flex flex-col h-full bg-black font-mono", className)}>
      <div className="flex-1 grid gap-px bg-[#222]" 
           style={{ 
             gridTemplateColumns: `repeat(${labels.length}, 1fr)`,
             gridTemplateRows: `repeat(${labels.length}, 1fr)` 
           }}>
        {data.map((row, i) => 
          row.map((val, j) => (
            <div 
              key={`${i}-${j}`}
              className="relative flex items-center justify-center group"
              style={{ backgroundColor: getColor(val) }}
            >
              <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                {val.toFixed(2)}
              </span>
              {/* Tooltip on hover */}
              <div className="absolute inset-0 z-10 pointer-events-none" title={`${labels[i]} vs ${labels[j]}: ${val.toFixed(4)}`} />
            </div>
          ))
        )}
      </div>
      <div className="h-4 flex mt-1">
        {labels.map((label, i) => (
          <div key={i} className="flex-1 text-[7px] text-[#444] font-bold text-center truncate px-0.5">
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
