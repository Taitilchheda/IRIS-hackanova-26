'use client'

import { useState, useEffect, useCallback } from 'react'
import { MarketData } from '@/types'
import { marketDataService } from '@/services/marketData'
import { apiClient } from '@/api/client'

interface UseMarketDataOptions {
  symbols: string[]
  enabled?: boolean
}

export function useMarketData({ symbols, enabled = true }: UseMarketDataOptions) {
  const [data, setData] = useState<Map<string, MarketData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = useCallback((symbol: string, marketData: MarketData) => {
    setData(prev => {
      const newData = new Map(prev)
      newData.set(symbol, marketData)
      return newData
    })
  }, [])

  useEffect(() => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    // Initial fetch from backend REST API
    const fetchInitialData = async () => {
      try {
        const initialData: MarketData[] = await apiClient.getMarketData(symbols)

        const dataMap = new Map<string, MarketData>()
        initialData.forEach(item => {
          dataMap.set(item.symbol, item)
        })

        setData(dataMap)
        setLoading(false)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        setLoading(false)
      }
    }

    fetchInitialData()

    // Subscribe to real-time updates via WebSocket service
    const callbacks: (() => void)[] = []

    symbols.forEach(symbol => {
      const callback = (marketData: MarketData) => {
        handleUpdate(symbol, marketData)
      }
      const unsubscribe = marketDataService.subscribe(symbol, callback)
      callbacks.push(unsubscribe)
    })

    // Cleanup
    return () => {
      callbacks.forEach(unsubscribe => unsubscribe())
    }
  }, [symbols, enabled, handleUpdate])

  return {
    data,
    loading,
    error,
    getSymbol: (symbol: string) => data.get(symbol),
    getAllSymbols: () => Array.from(data.values())
  }
}
