import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useMatch } from '../store/MatchStore'
import { computeState } from '../lib/engine'

// Which question screens a point needs, based on the serve outcome + mode.
function buildStepIds(serve, isDeep, ret) {
  const ids = ['serve']
  if (serve === 'ace') { if (isDeep) ids.push('place') }
  else if (serve === '1st' || serve === '2nd') {
    // chronological, as it happens live: serve -> placement -> return -> rally outcome
    if (isDeep) {
      ids.push('place', 'ret')
      // a missed return ends the point immediately (server wins) — nothing else to scout
      if (ret === 'miss') { ids.push('confirm'); return ids }
    }
    ids.push('winner', 'how', 'shot')
    if (isDeep) ids.push('dir', 'rally')
  }
  // double fault: no extra questions
  ids.push('confirm')
  return ids
}

const LABELS = {
  serve: { '1st': '1st serve in', '2nd': '2nd serve', ace: 'Ace', df: 'Double fault' },
  place: { wide: 'Wide', body: 'Body', t: 'Down the T' },
  how: { Winner: 'Winner', 'Forced err': 'Forced error', Unforced: 'Unforced error', Ace: 'Ace', 'Dbl fault': 'Double fault' },
  dir: { cc: 'Crosscourt', dtl: 'Down the line', middle: 'Middle' },
  rally: { short: 'Short (1–4)', medium: 'Medium (5–8)', long: 'Long (9+)' },
  ret: { attack: 'Attack', neutral: 'Neutral', defensive: 'Defensive', miss: 'Miss' },
}

