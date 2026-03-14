import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Zap } from 'lucide-react'
import { useIRISStore } from '../../store/irisStore'

export default function IrisSaysPanel() {
  const tearsheet = useIRISStore((s) => s.tearsheet)
  const openAutomateModal = useIRISStore((s) => s.openAutomateModal)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const narrative = tearsheet?.narrative || ''

  // Typewriter effect
  useEffect(() => {
    if (!narrative) {
      setDisplayedText('')
      return
    }

    setIsTyping(true)
    setDisplayedText('')
    let i = 0
    const interval = setInterval(() => {
      if (i < narrative.length) {
        setDisplayedText(narrative.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        setIsTyping(false)
      }
    }, 15)

    return () => clearInterval(interval)
  }, [narrative])

  if (!tearsheet) return null

  return (
    <motion.div
      className="iris-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      style={{ padding: '1.25rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Bot size={18} color="var(--accent-teal)" />
        <h3 className="font-mono" style={{
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          IRIS Says
        </h3>
      </div>

      <div
        className="font-mono"
        style={{
          fontSize: '0.8125rem',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
          padding: '1rem',
          background: 'var(--bg-base)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          minHeight: '80px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {displayedText}
        {isTyping && <span className="typewriter-cursor" />}
      </div>

      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginTop: '1rem',
        flexWrap: 'wrap',
      }}>
        <button
          className="iris-btn iris-btn-primary font-mono"
          onClick={() => openAutomateModal(false)}
          style={{ flex: 1, minWidth: '200px' }}
        >
          <Zap size={16} /> Automate My Strategy
        </button>
        <button
          className="iris-btn iris-btn-secondary font-mono"
          onClick={() => openAutomateModal(true)}
          style={{ flex: 1, minWidth: '200px' }}
        >
          <Zap size={16} /> Automate Expert
        </button>
      </div>
    </motion.div>
  )
}
