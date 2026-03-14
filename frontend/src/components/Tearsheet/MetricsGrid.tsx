import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, BarChart3, Target } from 'lucide-react'
import { useIRISStore } from '../../store/irisStore'
import type { TearsheetMetrics } from '../../api/client'

interface KPIConfig {
  key: string
  label: string
  metricKey: keyof TearsheetMetrics
  format: (v: number) => string
  goodWhen: 'higher' | 'lower'
  icon: React.ReactNode
}

const KPI_CONFIG: KPIConfig[] = [
  {
    key: 'sharpe', label: 'Sharpe Ratio',
    metricKey: 'sharpe',
    format: (v) => v.toFixed(2),
    goodWhen: 'higher',
    icon: <TrendingUp size={16} />,
  },
  {
    key: 'max_drawdown', label: 'Max Drawdown',
    metricKey: 'max_drawdown',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    goodWhen: 'lower',
    icon: <TrendingDown size={16} />,
  },
  {
    key: 'win_rate', label: 'Win Rate',
    metricKey: 'win_rate',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    goodWhen: 'higher',
    icon: <Target size={16} />,
  },
  {
    key: 'cagr', label: 'CAGR',
    metricKey: 'cagr',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    goodWhen: 'higher',
    icon: <BarChart3 size={16} />,
  },
  {
    key: 'sortino', label: 'Sortino Ratio',
    metricKey: 'sortino',
    format: (v) => v.toFixed(2),
    goodWhen: 'higher',
    icon: <Activity size={16} />,
  },
]

function getColor(val: number, goodWhen: 'higher' | 'lower'): string {
  if (goodWhen === 'higher') return val > 0 ? 'var(--accent-green)' : 'var(--accent-red)'
  return val < 0 ? 'var(--accent-red)' : 'var(--accent-green)'
}

function getDelta(trader: number, expert: number, goodWhen: 'higher' | 'lower'): { text: string; color: string } {
  const diff = trader - expert
  const sign = diff >= 0 ? '+' : ''
  const formatted = `${sign}${diff.toFixed(2)}`
  const isGood = goodWhen === 'higher' ? diff >= 0 : diff <= 0
  return { text: `${formatted} vs Expert`, color: isGood ? 'var(--accent-green)' : 'var(--accent-red)' }
}

export default function MetricsGrid() {
  const tearsheet = useIRISStore((s) => s.tearsheet)

  if (!tearsheet) return null

  const trader = tearsheet.trader_metrics
  const expert = tearsheet.expert_metrics

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '0.75rem',
    }}>
      {KPI_CONFIG.map((kpi, i) => {
        const traderVal = trader[kpi.metricKey] as number
        const expertVal = expert ? (expert[kpi.metricKey] as number) : 0
        const delta = expert ? getDelta(traderVal, expertVal, kpi.goodWhen) : null

        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="iris-card"
            style={{ padding: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{kpi.icon}</span>
              <span className="font-mono" style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {kpi.label}
              </span>
            </div>

            <div className="font-mono" style={{
              fontSize: '1.375rem',
              fontWeight: 500,
              color: getColor(traderVal, kpi.goodWhen),
            }}>
              {kpi.format(traderVal)}
            </div>

            {delta && (
              <div className="font-mono" style={{
                fontSize: '0.6875rem',
                color: delta.color,
                marginTop: '0.375rem',
              }}>
                {delta.text}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
