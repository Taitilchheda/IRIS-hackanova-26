import React, { useEffect, useRef, useState } from 'react'
import { useIRISStore } from './store/irisStore'
import { runStrategy, type Tearsheet } from './api/client'
import './index.css'

// ── Types ────────────────────────────────────────────────────────────────────
type RTab = 'metrics' | 'analysis' | 'trades' | 'iris'
type CTab = 'equity' | 'drawdown' | 'montecarlo' | 'rolling' | 'waterfall' | 'volume'

// ── Visualization Helpers ───────────────────────────────────────────────────

function setupCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const dpr = window.devicePixelRatio || 1
  canvas.width = canvas.offsetWidth * dpr
  canvas.height = canvas.offsetHeight * dpr
  ctx.scale(dpr, dpr)
  ctx.imageSmoothingEnabled = true
  return ctx
}

function drawDistChart(canvas: HTMLCanvasElement, ts: Tearsheet | null) {
  const ctx = setupCanvas(canvas)
  if (!ctx || !ts || !ts.expert.paths) return
  const w = canvas.offsetWidth, h = canvas.offsetHeight
  ctx.clearRect(0, 0, w, h)

  const paths = ts.expert.paths
  const finals = paths.map(p => p[p.length - 1]).sort((a, b) => a - b)
  const n = 40
  const mn = finals[0], mx = finals[finals.length - 1]
  const bw = (mx - mn) / (n || 1)
  const counts = new Array(n).fill(0)
  finals.forEach(v => {
    const b = Math.min(Math.floor((v - mn) / (bw || 1)), n - 1)
    if (b >= 0) counts[b]++
  })

  const maxC = Math.max(...counts) || 1
  const p5 = finals[Math.floor(finals.length * 0.05)]
  const p95 = finals[Math.floor(finals.length * 0.95)]

  counts.forEach((cnt, i) => {
    const x = (i / n) * w, bwPx = Math.max(w / n - 1, 1)
    const barH = (cnt / maxC) * h * 0.85
    const midV = mn + (i + 0.5) * bw
    ctx.fillStyle = midV <= p5 ? 'rgba(255,61,90,0.7)' : midV >= p95 ? 'rgba(0,232,122,0.7)' : 'rgba(0,255,224,0.35)'
    ctx.fillRect(x, h - barH, bwPx, barH)
  })
}

function drawHeatmap(canvas: HTMLCanvasElement) {
  const ctx = setupCanvas(canvas)
  if (!ctx) return
  const w = canvas.offsetWidth, h = canvas.offsetHeight
  ctx.clearRect(0, 0, w, h)
  const rows = 5, cols = 12
  const ch = h / rows, cw = w / cols
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = Math.random()
      ctx.fillStyle = val > 0.7 ? '#00e87a' : val > 0.4 ? '#2e4a60' : val > 0.2 ? '#ffb800' : '#ff3d5a'
      ctx.globalAlpha = 0.7
      ctx.fillRect(c * cw, r * ch, cw - 1, ch - 1)
    }
  }
  ctx.globalAlpha = 1.0
}

function drawRollingChart(canvas: HTMLCanvasElement, ts: Tearsheet | null) {
  const ctx = setupCanvas(canvas)
  if (!ctx || !ts) return
  const w = canvas.offsetWidth, h = canvas.offsetHeight
  ctx.clearRect(0, 0, w, h)
  const pad = { t: 30, r: 20, b: 30, l: 60 }
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b

  const data = new Array(100).fill(0).map((_, i) => Math.sin(i / 10) + 1.5 + Math.random() * 0.5)
  const min = 0, max = 4
  ctx.beginPath(); ctx.strokeStyle = '#ffb800'; ctx.lineWidth = 1.5
  data.forEach((v, i) => {
    const x = pad.l + (i / (data.length - 1)) * cw
    const y = pad.t + ch - ((v - min) / (max - min)) * ch
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  })
  ctx.stroke()
}

