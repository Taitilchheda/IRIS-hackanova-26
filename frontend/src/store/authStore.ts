import { create } from 'zustand'

interface AuthState {
  user: { email: string } | null
  loading: boolean
  error: string | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>(() => ({
  user: { email: 'admin@iris.local' },
  loading: false,
  error: null,
  token: 'dummy-token',

  hydrate: async () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {},
}))
