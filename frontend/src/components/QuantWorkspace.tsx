import { useState } from 'react'
import QuantTopbar from './QuantTopbar'
import QuantSidebar from './QuantSidebar'
import QuantDrawer from './QuantDrawer'

interface Props {
  children: React.ReactNode
  active?: string
}

export default function QuantWorkspace({ children, active = 'home' }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(true)

  return (
    <div className="quant-root">
      <QuantTopbar />
      <div id="workspace">
        <QuantSidebar onToggleDrawer={() => setDrawerOpen((v) => !v)} active={active} />
        <QuantDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <div id="mainpane">
          {children}
        </div>
      </div>
    </div>
  )
}
