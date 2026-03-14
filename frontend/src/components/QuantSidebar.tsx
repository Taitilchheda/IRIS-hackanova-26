import { Home, LineChart, Play, Shield, Settings, Github } from 'lucide-react'

interface Props {
  onToggleDrawer: () => void
  active: string
}

export default function QuantSidebar({ onToggleDrawer, active }: Props) {
  const iconClass = (id: string) => `sb-icon ${active === id ? 'active' : ''}`

  return (
    <div id="sidebar">
      <div className={iconClass('home')} data-tip="Workspace" onClick={onToggleDrawer}>
        <Home />
      </div>
      <div className={iconClass('charts')} data-tip="Charts">
        <LineChart />
      </div>
      <div className={iconClass('run')} data-tip="Run">
        <Play />
      </div>
      <div className={iconClass('risk')} data-tip="Risk">
        <Shield />
      </div>
      <div className="sb-sep" />
      <div className={iconClass('settings')} data-tip="Settings">
        <Settings />
      </div>
      <div className="sb-icon sb-icon-bottom" data-tip="Repo">
        <Github />
      </div>
    </div>
  )
}
