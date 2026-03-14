import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, BarChart3, ChevronRight, FileText, TrendingUp } from 'lucide-react'
import { useIRISStore } from '../store/irisStore'
import QuantWorkspace from '../components/QuantWorkspace'

export default function History() {
  const { historyItems, historyLoading, loadHistory } = useIRISStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return (
    <QuantWorkspace>
      <div className="main-stack">
        <div className="card-header">
          <FileText size={18} color="var(--teal)" />
          <h1 className="font-mono">Strategy Input History</h1>
        </div>

        <div className="iris-card" style={{ background: 'var(--raised)', border: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} color="var(--teal)" />
            <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Your recent strategy configurations and inputs
            </span>
          </div>
        </div>

        {historyLoading && (
          <div className="stack gap-sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
            ))}
          </div>
        )}

        {!historyLoading && historyItems.length === 0 && (
          <div className="iris-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <FileText size={40} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
            <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No strategy inputs yet. Head to Strategy Lab to create your first strategy.
            </p>
          </div>
        )}

        {!historyLoading && historyItems.length > 0 && (
          <div className="stack gap-sm">
            {historyItems.map((item, i) => (
              <motion.div
                key={item.run_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="strategy-history-card"
                onClick={() => navigate(`/history/${item.run_id}`)}
              >
                <div className="shc-header">
                  <div className="shc-run-id">
                    <span className="label">STRATEGY</span>
                    <span className="value accent">{item.run_id.slice(0, 8)}</span>
                  </div>
                  <div className="shc-timestamp">
                    <Clock size={12} color="var(--text2)" />
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text2)' }}>
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="shc-content">
                  <div className="shc-asset-info">
                    <span className="label">ASSET</span>
                    <span className="value">{item.asset}</span>
                  </div>
                  <div className="shc-period">
                    <span className="label">PERIOD</span>
                    <span className="value">{item.start_date} → {item.end_date}</span>
                  </div>
                  <div className="shc-capital">
                    <span className="label">CAPITAL</span>
                    <span className="value">${item.capital || '100,000'}</span>
                  </div>
                </div>

                {(item.sharpe != null || item.cagr != null) && (
                  <div className="shc-metrics">
                    {item.sharpe != null && (
                      <div className="metric-item">
                        <span className="metric-label">SHARPE</span>
                        <span className={`metric-value ${item.sharpe > 0 ? 'pos' : 'neg'}`}>
                          {item.sharpe.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {item.cagr != null && (
                      <div className="metric-item">
                        <span className="metric-label">CAGR</span>
                        <span className={`metric-value ${item.cagr > 0 ? 'pos' : 'neg'}`}>
                          {(item.cagr * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="shc-actions">
                  <ChevronRight size={18} color="var(--text-secondary)" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </QuantWorkspace>
  )
}
