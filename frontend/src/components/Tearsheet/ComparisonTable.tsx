import { useIRISStore } from '../../store/irisStore'
import type { TearsheetMetrics } from '../../api/client'

interface MetricRow {
  label: string
  key: keyof TearsheetMetrics
  format: (v: number) => string
  goodWhen: 'higher' | 'lower'
}

const ROWS: MetricRow[] = [
  { label: 'Total Return', key: 'total_return', format: (v) => `${(v * 100).toFixed(1)}%`, goodWhen: 'higher' },
  { label: 'Sharpe Ratio', key: 'sharpe', format: (v) => v.toFixed(2), goodWhen: 'higher' },
  { label: 'Sortino Ratio', key: 'sortino', format: (v) => v.toFixed(2), goodWhen: 'higher' },
  { label: 'Max Drawdown', key: 'max_drawdown', format: (v) => `${(v * 100).toFixed(1)}%`, goodWhen: 'lower' },
  { label: 'Win Rate', key: 'win_rate', format: (v) => `${(v * 100).toFixed(1)}%`, goodWhen: 'higher' },
  { label: 'Trade Count', key: 'trade_count', format: (v) => v.toString(), goodWhen: 'higher' },
  { label: 'Volatility', key: 'volatility', format: (v) => `${(v * 100).toFixed(1)}%`, goodWhen: 'lower' },
]

function findWinnerCol(trader: number, expert: number, benchmark: number, goodWhen: 'higher' | 'lower'): number {
  const vals = [trader, expert, benchmark]
  if (goodWhen === 'higher') return vals.indexOf(Math.max(...vals))
  return vals.indexOf(Math.min(...vals))
}

export default function ComparisonTable() {
  const tearsheet = useIRISStore((s) => s.tearsheet)

  if (!tearsheet) return null

  const { trader_metrics: tm, expert_metrics: em, benchmark_metrics: bm } = tearsheet

  return (
    <div className="iris-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
      <h3 className="font-mono" style={{
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '1rem',
      }}>
        Trader vs Expert Comparison
      </h3>

      <table className="iris-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Your Strategy</th>
            <th>Expert Agent</th>
            <th>SPY Benchmark</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const tv = tm[row.key] as number
            const ev = em[row.key] as number
            const bv = bm[row.key] as number
            const winner = findWinnerCol(tv, ev, bv, row.goodWhen)

            return (
              <tr key={row.key}>
                <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
                  {row.label}
                </td>
                <td style={{
                  color: winner === 0 ? 'var(--accent-teal)' : 'var(--text-primary)',
                  borderLeft: winner === 0 ? '3px solid var(--accent-teal)' : '3px solid transparent',
                  fontWeight: winner === 0 ? 500 : 400,
                }}>
                  {row.format(tv)}
                </td>
                <td style={{
                  color: winner === 1 ? 'var(--accent-amber)' : 'var(--text-primary)',
                  borderLeft: winner === 1 ? '3px solid var(--accent-amber)' : '3px solid transparent',
                  fontWeight: winner === 1 ? 500 : 400,
                }}>
                  {row.format(ev)}
                </td>
                <td style={{
                  color: winner === 2 ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderLeft: winner === 2 ? '3px solid var(--text-secondary)' : '3px solid transparent',
                  fontWeight: winner === 2 ? 500 : 400,
                }}>
                  {row.format(bv)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
