import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useIRISStore } from '../store/irisStore'

export default function AutomateModal() {
  const {
    automateUseExpert,
    automateResult,
    appPhase,
    closeAutomateModal,
    confirmAutomate,
    tearsheet,
  } = useIRISStore()

  const [confirmed, setConfirmed] = useState(false)
  const isAutomating = appPhase === 'automating'
  const strategyLabel = automateUseExpert ? 'Expert Strategy' : 'Your Strategy'

  const handleConfirm = async () => {
    setConfirmed(true)
    await confirmAutomate()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isAutomating) closeAutomateModal()
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="iris-card"
          style={{
            width: '100%',
            maxWidth: '480px',
            margin: '1rem',
            position: 'relative',
          }}
        >
          {/* Close button */}
          {!isAutomating && (
            <button
              onClick={closeAutomateModal}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', padding: '0.25rem',
              }}
            >
              <X size={18} />
            </button>
          )}

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <Zap size={20} color="var(--accent-teal)" />
            <h3 className="font-mono" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
              Automate Strategy
            </h3>
          </div>

          {/* Confirmation content */}
          {!confirmed && !automateResult && (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                You are about to deploy <strong style={{ color: 'var(--accent-teal)' }}>{strategyLabel}</strong> for
                automated execution.
              </p>

              {tearsheet && (
                <div className="iris-card-elevated" style={{
                  padding: '0.875rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.8125rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>Run ID</span>
                    <span className="font-mono" style={{ color: 'var(--accent-teal)' }}>
                      {tearsheet.run_id.slice(0, 12)}…
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>Asset</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {tearsheet.strategy_spec.asset}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>Strategy</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {automateUseExpert ? tearsheet.expert_type : 'Trader'}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="iris-btn iris-btn-secondary font-mono"
                  onClick={closeAutomateModal}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  className="iris-btn iris-btn-primary font-mono"
                  onClick={handleConfirm}
                  style={{ flex: 1 }}
                >
                  <Zap size={14} /> Confirm Deploy
                </button>
              </div>
            </>
          )}

          {/* Automating in progress */}
          {isAutomating && !automateResult && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <Loader2 size={32} color="var(--accent-teal)" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
              <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Deploying strategy…
              </p>
              <div className="progress-bar" style={{ marginTop: '1rem' }}>
                <div className="progress-bar-fill" style={{ width: '60%', animation: 'progress-fill 3s ease-in-out' }} />
              </div>
            </div>
          )}

          {/* Result */}
          {automateResult && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              {automateResult.error ? (
                <>
                  <AlertCircle size={36} color="var(--accent-red)" style={{ marginBottom: '0.75rem' }} />
                  <p className="font-mono" style={{ color: 'var(--accent-red)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Automation Failed
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                    {automateResult.error}
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 size={36} color="var(--accent-green)" style={{ marginBottom: '0.75rem' }} />
                  <p className="font-mono" style={{ color: 'var(--accent-green)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Strategy Deployed Successfully
                  </p>
                  {automateResult.message && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {automateResult.message}
                    </p>
                  )}
                </>
              )}

              <button
                className="iris-btn iris-btn-secondary font-mono"
                onClick={closeAutomateModal}
                style={{ marginTop: '1.25rem' }}
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
