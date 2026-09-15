import { useEffect, useState } from 'react'
import TabBar from '../components/TabBar'
import { useAuth } from '../store/AuthStore'
import { getMyInviteCode, redeemInvite, getMyLinks } from '../lib/links'
import { profile as sampleProfile, linkedPeople as sampleLinked, inviteCode as sampleCode } from '../data/sample'

export default function Profiles() {
  const { profile, user, configured, signOut } = useAuth()
  const cloud = configured && user

  const name = profile?.name || sampleProfile.name
  const initial = (name[0] || 'P').toUpperCase()
  const roleLabel = profile?.role === 'scout' ? 'Parent / Scout' : 'Player'
  const isScout = profile?.role === 'scout'

  const [code, setCode] = useState(cloud ? null : sampleCode)
  const [links, setLinks] = useState([])
  const [copied, setCopied] = useState(false)
  const [redeem, setRedeem] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const refreshLinks = () => { getMyLinks().then(setLinks).catch(() => {}) }

  useEffect(() => {
    if (!cloud) return
    getMyInviteCode().then(setCode).catch(() => setCode('—'))
    refreshLinks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloud])

  const copy = () => {
    if (navigator.clipboard && code) navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const doRedeem = async () => {
    setMsg('')
    if (!redeem.trim()) return
    setBusy(true)
    try {
      const res = await redeemInvite(redeem.trim())
      if (res.ok) { setMsg(`✓ Linked to ${res.name}!`); setRedeem(''); refreshLinks() }
      else setMsg(res.error || 'Could not link.')
    } catch { setMsg('Could not link — check the code and try again.') }
    setBusy(false)
  }

  // people who scout for me / players I scout for
  const scoutsForMe = cloud ? links.filter((l) => l.player === user.id) : sampleLinked.map((p) => ({ scout: p.id, scout_name: p.name, permission: p.permission }))
  const playersIScout = cloud ? links.filter((l) => l.scout === user.id) : []

  return (
    <div className="app has-tabbar">
      <div className="screen-scroll">
        <div className="home-head">
          <div className="h-eyebrow">Account</div>
          <div className="h-title">Profiles</div>
        </div>

        <div className="pad-lg" style={{ paddingTop: 4 }}>
          {/* active profile */}
          <div className="card row" style={{ gap: 12, marginBottom: 18 }}>
            <div className="avatar" style={{ cursor: 'default' }}>{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{roleLabel}{profile?.email ? ` · ${profile.email}` : ' · active now'}</div>
            </div>
            <span className="chip on">You</span>
          </div>

          {isScout ? (
            <>
              {/* SCOUT — link to a player is the main action */}
              <div className="card invite" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 5 }}>Link to a player</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>
                  Enter a player's invite code to start scouting matches for them.
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <input className="input" placeholder="e.g. 7K2Q9X" value={redeem}
                    onChange={(e) => setRedeem(e.target.value.toUpperCase())} style={{ flex: 1 }} />
                  <button className="mini-btn" style={{ padding: '12px 16px' }} disabled={busy} onClick={doRedeem}>{busy ? '…' : 'Link'}</button>
                </div>
                {msg && <div style={{ fontSize: 11.5, marginTop: 10, color: msg.startsWith('✓') ? 'var(--pos)' : 'var(--neg)' }}>{msg}</div>}
              </div>

              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, letterSpacing: '.5px', margin: '6px 2px 10px' }}>PLAYERS YOU SCOUT FOR</div>
              {playersIScout.length === 0
                ? <div className="empty" style={{ margin: '0 0 12px' }}>Not linked to any players yet. Enter a code above to get started.</div>
                : playersIScout.map((l) => (
                  <div className="card person" key={l.player}>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg,#2b3a49,#16202a)', cursor: 'default' }}>{(l.player_name[0] || 'P').toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="nm">{l.player_name}</div>
                      <div className="rl">You can {l.permission === 'record' ? 'record matches' : 'view'} for them</div>
                    </div>
                    <span style={{ fontSize: 15, color: 'var(--pos)' }}>✓</span>
                  </div>
                ))}
            </>
          ) : (
            <>
              {/* PLAYER — who scouts for me + my share code */}
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, letterSpacing: '.5px', margin: '0 2px 10px' }}>LINKED TO YOU</div>
              {scoutsForMe.length === 0
                ? <div className="empty" style={{ margin: '0 0 12px' }}>No one linked yet. Share your code below.</div>
                : scoutsForMe.map((l, i) => (
                  <div className="card person" key={l.scout || i}>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg,#3a2b49,#1f1620)', cursor: 'default' }}>{(l.scout_name[0] || 'S').toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="nm">{l.scout_name}</div>
                      <div className="rl">Parent / Scout · can {l.permission === 'record' ? 'record' : 'view'}</div>
                    </div>
                    <span style={{ fontSize: 15, color: 'var(--pos)' }}>✓</span>
                  </div>
                ))}

              <div className="card invite" style={{ marginTop: 9 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 5 }}>Invite someone to scout for you</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>
                  Share this code so a parent or coach can link to you from their own phone.
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <div className="code">{code || '……'}</div>
                  <button className="mini-btn" style={{ padding: '12px 14px' }} onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
              </div>
            </>
          )}

          {cloud && (
            <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={signOut}>Log out</button>
          )}
        </div>
      </div>
      <TabBar />
    </div>
  )
}
