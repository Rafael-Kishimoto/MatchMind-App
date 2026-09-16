import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useMatch } from '../store/MatchStore'
import { useAuth } from '../store/AuthStore'
import { getMyLinks } from '../lib/links'
import { profile as sampleProfile } from '../data/sample'

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={o} className={`chip${value === o ? ' on' : ''}`} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}

export default function NewMatch() {
  const navigate = useNavigate()
  const { startMatch, managedPlayers, addManagedPlayer } = useMatch()
  const { profile, user } = useAuth()
  const myName = profile?.name || sampleProfile.name
  const isScout = profile?.role === 'scout'

  const [recordablePlayers, setRecordablePlayers] = useState([])
  const [recordFor, setRecordFor] = useState('self')
  const [addingManaged, setAddingManaged] = useState(false)
  const [newManaged, setNewManaged] = useState('')

  useEffect(() => {
    if (!user) return
    getMyLinks()
      .then((rows) => setRecordablePlayers(
        rows.filter((l) => l.scout === user.id && l.permission === 'record').map((l) => ({ id: l.player, name: l.player_name })),
      ))
      .catch(() => {})
  }, [user])

  const linkedSel = recordablePlayers.find((p) => p.id === recordFor)
  const managedSel = managedPlayers.find((p) => p.id === recordFor)
  const playerName = recordFor === 'self' ? myName : (managedSel?.name || linkedSel?.name || 'Player')
  const recordOwner = linkedSel ? linkedSel.id : undefined       // linked player owns the match
  const managedFor = managedSel ? { id: managedSel.id, name: managedSel.name } : undefined // else the parent owns it

  const confirmAddManaged = () => {
    const nm = newManaged.trim()
    if (!nm) return
    const p = addManagedPlayer(nm)
    setRecordFor(p.id); setNewManaged(''); setAddingManaged(false)
  }

  const [opponent, setOpponent] = useState('')
  const [scoutMode, setScoutMode] = useState('simple')
  const [surface, setSurface] = useState('Hard')
  const [format, setFormat] = useState('Best of 3')
  const [scoring, setScoring] = useState('Ad')
  const [finalTb, setFinalTb] = useState(true)
  const [firstServer, setFirstServer] = useState('you')
  const [mood, setMood] = useState(false)

  const start = () => {
    startMatch({
      opponent: opponent.trim() || 'Opponent',
      playerName,
      recordOwner,
      managedFor,
      scoutMode,
      surface,
      format,
      adScoring: scoring === 'Ad',
      finalSetTb: finalTb,
      firstServer,
      mood,
    })
    navigate('/scout')
  }

  return (
    <div className="app">
      <div className="screen-scroll">
        <TopBar title="New match" to="/" />
        <div className="pad-lg" style={{ paddingTop: 4 }}>
          {(recordablePlayers.length > 0 || managedPlayers.length > 0 || isScout) && (
            <div className="field">
              <label>RECORDING FOR</label>
              <div className="chips">
                <button className={`chip${recordFor === 'self' ? ' on' : ''}`} onClick={() => setRecordFor('self')}>Myself</button>
                {recordablePlayers.map((p) => (
                  <button key={p.id} className={`chip${recordFor === p.id ? ' on' : ''}`} onClick={() => setRecordFor(p.id)}>{p.name}</button>
                ))}
                {managedPlayers.map((p) => (
                  <button key={p.id} className={`chip${recordFor === p.id ? ' on' : ''}`} onClick={() => setRecordFor(p.id)}>👶 {p.name}</button>
                ))}
                {isScout && !addingManaged && (
                  <button className="chip" onClick={() => setAddingManaged(true)}>＋ Add player</button>
                )}
              </div>
              {addingManaged && (
                <div className="row" style={{ gap: 8, marginTop: 8 }}>
                  <input className="input" placeholder="Player's name (no account needed)" value={newManaged}
                    onChange={(e) => setNewManaged(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmAddManaged()} style={{ flex: 1 }} />
                  <button className="mini-btn" style={{ padding: '12px 14px' }} onClick={confirmAddManaged}>Add</button>
                </div>
              )}
              {managedSel && (
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.45 }}>
                  You'll scout and do the reflection for {managedSel.name} — they have no account of their own.
                </div>
              )}
            </div>
          )}

          <div className="field">
            <label>YOUR PLAYER</label>
            <div className="input">{playerName}</div>
          </div>

          <div className="field">
            <label>OPPONENT</label>
            <input className="input" placeholder="Type a name…" value={opponent} onChange={(e) => setOpponent(e.target.value)} />
          </div>

          <div className="field">
            <label>SCOUTING MODE</label>
            <div className="chips">
              <button className={`chip${scoutMode === 'simple' ? ' on' : ''}`} onClick={() => setScoutMode('simple')}>⚡ Simple</button>
              <button className={`chip${scoutMode === 'deep' ? ' on' : ''}`} onClick={() => setScoutMode('deep')}>🔬 Deep</button>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.45 }}>
              {scoutMode === 'simple'
                ? 'Fast: serve → who won → how → shot. Best for most matches.'
                : 'Detailed: also serve placement, shot direction, rally length & return quality.'}
            </div>
          </div>

          <div className="field">
            <label>SURFACE</label>
            <ChipGroup options={['Hard', 'Clay', 'Grass']} value={surface} onChange={setSurface} />
          </div>

          <div className="field">
            <label>FORMAT</label>
            <ChipGroup options={['Best of 3', '1 set', 'Pro set (8)', 'Match TB (10)']} value={format} onChange={setFormat} />
          </div>

          <div className="field">
            <label>SCORING</label>
            <div className="chips">
              <button className={`chip${scoring === 'Ad' ? ' on' : ''}`} onClick={() => setScoring('Ad')}>Ad</button>
              <button className={`chip${scoring === 'No-ad' ? ' on' : ''}`} onClick={() => setScoring('No-ad')}>No-ad</button>
              {format === 'Best of 3' && (
                <button className={`chip${finalTb ? ' on' : ''}`} onClick={() => setFinalTb((v) => !v)}>Final-set TB</button>
              )}
            </div>
          </div>

          <div className="field">
            <label>FIRST SERVE</label>
            <div className="chips">
              <button className={`chip${firstServer === 'you' ? ' on' : ''}`} onClick={() => setFirstServer('you')}>{playerName.split(' ')[0]}</button>
              <button className={`chip${firstServer === 'opp' ? ' on' : ''}`} onClick={() => setFirstServer('opp')}>Opponent</button>
            </div>
          </div>

          <div className="field">
            <label>OPTIONS</label>
            <div className="toggle-card">
              <div>
                <div className="t-txt">Mood markers 🙂</div>
                <div className="t-sub">Tap a quick mood at each changeover to overlay feelings on the graph.</div>
              </div>
              <button className={`switch${mood ? ' on' : ''}`} onClick={() => setMood((v) => !v)} aria-label="Toggle mood markers" />
            </div>
          </div>

          <button className="btn btn-accent" style={{ marginTop: 6 }} onClick={start}>Start match&nbsp;&nbsp;▸</button>
        </div>
      </div>
    </div>
  )
}
