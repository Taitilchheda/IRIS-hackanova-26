import { Shield, Activity, History, Settings, Zap, Cpu } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useIRISStore } from '../store/irisStore'

export default function QuantTopbar() {
  const backendAlive = useIRISStore((s) => s.backendAlive)

  const pill = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) => `qt-pill ${isActive ? 'active' : ''}`}
      end
    >
      {label}
    </NavLink>
  )

  return (
    <div id="topbar">
      <div className="logo">
        <span className="logo-ring"><span className="logo-dot" /></span>
        IRIS
      </div>

      <div className="nav-pills">
        {pill('/', 'Strategy Lab')}
        {pill('/history', 'History')}
        {pill('/settings', 'Settings')}
      </div>

      <div className="tb-right">
        <div className="ticker-row">
          <span className="ticker-sym">CPU</span>
          <Cpu size={12} className="wh" />
          <span className="ticker-val wh">Quant Workstation</span>
        </div>
        <div className="sep" />
        <div className="status-chip">
          <span className="status-chip-dot" />
          {backendAlive ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>
    </div>
  )
}