export default function LiveScouting() {
  const navigate = useNavigate()
  const { activeMatch, startMatch, logPoint, undoPoint, addMood } = useMatch()

  useEffect(() => {
    if (!activeMatch) {
      startMatch({ opponent: 'Opponent', playerName: 'Rafael C.', surface: 'Hard', format: 'Best of 3', adScoring: true, finalSetTb: true, firstServer: 'you', mood: false, scoutMode: 'simple' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [serve, setServe] = useState(null)
  const [place, setPlace] = useState(null)
  const [winner, setWinner] = useState(null)
  const [how, setHow] = useState(null)
  const [shot, setShot] = useState(null)
  const [dir, setDir] = useState(null)
  const [rally, setRally] = useState(null)
  const [ret, setRet] = useState(null)
  const [step, setStep] = useState(0)
  const [moodOpen, setMoodOpen] = useState(false)
  const [lastMoodGame, setLastMoodGame] = useState(0)

  const gamesPlayed = (st) => st.setScores.reduce((a, x) => a + (x.you || 0) + (x.opp || 0), 0) + st.games.you + st.games.opp

  useEffect(() => {
    if (!activeMatch || !activeMatch.config.mood) return
    const st = computeState(activeMatch)
    if (st.matchOver) return
    const total = gamesPlayed(st)
    if (total > 0 && total % 2 === 1 && total !== lastMoodGame) setMoodOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMatch?.points.length])

  if (!activeMatch) return null

  const state = computeState(activeMatch)
  const cfg = activeMatch.config
  const isDeep = cfg.scoutMode === 'deep'
  const youName = (cfg.playerName || 'You').split(' ')[0]
  const oppName = cfg.opponent || 'Opponent'
  const serverName = state.server === 'you' ? youName : oppName
  const receiverSide = state.server === 'you' ? 'opp' : 'you'

  const values = { place, winner, how, shot, dir, rally, ret }
  const setters = { place: setPlace, winner: setWinner, how: setHow, shot: setShot, dir: setDir, rally: setRally, ret: setRet }

  const resetPoint = () => {
    setServe(null); setPlace(null); setWinner(null); setHow(null); setShot(null)
    setDir(null); setRally(null); setRet(null); setStep(0)
  }
  const chooseServe = (v) => {
    setPlace(null); setDir(null); setRally(null); setRet(null)
    setServe(v)
    if (v === 'ace') { setWinner(state.server); setHow('Ace'); setShot('Serve') }
    else if (v === 'df') { setWinner(receiverSide); setHow('Dbl fault'); setShot('Serve') }
    else { setWinner(null); setHow(null); setShot(null) }
  }

  const steps = buildStepIds(serve, isDeep, ret)
  const safeStep = Math.min(step, steps.length - 1)
  const currentId = steps[safeStep]

  const pick = (id, v) => {
    if (id === 'serve') { chooseServe(v); setStep(1); return }
    if (id === 'ret') {
      setRet(v)
      // return miss = returner's error, server wins the point; skip the rally questions
      if (v === 'miss') { setWinner(state.server); setHow('Forced err'); setShot(null) }
      else { setWinner(null); setHow(null); setShot(null) }
      setStep((s) => s + 1)
      return
    }
    setters[id](v); setStep((s) => s + 1)
  }
  const back = () => setStep((s) => Math.max(0, s - 1))
  const undoLast = () => { undoPoint(); resetPoint() }
  const doLog = () => {
    const how2 = serve === 'ace' ? 'Ace' : serve === 'df' ? 'Dbl fault' : how
    const pt = { serve, winner, how: how2, shot }
    if (isDeep) { if (place) pt.servePlacement = place; if (dir) pt.direction = dir; if (rally) pt.rally = rally; if (ret) pt.returnQuality = ret }
    logPoint(pt); resetPoint()
  }
  const handleMood = (emoji, value) => {
    if (emoji) addMood({ atPoint: activeMatch.points.length, emoji, value })
    setLastMoodGame(gamesPlayed(state)); setMoodOpen(false)
  }

  // question definitions that depend on names
  const DEFS = {
    serve: { q: 'What happened on the serve?', sub: `${serverName} serving`, opts: [['1st', '1st serve in'], ['2nd', '2nd serve'], ['ace', '🎯 Ace'], ['df', 'Double fault']] },
    place: { q: 'Serve placement', opts: [['wide', 'Wide'], ['body', 'Body'], ['t', 'Down the T']] },
    winner: { q: 'Who won the point?', opts: [['you', youName], ['opp', oppName]] },
    how: { q: 'How did the point end?', opts: [['Winner', 'Winner'], ['Forced err', 'Forced error'], ['Unforced', 'Unforced error']] },
    shot: { q: 'Last shot', opts: [['Forehand', 'Forehand'], ['Backhand', 'Backhand'], ['Serve', 'Serve'], ['Volley', 'Volley'], ['Overhead', 'Overhead'], ['Other', 'Other']] },
    dir: { q: 'Shot direction', opts: [['cc', 'Crosscourt'], ['dtl', 'Down the line'], ['middle', 'Middle']] },
    rally: { q: 'Rally length', opts: [['short', 'Short (1–4)'], ['medium', 'Medium (5–8)'], ['long', 'Long (9+)']] },
    ret: { q: 'Return quality', opts: [['attack', 'Attack'], ['neutral', 'Neutral'], ['defensive', 'Defensive'], ['miss', 'Miss']] },
  }

  const recapRows = () => {
    const rows = [['Serve', LABELS.serve[serve] + (place ? ` · ${LABELS.place[place]}` : '')]]
    if (serve === 'ace') { rows.push(['Result', `Ace — point to ${serverName}`]); return rows }
    if (serve === 'df') { rows.push(['Result', `Point to ${winner === 'you' ? youName : oppName} (double fault)`]); return rows }
    if (ret === 'miss') {
      rows.push(['Return', 'Miss — return error'])
      rows.push(['Point to', winner === 'you' ? youName : oppName])
      return rows
    }
    rows.push(['Point to', winner === 'you' ? youName : oppName])
    rows.push(['How', LABELS.how[how]])
    rows.push(['Shot', shot])
    if (isDeep) {
      if (dir) rows.push(['Direction', LABELS.dir[dir]])
      if (rally) rows.push(['Rally', LABELS.rally[rally]])
      if (ret) rows.push(['Return', LABELS.ret[ret]])
    }
    return rows
  }

  const renderRow = (who) => {
    const dim = who === 'opp'
    const name = who === 'you' ? youName : oppName
    return (
      <div className="score-line">
        <div className={`score-name ${dim ? 'dim' : ''}`}>{state.server === who && <span className="serve-dot" />}{name}</div>
        <div className="score-cells">
          {state.setScores.map((s, i) => <span key={i} className="cell">{s[who]}</span>)}
          {!state.curIsTBSet && !state.matchOver && <span className="cell">{state.games[who]}</span>}
          {!state.matchOver && <span className={`cell pts${dim ? ' dim' : ''}`}>{state.points[who]}</span>}
        </div>
      </div>
    )
  }

  const dots = activeMatch.points.slice(-18)

  return (
    <div className="app">
      <div className="screen-scroll">
        <TopBar
          title={`Scouting · ${isDeep ? 'Deep' : 'Simple'}`}
          to="/new"
          right={<button className="mini-btn" onClick={() => navigate('/momentum')}>End&nbsp;▸</button>}
        />

        {/* pinned score */}
        <div className="scout-top">
          {renderRow('you')}
          {renderRow('opp')}
          <div className="scout-meta">
            {state.matchOver
              ? `MATCH COMPLETE · ${state.scoreString}`
              : <>{state.meta.label}{state.isBreakPoint && <> · <span className="bp">★ BREAK POINT</span></>}</>}
          </div>
          {dots.length > 0 && !state.matchOver && (
            <div className="scout-dots">{dots.map((p, i) => <span key={i} className={`pdot ${p.winner}`} />)}</div>
          )}
        </div>

        {state.matchOver ? (
          <div className="pad-lg">
            <div className="card center" style={{ padding: '22px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>🏆</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{state.matchWinner === 'you' ? `${youName} wins!` : `${oppName} wins`}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{state.scoreString}</div>
            </div>
            <button className="btn btn-accent" onClick={() => navigate('/momentum')}>View momentum &amp; report&nbsp;▸</button>
          </div>
        ) : moodOpen ? (
          <div className="wiz">
            <div className="wiz-q">Changeover — how are you feeling?</div>
            <div className="wiz-options">
              <button className="wiz-opt" onClick={() => handleMood('😟', 0)}>😟&nbsp;&nbsp;Low</button>
              <button className="wiz-opt" onClick={() => handleMood('😐', 1)}>😐&nbsp;&nbsp;Flat</button>
              <button className="wiz-opt" onClick={() => handleMood('🙂', 2)}>🙂&nbsp;&nbsp;Good</button>
              <button className="wiz-opt" onClick={() => handleMood('🔥', 3)}>🔥&nbsp;&nbsp;Fired up</button>
            </div>
            <div className="wiz-nav"><span /><button className="wiz-undo" onClick={() => handleMood(null)}>Skip</button></div>
          </div>
        ) : (
          <div className="wiz">
            <div className="wiz-progress">
              {steps.map((id, i) => (
                <span key={i} className={`wiz-dot${i === safeStep ? ' on' : i < safeStep ? ' done' : ''}`} />
              ))}
            </div>

            {currentId === 'confirm' ? (
              <>
                <div className="wiz-q">Confirm the point</div>
                <div className="wiz-recap">
                  {recapRows().map(([k, v], i) => (
                    <div className="rl" key={i}><span className="k">{k}</span><span className="v">{v}</span></div>
                  ))}
                </div>
                <button className="btn btn-accent" style={{ marginTop: 18 }} onClick={doLog}>Log point&nbsp;✓</button>
              </>
            ) : (
              <>
                <div className="wiz-q">{DEFS[currentId].q}</div>
                {DEFS[currentId].sub && <div className="wiz-sub">{DEFS[currentId].sub}</div>}
                <div className="wiz-options">
                  {DEFS[currentId].opts.map(([v, label]) => (
                    <button
                      key={v}
                      className={`wiz-opt${values[currentId] === v ? ' on' : ''}${currentId === 'winner' ? ' big' : ''}${currentId === 'winner' && v === 'you' ? ' you' : ''}`}
                      onClick={() => pick(currentId, v)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="wiz-nav">
              {safeStep > 0
                ? <button className="wiz-back" onClick={back}>‹ Back</button>
                : <span />}
              {activeMatch.points.length > 0
                ? <button className="wiz-undo" onClick={undoLast}>↩ Undo last point</button>
                : <span />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