function drawWaterfallChart(canvas: HTMLCanvasElement, ts: Tearsheet | null) {
  const ctx = setupCanvas(canvas)
  if (!ctx || !ts) return
  const w = canvas.offsetWidth, h = canvas.offsetHeight
  ctx.clearRect(0, 0, w, h)
  const bars = [
    { label: 'ALPHA', val: 0.12, col: '#00ffe0' },
    { label: 'BETA', val: 0.08, col: '#4d9fff' },
    { label: 'COSTS', val: -0.03, col: '#ff3d5a' },
    { label: 'TOTAL', val: 0.17, col: '#ffb800' }
  ]
  const bw = w / bars.length - 20
  bars.forEach((b, i) => {
    const x = i * (w / bars.length) + 10
    const barH = Math.abs(b.val) * 400
    ctx.fillStyle = b.col
    ctx.fillRect(x, h/2 - (b.val > 0 ? barH : 0), bw, barH)
    ctx.fillStyle = '#d4e4f0'; ctx.font = '8px Syne'
    ctx.fillText(b.label, x, h/2 + (b.val > 0 ? 10 : -5))
  })
}

function drawVolumeSignalChart(canvas: HTMLCanvasElement, ts: Tearsheet | null) {
  const ctx = setupCanvas(canvas)
  if (!ctx || !ts) return
  const w = canvas.offsetWidth, h = canvas.offsetHeight
  ctx.clearRect(0, 0, w, h)
  const n = 60; const bw = w / n - 1
  for (let i = 0; i < n; i++) {
    const vh = Math.random() * h * 0.6
    ctx.fillStyle = 'rgba(77, 159, 255, 0.2)'
    ctx.fillRect(i * (w / n), h - vh, bw, vh)
    if (Math.random() > 0.9) {
      ctx.fillStyle = '#00ffe0'
      ctx.beginPath(); ctx.arc(i * (w / n) + bw/2, h - vh - 10, 3, 0, Math.PI * 2); ctx.fill()
    }
  }
}

// ── Main App Component ───────────────────────────────────────────────────────

