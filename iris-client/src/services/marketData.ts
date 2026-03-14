import { MarketData } from '@/types'

export class MarketDataService {
  private ws: WebSocket | null = null
  private subscribers: Map<string, Set<(data: MarketData) => void>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      this.ws = new WebSocket('ws://localhost:8000/ws')
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'market_data') {
            this.handleMarketData(message)
          } else if (message.type === 'strategy_update') {
            this.handleStrategyUpdate(message)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.handleReconnect()
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  private handleMarketData(message: any) {
    const symbol = message.symbol
    const data = message.data
    
    const subscribers = this.subscribers.get(symbol)
    if (subscribers) {
      subscribers.forEach(callback => callback(data))
    }
  }

  private handleStrategyUpdate(message: any) {
    // Handle strategy execution updates
    console.log('Strategy update:', message)
  }

  subscribe(symbol: string, callback: (data: MarketData) => void) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set())
    }
    this.subscribers.get(symbol)!.add(callback)

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(symbol)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          this.subscribers.delete(symbol)
        }
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export const marketDataService = new MarketDataService()
