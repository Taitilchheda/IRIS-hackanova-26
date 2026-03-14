// Test setup for IRIS Client
import '@testing-library/jest-dom'

// Mock WebSocket for tests
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.OPEN
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(public url: string) {}

  send(data: string) {
    // Mock send implementation
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }

  addEventListener(type: string, listener: EventListener) {
    // Mock event listener
  }

  removeEventListener(type: string, listener: EventListener) {
    // Mock event listener removal
  }
}

// Simple mock functions without Jest dependencies
const createMockFn = () => {
  const fn = () => {}
  fn.mock = {}
  fn.mockImplementation = (impl: Function) => {
    // Basic mock implementation
  }
  return fn
}

// Create mock objects
const mockFetch = createMockFn()
const mockResizeObserver = createMockFn().mockImplementation(() => ({
  observe: createMockFn(),
  unobserve: createMockFn(),
  disconnect: createMockFn(),
}))

const mockIntersectionObserver = createMockFn().mockImplementation(() => ({
  observe: createMockFn(),
  unobserve: createMockFn(),
  disconnect: createMockFn(),
}))

// Assign mocks to global for tests
const globalAny = globalThis as any

globalAny.WebSocket = MockWebSocket
globalAny.fetch = mockFetch
globalAny.ResizeObserver = mockResizeObserver
globalAny.IntersectionObserver = mockIntersectionObserver
