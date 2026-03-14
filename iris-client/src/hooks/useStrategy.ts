import { useState, useCallback } from 'react'
import { apiClient } from '@/api/client'

export function useStrategy() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitStrategy = useCallback(async (strategy: any) => {
    setIsLoading(true)
    setError(null)
    setCurrentResult(null)
    
    try {
      // Transform strategy to match backend RunRequest format
      const backendStrategy = {
        prompt: strategy.description,
        asset: strategy.asset,
        start_date: strategy.startDate,
        end_date: strategy.endDate,
        initial_capital: strategy.capital,
        commission_bps: strategy.commission * 100, // Convert to basis points
        slippage_bps: strategy.slippage * 100, // Convert to basis points
        max_position_pct: strategy.maxPosition,
        monte_carlo_paths: strategy.monteCarloPaths || 1000,
        expert_type: strategy.expertType || null
      }
      
      // Submit strategy and get result directly (backend runs it immediately)
      const result = await apiClient.submitStrategy(backendStrategy)
      setCurrentResult(result)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const parseStrategy = useCallback(async (strategy: any) => {
    try {
      const backendStrategy = {
        prompt: strategy.description,
        asset: strategy.asset,
        start_date: strategy.startDate,
        end_date: strategy.endDate,
        initial_capital: strategy.capital,
        commission_bps: strategy.commission * 100,
        slippage_bps: strategy.slippage * 100,
        max_position_pct: strategy.maxPosition,
        monte_carlo_paths: strategy.monteCarloPaths || 1000,
        expert_type: strategy.expertType || null
      }
      
      const result = await apiClient.parseStrategy(backendStrategy)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Parse failed'
      setError(errorMessage)
      throw err
    }
  }, [])

  const deployStrategy = useCallback(async (runId: string, useExpert: boolean = false) => {
    try {
      const result = await apiClient.deployStrategy(runId, useExpert)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Deployment failed'
      setError(errorMessage)
      return false
    }
  }, [])

  const getTearsheets = useCallback(async () => {
    try {
      const result = await apiClient.getTearsheets()
      return result
    } catch (err) {
      console.error('Error fetching tearsheets:', err)
      return []
    }
  }, [])

  const getHistory = useCallback(async () => {
    try {
      const result = await apiClient.getHistory()
      return result
    } catch (err) {
      console.error('Error fetching history:', err)
      return []
    }
  }, [])

  return {
    submitStrategy,
    parseStrategy,
    deployStrategy,
    getTearsheets,
    getHistory,
    isLoading,
    currentResult,
    error,
  }
}
