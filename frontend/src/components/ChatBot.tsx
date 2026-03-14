import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { chatService, type ChatMessage } from '../services/chatService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m IRIS AI assistant. I can help you analyze strategies, explain results, and provide trading insights. How can I assist you today?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Get strategy context for enhanced responses
      const strategyContext = chatService.getStrategyContext()
      
      // Convert messages to ChatMessage format
      const chatMessages: ChatMessage[] = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Call the chat service
      const response = await chatService.sendMessage(chatMessages, strategyContext)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      
      // Fallback to contextual response
      const strategyContext = chatService.getStrategyContext()
      const fallbackResponse = chatService.generateContextualResponse(currentInput, strategyContext)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-bot">
      {/* Header */}
      <div className="chat-header">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-teal" />
          <span className="text-xs font-bold text-teal">IRIS AI</span>
          {isLoading && <Sparkles size={12} className="text-amber animate-pulse" />}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? (
                <User size={12} className="text-amber" />
              ) : (
                <Bot size={12} className="text-teal" />
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant-message">
            <div className="message-avatar">
              <Bot size={12} className="text-teal" />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask about your strategy..."
          className="chat-textarea"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="chat-send-button"
        >
          <Send size={14} />
        </button>
      </div>

      <style>{`
        .chat-bot {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--panel);
          border: 1px solid var(--border2);
          border-radius: 8px;
          overflow: hidden;
        }

        .chat-header {
          padding: 12px;
          background: var(--surface);
          border-bottom: 1px solid var(--border2);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: calc(100vh - 200px);
        }

        .message {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .message-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--raised);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .message-text {
          background: var(--raised);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .user-message .message-text {
          background: var(--teal-lo);
          color: var(--teal);
        }

        .assistant-message .message-text {
          background: var(--surface);
          border: 1px solid var(--border2);
        }

        .message-time {
          font-size: 10px;
          color: var(--text2);
          padding: 0 4px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: 8px;
          width: fit-content;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text2);
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .chat-input {
          padding: 12px;
          border-top: 1px solid var(--border2);
          display: flex;
          gap: 8px;
          align-items: flex-end;
          background: var(--surface);
        }

        .chat-textarea {
          flex: 1;
          background: var(--raised);
          border: 1px solid var(--border2);
          border-radius: 6px;
          padding: 8px;
          font-size: 12px;
          resize: none;
          outline: none;
          color: var(--text);
          font-family: var(--mono);
        }

        .chat-textarea:focus {
          border-color: var(--teal);
        }

        .chat-textarea::placeholder {
          color: var(--text2);
        }

        .chat-send-button {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: var(--teal);
          color: var(--bg);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chat-send-button:hover:not(:disabled) {
          background: var(--teal-md);
          transform: translateY(-1px);
        }

        .chat-send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .chat-messages {
            max-height: calc(100vh - 250px);
          }
        }
      `}</style>
    </div>
  )
}
