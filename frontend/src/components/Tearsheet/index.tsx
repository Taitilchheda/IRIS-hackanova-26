import { motion } from 'framer-motion'
import EquityCurve from './EquityCurve'
import MetricsGrid from './MetricsGrid'
import ComparisonTable from './ComparisonTable'
import IrisSaysPanel from './IrisSaysPanel'
import { useIRISStore } from '../../store/irisStore'

export default function TearsheetLayout() {
  const tearsheet = useIRISStore((s) => s.tearsheet)
  const appPhase = useIRISStore((s) => s.appPhase)

  if (!tearsheet || appPhase === 'idle') return null

  // Show skeleton while running
  if (appPhase === 'running') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="skeleton" style={{ height: 360, borderRadius: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {/* Strategy info banner */}
      <div className="iris-card" style={{
        padding: '0.75rem 1.25rem',
        display: 'flex',
        gap: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Run: <span style={{ color: 'var(--accent-teal)' }}>{tearsheet.run_id.slice(0, 8)}</span>
        </span>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Asset: <span style={{ color: 'var(--text-primary)' }}>{tearsheet.strategy_spec.asset}</span>
        </span>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Period: <span style={{ color: 'var(--text-primary)' }}>
            {tearsheet.strategy_spec.start_date} → {tearsheet.strategy_spec.end_date}
          </span>
        </span>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Capital: <span style={{ color: 'var(--text-primary)' }}>
            ${tearsheet.strategy_spec.initial_capital.toLocaleString()}
          </span>
        </span>
        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Expert: <span style={{ color: 'var(--accent-amber)' }}>{tearsheet.expert_type}</span>
        </span>
      </div>

      {/* Two-column layout: chart + metrics */}
      <div className="tearsheet-grid">
        <div className="tearsheet-chart">
          <EquityCurve />
        </div>
        <div className="tearsheet-metrics">
          <MetricsGrid />
        </div>
      </div>

      {/* Comparison table */}
      <ComparisonTable />

      {/* Parsed rules (if available) */}
      {tearsheet.strategy_spec.parsed_rules_text && (
        <div className="iris-card" style={{ padding: '1.25rem' }}>
          <h3 className="font-mono" style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.75rem',
          }}>
            Parsed Rules
          </h3>
          <pre className="font-mono" style={{
            fontSize: '0.75rem',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            padding: '1rem',
            background: 'var(--bg-base)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}>
            {tearsheet.strategy_spec.parsed_rules_text}
          </pre>
        </div>
      )}

      {/* IRIS Says */}
      <IrisSaysPanel />

      <style>{`
        .tearsheet-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .tearsheet-chart {
          grid-column: 1;
        }
        .tearsheet-metrics {
          grid-column: 2;
          display: flex;
          flex-direction: column;
          justify-content: stretch;
        }
        @media (max-width: 1279px) {
          .tearsheet-grid {
            grid-template-columns: 1fr;
          }
          .tearsheet-chart, .tearsheet-metrics {
            grid-column: 1;
          }
        }
      `}</style>
    </motion.div>
  )
}
