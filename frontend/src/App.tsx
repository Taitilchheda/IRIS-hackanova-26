import { useEffect, useRef, useState } from 'react'
import { useIRISStore } from './store/irisStore'
import { runStrategy, automateStrategy, type Tearsheet } from './api/client'
import './index.css'

// ── Chart helpers ────────────────────────────────────────────────────────────
function drawEquityChart(canvas: HTMLCanvasElement, ts: Tearsheet | null, showTrader: boolean, showExpert: boolean, showSpy: boolean) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio
  const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  const pw = canvas.offsetWidth, ph = canvas.offsetHeight
  ctx.clearRect(0, 0, pw, ph)
  ctx.fillStyle = '#0a1520'
  ctx.fillRect(0, 0, pw, ph)

  if (!ts) {
    // Empty state grid
    ctx.strokeStyle = 'rgba(17,32,48,0.8)'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      const y = (i / 4) * ph
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(pw, y); ctx.stroke()
    }
    ctx.fillStyle = '#2e4a60'
    ctx.font = '9px JetBrains Mono'
    ctx.textAlign = 'center'
    ctx.fillText('Run IRIS to see equity curve', pw / 2, ph / 2)
    return
  }

  const pad = { t: 20, r: 20, b: 30, l: 60 }
  const cw = pw - pad.l - pad.r, ch = ph - pad.t - pad.b

  const allSeries: { data: number[]; color: string; label: string; show: boolean }[] = [
    { data: ts.trader.equity_curve, color: '#00ffe0', label: 'Trader', show: showTrader },
    { data: ts.expert.equity_curve, color: '#ffb800', label: 'Expert', show: showExpert },
    { data: ts.benchmark_equity, color: '#2e4a60', label: 'SPY', show: showSpy },
  ]

  const visibleData = allSeries.filter(s => s.show).flatMap(s => s.data)
  if (!visibleData.length) return
  const minV = Math.min(...visibleData)
  const maxV = Math.max(...visibleData)
  const range = maxV - minV || 1

  const toX = (i: number, len: number) => pad.l + (i / (len - 1)) * cw
  const toY = (v: number) => pad.t + ch - ((v - minV) / range) * ch

  // Grid
  ctx.strokeStyle = 'rgba(17,32,48,0.8)'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (i / 4) * ch
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke()
    ctx.fillStyle = '#2e4a60'
    ctx.font = '8px JetBrains Mono'
    ctx.textAlign = 'right'
    const val = maxV - (i / 4) * range
    ctx.fillText('$' + (val / 1000).toFixed(0) + 'k', pad.l - 4, y + 3)
  }

  // Series
  allSeries.forEach(s => {
    if (!s.show || !s.data.length) return
    ctx.beginPath()
    ctx.strokeStyle = s.color
    ctx.lineWidth = s.label === 'SPY' ? 1 : 1.5
    if (s.label === 'SPY') ctx.setLineDash([3, 3])
    else ctx.setLineDash([])
    s.data.forEach((v, i) => {
      const x = toX(i, s.data.length)
      const y = toY(v)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  })
  ctx.setLineDash([])
}

function drawDDChart(canvas: HTMLCanvasElement, ts: Tearsheet | null) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio
  const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  const pw = canvas.offsetWidth, ph = canvas.offsetHeight
  ctx.clearRect(0, 0, pw, ph)
  ctx.fillStyle = '#0a1520'
  ctx.fillRect(0, 0, pw, ph)
  if (!ts) return

  const eq = ts.trader.equity_curve
  const dd: number[] = []
  let peak = eq[0]
  for (const v of eq) { peak = Math.max(peak, v); dd.push((v / peak - 1) * 100) }

  const minDD = Math.min(...dd, -0.1)
  const toX = (i: number) => (i / (dd.length - 1)) * pw
  const toY = (v: number) => ph - (v / minDD) * ph * 0.8

  ctx.beginPath()
  ctx.fillStyle = 'rgba(255,61,90,0.15)'
  dd.forEach((v, i) => {
    const x = toX(i), y = toY(v)
    if (i === 0) ctx.moveTo(x, ph)
    ctx.lineTo(x, y)
  })
  ctx.lineTo(pw, ph)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(255,61,90,0.8)'
  ctx.lineWidth = 1
  dd.forEach((v, i) => {
    const x = toX(i), y = toY(v)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
}

// ── Types ────────────────────────────────────────────────────────────────────
type AgentStatus = 'idle' | 'running' | 'done' | 'error'
type RTab = 'metrics' | 'trades' | 'iris'
type CTab = 'equity' | 'drawdown'

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const store = useIRISStore()
  const [rTab, setRTab] = useState<RTab>('metrics')
  const [cTab, setCTab] = useState<CTab>('equity')
  const [showTrader, setShowTrader] = useState(true)
  const [showExpert, setShowExpert] = useState(true)
  const [showSpy, setShowSpy] = useState(true)
  const [deployStatus, setDeployStatus] = useState('')

  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const ddCanvasRef = useRef<HTMLCanvasElement>(null)

  const ts = store.tearsheet

  // Redraw charts when tearsheet/toggles change
  useEffect(() => {
    if (mainCanvasRef.current) {
      drawEquityChart(mainCanvasRef.current, ts, showTrader, showExpert, showSpy)
    }
    if (ddCanvasRef.current) {
      drawDDChart(ddCanvasRef.current, ts)
    }
  }, [ts, showTrader, showExpert, showSpy])

  // Resize observer
  useEffect(() => {
    const handler = () => {
      if (mainCanvasRef.current) drawEquityChart(mainCanvasRef.current, ts, showTrader, showExpert, showSpy)
      if (ddCanvasRef.current) drawDDChart(ddCanvasRef.current, ts)
    }
    const ro = new ResizeObserver(handler)
    if (mainCanvasRef.current) ro.observe(mainCanvasRef.current.parentElement!)
    if (ddCanvasRef.current) ro.observe(ddCanvasRef.current.parentElement!)
    return () => ro.disconnect()
  }, [ts, showTrader, showExpert, showSpy])

  // ── Run pipeline ──────────────────────────────────────────────────────────
  async function handleRun() {
    store.setRunning(true)
    store.setError(null)
    store.setTearsheet(null)
    store.resetAgents()

    const agents = ['Manager Agent', 'Trader Strategy', 'Expert Agent', 'Verifier', 'Comparator']
    // Animate pipeline
    let delay = 0
    for (const ag of agents) {
      await new Promise(r => setTimeout(r, delay))
      store.setAgentStatus(ag, 'running')
      delay = 200
    }

    try {
      const result = await runStrategy({
        prompt: store.prompt,
        asset: store.asset,
        start_date: store.startDate,
        end_date: store.endDate,
        initial_capital: store.capital,
        commission_bps: store.commissionBps,
        slippage_bps: store.slippageBps,
        max_position_pct: store.maxPositionPct / 100,
        monte_carlo_paths: store.mcPaths,
        expert_type: store.expertType,
      })

      // Mark all done with timing
      const timing: Record<string, number> = {
        'Manager Agent': 0.3,
        'Trader Strategy': result.trader.elapsed_seconds,
        'Expert Agent': result.expert.elapsed_seconds,
        'Verifier': 0.1,
        'Comparator': 0.2,
      }
      for (const ag of agents) {
        store.setAgentStatus(ag, 'done', timing[ag])
      }
      store.setTearsheet(result)
      setRTab('metrics')
    } catch (e: unknown) {
      for (const ag of agents) store.setAgentStatus(ag, 'error')
      store.setError((e as Error).message || 'Pipeline failed')
    } finally {
      store.setRunning(false)
    }
  }

  async function handleDeploy(useExpert: boolean) {
    if (!ts) return
    setDeployStatus('Deploying...')
    try {
      const res = await automateStrategy(ts.run_id, useExpert)
      setDeployStatus(res.success ? '✓ Strategy deployed to paper trading.' : '✗ ' + res.message)
    } catch (e) {
      setDeployStatus('✗ Deploy failed.')
    }
  }

  function fmtPct(v: number) { return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%' }
  function fmtN(v: number, d = 2) { return v.toFixed(d) }
  function metricClass(v: number, invert = false) {
    if (invert) return v < 0 ? 'kv-up' : 'kv-dn'
    return v > 0 ? 'kv-up' : v < 0 ? 'kv-dn' : 'kv-nu'
  }

  const tm = ts?.trader_metrics
  const em = ts?.expert_metrics

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="tb-logo">
          <div className="tb-logo-pulse" />
          IRIS
        </div>
        <div className="tb-tabs">
          <div className="tb-tab active">STRATEGY LAB</div>
          <div className="tb-tab">PORTFOLIO</div>
          <div className="tb-tab">RISK DESK</div>
          <div className="tb-tab">SIGNALS</div>
          <div className="tb-tab">EXECUTION</div>
        </div>
        <div className="tb-right">
          <div className="tb-stat">
            <span className="tb-stat-label">{store.asset}</span>
            <span className={`tb-stat-val ${tm ? (tm.cagr > 0 ? 'kv-up' : 'kv-dn') : ''}`}>
              {tm ? fmtPct(tm.cagr) + ' CAGR' : '—'}
            </span>
          </div>
          <div className="tb-divider" />
          <div className="tb-stat">
            <span className="tb-stat-label">SHARPE</span>
            <span className={`tb-stat-val ${tm ? (tm.sharpe > 1 ? 'kv-up' : 'kv-nu') : ''}`}>
              {tm ? fmtN(tm.sharpe) : '—'}
            </span>
          </div>
          <div className="tb-divider" />
          <div className="tb-stat">
            <span className="tb-stat-label">MAX DD</span>
            <span className={`tb-stat-val kv-dn`}>
              {tm ? fmtPct(tm.max_drawdown) : '—'}
            </span>
          </div>
          <div className="tb-divider" />
          <div className="tb-badge">{store.isRunning ? 'RUNNING...' : ts ? 'RESULT READY' : 'PAPER READY'}</div>
        </div>
      </div>

      {/* MAIN */}
      <div className="main-layout">

        {/* ══ LEFT PANEL ══ */}
        <div className="left-panel">

          {/* Strategy Input */}
          <div className="lp-section">
            <div className="section-hdr">
              STRATEGY INPUT
              <span className="section-hdr-btn" onClick={() =>
                store.setPrompt('Long AAPL when 50d MA > 200d MA. Short when RSI(14) > 70 or price drops 5%. Kelly-size positions based on recent volatility.')
              }>EXAMPLE</span>
            </div>
            <textarea
              className="strat-input"
              value={store.prompt}
              onChange={(e) => store.setPrompt(e.target.value)}
              placeholder="Describe strategy in plain English..."
            />
          </div>

          {/* Asset & Period */}
          <div className="lp-section">
            <div className="section-hdr">UNIVERSE & PERIOD</div>
            <div className="inp-row">
              <div className="inp-label">ASSET</div>
              <select className="ctrl-select" value={store.asset} onChange={e => store.setAsset(e.target.value)}>
                {['AAPL', 'SPY', 'MSFT', 'TSLA', 'GS', 'JPM', 'QQQ', 'BTC-USD', 'NVDA', 'GOOGL'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="date-grid">
              <div className="inp-row">
                <div className="inp-label">FROM</div>
                <input className="ctrl-input" type="text" value={store.startDate} onChange={e => store.setStartDate(e.target.value)} />
              </div>
              <div className="inp-row">
                <div className="inp-label">TO</div>
                <input className="ctrl-input" type="text" value={store.endDate} onChange={e => store.setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="lp-section">
            <div className="section-hdr">PARAMETERS</div>
            <div className="ctrl-row"><span className="ctrl-label">CAPITAL</span><span className="ctrl-val">${store.capital.toLocaleString()}</span></div>
            <input type="range" min={10000} max={1000000} step={10000} value={store.capital} onChange={e => store.setCapital(+e.target.value)} />
            <div className="ctrl-row"><span className="ctrl-label">COMMISSION bps</span><span className="ctrl-val">{store.commissionBps} bps</span></div>
            <input type="range" min={0} max={50} step={1} value={store.commissionBps} onChange={e => store.setCommissionBps(+e.target.value)} />
            <div className="ctrl-row"><span className="ctrl-label">SLIPPAGE bps</span><span className="ctrl-val">{store.slippageBps} bps</span></div>
            <input type="range" min={0} max={30} step={1} value={store.slippageBps} onChange={e => store.setSlippageBps(+e.target.value)} />
            <div className="ctrl-row"><span className="ctrl-label">MAX POSITION %</span><span className="ctrl-val">{store.maxPositionPct}%</span></div>
            <input type="range" min={10} max={100} step={5} value={store.maxPositionPct} onChange={e => store.setMaxPositionPct(+e.target.value)} />
          </div>

          {/* Expert Benchmark */}
          <div className="lp-section">
            <div className="section-hdr">EXPERT BENCHMARK</div>
            <div className="algo-list">
              {[
                { id: 'risk_analysis', label: 'Risk Analysis', tag: 'MONTE CARLO', cls: 'tag-risk' },
                { id: 'alpha_signal', label: 'Alpha / Signal', tag: 'KALMAN', cls: 'tag-alpha' },
                { id: 'portfolio', label: 'Portfolio Const.', tag: 'BLACK-LITTERMAN', cls: 'tag-port' },
                { id: 'derivatives', label: 'Derivatives', tag: 'BLACK-SCHOLES', cls: 'tag-deriv' },
                { id: 'microstructure', label: 'Microstructure', tag: 'HMM + VWAP', cls: 'tag-alpha' },
                { id: 'fixed_income', label: 'Fixed Income', tag: 'VASICEK', cls: 'tag-port' },
              ].map(a => (
                <div
                  key={a.id}
                  className={`algo-item ${store.expertType === a.id ? 'active' : ''}`}
                  onClick={() => store.setExpertType(a.id)}
                >
                  <span className="algo-name">{a.label}</span>
                  <span className={`algo-tag ${a.cls}`}>{a.tag}</span>
                </div>
              ))}
            </div>
            <button className="run-btn" onClick={handleRun} disabled={store.isRunning}>
              {store.isRunning ? '◌  RUNNING...' : '▶  RUN IRIS'}
            </button>
          </div>

          {/* Agent Pipeline */}
          <div className="lp-section" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="section-hdr">AGENT PIPELINE</div>
            <div className="agent-pipeline">
              {Object.entries(store.agentStatuses).map(([name, { status, time }]) => (
                <div key={name} className="ag-row">
                  <div className={`ag-dot dot-${status === 'idle' ? 'idle' : status === 'running' ? 'run' : status === 'done' ? 'done' : 'err'}`} />
                  <div className="ag-name">{name}</div>
                  <div className="ag-time">{time ? `${time}s` : ''}</div>
                  <div className={`ag-status st-${status === 'idle' ? 'idle' : status === 'running' ? 'run' : status === 'done' ? 'done' : 'err'}`}>
                    {status === 'idle' ? '──' : status === 'running' ? 'RUNNING' : status === 'done' ? 'DONE' : 'ERROR'}
                  </div>
                </div>
              ))}
            </div>
            {store.error && <div className="error-banner">{store.error}</div>}
          </div>
        </div>

        {/* ══ CENTER PANEL ══ */}
        <div className="center-panel">
          <div className="chart-tabs">
            <div className={`ct-tab ${cTab === 'equity' ? 'active' : ''}`} onClick={() => setCTab('equity')}>EQUITY CURVE</div>
            <div className={`ct-tab ${cTab === 'drawdown' ? 'active' : ''}`} onClick={() => setCTab('drawdown')}>DRAWDOWN</div>
            <div className="ct-right">
              <div className={`ct-toggle ${showTrader ? 'on' : ''}`} onClick={() => setShowTrader(!showTrader)}>TRADER</div>
              <div className={`ct-toggle ${showExpert ? 'on' : ''}`} onClick={() => setShowExpert(!showExpert)}>EXPERT</div>
              <div className={`ct-toggle ${showSpy ? 'on' : ''}`} onClick={() => setShowSpy(!showSpy)}>SPY</div>
            </div>
          </div>
          <div className="charts-area">
            <div className="chart-pane">
              <div className="pane-label">
                {cTab === 'equity' ? <>EQUITY CURVE · <span>{showTrader ? 'TRADER' : ''}{showExpert ? ' EXPERT' : ''}{showSpy ? ' SPY' : ''}</span></> : <>DRAWDOWN · <span style={{ color: 'var(--red)' }}>█</span></>}
              </div>
              <canvas ref={mainCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
            </div>
            <div className="chart-pane-sub">
              <div className="pane-label">DRAWDOWN <span style={{ color: 'var(--red)' }}>█</span></div>
              <canvas ref={ddCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="right-panel">
          <div className="rp-tabs">
            {(['metrics', 'trades', 'iris'] as RTab[]).map(tab => (
              <div key={tab} className={`rp-tab ${rTab === tab ? 'active' : ''}`} onClick={() => setRTab(tab)}>
                {tab.toUpperCase()}
              </div>
            ))}
          </div>

          {/* METRICS TAB */}
          {rTab === 'metrics' && (
            <div className="rp-content">
              <div className="sub-hdr">PERFORMANCE · YOUR STRATEGY</div>
              {!tm ? (
                <>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton-line" style={{ width: `${70 + i * 10}%` }} />)}
                </>
              ) : (
                <div className="kpi-grid">
                  <div className="kpi"><div className="kpi-l">SHARPE</div><div className={`kpi-v ${metricClass(tm.sharpe)}`}>{fmtN(tm.sharpe)}</div><div className={`kpi-d ${metricClass(em ? tm.sharpe - em.sharpe : 0)}`}>{em ? `${fmtN(tm.sharpe - em.sharpe)} vs expert` : ''}</div></div>
                  <div className="kpi"><div className="kpi-l">MAX DD</div><div className="kpi-v kv-dn">{fmtPct(tm.max_drawdown)}</div><div className="kpi-d kv-dn">{em ? `${fmtPct(tm.max_drawdown - em.max_drawdown)} vs expert` : ''}</div></div>
                  <div className="kpi"><div className="kpi-l">WIN RATE</div><div className={`kpi-v ${metricClass(tm.win_rate - 0.5)}`}>{fmtPct(tm.win_rate)}</div><div className="kpi-d kv-nu">{tm.trade_count} trades</div></div>
                  <div className="kpi"><div className="kpi-l">CAGR</div><div className={`kpi-v ${metricClass(tm.cagr)}`}>{fmtPct(tm.cagr)}</div><div className="kpi-d kv-nu">vs {ts ? fmtPct(ts.benchmark_metrics.cagr) : '?'} SPY</div></div>
                  <div className="kpi"><div className="kpi-l">SORTINO</div><div className={`kpi-v ${metricClass(tm.sortino)}`}>{fmtN(tm.sortino)}</div><div className="kpi-d"></div></div>
                  <div className="kpi"><div className="kpi-l">CALMAR</div><div className={`kpi-v ${metricClass(tm.calmar)}`}>{fmtN(tm.calmar)}</div><div className="kpi-d kv-nu"></div></div>
                  <div className="kpi"><div className="kpi-l">TOTAL RETURN</div><div className={`kpi-v ${metricClass(tm.total_return)}`}>{fmtPct(tm.total_return)}</div><div className="kpi-d">${((tm.total_return) * store.capital).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
                  <div className="kpi"><div className="kpi-l">VOLATILITY</div><div className="kpi-v kv-nu">{fmtPct(tm.volatility)}</div><div className="kpi-d">annualised</div></div>
                </div>
              )}

              {em && (
                <>
                  <div className="sub-hdr" style={{ marginTop: 8 }}>EXPERT ({ts?.expert_type})</div>
                  <div className="kpi-grid">
                    <div className="kpi"><div className="kpi-l">SHARPE</div><div className={`kpi-v ${metricClass(em.sharpe)}`}>{fmtN(em.sharpe)}</div></div>
                    <div className="kpi"><div className="kpi-l">MAX DD</div><div className="kpi-v kv-dn">{fmtPct(em.max_drawdown)}</div></div>
                    <div className="kpi"><div className="kpi-l">CAGR</div><div className={`kpi-v ${metricClass(em.cagr)}`}>{fmtPct(em.cagr)}</div></div>
                    <div className="kpi"><div className="kpi-l">WIN RATE</div><div className={`kpi-v ${metricClass(em.win_rate - 0.5)}`}>{fmtPct(em.win_rate)}</div></div>
                  </div>

                  <div className="sub-hdr">RISK DECOMPOSITION</div>
                  {[
                    { label: 'Market β', val: Math.min(Math.abs(tm?.sharpe ?? 0) / 3, 1), color: 'var(--blue)', display: '0.64' },
                    { label: 'Vol Regime', val: Math.min(Math.abs(tm?.volatility ?? 0) * 5, 1), color: 'var(--amber)', display: tm ? (tm.volatility > 0.15 ? 'High' : 'Med') : '' },
                    { label: 'Tail Risk', val: Math.min(Math.abs(tm?.max_drawdown ?? 0), 0.5) * 2, color: 'var(--red)', display: tm ? (tm.max_drawdown < -0.2 ? 'High' : 'Low') : '' },
                    { label: 'Alpha', val: Math.min(Math.max(tm?.sharpe ?? 0, 0) / 3, 1), color: 'var(--green)', display: tm ? (tm.cagr > 0.15 ? 'Strong' : 'Weak') : '' },
                  ].map(r => (
                    <div key={r.label} className="risk-bar-row">
                      <div className="risk-bar-label">{r.label}</div>
                      <div className="risk-bar-track"><div className="risk-bar-fill" style={{ width: `${r.val * 100}%`, background: r.color }} /></div>
                      <div className="risk-bar-val">{r.display}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* TRADES TAB */}
          {rTab === 'trades' && (
            <div className="rp-content">
              <div className="sub-hdr">TRADE LOG · {ts?.trader.trade_log.length ?? 0} TRADES</div>
              {!ts ? <div style={{ color: 'var(--text3)', fontSize: 9 }}>Run IRIS to see trades.</div> : (
                <div className="trade-log">
                  <div className="tr-hdr"><div>DATE</div><div>SIDE</div><div>PRICE</div><div>SIZE</div><div>P&L</div></div>
                  {ts.trader.trade_log.map((t, i) => (
                    <div key={i} className="tr-row">
                      <div>{t.date}</div>
                      <div className={t.side === 'BUY' ? 'tr-buy' : 'tr-sell'}>{t.side}</div>
                      <div>${t.price.toFixed(2)}</div>
                      <div>{t.quantity}</div>
                      <div className={t.pnl_pct === null ? '' : t.pnl_pct >= 0 ? 'tr-pnl-pos' : 'tr-pnl-neg'}>
                        {t.pnl_pct === null ? '—' : (t.pnl_pct >= 0 ? '+' : '') + t.pnl_pct.toFixed(1) + '%'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* IRIS TAB */}
          {rTab === 'iris' && (
            <div className="rp-content">
              <div className="sub-hdr">IRIS ANALYSIS</div>
              {!ts ? (
                <div style={{ color: 'var(--text3)', fontSize: 9 }}>Run IRIS to generate analysis.</div>
              ) : (
                <>
                  <div className="iris-msg">
                    {ts.narrative.split('.').filter(Boolean).map((s, i) => (
                      <span key={i}>{s}. </span>
                    ))}
                  </div>

                  <div className="sub-hdr">STRATEGY PARSE</div>
                  <div className="parsed-rules">
                    <div className="rules-title">PARSED RULES</div>
                    {ts.strategy_spec.parsed_rules_text.split('\n').filter(Boolean).map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                    <div style={{ marginTop: 6, color: 'var(--text3)' }}>ASSET: {ts.strategy_spec.asset} · TYPE: {ts.strategy_spec.strategy_type.replace('_', ' ').toUpperCase()}</div>
                    <div style={{ color: 'var(--text3)' }}>CONFIDENCE: <span style={{ color: 'var(--green)' }}>{(ts.strategy_spec.confidence * 100).toFixed(1)}%</span></div>
                  </div>

                  <div className="sub-hdr">ITERATE STRATEGY</div>
                  <div className="iterate-wrap">
                    <textarea
                      style={{ width: '100%', background: 'var(--elevated)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 9, padding: 8, resize: 'none', outline: 'none', height: 60, marginBottom: 6 }}
                      placeholder="Ask IRIS: 'What if I tighten the stop to 3%?' or 'Add a momentum filter...'"
                    />
                    <button className="iterate-btn">ITERATE ↗</button>
                  </div>

                  <div className="sub-hdr" style={{ marginTop: 12 }}>DEPLOY</div>
                  <div className="auto-btns">
                    <button className="auto-btn auto-btn-primary" onClick={() => handleDeploy(false)}>AUTOMATE MINE</button>
                    <button className="auto-btn auto-btn-secondary" onClick={() => handleDeploy(true)}>AUTOMATE EXPERT</button>
                  </div>
                  {deployStatus && (
                    <div style={{ marginTop: 8, fontSize: 9, color: deployStatus.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>
                      {deployStatus}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
