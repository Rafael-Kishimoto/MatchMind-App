import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthStore'

export default function Welcome() {
  const navigate = useNavigate()
  const { configured, signUp, signIn } = useAuth()

  const [mode, setMode] = useState('signup') // 'login' | 'signup'
  const [role, setRole] = useState('player')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    if (!configured) { navigate('/'); return } // local mode fallback
    if (!email || !password) { setError('Enter your email and password.'); return }
    if (mode === 'signup' && password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setBusy(true)
    const err = mode === 'signup'
      ? await signUp(email.trim(), password, name.trim(), role)
      : await signIn(email.trim(), password)
    setBusy(false)
    if (err) { setError(err.message || 'Something went wrong.'); return }
    navigate('/') // the auth gate lets us in once the session is set
  }

  return (
    <div className="welcome">
      <div className="welcome-brand"><span className="welcome-dot">▲</span> MATCHMIND</div>
      <div className="welcome-tag">Understand your match — on the court <b style={{ color: 'var(--text)' }}>and</b> in your head.</div>

      <div className="segment">
        <button className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setError('') }}>Log in</button>
        <button className={mode === 'signup' ? 'on' : ''} onClick={() => { setMode('signup'); setError('') }}>Sign up</button>
      </div>

      {mode === 'signup' && (
        <>
          <div className="field">
            <label>I AM A…</label>
            <div className="chips">
              <button className={`chip${role === 'player' ? ' on' : ''}`} onClick={() => setRole('player')}>🎾 Player</button>
              <button className={`chip${role === 'scout' ? ' on' : ''}`} onClick={() => setRole('scout')}>👀 Parent / Scout</button>
            </div>
          </div>
          <div className="field">
            <label>NAME</label>
            <input className="input" placeholder="Your name…" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </>
      )}

      <div className="field">
        <label>EMAIL</label>
        <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label>PASSWORD</label>
        <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>

      {error && <div style={{ color: 'var(--neg)', fontSize: 12.5, marginBottom: 12, lineHeight: 1.4 }}>{error}</div>}

      <button className="btn btn-accent" disabled={busy} onClick={submit}>
        {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
      </button>

      <div className="welcome-note">🔒 Secure cloud account · log in from any phone or computer.</div>
    </div>
  )
}
