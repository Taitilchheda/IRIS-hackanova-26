import { useIRISStore } from '../store/irisStore'
import TearsheetLayout from '../components/Tearsheet'
import StrategyInputPanel from '../components/StrategyInputPanel'
import { AlertCircle, RotateCcw } from 'lucide-react'
import QuantWorkspace from '../components/QuantWorkspace'
import AgentPipeline from '../components/AgentPipeline'

export default function StrategyLab() {
  const { appPhase, error, resetPipeline } = useIRISStore()

  return (
    <QuantWorkspace>
      <div className="strategy-lab-layout">
        <div className="strategy-lab-sidebar">
          <StrategyInputPanel compact={true} />
        </div>
        <div className="main-stack">
          {appPhase === 'error' && error && (
          <div className="iris-card" style={{
            padding: '1rem 1.25rem',
            borderColor: 'rgba(255, 77, 106, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <AlertCircle size={20} color="var(--accent-red)" />
            <div style={{ flex: 1 }}>
              <p className="font-mono" style={{ color: 'var(--accent-red)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Pipeline Error
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{error}</p>
            </div>
            <button className="iris-btn iris-btn-secondary" onClick={resetPipeline}>
              <RotateCcw size={14} /> Retry
            </button>
          </div>
        )}

        {appPhase !== 'idle' && <AgentPipeline />}
        {(appPhase === 'complete' || appPhase === 'running') && <TearsheetLayout />}
        </div>
      </div>
    </QuantWorkspace>
  )
}
