import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import StrategyLab from './pages/StrategyLab'
import History from './pages/History'
import HistoryDetail from './pages/HistoryDetail'
import Settings from './pages/Settings'
import AutomateModal from './components/AutomateModal'
import { useIRISStore } from './store/irisStore'
import { useAuthStore } from './store/authStore'


export default function App() {
  const checkHealth = useIRISStore((s) => s.checkHealth)
  const automateModalOpen = useIRISStore((s) => s.automateModalOpen)
  const { hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 15000)
    return () => clearInterval(interval)
  }, [checkHealth])

  return (
    <>
      <Navbar />
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        <Routes>
          <Route path="/" element={<StrategyLab />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:runId" element={<HistoryDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      {automateModalOpen && <AutomateModal />}
    </>
  )
}
