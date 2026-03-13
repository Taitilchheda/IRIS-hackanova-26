import axios from 'axios'

export interface RunRequest {
    prompt: string
    asset: string
    start_date: string
    end_date: string
    initial_capital: number
    commission_bps: number
    slippage_bps: number
    max_position_pct: number
    monte_carlo_paths: number
    expert_type?: string
}

export interface TearsheetMetrics {
    sharpe: number
    sortino: number
    max_drawdown: number
    win_rate: number
    cagr: number
    calmar: number
    total_return: number
    volatility: number
    trade_count: number
}

export interface AgentResult {
    agent_name: string
    equity_curve: number[]
    dates: string[]
    trade_log: Array<{ date: string; side: string; price: number; quantity: number; pnl_pct: number | null }>
    metrics: Record<string, number>
    error: string | null
    elapsed_seconds: number
}

export interface Tearsheet {
    run_id: string
    strategy_spec: {
        raw_prompt: string
        asset: string
        start_date: string
        end_date: string
        initial_capital: number
        parsed_rules_text: string
        confidence: number
        strategy_type: string
    }
    trader: AgentResult
    expert: AgentResult
    trader_metrics: TearsheetMetrics
    expert_metrics: TearsheetMetrics
    benchmark_equity: number[]
    benchmark_metrics: TearsheetMetrics
    narrative: string
    expert_type: string
}

const client = axios.create({
    baseURL: '/api',
    timeout: 120_000,
})

export async function runStrategy(req: RunRequest): Promise<Tearsheet> {
    const { data } = await client.post<Tearsheet>('/run', req)
    return data
}

export async function getTearsheet(runId: string): Promise<Tearsheet> {
    const { data } = await client.get<Tearsheet>(`/tearsheet/${runId}`)
    return data
}

export async function automateStrategy(runId: string, useExpert: boolean = false) {
    const { data } = await client.post(`/automate/${runId}`, null, { params: { use_expert: useExpert } })
    return data
}
