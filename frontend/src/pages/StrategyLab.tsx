import { useIRISStore } from '../store/irisStore'
import TearsheetLayout from '../components/Tearsheet'
import { AlertCircle, RotateCcw, Play, Activity } from 'lucide-react'
import QuantWorkspace from '../components/QuantWorkspace'
import AgentPipeline from '../components/AgentPipeline'

export default function StrategyLab() {
  const { appPhase, error, resetPipeline } = useIRISStore()

  return (
    <QuantWorkspace>
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

        {appPhase === 'idle' && (
          <div className="center-box" style={{ marginTop: '4rem', opacity: 0.8 }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: '50%', background: 'var(--teal-lo)', 
              margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--teal-md)'
            }}>
              <Activity size={32} color="var(--accent-teal)" />
            </div>
            <h1 className="font-mono" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Quant Strategy Lab
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 2rem', lineHeight: 1.6 }}>
              Welcome to the IRIS Quant Intelligence workstation. Use the 
              <strong> Strategy Input</strong> panel in the left drawer to describe your strategy and begin the simulation.
            </p>
            <div className="hint font-mono">
              <Play size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Ready to start? Enter your strategy and click RUN IRIS.
            </div>
          </div>
        )}

        {appPhase !== 'idle' && <AgentPipeline />}
        {(appPhase === 'complete' || appPhase === 'running') && <TearsheetLayout />}
      </div>
    </QuantWorkspace>
  )
}
