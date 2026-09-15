import { useState } from 'react'
import { useAuth } from '../store/AuthStore'

// Shown when the user arrives via a password-reset email link.
export default function SetNewPassword() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('The two passwords do not match.'); return }
    setBusy(true)
    const err = await updatePassword(password)
    setBusy(false)
    if (err) { setError(err.message || 'Could not update the password.'); return }
    // on success, recovery clears and the app drops you into Home, now logged in
  }

  return (
    <div className="welcome">
      <div className="welcome-brand"><span className="welcome-dot">▲</span> MATCHMIND</div>
      <div className="welcome-tag">Set a new password for your account.</div>

      <div className="field" style={{ marginTop: 26 }}>
        <label>NEW PASSWORD</label>
        <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="field">
        <label>CONFIRM PASSWORD</label>
        <input className="input" type="password" placeholder="••••••••" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>

      {error && <div style={{ color: 'var(--neg)', fontSize: 12.5, marginBottom: 12, lineHeight: 1.4 }}>{error}</div>}

      <button className="btn btn-accent" disabled={busy} onClick={submit}>
        {busy ? 'Saving…' : 'Save new password'}
      </button>
    </div>
  )
}
