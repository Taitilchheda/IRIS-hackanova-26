'use client'

import React, { useState, useEffect } from 'react'
import { useKeyboardShortcuts, irisShortcuts } from '@/hooks/useKeyboardShortcuts'
import { X, HelpCircle, Command } from 'lucide-react'

interface KeyboardShortcutsProps {
  onRunStrategy?: () => void
  onDeployTrader?: () => void
  onDeployExpert?: () => void
  onFocusStrategy?: () => void
}

export function KeyboardShortcuts({ 
  onRunStrategy, 
  onDeployTrader, 
  onDeployExpert, 
  onFocusStrategy 
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false)

  const shortcuts = [
    {
      ...irisShortcuts.runStrategy,
      action: onRunStrategy || (() => {})
    },
    {
      ...irisShortcuts.deployTrader,
      action: onDeployTrader || (() => {})
    },
    {
      ...irisShortcuts.deployExpert,
      action: onDeployExpert || (() => {})
    },
    {
      ...irisShortcuts.focusStrategy,
      action: onFocusStrategy || (() => {})
    },
    {
      key: '?',
      action: () => setShowHelp(!showHelp),
      description: 'Open Help Menu'
    }
  ]

  useKeyboardShortcuts(shortcuts)

  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        setShowHelp(!showHelp)
      }
    }

    document.addEventListener('keydown', handleGlobalKeydown)
    return () => document.removeEventListener('keydown', handleGlobalKeydown)
  }, [showHelp])

  if (!showHelp) return null

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-mono">
      <div className="bg-black border-2 border-amber max-w-2xl w-full shadow-[0_0_50px_rgba(255,184,0,0.2)] overflow-hidden">
        {/* Bloomberg Help Header */}
        <div className="bg-amber p-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-black" />
            <span className="text-black font-extrabold text-sm tracking-tighter">IRIS TERMINAL HELP</span>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="text-black hover:bg-black/10 p-1 transition-colors"
          >
            <X className="w-4 h-4 border-2 border-black" />
          </button>
        </div>

        <div className="p-4 bg-black">
          <div className="mb-4 text-amber font-bold text-[12px] border-b border-[#333] pb-1 uppercase tracking-widest">
            TERMINAL FUNCTION KEYS & COMMANDS
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_120px] px-2 py-1 bg-[#111] text-orange text-[10px] font-bold border-b border-[#222]">
              <span>FUNCTION DESCRIPTION</span>
              <span className="text-right">HOTKEY</span>
            </div>
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="grid grid-cols-[1fr_120px] items-center px-2 py-2 border-b border-[#111] hover:bg-[#151515] transition-all group">
                <span className="text-[11px] text-[#888] font-bold group-hover:text-amber transition-colors uppercase tracking-tight">
                  {shortcut.description}
                </span>
                <div className="flex items-center justify-end gap-1">
                  {'ctrlKey' in shortcut && shortcut.ctrlKey && (
                    <span className="px-1.5 py-0.5 text-[9px] border border-orange text-orange font-black">CTRL</span>
                  )}
                  <span className="px-2 py-0.5 text-[10px] bg-amber text-black font-black">
                    {shortcut.key.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="p-2 border border-blue/20 bg-blue/5 flex items-center gap-3">
              <Command className="w-5 h-5 text-blue" />
              <div>
                <div className="text-[10px] font-extrabold text-blue uppercase">Expert Mode Active</div>
                <div className="text-[9px] text-blue/80 italic">Cognitive agents are currently monitoring your execution cycle.</div>
              </div>
            </div>
            
            <div className="text-[9px] text-[#444] text-center pt-2">
              ESC OR ? TO CLOSE · VERSION 2.0.26-ALPHA
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
