import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getTearsheet } from '../api/client'
import type { Tearsheet } from '../api/client'
import TearsheetLayout from '../components/Tearsheet'
import { useIRISStore } from '../store/irisStore'
import QuantWorkspace from '../components/QuantWorkspace'

export default function HistoryDetail() {
  const { runId } = useParams<{ runId: string }>()
  const navigate = useNavigate()
  const setTearsheet = useIRISStore((s) => s.setTearsheet)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tearsheet, setLocalTearsheet] = useState<Tearsheet | null>(null)

  useEffect(() => {
    if (!runId) return
    setLoading(true)
    setError(null)
    getTearsheet(runId)
      .then((ts) => {
        setLocalTearsheet(ts)
        setTearsheet(ts)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load tearsheet')
        setLoading(false)
      })
    return () => setTearsheet(null)
  }, [runId, setTearsheet])

  return (
    <QuantWorkspace active="charts">
      <div className="main-stack">
        <button onClick={() => navigate('/history')} className="iris-btn iris-btn-secondary font-mono" style={{ width: 'fit-content' }}>
          <ArrowLeft size={16} /> Back to History
        </button>

        {loading && (
          <div className="center-box">
            <Loader2 size={32} color="var(--teal)" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="font-mono" style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.875rem' }}>
              Loading tearsheet…
            </p>
          </div>
        )}

        {error && (
          <div className="iris-card" style={{ textAlign: 'center', padding: '2rem', borderColor: 'rgba(255, 77, 106, 0.3)' }}>
            <p className="font-mono" style={{ color: 'var(--red)', fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}

        {!loading && !error && tearsheet && (
          <TearsheetLayout />
        )}
      </div>
    </QuantWorkspace>
  )
}