export default function App() {
  const store = useIRISStore()
  const [rTab, setRTab] = useState<RTab>('metrics')
  const [cTab, setCTab] = useState<CTab>('equity')
  const [showTrader, setShowTrader] = useState(true)
  const [showExpert, setShowExpert] = useState(true)
  const [showSpy, setShowSpy] = useState(true)

  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const ddCanvasRef = useRef<HTMLCanvasElement>(null)
  const volCanvasRef = useRef<HTMLCanvasElement>(null)
  const mcMiniRef = useRef<HTMLCanvasElement>(null)
  const distCanvasRef = useRef<HTMLCanvasElement>(null)
  const heatmapRef = useRef<HTMLCanvasElement>(null)
  const rollingRightRef = useRef<HTMLCanvasElement>(null)

  const ts = store.tearsheet

  // ── Drawing Logic ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mainCanvasRef.current) return
    const ctx = setupCanvas(mainCanvasRef.current)
    if (!ctx) return
    const w = mainCanvasRef.current.offsetWidth, h = mainCanvasRef.current.offsetHeight
    ctx.clearRect(0, 0, w, h)

    if (!ts) {
      ctx.fillStyle = '#2e4a60'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center'
      ctx.fillText('RUN IRIS TO MATERIALIZE DATA...', w / 2, h / 2)
      return
    }

    const pad = { t: 30, r: 20, b: 30, l: 60 }
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b

    // Simple Line Drawing Logic
    const drawSeries = (data: number[], color: string, dashed = false) => {
      const min = Math.min(...data), max = Math.max(...data), range = (max - min) || 1
      const pts = data.map((v, i) => ({
        x: pad.l + (i / (data.length - 1)) * cw,
        y: pad.t + ch - ((v - min) / range) * ch
      }))
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5
      if (dashed) ctx.setLineDash([3, 3]); else ctx.setLineDash([])
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
      ctx.stroke()
    }

    if (cTab === 'equity' || cTab === 'drawdown') {
      if (showSpy) drawSeries(ts.benchmark_equity, '#2e4a60', true)
      if (showExpert) drawSeries(ts.expert.equity_curve, '#ffb800')
      if (showTrader) drawSeries(ts.trader.equity_curve, '#00ffe0')
    } else if (cTab === 'montecarlo' && ts.expert.paths) {
      ts.expert.paths.forEach((path, i) => {
        ctx.beginPath(); ctx.strokeStyle = `rgba(0, 255, 224, ${0.05 + (i % 5) * 0.02})`; ctx.lineWidth = 0.8; ctx.setLineDash([])
        const min = Math.min(...path), max = Math.max(...path), range = (max - min) || 1
        path.forEach((v, j) => {
          const x = pad.l + (j / (path.length - 1)) * cw
          const y = pad.t + ch - ((v - min) / range) * ch
          if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        })
        ctx.stroke()
      })
    } else if (cTab === 'rolling') {
      drawRollingChart(mainCanvasRef.current, ts)
    } else if (cTab === 'waterfall') {
      drawWaterfallChart(mainCanvasRef.current, ts)
    } else if (cTab === 'volume') {
      drawVolumeSignalChart(mainCanvasRef.current, ts)
    }

    if (distCanvasRef.current) drawDistChart(distCanvasRef.current, ts)
    if (heatmapRef.current) drawHeatmap(heatmapRef.current)
    if (rollingRightRef.current) drawRollingChart(rollingRightRef.current, ts)
  }, [ts, cTab, showTrader, showExpert, showSpy, rTab])

  useEffect(() => {
    if (!ts || !mcMiniRef.current) return
    const ctx = setupCanvas(mcMiniRef.current)
    if (!ctx || !ts.expert.paths) return
    const w = mcMiniRef.current.offsetWidth, h = mcMiniRef.current.offsetHeight
    ctx.clearRect(0, 0, w, h)
    ts.expert.paths.slice(0, 20).forEach((path) => {
      ctx.beginPath(); ctx.strokeStyle = `rgba(0, 255, 224, 0.1)`; ctx.lineWidth = 0.5
      const min = Math.min(...path), max = Math.max(...path), range = (max - min) || 1
      path.forEach((v, j) => {
        const x = (j / (path.length - 1)) * w
        const y = h - ((v - min) / range) * h
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      })
      ctx.stroke()
    })
  }, [ts])

  async function handleRun() {
    store.setRunning(true); store.setError(null); store.setTearsheet(null); store.resetAgents()
    try {
      const result = await runStrategy({
        prompt: store.prompt, asset: store.asset,
        start_date: store.startDate, end_date: store.endDate,
        initial_capital: store.capital,
        monte_carlo_paths: store.mcPaths,
        expert_type: store.expertType,
        commission_bps: store.commissionBps,
        slippage_bps: store.slippageBps,
        max_position_pct: store.maxPositionPct / 100
      })
      store.setTearsheet(result)
      const mockAgents = ['Manager Agent', 'Trader Strategy', 'Risk Analysis', 'Verifier', 'Comparator']
      mockAgents.forEach(a => store.setAgentStatus(a, 'done', 0.5))
    } catch (e: unknown) {
      const err = e as Error;
      store.setError(err.message || 'Pipeline error');
    } finally {
      store.setRunning(false)
    }
  }

  const tm = ts?.trader_metrics

  // Calculate MC stats if paths exist
  let mcStats = { p5: 0, median: 0, p95: 0 }
  if (ts?.expert.paths && ts.expert.paths.length > 0) {
    const finals = ts.expert.paths.map(p => p[p.length - 1]).sort((a, b) => a - b)
    mcStats = {
      p5: finals[Math.floor(finals.length * 0.05)],
      median: finals[Math.floor(finals.length * 0.5)],
      p95: finals[Math.floor(finals.length * 0.95)]
    }
  }

  return (
    <>
      <div id="topbar">
        <div className="tb-logo"><div className="tb-logo-pulse"></div>IRIS</div>
        <div className="tb-tabs">
          <div className="tb-tab active">STRATEGY LAB</div>
          <div className="tb-tab">PORTFOLIO</div>
          <div className="tb-tab">RISK DESK</div>
          <div className="tb-tab">SIGNALS</div>
          <div className="tb-tab">EXECUTION</div>
        </div>
        <div className="tb-right">
          <div className="tb-stat"><span className="tb-stat-label">{store.asset}</span><span className="tb-stat-val kv-up">$213.47</span></div>
          <div className="tb-divider"></div>
          <div className="tb-stat"><span className="tb-stat-label">VIX</span><span className="tb-stat-val kv-nu">18.32</span></div>
          <div className="tb-divider"></div>
          <div className="tb-stat"><span className="tb-stat-label">SPY</span><span className="tb-stat-val kv-up">+0.84%</span></div>
          <div className="tb-divider"></div>
          <div className="tb-badge">PAPER ACTIVE</div>
        </div>
      </div>

      <div id="main">
        <div id="left">
          <div className="lp-section">
            <div className="section-hdr">STRATEGY INPUT <span className="section-hdr-btn" onClick={() => store.setPrompt('Buy AAPL when 50-day MA > 200-day MA.')}>EXAMPLE</span></div>
            <textarea id="stratInput" value={store.prompt} onChange={e => store.setPrompt(e.target.value)} />
          </div>
          <div className="lp-section">
            <div className="section-hdr">UNIVERSE & PERIOD</div>
            <select className="ctrl-select" value={store.asset} onChange={e => store.setAsset(e.target.value)}>
              {['AAPL', 'SPY', 'QQQ', 'BTC-USD', 'NVDA', 'TSLA'].map(a => <option key={a}>{a}</option>)}
            </select>
            <div className="date-grid">
              <input className="ctrl-input" value={store.startDate} onChange={e => store.setStartDate(e.target.value)} />
              <input className="ctrl-input" value={store.endDate} onChange={e => store.setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="lp-section">
            <div className="section-hdr">PARAMETERS</div>
            <div className="ctrl-row"><span className="ctrl-label">CAPITAL</span><span className="ctrl-val">${store.capital.toLocaleString()}</span></div>
            <input type="range" min="10000" max="1000000" step="10000" value={store.capital} onChange={e => store.setCapital(+e.target.value)} />

            <div className="ctrl-row"><span className="ctrl-label">COMMISSION BPS</span><span className="ctrl-val">{store.commissionBps}</span></div>
            <input type="range" min="0" max="50" step="1" value={store.commissionBps} onChange={e => store.setCommissionBps(+e.target.value)} />

            <div className="ctrl-row"><span className="ctrl-label">SLIPPAGE BPS</span><span className="ctrl-val">{store.slippageBps}</span></div>
            <input type="range" min="0" max="20" step="1" value={store.slippageBps} onChange={e => store.setSlippageBps(+e.target.value)} />

            <div className="ctrl-row"><span className="ctrl-label">MAX POSITION %</span><span className="ctrl-val">{store.maxPositionPct}%</span></div>
            <input type="range" min="1" max="100" step="1" value={store.maxPositionPct} onChange={e => store.setMaxPositionPct(+e.target.value)} />

            <div className="ctrl-row"><span className="ctrl-label">MC PATHS</span><span className="ctrl-val">{store.mcPaths}</span></div>
            <input type="range" min="100" max="2000" step="100" value={store.mcPaths} onChange={e => store.setMcPaths(+e.target.value)} />
          </div>

          <div className="lp-section">
            <div className="section-hdr">EXPERT BENCHMARK</div>
            <div className="algo-list">
              {[
                { id: 'risk_analysis', label: 'Risk Analysis', tag: 'Monte Carlo', cls: 'tag-risk' },
                { id: 'alpha_signal', label: 'Alpha / Signal', tag: 'Kalman Filter', cls: 'tag-alpha' },
                { id: 'derivatives', label: 'Derivatives', tag: 'Black-Scholes', cls: 'tag-deriv' },
                { id: 'microstructure', label: 'Microstructure', tag: 'HMM + VWAP', cls: 'tag-port' },
                { id: 'fixed_income', label: 'Fixed Income', tag: 'Vasicek', cls: 'tag-nu' },
              ].map(a => (
                <div key={a.id} className={`algo-item ${store.expertType === a.id ? 'active' : ''}`} onClick={() => store.setExpertType(a.id)}>
                  <span className="algo-name">{a.label}</span>
                  <span className={`algo-tag ${a.cls}`}>{a.tag}</span>
                </div>
              ))}
            </div>
            <button className="run-btn" onClick={handleRun} disabled={store.isRunning}>▶ RUN IRIS</button>
          </div>
          <div className="lp-section">
            <div className="section-hdr">AGENT PIPELINE</div>
            <div className="agent-pipeline">
              {Object.entries(store.agentStatuses).map(([name, s]) => (
                <div key={name} className="ag-row">
                  <div className={`ag-dot dot-${s.status}`} />
                  <div className="ag-name">{name}</div>
                  <div className={`ag-status st-${s.status}`}>{s.status.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="center">
          <div id="chart-tabs">
            {[
              { id: 'equity', label: 'EQUITY' },
              { id: 'drawdown', label: 'DRAWDOWN' },
              { id: 'montecarlo', label: 'MONTE CARLO' },
              { id: 'rolling', label: 'ROLLING METRICS' },
              { id: 'waterfall', label: 'P&L WATERFALL' },
              { id: 'volume', label: 'VOLUME SIGNAL' }
            ].map(t => (
              <div key={t.id} className={`ct-tab ${cTab === t.id ? 'active' : ''}`} onClick={() => setCTab(t.id as CTab)}>{t.label}</div>
            ))}
            <div className="ct-right">
              <div className={`ct-toggle ${showTrader ? 'on' : ''}`} onClick={() => setShowTrader(!showTrader)}>TRADER</div>
              <div className={`ct-toggle ${showExpert ? 'on' : ''}`} onClick={() => setShowExpert(!showExpert)}>EXPERT</div>
              <div className={`ct-toggle ${showSpy ? 'on' : ''}`} onClick={() => setShowSpy(!showSpy)}>SPY</div>
            </div>
          </div>
          <div id="charts-area">
            <div className="chart-pane"><canvas ref={mainCanvasRef} /></div>
            <div className="chart-pane"><canvas ref={ddCanvasRef} /></div>
            <div className="chart-pane"><canvas ref={volCanvasRef} /></div>
          </div>
        </div>

        <div id="right">
          <div className="rp-tabs">
            {['metrics', 'analysis', 'trades', 'iris'].map(t => (
              <div key={t} className={`rp-tab ${rTab === t ? 'active' : ''}`} onClick={() => setRTab(t as RTab)}>{t.toUpperCase()}</div>
            ))}
          </div>
          <div className="rp-content">
            {rTab === 'metrics' && (
              <>
                <div className="sub-hdr">PERFORMANCE · YOUR STRATEGY</div>
                <div className="kpi-grid">
                  <div className="kpi">
                    <div className="kpi-l">SHARPE</div>
                    <div className={`kpi-v ${tm ? (tm.sharpe > 1.5 ? 'kv-up' : tm.sharpe > 1.0 ? 'kv-nu' : 'kv-dn') : ''}`}>
                      {tm?.sharpe.toFixed(2) || '—'}
                    </div>
                    <div className="kpi-d">
                      {ts ? `${(tm!.sharpe - ts.expert_metrics.sharpe).toFixed(2)} vs expert` : '—'}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-l">MAX DD</div>
                    <div className="kpi-v kv-dn">
                      {tm ? `${(tm.max_drawdown * 100).toFixed(1)}%` : '—'}
                    </div>
                    <div className="kpi-d">
                      {ts ? `${((tm!.max_drawdown - ts.expert_metrics.max_drawdown) * 100).toFixed(1)}pp vs expert` : '—'}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-l">WIN RATE</div>
                    <div className="kpi-v kv-up">
                      {tm ? `${(tm.win_rate * 100).toFixed(1)}%` : '—'}
                    </div>
                    <div className="kpi-d">{tm?.trade_count || 0} trades</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-l">CAGR</div>
                    <div className="kpi-v kv-up">
                      {tm ? `${(tm.cagr * 100).toFixed(1)}%` : '—'}
                    </div>
                    <div className="kpi-d">
                      {ts ? `vs ${(ts.benchmark_metrics.cagr * 100).toFixed(1)}% SPY` : '—'}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-l">SORTINO</div>
                    <div className="kpi-v kv-up">
                      {tm?.sortino.toFixed(2) || '—'}
                    </div>
                    <div className="kpi-d">
                      {ts ? `${(tm!.sortino - ts.benchmark_metrics.sortino).toFixed(2)} vs SPY` : '—'}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-l">CALMAR</div>
                    <div className="kpi-v kv-up">
                      {tm?.calmar.toFixed(2) || '—'}
                    </div>
                    <div className="kpi-d">{tm && tm.calmar > 1.2 ? 'Excellent' : 'Good'}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-l">TOTAL RETURN</div>
                    <div className="kpi-v kv-up">
                      {tm ? `${(tm.total_return * 100).toFixed(1)}%` : '—'}
                    </div>
                    <div className="kpi-d">
                      {tm ? `$${(store.capital * tm.total_return).toLocaleString()}` : '—'}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-l">VOLATILITY</div>
                    <div className="kpi-v kv-nu">
                      {tm ? `${(tm.volatility * 100).toFixed(1)}%` : '—'}
                    </div>
                    <div className="kpi-d">annualised</div>
                  </div>
                </div>

                <div className="sub-hdr">MONTE CARLO · {store.mcPaths.toLocaleString()} PATHS</div>
                <div id="mc-canvas-wrap"><canvas ref={mcMiniRef} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '12px' }}>
                  <div className="kpi"><div className="kpi-l">P5</div><div className="kpi-v kv-dn" style={{ fontSize: '12px' }}>{ts ? `$${(mcStats.p5 / 1000).toFixed(1)}k` : '—'}</div></div>
                  <div className="kpi"><div className="kpi-l">MEDIAN</div><div className="kpi-v kv-up" style={{ fontSize: '12px' }}>{ts ? `$${(mcStats.median / 1000).toFixed(1)}k` : '—'}</div></div>
                  <div className="kpi"><div className="kpi-l">P95</div><div className="kpi-v kv-up" style={{ fontSize: '12px' }}>{ts ? `$${(mcStats.p95 / 1000).toFixed(1)}k` : '—'}</div></div>
                </div>

                <div className="sub-hdr">FINAL PRICE DISTRIBUTION</div>
                <div id="dist-canvas-wrap"><canvas ref={distCanvasRef} /></div>

                <div className="sub-hdr">RISK DECOMPOSITION</div>
                <div className="risk-bar-row">
                  <div className="risk-bar-label">Market β</div>
                  <div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: '65%', background: 'var(--blue)' }}></div></div>
                  <div className="risk-bar-val">0.64</div>
                </div>
                <div className="risk-bar-row">
                  <div className="risk-bar-label">Idiosync.</div>
                  <div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: '25%', background: 'var(--purple)' }}></div></div>
                  <div className="risk-bar-val">24.8%</div>
                </div>
                <div className="risk-bar-row">
                  <div className="risk-bar-label">Vol Regime</div>
                  <div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: '40%', background: 'var(--amber)' }}></div></div>
                  <div className="risk-bar-val">Med</div>
                </div>
                <div className="risk-bar-row">
                  <div className="risk-bar-label">Tail Risk</div>
                  <div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: '15%', background: 'var(--red)' }}></div></div>
                  <div className="risk-bar-val">Low</div>
                </div>
              </>
            )}

            {rTab === 'analysis' && (
              <>
                <div className="sub-hdr">EXTENDED ANALYSIS</div>
                <div className="analysis-grid">
                  {[
                    { label: 'REGIME DETECT', active: true },
                    { label: 'FACTOR EXPOSURE', active: true },
                    { label: 'GARCH VOL', active: false },
                    { label: 'CORRELATION', active: true },
                    { label: 'PAIRS SPREAD', active: false },
                    { label: 'OPTIONS CHAIN', active: false },
                    { label: 'KELLY SIZING', active: false },
                    { label: 'WALK-FORWARD', active: false }
                  ].map(b => (
                    <div key={b.label} className={`an-btn ${b.active ? 'active' : ''}`}>{b.label}</div>
                  ))}
                </div>

                <div className="sub-hdr">MARKET REGIME HEATMAP · 2019–2024</div>
                <div id="heatmap-wrap">
                  {new Array(6).fill(0).map((_, group) => (
                    <div key={group} className="hm-row">
                      {new Array(12).fill(0).map((_, i) => {
                        const r = Math.random();
                        const color = r < 0.45 ? 'var(--green)' : r < 0.65 ? 'var(--red)' : r < 0.78 ? 'var(--amber)' : 'var(--text3)';
                        return <div key={i} className="hm-cell" style={{ background: color, opacity: 0.7 }} title={`Month ${group * 12 + i + 1}`} />;
                      })}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '8px', color: 'var(--text2)' }}>
                  <span><span style={{ color: 'var(--green)' }}>█</span> BULL</span>
                  <span><span style={{ color: 'var(--red)' }}>█</span> BEAR</span>
                  <span><span style={{ color: 'var(--amber)' }}>█</span> HIGH VOL</span>
                  <span><span style={{ color: 'var(--text3)' }}>█</span> NEUTRAL</span>
                </div>

                <div className="sub-hdr">ROLLING SHARPE (90-DAY)</div>
                <div id="rolling-canvas-wrap"><canvas ref={rollingRightRef} /></div>

                <div className="sub-hdr">FACTOR EXPOSURE</div>
                <div className="risk-bar-row"><div className="risk-bar-label">Market</div><div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: '65%', background: 'var(--blue)' }}></div></div><div className="risk-bar-val">+0.64</div></div>
                <div className="risk-bar-row"><div className="risk-bar-label">Size SMB</div><div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: '30%', background: 'var(--teal)' }}></div></div><div className="risk-bar-val">+0.28</div></div>
                <div className="risk-bar-row"><div className="risk-bar-label">Value HML</div><div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: '15%', background: 'var(--amber)' }}></div></div><div className="risk-bar-val">−0.12</div></div>
                <div className="risk-bar-row"><div className="risk-bar-label">Momentum</div><div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: '55%', background: 'var(--purple)' }}></div></div><div className="risk-bar-val">+0.54</div></div>
                <div className="risk-bar-row"><div className="risk-bar-label">Quality</div><div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: '45%', background: 'var(--green)' }}></div></div><div className="risk-bar-val">+0.41</div></div>

                <div className="sub-hdr">CORRELATION MATRIX</div>
                <div className="corr-grid" style={{ gridTemplateColumns: '40px repeat(5, 1fr)' }}>
                  <div className="corr-cell" style={{ background: 'transparent' }}></div>
                  {['AAPL', 'SPY', 'QQQ', 'GS', 'MSFT'].map(a => <div key={a} className="corr-cell">{a}</div>)}
                  {['AAPL', 'SPY', 'QQQ', 'GS', 'MSFT'].map((ra, ri) => (
                    <React.Fragment key={ra}>
                      <div className="corr-cell">{ra}</div>
                      {[1, 0.78, 0.82, 0.51, 0.88].map((v, ci) => (
                        <div key={ci} className="corr-cell" style={{ background: `rgba(0, 255, 224, ${0.1 + v * 0.5})`, color: 'var(--text)' }}>
                          {(v * (1 - (ri + ci) * 0.05)).toFixed(2)}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>

                <div className="sub-hdr">VAR / CVAR (95%)</div>
                <div className="kpi-grid">
                  <div className="kpi"><div className="kpi-l">1-DAY VaR</div><div className="kpi-v kv-dn" style={{ fontSize: '13px' }}>−1.84%</div></div>
                  <div className="kpi"><div className="kpi-l">1-DAY CVaR</div><div className="kpi-v kv-dn" style={{ fontSize: '13px' }}>−2.91%</div></div>
                  <div className="kpi"><div className="kpi-l">5-DAY VaR</div><div className="kpi-v kv-dn" style={{ fontSize: '13px' }}>−4.12%</div></div>
                  <div className="kpi"><div className="kpi-l">5-DAY CVaR</div><div className="kpi-v kv-dn" style={{ fontSize: '13px' }}>−6.50%</div></div>
                  <div className="kpi"><div className="kpi-l">10-DAY VaR</div><div className="kpi-v kv-dn" style={{ fontSize: '13px' }}>−5.82%</div></div>
                  <div className="kpi"><div className="kpi-l">10-DAY CVaR</div><div className="kpi-v kv-dn" style={{ fontSize: '13px' }}>−9.17%</div></div>
                  <div className="kpi" style={{ gridColumn: 'span 2' }}>
                    <div className="kpi-l">STRESS DD (99.9% / HIST)</div>
                    <div className="kpi-v kv-dn" style={{ fontSize: '15px' }}>−22.4%</div>
                  </div>
                </div>
              </>
            )}

            {rTab === 'trades' && (
              <div className="trade-log">
                <div className="tr-hdr"><div>DATE</div><div>SIDE</div><div>PRICE</div><div>SIZE</div><div>P&L</div></div>
                <div style={{ overflowY: 'visible' }}>
                  {ts?.trader.trade_log.map((t, i) => (
                    <div key={i} className="tr-row">
                      <div>{t.date}</div>
                      <div className={t.side === 'BUY' ? 'tr-buy' : 'tr-sell'}>{t.side}</div>
                      <div>${t.price.toFixed(2)}</div>
                      <div>{t.quantity}</div>
                      <div className={t.pnl_pct && t.pnl_pct >= 0 ? 'tr-pnl-pos' : 'tr-pnl-neg'}>
                        {t.pnl_pct !== null ? `${t.pnl_pct >= 0 ? '+' : ''}${t.pnl_pct.toFixed(1)}%` : '—'}
                      </div>
                    </div>
                  ))}
                  {!ts && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', letterSpacing: '0.1em' }}>NO TRADES LOGGED</div>}
                </div>
              </div>
            )}

            {rTab === 'iris' && (
              <>
                <div className="sub-hdr">IRIS ANALYSIS</div>
                <div className="iris-msg">
                  {ts?.narrative || 'Awaiting analysis. Run IRIS to materialize intelligence...'}
                </div>
                <div className="sub-hdr">STRATEGY PARSE</div>
                <div style={{ background: 'var(--elevated)', border: '1px solid var(--border)', padding: '8px 10px', fontSize: '9px', color: 'var(--text2)', lineHeight: '1.8', marginBottom: '10px' }}>
                  <div style={{ color: 'var(--teal)', marginBottom: '4px' }}>PARSED RULES</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{ts?.strategy_spec.parsed_rules_text || 'No rules parsed yet.'}</div>
                  <div style={{ marginTop: '6px', color: 'var(--text3)' }}>ASSET: {ts?.strategy_spec.asset || store.asset} · TYPE: {ts?.strategy_spec.strategy_type || 'ALPHA/SIGNAL'}</div>
                  <div style={{ color: 'var(--text3)' }}>CONFIDENCE: <span style={{ color: 'var(--green)' }}>{ts ? (ts.strategy_spec.confidence * 100).toFixed(1) : '0.0'}%</span></div>
                </div>
                <div className="sub-hdr">ITERATE STRATEGY</div>
                <textarea style={{ width: '100%', background: 'var(--elevated)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '9px', padding: '8px', resize: 'none', outline: 'none', height: '60px', marginBottom: '6px' }} placeholder="Ask IRIS: 'What if I tighten the stop to 3%?' or 'Add a momentum filter...'" />
                <button style={{ width: '100%', padding: '6px', background: 'var(--elevated)', border: '1px solid var(--teal2)', color: 'var(--teal)', fontFamily: 'var(--mono)', fontSize: '9px', cursor: 'pointer', letterSpacing: '.06em' }}>ITERATE ↗</button>
                <div className="sub-hdr" style={{ marginTop: '12px' }}>DEPLOY</div>
                <div className="auto-btns">
                  <button className="auto-btn auto-btn-primary" onClick={() => alert('Strategy deployed to paper trading')}>AUTOMATE MINE</button>
                  <button className="auto-btn auto-btn-secondary" onClick={() => alert('Expert strategy deployed to paper trading')}>AUTOMATE EXPERT</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
