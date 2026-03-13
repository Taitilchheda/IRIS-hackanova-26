import { create } from 'zustand'
import type { Tearsheet } from '../services/api'

interface IRISStore {
    // Input
    prompt: string
    asset: string
    startDate: string
    endDate: string
    capital: number
    commissionBps: number
    slippageBps: number
    maxPositionPct: number
    mcPaths: number
    lookbackWindow: number
    stopLossPct: number
    rollingWindow: number
    expertType: string

    // Run state
    isRunning: boolean
    error: string | null
    tearsheet: Tearsheet | null

    // Agent pipeline
    agentStatuses: Record<string, { status: 'idle' | 'running' | 'done' | 'error'; time?: number }>

    // Actions
    setPrompt: (p: string) => void
    setAsset: (a: string) => void
    setStartDate: (d: string) => void
    setEndDate: (d: string) => void
    setCapital: (c: number) => void
    setCommissionBps: (c: number) => void
    setSlippageBps: (s: number) => void
    setMaxPositionPct: (m: number) => void
    setMcPaths: (n: number) => void
    setLookbackWindow: (n: number) => void
    setStopLossPct: (n: number) => void
    setRollingWindow: (n: number) => void
    setExpertType: (t: string) => void
    setRunning: (r: boolean) => void
    setError: (e: string | null) => void
    setTearsheet: (ts: Tearsheet | null) => void
    setAgentStatus: (name: string, status: 'idle' | 'running' | 'done' | 'error', time?: number) => void
    resetAgents: () => void
}

const AGENTS = ['Manager Agent', 'Trader Strategy', 'Expert Agent', 'Verifier', 'Comparator']

export const useIRISStore = create<IRISStore>((set) => ({
    prompt: 'Buy AAPL when 50-day MA crosses above 200-day MA. Sell when RSI > 70 or position drops 5% from entry. Risk 2% capital per trade.',
    asset: 'AAPL',
    startDate: '2019-01-01',
    endDate: '2024-12-31',
    capital: 100000,
    commissionBps: 10,
    slippageBps: 5,
    maxPositionPct: 100,
    mcPaths: 1000,
    lookbackWindow: 252,
    stopLossPct: 5,
    rollingWindow: 90,
    expertType: 'risk_analysis',
    isRunning: false,
    error: null,
    tearsheet: null,
    agentStatuses: Object.fromEntries(AGENTS.map(a => [a, { status: 'idle' }])),

    setPrompt: (p) => set({ prompt: p }),
    setAsset: (a) => set({ asset: a }),
    setStartDate: (d) => set({ startDate: d }),
    setEndDate: (d) => set({ endDate: d }),
    setCapital: (c) => set({ capital: c }),
    setCommissionBps: (c) => set({ commissionBps: c }),
    setSlippageBps: (s) => set({ slippageBps: s }),
    setMaxPositionPct: (m) => set({ maxPositionPct: m }),
    setMcPaths: (n) => set({ mcPaths: n }),
    setLookbackWindow: (n) => set({ lookbackWindow: n }),
    setStopLossPct: (n) => set({ stopLossPct: n }),
    setRollingWindow: (n) => set({ rollingWindow: n }),
    setExpertType: (t) => set({ expertType: t }),
    setRunning: (r) => set({ isRunning: r }),
    setError: (e) => set({ error: e }),
    setTearsheet: (ts) => set({ tearsheet: ts }),
    setAgentStatus: (name, status, time) =>
        set((s) => ({ agentStatuses: { ...s.agentStatuses, [name]: { status, time } } })),
    resetAgents: () =>
        set({ agentStatuses: Object.fromEntries(AGENTS.map(a => [a, { status: 'idle' as const }])) }),
}))
