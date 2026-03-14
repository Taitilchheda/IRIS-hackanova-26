import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, Circle, XCircle } from 'lucide-react'
import { useIRISStore, AGENT_NAMES } from '../store/irisStore'
import type { AgentStatus } from '../store/irisStore'

function StatusIcon({ status }: { status: AgentStatus }) {
  switch (status) {
    case 'done':
      return <CheckCircle2 size={18} color="var(--accent-green)" />
    case 'running':
      return (
        <span className="pulse-dot" style={{
          display: 'inline-block',
          width: 12, height: 12,
          background: 'var(--accent-teal)',
          borderRadius: '50%',
          boxShadow: '0 0 10px var(--accent-teal)',
        }} />
      )
    case 'error':
      return <XCircle size={18} color="var(--accent-red)" />
    default:
      return <Circle size={18} color="var(--text-secondary)" strokeWidth={1.5} />
  }
}

export default function AgentPipeline({ compact = false }: { compact?: boolean }) {
  const agentStatuses = useIRISStore((s) => s.agentStatuses)
  const appPhase = useIRISStore((s) => s.appPhase)

  if (appPhase === 'idle') return null

  return (
    <div className={compact ? '' : 'iris-card'} style={{ padding: compact ? 0 : '1.25rem' }}>
      {!compact && (
        <h3 className="font-mono" style={{
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '1rem',
        }}>
          Agent Pipeline
        </h3>
      )}

      <div className="pipeline">
        {AGENT_NAMES.map((name, i) => {
          const info = agentStatuses[name]
          if (!info) return null

          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="pl-row"
            >
              <span className={`pl-dot ${info.status === 'running' ? 'd-run' : info.status === 'done' ? 'd-done' : info.status === 'error' ? 'd-error' : 'd-idle'}`} />
              <span className="font-mono" style={{ fontSize: '0.8125rem', minWidth: '140px', color: 'var(--text-primary)' }}>
                {name}
              </span>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1 }}>
                {info.message}
              </span>
              {info.status === 'running' && (
                <Loader2 size={14} color="var(--accent-teal)" style={{ animation: 'spin 1s linear infinite' }} />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )}
