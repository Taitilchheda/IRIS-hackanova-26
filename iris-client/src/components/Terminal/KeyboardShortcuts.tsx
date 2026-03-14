'use client'

import React, { useState, useEffect } from 'react'
import { useKeyboardShortcuts, irisShortcuts } from '@/hooks/useKeyboardShortcuts'

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
      description: 'Toggle Keyboard Shortcuts Help'
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
    <div className="fixed inset-0 bg-void/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-teal font-sans">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-text2 hover:text-text transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortcuts.slice(0, -1).map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-elevated rounded-lg border border-border">
              <span className="text-sm text-text">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {'ctrlKey' in shortcut && shortcut.ctrlKey && (
                  <span className="px-2 py-1 text-xs bg-border text-text rounded">Ctrl</span>
                )}
                {'shiftKey' in shortcut && shortcut.shiftKey && (
                  <span className="px-2 py-1 text-xs bg-border text-text rounded">Shift</span>
                )}
                {'altKey' in shortcut && shortcut.altKey && (
                  <span className="px-2 py-1 text-xs bg-border text-text rounded">Alt</span>
                )}
                <span className="px-2 py-1 text-xs bg-teal/20 text-teal rounded font-mono">
                  {shortcut.key.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <span className="text-xs text-text3">Press <span className="text-teal">?</span> to close this help</span>
        </div>
      </div>
    </div>
  )
}
