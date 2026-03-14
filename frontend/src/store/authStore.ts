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

<<<<<<< HEAD
  hydrate: async () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {},
=======
  hydrate: async () => {
    const token = localStorage.getItem('iris_token')
    if (!token) return
    try {
      const user = await apiMe(token)
      set({ user, token })
    } catch {
      localStorage.removeItem('iris_token')
      set({ user: null, token: null })
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const token = await apiLogin(email, password)
      localStorage.setItem('iris_token', token)
      const user = await apiMe(token)
      set({ user, token, loading: false })
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Login failed', loading: false })
    }
  },

  register: async (email, password) => {
    // Registration just validates the fixed admin creds via login
    set({ loading: true, error: null })
    try {
      const token = await apiLogin(email, password)
      localStorage.setItem('iris_token', token)
      const user = await apiMe(token)
      set({ user, token, loading: false })
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Signup failed', loading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('iris_token')
    set({ user: null, token: null })
  },
>>>>>>> 716f20677e472710adb249a9598b86079449c19e
}))
