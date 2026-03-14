'use client'

import React from 'react'
import { cn } from '@/utils'
import { 
  Terminal, 
  Settings2, 
  Layers, 
  Activity, 
  LayoutGrid, 
  BarChart3, 
  FileInput,
  Cpu,
  MessageSquare,
  History as HistoryIcon
} from 'lucide-react'

interface SidebarProps {
  activeDrawer: string | null
  setActiveDrawer: (drawer: string | null) => void
  activeRight: string | null
  setActiveRight: (right: string | null) => void
}

export function Sidebar({ 
  activeDrawer, 
  setActiveDrawer,
  activeRight,
  setActiveRight
}: SidebarProps) {
  const leftIcons = [
    { id: 'strategy', icon: Terminal, tip: 'COGNITIVE' },
    { id: 'params', icon: Settings2, tip: 'PARAMETERS' },
    { id: 'algos', icon: Layers, tip: 'ALGORITHMS' },
    { id: 'analysis', icon: LayoutGrid, tip: 'ANALYSIS' },
    { id: 'history', icon: HistoryIcon, tip: 'HISTORY' },
  ]

  const rightIcons = [
    { id: 'pipeline', icon: Activity, tip: 'PIPELINE' },
    { id: 'metrics', icon: BarChart3, tip: 'METRICS' },
    { id: 'trades', icon: FileInput, tip: 'TRADES' },
    { id: 'iris', icon: Cpu, tip: 'IRIS' },
  ]

  return (
    <div className="w-[52px] bg-[#0C1018] border-r border-[#1B2333]/30 flex flex-col items-center py-3 gap-2 z-50">
      {leftIcons.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveDrawer(activeDrawer === item.id ? null : item.id)}
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center transition-all relative group",
            activeDrawer === item.id 
              ? "bg-[#00E5C3]/10 text-[#00E5C3]" 
              : "text-[#4A6070] hover:bg-[#1A2333] hover:text-[#C8D8E8]"
          )}
        >
          <item.icon className="w-4 h-4" />
          <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-[#141B26] border border-[#1B2333] text-[#C8D8E8] text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity">
            {item.tip}
          </div>
        </button>
      ))}

      <div className="w-6 h-px bg-[#1B2333] my-2" />

      {rightIcons.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveRight(activeRight === item.id ? null : item.id)}
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center transition-all relative group",
            activeRight === item.id 
              ? "bg-[#00E5C3]/10 text-[#00E5C3]" 
              : "text-[#4A6070] hover:bg-[#1A2333] hover:text-[#C8D8E8]"
          )}
        >
          <item.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}
