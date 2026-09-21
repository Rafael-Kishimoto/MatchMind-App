import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useMatch } from '../store/MatchStore'
import { useAuth } from '../store/AuthStore'
import { computeState } from '../lib/engine'
import { buildMomentum } from '../lib/momentum'
import { buildShareText, shareText } from '../lib/share'
import MomentumChart from '../components/MomentumChart'

export default function Momentum() {
  const navigate = useNavigate()
  const { activeMatch, finishToHistory } = useMatch()
  const { user } = useAuth()
  const [showWarn, setShowWarn] = useState(false)
  const [dontShow, setDontShow] = useState(false)
  const [shareMsg, setShareMsg] = useState('')

  if (!activeMatch) {
    return (
      <div className="app">
        <div className="screen-scroll">
          <TopBar title="Momentum" to="/" />
          <div className="empty">No match to show yet.<br />Start a match to build its momentum graph.</div>
          <div className="pad-lg"><button className="btn btn-accent" onClick={() => navigate('/new')}>+ New match</button></div>
        </div>
      </div>
    )
  }

  const state = computeState(activeMatch)
  const mo = buildMomentum(state.perPoint, state.setBoundaries, activeMatch.config.opponent || 'your opponent')
  const cfg = activeMatch.config
  const s = state.stats
  const youName = (cfg.playerName || 'You').split(' ')[0]
  const resultLabel = state.matchOver ? (state.matchWinner === 'you' ? 'Won' : 'Lost') : 'In progress'
  const isDeep = cfg.scoutMode === 'deep'
  const firstServePct = s.servePts.you ? Math.round((s.firstIn.you / s.servePts.you) * 100) : null
  const totalPts = s.pointsWon.you + s.pointsWon.opp
  const pointsWonPct = totalPts ? Math.round((s.pointsWon.you / totalPts) * 100) : null

  // A scout recording for someone else saves the match; the player reflects later.
  const scoutRecording = !!cfg.recordOwner && cfg.recordOwner !== user?.id
  const hasReflection = !!activeMatch.reflection
  const saveForPlayer = async () => { await finishToHistory(); navigate('/') }
  const handleShare = async () => {
    const res = await shareText(buildShareText(state, cfg, mo))
    if (res === 'copied') setShareMsg('Copied! Paste it to your parents 📋')
    else if (res === 'failed') setShareMsg('Sharing not supported on this device.')
    if (res === 'copied' || res === 'failed') setTimeout(() => setShareMsg(''), 2800)
  }
  const startScoutReflection = () => {
    if (localStorage.getItem('matchmind:skipReflectWarn')) { navigate('/reflect'); return }
    setShowWarn(true)
  }
  const confirmScoutReflection = () => {
    if (dontShow) { try { localStorage.setItem('matchmind:skipReflectWarn', '1') } catch { /* ignore */ } }
    setShowWarn(false); navigate('/reflect')
  }

  return (
    <div className="app">
      <div className="screen-scroll">
        <TopBar title="Momentum" subtitle={`vs. ${cfg.opponent || 'Opponent'} · ${state.scoreString} · ${resultLabel}`} to="/" />

        <div className="chart-card">
          <MomentumChart series={mo.series} setBoundaries={mo.setBoundaries} markers={mo.markers} moods={(activeMatch.moods || []).map((m) => ({ atPoint: m.atPoint, emoji: m.emoji }))} />
          <div className="legend">
            <span><i style={{ background: '#34D399' }} />{youName} ahead</span>
            <span><i style={{ background: '#FB7185' }} />Opponent run</span>
            <span><i style={{ background: '#fff', borderRadius: '50%' }} />Turning point</span>
          </div>
        </div>

        <div className="turning">
          <div className="tt">⚡ Key insight</div>
          <div className="td">{mo.insight}</div>
        </div>

        <div className="mini-stats">
          <div className="ms"><div className="v">{firstServePct == null ? '—' : firstServePct}<span className="of">%</span></div><div className="k">1st serve in</div></div>
          <div className="ms"><div className="v">{pointsWonPct == null ? '—' : pointsWonPct}<span className="of">%</span></div><div className="k">Points won</div></div>
          <div className="ms"><div className="v">{s.winners.you}</div><div className="k">Winners</div></div>
          <div className="ms"><div className="v">{s.unforced.you}</div><div className="k">Unforced errors</div></div>
          <div className="ms"><div className="v">{s.aces.you}</div><div className="k">Aces</div></div>
          <div className="ms"><div className="v">{s.doubleFaults.you}</div><div className="k">Double faults</div></div>
          <div className="ms"><div className="v">{s.bpConverted.you}<span className="of">/{s.bpTotal.you}</span></div><div className="k">Break pts won</div></div>
          <div className="ms"><div className="v">{s.netWon.you}</div><div className="k">Net pts won</div></div>
        </div>

        {isDeep && (
          <div className="sec" style={{ marginTop: 14 }}>
            <div className="sec-h"><span className="si">🔬</span><span className="st">Deep insights</span></div>
            <div className="bullet"><span className="bd">•</span><span>Rally length — short {s.deep.rally.short} · medium {s.deep.rally.medium} · long {s.deep.rally.long}</span></div>
            <div className="bullet"><span className="bd">•</span><span>Your winners — crosscourt {s.deep.direction.cc} · down-the-line {s.deep.direction.dtl} · middle {s.deep.direction.middle}</span></div>
            <div className="bullet"><span className="bd">•</span><span>Returns — attack {s.deep.ret.attack} · neutral {s.deep.ret.neutral} · defensive {s.deep.ret.defensive} · miss {s.deep.ret.miss}</span></div>
          </div>
        )}

        <div className="pad-lg">
          <button className="btn btn-ghost" style={{ marginBottom: 10 }} onClick={handleShare}>📤 Share stats</button>
          {shareMsg && <div className="center" style={{ fontSize: 11.5, color: 'var(--accent)', marginBottom: 12 }}>{shareMsg}</div>}
          {scoutRecording ? (
            <>
              <button className="btn btn-accent" onClick={saveForPlayer}>Save match&nbsp;&nbsp;▸</button>
              <div className="center muted" style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>
                {youName} will add their mental reflection when they open the app.
              </div>
              <button className="wiz-undo" style={{ display: 'block', margin: '14px auto 0' }} onClick={startScoutReflection}>Or fill the reflection yourself</button>
            </>
          ) : hasReflection ? (
            <button className="btn btn-accent" onClick={() => navigate('/report')}>View AI report&nbsp;&nbsp;▸</button>
          ) : (
            <button className="btn btn-accent" onClick={() => navigate('/reflect')}>Continue to reflection&nbsp;&nbsp;▸</button>
          )}
        </div>
      </div>

      {showWarn && (
        <div className="modal-overlay" onClick={() => setShowWarn(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🧠</div>
            <div className="modal-title">Reflections are best done by the player</div>
            <div className="modal-body">The mental reflection works best when the player answers honestly about their own head. Only fill it in yourself if they can't right now (e.g. a dead phone).</div>
            <label className="modal-check">
              <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
              Don't show this again
            </label>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowWarn(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={confirmScoutReflection}>Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
