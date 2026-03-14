import { create } from 'zustand'
import type { Tearsheet, HistorySummary, AutomateResult } from '../api/client'
import { runStrategy, listTearsheets, automateStrategy, healthCheck } from '../api/client'

/* ── Types ───────────────────────────────────────────────────────── */

export type AppPhase = 'idle' | 'running' | 'complete' | 'error' | 'automating'
export type AgentStatus = 'idle' | 'running' | 'done' | 'error'

export interface AgentStatusInfo {
  status: AgentStatus
  message: string
  time?: number
}

export const AGENT_NAMES = [
  'Manager Agent',
  'Trader Strategy',
  'Expert Agent',
  'Verifier',
  'Comparator',
] as const

export type ExpertType =
  | 'risk_analysis'
  | 'derivatives'
  | 'portfolio'
  | 'alpha_signal'
  | 'fixed_income'
  | 'microstructure'
  | 'trend_following'

export const EXPERT_OPTIONS: { value: ExpertType; label: string }[] = [
  { value: 'risk_analysis', label: 'Risk Analysis' },
  { value: 'derivatives', label: 'Derivatives & Pricing' },
  { value: 'portfolio', label: 'Portfolio Construction' },
  { value: 'alpha_signal', label: 'Alpha & Signal Research' },
  { value: 'fixed_income', label: 'Fixed Income & Rates' },
  { value: 'microstructure', label: 'Market Microstructure' },
  { value: 'trend_following', label: 'Trend Following (SMA)' },
]

/* ── Store Interface ─────────────────────────────────────────────── */

interface IRISStore {
  // ── Input fields ──
  prompt: string
  asset: string
  startDate: string
  endDate: string
  capital: number
  commissionBps: number
  slippageBps: number
  maxPositionPct: number
  mcPaths: number
  expertType: ExpertType

  // ── Application state ──
  appPhase: AppPhase
  error: string | null
  tearsheet: Tearsheet | null

  // ── Agent pipeline ──
  agentStatuses: Record<string, AgentStatusInfo>

  // ── History ──
  historyItems: HistorySummary[]
  historyLoading: boolean

  // ── Automation ──
  automateResult: AutomateResult | null
  automateModalOpen: boolean
  automateUseExpert: boolean

  // ── Backend health ──
  backendAlive: boolean

  // ── Groq Integration ──
  groqApiKey: string
  groqHistory: { role: 'system' | 'user' | 'assistant'; content: string }[]

  // ── Input actions ──
  setPrompt: (p: string) => void
  setAsset: (a: string) => void
  setStartDate: (d: string) => void
  setEndDate: (d: string) => void
  setCapital: (c: number) => void
  setCommissionBps: (c: number) => void
  setSlippageBps: (s: number) => void
  setMaxPositionPct: (m: number) => void
  setMcPaths: (n: number) => void
  setExpertType: (t: ExpertType) => void
  setGroqApiKey: (k: string) => void
  resetGroqHistory: () => void
  runGroqManager: () => Promise<void>

  // ── Pipeline actions ──
  runPipeline: () => Promise<void>
  setAgentStatus: (name: string, status: AgentStatus, message?: string) => void
  resetPipeline: () => void
  setTearsheet: (ts: Tearsheet | null) => void

  // ── History actions ──
  loadHistory: () => Promise<void>

  // ── Automate actions ──
  openAutomateModal: (useExpert: boolean) => void
  closeAutomateModal: () => void
  confirmAutomate: () => Promise<void>

  // ── Health ──
  checkHealth: () => Promise<void>
}

/* ── Helper ──────────────────────────────────────────────────────── */

