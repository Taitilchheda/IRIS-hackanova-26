import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiClient = {
  // Strategy submission - matches backend /api/run endpoint
  async submitStrategy(strategy: any): Promise<any> {
    const response = await api.post('/api/run', strategy)
    return response.data
  },

  // Parse strategy - matches backend /api/parse endpoint
  async parseStrategy(strategy: any): Promise<any> {
    const response = await api.post('/api/parse', strategy)
    return response.data
  },

  // Get tearsheet/results - matches backend /api/tearsheet/{run_id}
  async getTearsheet(runId: string): Promise<any> {
    const response = await api.get(`/api/tearsheet/${runId}`)
    return response.data
  },

  // Get all tearsheets - matches backend /api/tearsheets
  async getTearsheets(): Promise<any[]> {
    const response = await api.get('/api/tearsheets')
    return response.data
  },

  // Get history - matches backend /api/history
  async getHistory(): Promise<any[]> {
    const response = await api.get('/api/history')
    return response.data
  },

  // Deploy strategy - matches backend /api/automate/{run_id}
  async deployStrategy(runId: string, useExpert: boolean = false): Promise<any> {
    const response = await api.post(`/api/automate/${runId}`, null, {
      params: { use_expert: useExpert }
    })
    return response.data
  },

  // Get market data - now uses real backend endpoint
  async getMarketData(symbols: string[]): Promise<any[]> {
    const response = await api.get('/api/market-data', {
      params: { symbols: symbols.join(',') }
    })
    return response.data
  },

  // Poll for results - simplified for backend structure
  async pollResults(runId: string): Promise<any> {
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      try {
        const result = await this.getTearsheet(runId)
        if (result && result.run_id) {
          return result
        }
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++
      } catch (error) {
        console.error('Error polling results:', error)
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++
      }
    }
    
    throw new Error('Timeout waiting for backtest results')
  }
}
