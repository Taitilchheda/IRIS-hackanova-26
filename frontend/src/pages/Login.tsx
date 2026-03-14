import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Lock, Mail, LogIn, UserPlus } from 'lucide-react'

export default function Login() {
  const { user, login, register, error, loading, hydrate } = useAuthStore()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('admin@iris.local')
  const [password, setPassword] = useState('ChangeMe123!')
  const navigate = useNavigate()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignup) await register(email, password)
    else await login(email, password)
    if (!error) navigate('/')
  }

  return (
    <div className="container-iris" style={{ maxWidth: '520px', paddingTop: '3rem' }}>
      <div className="iris-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h1 className="font-mono" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          {isSignup ? 'Create Account' : 'Sign In'}
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            Email
            <div className="iris-input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              <Mail size={16} color="var(--text-secondary)" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="quant@firm.com"
                style={{ background: 'transparent', border: 'none', width: '100%' }}
                required
              />
            </div>
          </label>

          <label className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            Password
            <div className="iris-input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              <Lock size={16} color="var(--text-secondary)" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ background: 'transparent', border: 'none', width: '100%' }}
                required
              />
            </div>
          </label>

          {error && (
            <div className="iris-card" style={{ borderColor: 'rgba(255,77,106,0.3)', background: 'rgba(255,77,106,0.05)', padding: '0.75rem' }}>
              <p className="font-mono" style={{ color: 'var(--accent-red)', fontSize: '0.8125rem' }}>{error}</p>
            </div>
          )}

          <button className="iris-btn iris-btn-primary font-mono" type="submit" disabled={loading}>
            {loading ? 'Working...' : isSignup ? (<><UserPlus size={16} /> Create Account</>) : (<><LogIn size={16} /> Sign In</>)}
          </button>
        </form>

        <button className="iris-btn iris-btn-secondary font-mono" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'Have an account? Sign in' : 'Need an account? Create one'}
        </button>
      </div>
    </div>
  )
}
