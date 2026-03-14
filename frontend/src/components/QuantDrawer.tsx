import AgentPipeline from './AgentPipeline'
import StrategyInputPanel from './StrategyInputPanel'

interface Props {
  open: boolean
  onClose: () => void
}

export default function QuantDrawer({ open }: Props) {
  return (
    <div id="drawer" className={open ? 'open' : ''}>
      <div id="drawer-inner">
        <div className="drawer-section">
          <div className="ds-title">Strategy Input</div>
          <StrategyInputPanel compact />
        </div>
        <div className="drawer-section">
          <div className="ds-title">Agent Pipeline</div>
          <AgentPipeline compact />
        </div>
      </div>
    </div>
  )
}
