import { Settings as SettingsIcon, Save } from 'lucide-react'
import { useIRISStore, EXPERT_OPTIONS } from '../store/irisStore'
import type { ExpertType } from '../store/irisStore'
import { useState } from 'react'
import QuantWorkspace from '../components/QuantWorkspace'

export default function Settings() {
  const {
    capital, commissionBps, slippageBps, maxPositionPct, mcPaths, expertType,
    setCapital, setCommissionBps, setSlippageBps, setMaxPositionPct, setMcPaths, setExpertType,
    backendAlive,
  } = useIRISStore()

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <QuantWorkspace>
      <div className="main-stack">
        <div className="card-header">
          <SettingsIcon size={18} color="var(--teal)" />
          <h1 className="font-mono">Settings</h1>
        </div>

        <div className="iris-card">
          <h3 className="section-title">System Status</h3>
          <div className="status-row">
            <span className={`dot ${backendAlive ? 'dot-green' : 'dot-red'}`} />
            <span className={`font-mono ${backendAlive ? 'pos' : 'neg'}`}>
              Backend {backendAlive ? 'Connected' : 'Disconnected'}
            </span>
            <span className="hint">(http://localhost:8000)</span>
          </div>
        </div>

        <div className="iris-card">
          <h3 className="section-title">Default Backtest Configuration</h3>
          <div className="config-grid">
            <ConfigField label="Initial Capital ($)">
              <input className="iris-input font-mono" type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} min={1000} step={1000} />
            </ConfigField>
            <ConfigField label="Commission (bps)">
              <input className="iris-input font-mono" type="number" value={commissionBps} onChange={(e) => setCommissionBps(Number(e.target.value))} min={0} max={100} />
            </ConfigField>
            <ConfigField label="Slippage (bps)">
              <input className="iris-input font-mono" type="number" value={slippageBps} onChange={(e) => setSlippageBps(Number(e.target.value))} min={0} max={100} />
            </ConfigField>
            <ConfigField label="Max Position (%)">
              <input className="iris-input font-mono" type="number" value={maxPositionPct} onChange={(e) => setMaxPositionPct(Number(e.target.value))} min={1} max={100} />
            </ConfigField>
            <ConfigField label="Monte Carlo Paths">
              <input className="iris-input font-mono" type="number" value={mcPaths} onChange={(e) => setMcPaths(Number(e.target.value))} min={100} max={50000} step={100} />
            </ConfigField>
            <ConfigField label="Default Expert Agent">
              <select className="iris-input font-mono" value={expertType} onChange={(e) => setExpertType(e.target.value as ExpertType)}>
                {EXPERT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </ConfigField>
          </div>
          <button className="iris-btn iris-btn-primary font-mono" onClick={handleSave} style={{ marginTop: '1.25rem', width: '100%' }}>
            <Save size={14} />
            {saved ? 'Saved ✓' : 'Save Defaults'}
          </button>
        </div>

        <div className="iris-card">
          <h3 className="section-title">About IRIS</h3>
          <p className="body-text">
            <strong className="accent">IRIS</strong> — Intelligent Reasoning & Inferential Simulator. An AI-powered backtesting tool that accepts trading strategies in plain English, parses them into executable rules, runs realistic historical simulations, and returns performance tearsheets with equity curves, Sharpe ratios, and drawdown analysis.
          </p>
          <p className="footnote">v0.2.0</p>
        </div>
      </div>
    </QuantWorkspace>
  )
}

function ConfigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="config-field">
      <label className="config-label">{label}</label>
      {children}
    </div>
  )
}