function defaultAgentStatuses(): Record<string, AgentStatusInfo> {
  return Object.fromEntries(
    AGENT_NAMES.map((name) => [name, { status: 'idle' as AgentStatus, message: 'Waiting' }])
  )
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function normalizeDate(d: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  const m = d.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  const parsed = new Date(d)
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  throw new Error('Invalid date format. Use YYYY-MM-DD')
}

/* ── Store ────────────────────────────────────────────────────────── */

export const useIRISStore = create<IRISStore>((set, get) => ({
  // Defaults
  prompt: '',
  asset: 'AAPL',
  startDate: '2019-01-01',
  endDate: '2024-12-31',
  capital: 100000,
  commissionBps: 10,
  slippageBps: 5,
  maxPositionPct: 100,
  mcPaths: 1000,
  expertType: 'risk_analysis',

  groqApiKey: localStorage.getItem('iris_groq_key') || '',
  groqHistory: JSON.parse(localStorage.getItem('iris_groq_history') || '[]'),

  appPhase: 'idle',
  error: null,
  tearsheet: null,

  agentStatuses: defaultAgentStatuses(),

  historyItems: [],
  historyLoading: false,

  automateResult: null,
  automateModalOpen: false,
  automateUseExpert: false,

  backendAlive: false,

  // ── Input setters ──
  setPrompt: (p) => set({ prompt: p }),
  setAsset: (a) => set({ asset: a }),
  setStartDate: (d) => set({ startDate: d }),
  setEndDate: (d) => set({ endDate: d }),
  setCapital: (c) => set({ capital: c }),
  setCommissionBps: (c) => set({ commissionBps: c }),
  setSlippageBps: (s) => set({ slippageBps: s }),
  setMaxPositionPct: (m) => set({ maxPositionPct: m }),
  setMcPaths: (n) => set({ mcPaths: n }),
  setExpertType: (t) => set({ expertType: t }),
  setGroqApiKey: (k) => {
    localStorage.setItem('iris_groq_key', k)
    set({ groqApiKey: k })
  },
  resetGroqHistory: () => {
    localStorage.removeItem('iris_groq_history')
    set({ groqHistory: [] })
  },

  // ── Pipeline ──
  setAgentStatus: (name, status, message) =>
    set((s) => ({
      agentStatuses: {
        ...s.agentStatuses,
        [name]: { status, message: message || s.agentStatuses[name]?.message || '' },
      },
    })),

  resetPipeline: () =>
    set({
      appPhase: 'idle',
      tearsheet: null,
      error: null,
      automateResult: null,
      agentStatuses: defaultAgentStatuses(),
    }),

  setTearsheet: (ts) => set({ tearsheet: ts, appPhase: ts ? 'complete' : 'idle' }),

  runPipeline: async () => {
    const state = get()
    if (state.appPhase === 'running') return

    // Reset
    set({
      appPhase: 'running',
      tearsheet: null,
      error: null,
      automateResult: null,
      agentStatuses: defaultAgentStatuses(),
    })

    const setAgent = get().setAgentStatus

    // Simulate agent progression
    setAgent('Manager Agent', 'running', 'Parsing strategy...')
    await delay(500)
    setAgent('Manager Agent', 'done', 'Strategy parsed')
    setAgent('Trader Strategy', 'running', 'Running trader simulation...')
    setAgent('Expert Agent', 'running', `Running ${state.expertType} analysis...`)

    try {
      const tearsheet = await runStrategy({
        prompt: state.prompt,
        asset: state.asset,
        start_date: normalizeDate(state.startDate),
        end_date: normalizeDate(state.endDate),
        initial_capital: state.capital,
        commission_bps: state.commissionBps,
        slippage_bps: state.slippageBps,
        max_position_pct: state.maxPositionPct / 100,
        monte_carlo_paths: state.mcPaths,
        expert_type: state.expertType,
        groq_api_key: state.groqApiKey,
      })

      setAgent('Trader Strategy', 'done', `Completed in ${tearsheet.trader.elapsed_seconds.toFixed(1)}s`)
      setAgent('Expert Agent', 'done', `Completed in ${tearsheet.expert.elapsed_seconds.toFixed(1)}s`)
      await delay(300)
      setAgent('Verifier', 'running', 'Validating results...')
      await delay(400)
      setAgent('Verifier', 'done', 'Results verified')
      setAgent('Comparator', 'running', 'Generating comparison...')
      await delay(300)
      setAgent('Comparator', 'done', 'Tearsheet ready')

      set({ tearsheet, appPhase: 'complete' })
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Unknown error'
      const statuses = get().agentStatuses
      for (const [name, info] of Object.entries(statuses)) {
        if (info.status === 'running') {
          setAgent(name, 'error', message)
        }
      }
      set({ error: message, appPhase: 'error' })
    }
  },

  runGroqManager: async () => {
    const state = get()
    if (!state.groqApiKey) {
      set({ error: 'Groq API Key missing. Set it in Settings.' })
      return
    }
    if (!state.prompt.trim()) return

    set({ appPhase: 'running' })
    const setAgent = get().setAgentStatus
    setAgent('Manager Agent', 'running', 'Groq is analyzing your strategy...')

    try {
      const { callManagerAgent } = await import('../api/groq')
      const { parsed, updatedHistory } = await callManagerAgent(state.prompt, state.groqApiKey, state.groqHistory)

      // Update history
      localStorage.setItem('iris_groq_history', JSON.stringify(updatedHistory))

      // Update form fields based on parsed JSON
      const updates: any = {}
      if (parsed.asset) updates.asset = parsed.asset.toUpperCase()
      if (parsed.backtest_period?.start) updates.startDate = parsed.backtest_period.start
      if (parsed.backtest_period?.end) updates.endDate = parsed.backtest_period.end

      // Map expert agent
      const expertMap: Record<string, ExpertType> = {
        'risk_analysis': 'risk_analysis',
        'derivatives_pricing': 'derivatives',
        'portfolio_construction': 'portfolio',
        'alpha_signal': 'alpha_signal',
        'fixed_income': 'fixed_income',
        'market_microstructure': 'microstructure'
      }
      if (parsed.expert_agent_required && expertMap[parsed.expert_agent_required]) {
        updates.expertType = expertMap[parsed.expert_agent_required]
      }

      set({
        ...updates,
        groqHistory: updatedHistory,
        appPhase: 'idle', // Ready for user to review or run
      })

      setAgent('Manager Agent', 'done', parsed.manager_response_to_trader)

    } catch (err: any) {
      set({ error: err.message, appPhase: 'error' })
      setAgent('Manager Agent', 'error', err.message)
    }
  },

  // ── History ──
  loadHistory: async () => {
    set({ historyLoading: true })
    try {
      const items = await listTearsheets()
      set({ historyItems: items, historyLoading: false })
    } catch {
      set({ historyLoading: false })
    }
  },

  // ── Automate ──
  openAutomateModal: (useExpert) =>
    set({ automateModalOpen: true, automateUseExpert: useExpert, automateResult: null }),

  closeAutomateModal: () =>
    set({ automateModalOpen: false, automateResult: null }),

  confirmAutomate: async () => {
    const { tearsheet, automateUseExpert } = get()
    if (!tearsheet) return

    set({ appPhase: 'automating' })
    try {
      const result = await automateStrategy(tearsheet.run_id, automateUseExpert)
      set({ automateResult: result, appPhase: 'complete' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Automation failed'
      set({
        automateResult: { status: 'error', run_id: tearsheet.run_id, error: message },
        appPhase: 'complete',
      })
    }
  },

  // ── Health ──
  checkHealth: async () => {
    try {
      await healthCheck()
      set({ backendAlive: true })
    } catch {
      set({ backendAlive: false })
    }
  },
}))
