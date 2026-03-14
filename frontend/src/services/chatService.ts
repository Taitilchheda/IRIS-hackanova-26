import { useIRISStore } from '../store/irisStore'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  message: string
  context?: {
    strategy_info?: string
    performance_metrics?: any
    suggestions?: string[]
  }
}

class ChatService {
  private baseUrl = '/api'

  async sendMessage(messages: ChatMessage[], strategyContext?: any): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          strategy_context: strategyContext,
          // Include Groq API key if available from store
          groq_api_key: this.getGroqApiKey(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Chat API error:', error)
      // Fallback response
      return {
        message: 'I apologize, but I\'m having trouble connecting to the AI service. Please try again later.',
      }
    }
  }

  private getGroqApiKey(): string | null {
    // Try to get Groq API key from environment or store
    return import.meta.env.VITE_GROQ_API_KEY || null
  }

  // Enhanced context gathering for strategy analysis
  getStrategyContext() {
    const store = useIRISStore.getState()
    
    return {
      prompt: store.prompt,
      asset: store.asset,
      start_date: store.startDate,
      end_date: store.endDate,
      capital: store.capital,
      commission_bps: store.commissionBps,
      slippage_bps: store.slippageBps,
      max_position_pct: store.maxPositionPct,
      expert_type: store.expertType,
      app_phase: store.appPhase,
    }
  }

  // Predefined response templates for common queries
  generateContextualResponse(userInput: string, context: any): string {
    const input = userInput.toLowerCase()
    
    if (input.includes('strategy') && context.prompt) {
      return `I can see you're working with a strategy for ${context.asset || 'an asset'}. The strategy runs from ${context.start_date || 'start date'} to ${context.end_date || 'end date'} with ${context.capital || 'specified'} capital. Would you like me to help optimize the parameters or explain the current results?`
    }
    
    if (input.includes('performance') || input.includes('results')) {
      return 'Based on the current results, I can see the strategy performance metrics. The key indicators show promising risk-adjusted returns. Would you like me to break down the specific performance metrics or suggest improvements?'
    }
    
    if (input.includes('risk')) {
      return 'Risk management is crucial in trading. I can help analyze the risk metrics of your strategy, including maximum drawdown, volatility, and position sizing. What specific risk aspects would you like to explore?'
    }
    
    if (input.includes('optimize') || input.includes('improve')) {
      return 'Strategy optimization involves several factors: parameter tuning, risk management, and market conditions. I can suggest improvements based on your current strategy performance. What specific areas would you like to optimize?'
    }
    
    if (input.includes('help')) {
      return `I can help you with:
• Strategy analysis and optimization
• Performance metric explanations  
• Risk assessment
• Parameter tuning suggestions
• Trading signal interpretation

What specific aspect would you like to explore?`
    }
    
    return 'I understand you\'re looking for assistance with trading strategies. Could you provide more details about what specific aspect you\'d like help with?'
  }
}

export const chatService = new ChatService()
