import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthStore'

export default function Welcome() {
  const navigate = useNavigate()
  const { configured, signUp, signIn, resetPassword } = useAuth()

  const [mode, setMode] = useState('signup') // 'login' | 'signup' | 'reset'
  const [role, setRole] = useState('player')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetSent, setResetSent] = useState(false)

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
    navigate('/')
  }

  const doReset = async () => {
    setError('')
    if (!email) { setError('Enter your email first.'); return }
    setBusy(true)
    const err = await resetPassword(email.trim())
    setBusy(false)
    if (err) { setError(err.message || 'Could not send the reset email.'); return }
    setResetSent(true)
  }

  const go = (m) => { setMode(m); setError(''); setResetSent(false) }

  // ---- reset-password view ----
  if (mode === 'reset') {
    return (
      <div className="welcome">
        <div className="welcome-brand"><span className="welcome-dot">▲</span> MATCHMIND</div>
        <div className="welcome-tag">Forgot your password? We'll email you a reset link.</div>

        {resetSent ? (
          <div className="card" style={{ marginTop: 26, textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📬</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Check your inbox</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.5 }}>
              If an account exists for <b>{email}</b>, a reset link is on its way. Open it, set a new password, and you're back in.
            </div>
          </div>
        ) : (
          <>
            <div className="field" style={{ marginTop: 26 }}>
              <label>EMAIL</label>
              <input className="input" type="email" placeholder="you@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doReset()} />
            </div>
            {error && <div style={{ color: 'var(--neg)', fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-accent" disabled={busy} onClick={doReset}>{busy ? 'Sending…' : 'Send reset link'}</button>
          </>
        )}

        <div className="welcome-note">
          <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }} onClick={() => go('login')}>‹ Back to log in</button>
        </div>
      </div>
    )
  }

  // ---- login / signup view ----
  return (
    <div className="welcome">
      <div className="welcome-brand"><span className="welcome-dot">▲</span> MATCHMIND</div>
      <div className="welcome-tag">Understand your match — on the court <b style={{ color: 'var(--text)' }}>and</b> in your head.</div>

      <div className="segment">
        <button className={mode === 'login' ? 'on' : ''} onClick={() => go('login')}>Log in</button>
        <button className={mode === 'signup' ? 'on' : ''} onClick={() => go('signup')}>Sign up</button>
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
      <div className="field" style={{ marginBottom: mode === 'login' ? 6 : 14 }}>
        <label>PASSWORD</label>
        <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>

      {mode === 'login' && (
        <div style={{ textAlign: 'right', marginBottom: 14 }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }} onClick={() => go('reset')}>Forgot password?</button>
        </div>
      )}

      {error && <div style={{ color: 'var(--neg)', fontSize: 12.5, marginBottom: 12, lineHeight: 1.4 }}>{error}</div>}

      <button className="btn btn-accent" disabled={busy} onClick={submit}>
        {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
      </button>

      <div className="welcome-note">🔒 Secure cloud account · log in from any phone or computer.</div>
    </div>
  )
}
