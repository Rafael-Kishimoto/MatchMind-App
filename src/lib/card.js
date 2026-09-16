import { computeState } from './engine'
import { buildMomentum } from './momentum'

// Turn a stored match into the shape the Home/History match cards expect,
// including a tiny momentum sparkline derived from the real points.
export function matchToCard(match) {
  const st = computeState(match)
  const mo = buildMomentum(st.perPoint, st.setBoundaries, match.config.opponent)
  const result = st.matchWinner === 'you' ? 'W' : st.matchWinner === 'opp' ? 'L' : '–'

  const s = mo.series
  let spark
  if (s.length >= 2) {
    const maxAbs = Math.max(1, ...s.map((v) => Math.abs(v)))
    const N = Math.min(9, s.length)
    const pts = []
    for (let i = 0; i < N; i++) {
      const idx = Math.round((i / (N - 1)) * (s.length - 1))
      const x = (i / (N - 1)) * 54
      const y = 15 - (s[idx] / maxAbs) * 11
      pts.push(`${x.toFixed(0)},${y.toFixed(0)}`)
    }
    spark = pts.join(' ')
  } else {
    spark = '0,15 54,15'
  }

  return {
    id: match.id,
    opponent: match.config.opponent || 'Opponent',
    result,
    score: st.scoreString || '—',
    surface: match.config.surface || '',
    when: 'Recent',
    spark,
    real: true,
    hasReflection: !!match.reflection,
    owner: match._owner,
    managedName: match.config?.managedFor?.name || null,
  }
}

// Career tiles computed from real saved matches.
export function computeCareer(savedMatches) {
  const states = savedMatches.map((m) => computeState(m))
  const done = states.filter((st) => st.matchOver)
  let winRate = null
  if (done.length) {
    const wins = done.filter((st) => st.matchWinner === 'you').length
    winRate = Math.round((wins / done.length) * 100)
  }

  let avgMindset = null
  const scores = savedMatches
    .filter((m) => m.reflection)
    .map((m) => {
      const r = m.reflection
      const vals = ['confidence', 'focus', 'selftalk', 'motivation'].map((k) => r[k]).filter((v) => typeof v === 'number')
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    })
    .filter((v) => v != null)
  if (scores.length) avgMindset = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10

  return { matches: savedMatches.length, winRate, avgMindset }
}
