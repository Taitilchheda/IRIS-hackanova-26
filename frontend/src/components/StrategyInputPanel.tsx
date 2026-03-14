import { Play, ChevronDown } from 'lucide-react'
import { useIRISStore, EXPERT_OPTIONS } from '../store/irisStore'
import type { ExpertType } from '../store/irisStore'

const PLACEHOLDER_STRATEGIES = [
  'Buy when the 50-day MA crosses above the 200-day MA, sell when RSI exceeds 70...',
  'Buy AAPL when MACD histogram turns positive, sell when it turns negative...',
  'Go long when Bollinger Band width contracts below 2%, exit on 3% trailing stop...',
]

export default function StrategyInputPanel({ compact = false }: { compact?: boolean } = {}) {
  const {
    prompt, asset, startDate, endDate, capital,
    commissionBps, slippageBps, maxPositionPct, expertType,
    appPhase,
    setPrompt, setAsset, setStartDate, setEndDate, setCapital,
    setCommissionBps, setSlippageBps, setMaxPositionPct, setExpertType,
    runPipeline,
  } = useIRISStore()

  const isRunning = appPhase === 'running'
  const placeholder = PLACEHOLDER_STRATEGIES[Math.floor(Date.now() / 60000) % PLACEHOLDER_STRATEGIES.length]

  return (
    <div className="strategy-panel" style={{ background: compact ? 'var(--panel)' : 'var(--bg-surface)', border: compact ? '1px solid var(--border2)' : '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
      <div className="panel-header">
        <h2 className="font-mono">Strategy Input</h2>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }} className="font-mono">
          Describe your trading strategy in plain English
        </span>
      </div>

      {/* Strategy textarea */}
      <textarea
        className="iris-input strategy-textarea font-mono"
        placeholder={placeholder}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        disabled={isRunning}
      />

      {/* Config grid */}
      <div className="config-grid">
        {/* Asset */}
        <div className="config-field">
          <label className="config-label">Asset</label>
          <input
            className="iris-input font-mono"
            type="text"
            value={asset}
            onChange={(e) => setAsset(e.target.value.toUpperCase())}
            placeholder="AAPL"
            disabled={isRunning}
          />
        </div>

        {/* Date range */}
        <div className="config-field">
          <label className="config-label">From</label>
          <input
            className="iris-input font-mono"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isRunning}
          />
        </div>
        <div className="config-field">
          <label className="config-label">To</label>
          <input
            className="iris-input font-mono"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isRunning}
          />
        </div>

        {/* Capital */}
        <div className="config-field">
          <label className="config-label">Capital ($)</label>
          <input
            className="iris-input font-mono"
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            min={1000}
            step={1000}
            disabled={isRunning}
          />
        </div>

        {/* Commission */}
        <div className="config-field">
          <label className="config-label">Commission (bps)</label>
          <input
            className="iris-input font-mono"
            type="number"
            value={commissionBps}
            onChange={(e) => setCommissionBps(Number(e.target.value))}
            min={0}
            max={100}
            step={1}
            disabled={isRunning}
          />
        </div>

        {/* Slippage */}
        <div className="config-field">
          <label className="config-label">Slippage (bps)</label>
          <input
            className="iris-input font-mono"
            type="number"
            value={slippageBps}
            onChange={(e) => setSlippageBps(Number(e.target.value))}
            min={0}
            max={100}
            step={1}
            disabled={isRunning}
          />
        </div>

        {/* Max position */}
        <div className="config-field">
          <label className="config-label">Max Position (%)</label>
          <input
            className="iris-input font-mono"
            type="number"
            value={maxPositionPct}
            onChange={(e) => setMaxPositionPct(Number(e.target.value))}
            min={1}
            max={100}
            step={1}
            disabled={isRunning}
          />
        </div>

        {/* Expert type */}
        <div className="config-field config-field-wide">
          <label className="config-label">Expert Agent</label>
          <div className="select-wrapper">
            <select
              className="iris-input font-mono"
              value={expertType}
              onChange={(e) => setExpertType(e.target.value as ExpertType)}
              disabled={isRunning}
            >
              {EXPERT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-icon" />
          </div>
        </div>
      </div>

      {/* Run button */}
      <button
        className="iris-btn iris-btn-primary run-btn font-mono"
        onClick={runPipeline}
        disabled={isRunning || !prompt.trim()}
      >
        {isRunning ? (
          <>
            <span className="spinner" /> Running…
          </>
        ) : (
          <>
            <Play size={16} fill="currentColor" /> RUN IRIS
          </>
        )}
      </button>

      <style>{`
        .strategy-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: var(--panel);
          border: 1px solid var(--border2);
          border-radius: 10px;
          padding: 14px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.25);
        }
        .strategy-panel.compact {
          padding: 12px;
          border: 1px solid var(--border2);
          box-shadow: none;
        }
        .panel-header {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .panel-header h2 {
          font-size: 1rem;
          color: var(--text-primary);
          letter-spacing: 0.02em;
        }
        .strategy-textarea {
          resize: vertical;
          min-height: 100px;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.75rem;
        }
        .config-field-wide {
          grid-column: span 2;
        }
        .config-label {
          display: block;
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.375rem;
          font-family: var(--font-mono);
        }
        .select-wrapper {
          position: relative;
        }
        .select-wrapper select {
          appearance: none;
          padding-right: 2rem;
        }
        .select-icon {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          pointer-events: none;
        }
        .run-btn {
          width: 100%;
          padding: 0.875rem;
          font-size: 0.9375rem;
          margin-top: 0.5rem;
        }
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .config-grid {
            grid-template-columns: 1fr 1fr;
          }
          .config-field-wide {
            grid-column: span 2;
          }
        }
      `}</style>
    </div>
  )
}
