import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useMatch } from '../store/MatchStore'
import { computeState } from '../lib/engine'

const HOW = ['Winner', 'Forced err', 'Unforced']
const SHOTS = [['Forehand', 'Backhand', 'Serve'], ['Volley', 'Overhead', 'Other']]
const PLACE = [['wide', 'Wide'], ['body', 'Body'], ['t', 'T']]
const DIRS = [['cc', 'Crosscourt'], ['dtl', 'Down the line'], ['middle', 'Middle']]
const RALL = [['short', 'Short'], ['medium', 'Medium'], ['long', 'Long']]
const RET = [['attack', 'Attack'], ['neutral', 'Neutral'], ['defensive', 'Defensive'], ['miss', 'Miss']]

export default function LiveScouting() {
  const navigate = useNavigate()
  const { activeMatch, startMatch, logPoint, undoPoint, addMood } = useMatch()

  useEffect(() => {
    if (!activeMatch) {
      startMatch({ opponent: 'Opponent', playerName: 'Rafael C.', surface: 'Hard', format: 'Best of 3', adScoring: true, finalSetTb: true, firstServer: 'you', mood: false, scoutMode: 'simple' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [serve, setServe] = useState(null)      // '1st' | '2nd' | 'ace' | 'df'
  const [winner, setWinner] = useState(null)
  const [how, setHow] = useState(null)
  const [shot, setShot] = useState(null)
  const [place, setPlace] = useState(null)      // deep: serve placement
  const [dir, setDir] = useState(null)          // deep: shot direction
  const [rally, setRally] = useState(null)      // deep: rally length
  const [ret, setRet] = useState(null)          // deep: return quality
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

  const reset = () => { setServe(null); setWinner(null); setHow(null); setShot(null); setPlace(null); setDir(null); setRally(null); setRet(null) }

  const chooseServe = (v) => {
    setServe(v)
    setPlace(null)
    if (v === 'ace') { setWinner(state.server); setHow('Winner'); setShot('Serve') }
    else if (v === 'df') { setWinner(receiverSide); setHow('Forced err'); setShot('Serve') }
    else { setWinner(null); setHow(null); setShot(null); setDir(null); setRally(null); setRet(null) }
  }

  const isRally = serve === '1st' || serve === '2nd'
  let canLog = false
  if (serve === 'df') canLog = true
  else if (serve === 'ace') canLog = !isDeep || !!place
  else if (isRally) {
    const base = winner && how && shot
    canLog = isDeep ? Boolean(base && place && dir && rally && ret) : Boolean(base)
  }

  const log = () => {
    // ace/df are stored with their real "how" so serve + error stats stay correct
    const how2 = serve === 'ace' ? 'Ace' : serve === 'df' ? 'Dbl fault' : how
    const pt = { serve, winner, how: how2, shot }
    if (isDeep) {
      if (place) pt.servePlacement = place
      if (dir) pt.direction = dir
      if (rally) pt.rally = rally
      if (ret) pt.returnQuality = ret
    }
    logPoint(pt)
    reset()
  }
  const undo = () => { undoPoint(); reset() }
  const handleMood = (emoji, value) => {
    if (emoji) addMood({ atPoint: activeMatch.points.length, emoji, value })
    setLastMoodGame(gamesPlayed(state)); setMoodOpen(false)
  }

  const dots = activeMatch.points.slice(-16)

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

  const ChipRow = ({ items, value, onPick }) => (
    <div className="shot-row">
      {items.map(([v, label]) => (
        <button key={v} className={`shot${value === v ? ' on' : ''}`} onClick={() => onPick(v)}>{label}</button>
      ))}
    </div>
  )

  return (
    <div className="app">
      <div className="screen-scroll">
        <TopBar
          title={`Scouting · ${isDeep ? 'Deep' : 'Simple'}`}
          to="/new"
          right={<button className="mini-btn" onClick={() => navigate('/momentum')}>End&nbsp;▸</button>}
        />

        <div className="scout-top">
          {renderRow('you')}
          {renderRow('opp')}
          <div className="scout-meta">
            {state.matchOver
              ? `MATCH COMPLETE · ${state.scoreString}`
              : <>{state.meta.label}{state.isBreakPoint && <> · <span className="bp">★ BREAK POINT</span></>}</>}
          </div>
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
        ) : (
          <>
            {moodOpen && (
              <div className="panel" style={{ borderColor: 'rgba(70,182,247,.45)' }}>
                <div className="step" style={{ color: 'var(--blue)' }}>Changeover · quick mood</div>
                <div className="q">How are you feeling right now?</div>
                <div className="face-row">
                  <button className="face" onClick={() => handleMood('😟', 0)}>😟<small>Low</small></button>
                  <button className="face" onClick={() => handleMood('😐', 1)}>😐<small>Flat</small></button>
                  <button className="face" onClick={() => handleMood('🙂', 2)}>🙂<small>Good</small></button>
                  <button className="face" onClick={() => handleMood('🔥', 3)}>🔥<small>Fired up</small></button>
                </div>
                <button className="mini-btn" style={{ marginTop: 10 }} onClick={() => handleMood(null)}>Skip</button>
              </div>
            )}

            {/* STEP 1 — serve */}
            <div className="panel">
              <div className="step">Serve · {serverName} serving</div>
              <div className="opt-grid">
                <button className={`opt${serve === '1st' ? ' on' : ''}`} onClick={() => chooseServe('1st')}>1st in</button>
                <button className={`opt${serve === '2nd' ? ' on' : ''}`} onClick={() => chooseServe('2nd')}>2nd serve</button>
                <button className={`opt${serve === 'ace' ? ' on' : ''}`} onClick={() => chooseServe('ace')}>Ace</button>
                <button className={`opt${serve === 'df' ? ' on' : ''}`} onClick={() => chooseServe('df')}>Double fault</button>
              </div>

              {isDeep && (serve === '1st' || serve === '2nd' || serve === 'ace') && (
                <>
                  <div className="step" style={{ marginTop: 13 }}>Serve placement</div>
                  <ChipRow items={PLACE} value={place} onPick={setPlace} />
                </>
              )}
            </div>

            {/* STEP 2 — rally outcome (only if the ball was in play) */}
            {isRally && (
              <>
                <div className="split">
                  <button className="side you" style={winner === 'you' ? { outline: '2px solid var(--accent)' } : undefined} onClick={() => setWinner('you')}>
                    <div className="who">Point to</div><div className="pt">{youName}</div>
                  </button>
                  <button className="side" style={winner === 'opp' ? { outline: '2px solid var(--neg)' } : undefined} onClick={() => setWinner('opp')}>
                    <div className="who">Point to</div><div className="pt">{oppName}</div>
                  </button>
                </div>

                {winner && (
                  <div className="panel">
                    <div className="step">How did it end? · won by {winner === 'you' ? youName : oppName}</div>
                    <div className="opt-grid">
                      {HOW.map((h) => <button key={h} className={`opt${how === h ? ' on' : ''}`} onClick={() => setHow(h)}>{h}</button>)}
                    </div>
                    <div className="step" style={{ marginTop: 13 }}>Shot type</div>
                    {SHOTS.map((row, i) => (
                      <div className="shot-row" key={i}>
                        {row.map((sh) => <button key={sh} className={`shot${shot === sh ? ' on' : ''}`} onClick={() => setShot(sh)}>{sh}</button>)}
                      </div>
                    ))}

                    {isDeep && (
                      <>
                        <div className="step" style={{ marginTop: 13 }}>Shot direction</div>
                        <ChipRow items={DIRS} value={dir} onPick={setDir} />
                        <div className="step" style={{ marginTop: 13 }}>Rally length</div>
                        <ChipRow items={RALL} value={rally} onPick={setRally} />
                        <div className="step" style={{ marginTop: 13 }}>Return quality</div>
                        <div className="opt-grid">
                          {RET.map(([v, label]) => <button key={v} className={`opt${ret === v ? ' on' : ''}`} onClick={() => setRet(v)}>{label}</button>)}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="scout-foot">
              <button className="mini-btn" onClick={undo}>↺ Undo</button>
              <div className="dots">{dots.map((p, i) => <span key={i} className={`pdot ${p.winner}`} />)}</div>
              <button className="mini-btn">📝 Note</button>
            </div>

            {serve && (
              <div className="pad-lg" style={{ paddingTop: 0 }}>
                <button className="btn btn-accent" disabled={!canLog} onClick={log}>{canLog ? 'Log point ▸' : 'Complete the taps above'}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
