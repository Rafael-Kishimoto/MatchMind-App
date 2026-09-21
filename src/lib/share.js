// Build a short, shareable text summary of a match, and share it via the
// phone's native share sheet (with a copy-to-clipboard fallback).

export function buildShareText(state, cfg, mo) {
  const you = (cfg.playerName || 'Player').split(' ')[0]
  const opp = cfg.opponent || 'Opponent'
  const s = state.stats
  const result = state.matchOver ? (state.matchWinner === 'you' ? '✅ Won' : 'Lost') : '⏱️ In progress'
  const total = s.pointsWon.you + s.pointsWon.opp
  const ptsPct = total ? Math.round((s.pointsWon.you / total) * 100) : 0
  const firstIn = s.servePts.you ? Math.round((s.firstIn.you / s.servePts.you) * 100) : null

  const lines = [
    `🎾 ${you} vs ${opp}`,
    `${state.scoreString} · ${result}`,
    '',
    '📊 Stats',
    `• Points won: ${ptsPct}%`,
    `• Winners: ${s.winners.you} · Unforced errors: ${s.unforced.you}`,
    `• Aces: ${s.aces.you} · Double faults: ${s.doubleFaults.you}`,
    firstIn != null ? `• 1st serve in: ${firstIn}%` : null,
    s.bpTotal.you > 0 ? `• Break points: ${s.bpConverted.you}/${s.bpTotal.you}` : null,
  ].filter((x) => x !== null)

  if (mo && mo.insight) lines.push('', `💡 ${mo.insight.replace(/\*\*/g, '')}`)
  lines.push('', 'Live-scouted with MatchMind 🎾')
  return lines.join('\n')
}

export async function shareText(text) {
  try {
    if (navigator.share) { await navigator.share({ text }); return 'shared' }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled'
    // otherwise fall through to clipboard
  }
  try { await navigator.clipboard.writeText(text); return 'copied' } catch { return 'failed' }
}
