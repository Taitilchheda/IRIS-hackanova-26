'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const pressedKey = event.key.toLowerCase()
    
    for (const shortcut of shortcuts) {
      const keyMatch = shortcut.key.toLowerCase() === pressedKey
      const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey
      const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey
      
      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.action()
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return shortcuts
}

// Predefined shortcuts for IRIS
export const irisShortcuts = {
  runStrategy: {
    key: 'Enter',
    ctrlKey: true,
    description: 'Run Strategy'
  },
  deployTrader: {
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    description: 'Deploy Trader Strategy'
  },
  deployExpert: {
    key: 'e',
    ctrlKey: true,
    shiftKey: true,
    description: 'Deploy Expert Strategy'
  },
  toggleCharts: {
    key: 'Tab',
    description: 'Toggle Chart Tabs'
  },
  focusStrategy: {
    key: 's',
    altKey: true,
    description: 'Focus Strategy Input'
  }
}
