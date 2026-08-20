// ============================================================
// MatchMind — simulated AI report generator.
// Reads the real match (stats + momentum + reflection) and writes
// a personalised report. In Step 7 this is swapped for a real
// Claude API call; the output shape stays the same.
// ============================================================
import { computeState } from './engine'
import { buildMomentum } from './momentum'

const RECOVERY_LABELS = ['poorly', 'so-so', 'well', 'great']

export function generateReport(match) {
  const st = computeState(match)
  const mo = buildMomentum(st.perPoint, st.setBoundaries, match.config.opponent || 'your opponent')
  const cfg = match.config
  const s = st.stats
  const r = match.reflection || null

  const youName = (cfg.playerName || 'You').split(' ')[0]
  const oppName = cfg.opponent || 'Opponent'
  const won = st.matchWinner === 'you'
  const lost = st.matchWinner === 'opp'
  const total = s.pointsWon.you + s.pointsWon.opp || 1
  const pct = Math.round((s.pointsWon.you / total) * 100)

  const W = s.winners.you, UE = s.unforced.you, AC = s.aces.you, DF = s.doubleFaults.you, NET = s.netWon.you
  const BPc = s.bpConverted.you, BPt = s.bpTotal.you
  const firstServePct = s.servePts.you ? Math.round((s.firstIn.you / s.servePts.you) * 100) : null
  const deep = cfg.scoutMode === 'deep' ? s.deep : null

  const num = (k) => (r && typeof r[k] === 'number' ? r[k] : null)
  const confidence = num('confidence'), nerves = num('nerves'), focus = num('focus')
  const selftalk = num('selftalk'), motivation = num('motivation')
  const recovery = r && typeof r.recovery === 'number' ? r.recovery : null
  const recoveryLabel = recovery != null ? RECOVERY_LABELS[recovery] : null
  const challenge = r && r.challenge ? r.challenge : null
  const notes = r && r.notes ? r.notes.trim() : ''

  // ---- headline title ----
  let title
  if (won && W > UE) title = `${youName} hit through it — ${st.scoreString}.`
  else if (won && BPc >= 1) title = `${youName} took the big chances — ${st.scoreString}.`
  else if (won) title = `A hard-earned win, ${st.scoreString}.`
  else if (lost && UE > W) title = `Unforced errors made it a tough one.`
  else if (lost && nerves != null && nerves >= 7) title = `Nerves got the edge in a winnable match.`
  else if (lost) title = `A loss with clear lessons.`
  else title = `Your match so far.`

  // ---- Mind <-> Match insight (the signature) ----
  let mentalFlag = null
  if (recovery != null && recovery <= 1) mentalFlag = 'resetting after mistakes'
  else if (challenge) mentalFlag = challenge.toLowerCase()
  else if (nerves != null && nerves >= 7) mentalFlag = 'nerves'

  let insight
  if (mo.runs.opp.len >= 3 && mentalFlag) {
    insight = `Your momentum dipped most during a ${mo.runs.opp.len}-point run against you in Set ${mo.runs.opp.set}. You also flagged **${mentalFlag}** as today's struggle — staying composed through those swing moments is the clearest link between your head and the scoreboard.`
  } else if (won && mo.runs.you.len >= 3 && confidence != null) {
    insight = `Your best stretch — ${mo.runs.you.len} straight points in Set ${mo.runs.you.set} — lined up with your confidence (**${confidence}/10**). Carrying that feeling into tight moments is your edge.`
  } else if (mentalFlag) {
    insight = `You won ${pct}% of points but flagged **${mentalFlag}** as your challenge. Watch how that shows up on the big points — that's where your mind moves your results.`
  } else {
    insight = mo.insight
  }

  // ---- match summary ----
  const summary = `${won ? 'A win' : lost ? 'A loss' : 'In progress'}, ${st.scoreString}, against ${oppName}. `
    + `You took ${pct}% of all points (${s.pointsWon.you}–${s.pointsWon.opp}). ${mo.insight}`

  // ---- mental analysis ----
  let mental
  if (r) {
    const bits = []
    if (confidence != null) bits.push(`confidence ${confidence}/10`)
    if (focus != null) bits.push(`focus ${focus}/10`)
    if (nerves != null && nerves >= 6) bits.push(`pre-match nerves ${nerves}/10`)
    mental = `You rated ${bits.join(', ')}.`
      + (recoveryLabel ? ` You recovered ${recoveryLabel} after mistakes.` : '')
      + (challenge ? ` Your biggest mental challenge was ${challenge.toLowerCase()}.` : '')
      + (recovery != null && recovery <= 1 && UE > 0
        ? ` That fits the ${UE} unforced errors — frustration tends to leak into loose points.` : '')
    if (notes) mental += ` In your words: “${notes}”.`
  } else {
    mental = `No reflection was filled in for this match, so the mental read is limited. Completing it next time unlocks the full mind↔match analysis.`
  }

  // ---- technical & tactical ----
  const tech = []
  if (AC > DF) tech.push(`Your serve was a weapon — ${AC} ace${AC === 1 ? '' : 's'} against ${DF} double fault${DF === 1 ? '' : 's'}.`)
  else if (DF > AC) tech.push(`The serve leaked points (${DF} double fault${DF === 1 ? '' : 's'} vs ${AC} ace${AC === 1 ? '' : 's'}).`)
  tech.push(`${W} winner${W === 1 ? '' : 's'} against ${UE} unforced error${UE === 1 ? '' : 's'}`
    + (W > UE ? ' — a healthy balance.' : UE > W ? ' — too many free points given away.' : '.'))
  if (firstServePct != null) {
    tech.push(`First serve landed ${firstServePct}% of the time`
      + (firstServePct < 55 ? ' — more first serves in would take pressure off.' : firstServePct >= 65 ? ' — a reliable platform.' : '.'))
  }
  if (NET >= 2) tech.push(`Coming forward paid off (${NET} points won at the net).`)
  if (BPt > 0) tech.push(`You converted ${BPc} of ${BPt} break point${BPt === 1 ? '' : 's'}.`)
  if (deep) {
    const dirName = { cc: 'crosscourt', dtl: 'down-the-line', middle: 'through the middle' }
    const top = Object.entries(deep.direction).sort((a, b) => b[1] - a[1])[0]
    if (top && top[1] > 0) tech.push(`Most of your winners went ${dirName[top[0]]}.`)
    if (deep.rally.long + deep.rally.short > 0) {
      tech.push(deep.rally.long > deep.rally.short
        ? 'You won more of the long rallies — patience is a weapon for you.'
        : 'Most of your points ended quickly — you kept rallies short.')
    }
  }
  const technical = tech.join(' ')

  // ---- strengths ----
  const strengths = []
  if (W >= UE && W > 0) strengths.push(`Clean, aggressive ball-striking (${W} winners).`)
  if (AC >= 3 || (AC > DF && AC > 0)) strengths.push(`Dependable serve (${AC} aces).`)
  if (BPc >= 1) strengths.push(`Took your break-point chances (${BPc}/${BPt}).`)
  if (NET >= 2) strengths.push(`Effective at the net (${NET} points).`)
  if (confidence != null && confidence >= 7) strengths.push(`Played with real confidence (${confidence}/10).`)
  if (motivation != null && motivation >= 7) strengths.push(`High competitive drive (${motivation}/10).`)
  if (recovery != null && recovery >= 2) strengths.push(`Reset well after mistakes.`)
  if (!strengths.length) strengths.push(`Competed point-for-point (${pct}% of points won).`)

  // ---- areas to improve ----
  const improve = []
  if (UE > W) improve.push(`Cut the unforced errors (${UE} this match).`)
  if (DF >= 2) improve.push(`Steady the second serve (${DF} double faults).`)
  if (firstServePct != null && firstServePct < 55) improve.push(`Get more first serves in (${firstServePct}% this match).`)
  if (BPt > 0 && BPc / BPt < 0.5) improve.push(`Convert more break points (${BPc}/${BPt}).`)
  if (recovery != null && recovery <= 1) improve.push(`Reset faster after errors — build a between-point routine.`)
  if (nerves != null && nerves >= 7) improve.push(`Settle pre-match nerves (breathing, a warm-up routine).`)
  if (focus != null && focus <= 4) improve.push(`Hold focus between points (${focus}/10).`)
  if (selftalk != null && selftalk <= 4) improve.push(`More positive self-talk (${selftalk}/10).`)
  if (challenge && !improve.some((x) => x.toLowerCase().includes(challenge.toLowerCase()))) {
    improve.push(`Work on ${challenge.toLowerCase()} — the challenge you named.`)
  }
  if (!improve.length) improve.push(`Keep building on a well-rounded performance.`)

  return {
    title,
    resultLine: `vs. ${oppName} · ${st.scoreString} · ${won ? 'Won' : lost ? 'Lost' : 'In progress'}`,
    insight,
    summary,
    mental,
    technical,
    strengths: strengths.slice(0, 3),
    improve: improve.slice(0, 3),
  }
}
