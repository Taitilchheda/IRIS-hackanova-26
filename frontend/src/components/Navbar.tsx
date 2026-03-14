import { NavLink } from 'react-router-dom'
import { Activity, History, Settings, Cpu } from 'lucide-react'
import { useIRISStore } from '../store/irisStore'

export default function Navbar() {
  const backendAlive = useIRISStore((s) => s.backendAlive)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? 'active' : ''}`

  // Legacy navbar used on non-lab pages
  return (
    <nav className="navbar">
      <div className="container-iris navbar-inner">
        {/* Logo */}
        <NavLink to="/" className="navbar-logo">
          <Cpu size={22} strokeWidth={2} />
          <span>IRIS</span>
        </NavLink>

        {/* Nav links */}
        <div className="navbar-links">
          <NavLink to="/" className={linkClass} end>
            <Activity size={16} />
            <span>Strategy Lab</span>
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            <History size={16} />
            <span>History</span>
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            <Settings size={16} />
            <span>Settings</span>
          </NavLink>
        </div>

        {/* Live indicator */}
        <div className="navbar-status">
          <span
            className="status-dot"
            style={{ background: backendAlive ? 'var(--accent-green)' : 'var(--accent-red)' }}
          />
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {backendAlive ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <style>{`
        .navbar {
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(12px);
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          height: 56px;
          gap: 2rem;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--accent-teal);
          text-decoration: none;
          letter-spacing: 0.05em;
        }
        .navbar-links {
          display: flex;
          gap: 0.25rem;
          flex: 1;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s;
        }
        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-elevated);
        }
        .nav-link.active {
          color: var(--accent-teal);
          background: rgba(0, 212, 170, 0.08);
        }
        .navbar-status {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
        }
        @media (max-width: 640px) {
          .nav-link span { display: none; }
          .navbar-inner { gap: 1rem; }
          .navbar-status { gap: 0.25rem; }
        }
      `}</style>
    </nav>
  )
}
