// ============================================================
// MatchMind — tennis scoring + stats + momentum engine
// Pure functions, no React. The source of truth for a match is
// its ordered list of points; computeState() replays them.
// ============================================================

export const OUTCOMES = ['Winner', 'Forced err', 'Unforced', 'Ace', 'Dbl fault']
export const RALLY_OUTCOMES = ['Winner', 'Forced err', 'Unforced'] // ace/df now come from the serve step
export const SHOTS = ['Forehand', 'Backhand', 'Serve', 'Volley', 'Overhead', 'Other']

// Serve outcome (the server's): first serve in, went to second, ace, double fault.
export const SERVES = ['1st', '2nd', 'ace', 'df']
// Deep-scout extras:
export const SERVE_PLACEMENTS = ['wide', 'body', 't']
export const DIRECTIONS = ['cc', 'dtl', 'middle']
export const RALLIES = ['short', 'medium', 'long']
export const RETURNS = ['attack', 'neutral', 'defensive', 'miss']

const other = (p) => (p === 'you' ? 'opp' : 'you')

// ---- format helpers ----
function setGamesTarget(format) {
  return format === 'Pro set (8)' ? 8 : 6
}
function setsToWin(format) {
  return format === 'Best of 3' ? 2 : 1
}
const isMatchTBFormat = (format) => format === 'Match TB (10)'

// A brand-new match (config + empty points).
export function createMatch(config) {
  return {
    id: 'm_' + Date.now().toString(36),
    createdAt: Date.now(),
    config,            // {opponent, playerName, surface, format, adScoring, finalSetTb, firstServer, mood}
    points: [],        // [{winner:'you'|'opp', how, shot}]
    moods: [],         // [{atPoint, mood}] (changeover mood markers, optional)
    reflection: null,
    status: 'in_progress',
  }
}

// ---- per-set state ----
function newSetState(config, setsWon) {
  const finalSetTB = config.format === 'Best of 3' && config.finalSetTb && setsWon.you === 1 && setsWon.opp === 1
  const matchTB = isMatchTBFormat(config.format)
  const isTBSet = finalSetTB || matchTB
  return {
    games: { you: 0, opp: 0 },
    gpts: { you: 0, opp: 0 },
    inTiebreak: isTBSet,
    tbTarget: isTBSet ? 10 : 7,
    isMatchTBSet: isTBSet,
  }
}

function initState(config) {
  const s = {
    config,
    server: config.firstServer || 'you',
    setsWon: { you: 0, opp: 0 },
    completedSets: [],
    matchOver: false,
    matchWinner: null,
    tbFirstServer: null,
    tbServeCount: 0,
  }
  s.cur = newSetState(config, s.setsWon)
  if (s.cur.inTiebreak) { s.tbFirstServer = s.server; s.tbServeCount = 0 }
  return s
}

// ---- game / set rules ----
function gameWon(gpts, p, ad) {
  const a = gpts[p], b = gpts[other(p)]
  return ad ? a >= 4 && a - b >= 2 : a >= 4
}
function oneFromGame(gpts, p, ad) {
  const test = { you: gpts.you, opp: gpts.opp }
  test[p]++
  return gameWon(test, p, ad)
}
function oneFromGameOrTB(cur, p, ad) {
  if (cur.inTiebreak) {
    const a = cur.gpts[p] + 1, b = cur.gpts[other(p)]
    return a >= cur.tbTarget && a - b >= 2
  }
  return oneFromGame(cur.gpts, p, ad)
}
function winsSetIfWon(s, p) {
  const cur = s.cur
  if (cur.inTiebreak) return true
  const target = setGamesTarget(s.config.format)
  const g = cur.games[p] + 1
  return g >= target && g - cur.games[other(p)] >= 2
}

function afterSet(s, winner) {
  s.setsWon[winner]++
  if (s.setsWon[winner] >= setsToWin(s.config.format)) {
    s.matchOver = true
    s.matchWinner = winner
    return
  }
  s.cur = newSetState(s.config, s.setsWon)
  if (s.cur.inTiebreak) { s.tbFirstServer = s.server; s.tbServeCount = 0 }
}

// Apply one point to the running state.
function applyPoint(s, winner) {
  const cur = s.cur
  if (cur.inTiebreak) {
    cur.gpts[winner]++
    s.tbServeCount++
    if (cur.gpts[winner] >= cur.tbTarget && cur.gpts[winner] - cur.gpts[other(winner)] >= 2) {
      if (cur.isMatchTBSet) {
        s.completedSets.push({ you: cur.gpts.you, opp: cur.gpts.opp, isTB: true })
      } else {
        const g = { you: cur.games.you, opp: cur.games.opp }
        g[winner] = 7; g[other(winner)] = 6
        s.completedSets.push({ you: g.you, opp: g.opp, tb: { you: cur.gpts.you, opp: cur.gpts.opp } })
      }
      afterSet(s, winner)
    }
    return
  }

  cur.gpts[winner]++
  if (gameWon(cur.gpts, winner, s.config.adScoring)) {
    cur.games[winner]++
    cur.gpts = { you: 0, opp: 0 }
    s.server = other(s.server) // server alternates each game
    const g = cur.games
    const target = setGamesTarget(s.config.format)
    if ((g.you >= target || g.opp >= target) && Math.abs(g.you - g.opp) >= 2) {
      s.completedSets.push({ you: g.you, opp: g.opp })
      afterSet(s, g.you > g.opp ? 'you' : 'opp')
    } else if (g.you === target && g.opp === target) {
      cur.inTiebreak = true
      cur.tbTarget = 7
      cur.gpts = { you: 0, opp: 0 }
      s.tbFirstServer = s.server
      s.tbServeCount = 0
    }
  }
}

// Tiebreak server: first server serves 1 point, then players alternate every 2.
function serverForTBPoint(n, first) {
  if (n === 0) return first
  return Math.floor((n + 1) / 2) % 2 === 1 ? other(first) : first
}

// ---- point-value display ----
const PT = ['0', '15', '30', '40']
function gameDisplay(cur, ad) {
  if (cur.inTiebreak) return { you: String(cur.gpts.you), opp: String(cur.gpts.opp) }
  const a = cur.gpts.you, b = cur.gpts.opp
  if (a >= 3 && b >= 3) {
    if (!ad || a === b) return { you: '40', opp: '40' }
    return a > b ? { you: 'AD', opp: '40' } : { you: '40', opp: 'AD' }
  }
  return { you: PT[a], opp: PT[b] }
}

// ---- importance weight for momentum ----
function pointWeight(s, server) {
  const cur = s.cur
  const ad = s.config.adScoring
  const setPt = (p) => oneFromGameOrTB(cur, p, ad) && winsSetIfWon(s, p)
  const matchPt = (p) => setPt(p) && s.setsWon[p] + 1 >= setsToWin(s.config.format)
  const receiver = other(server)
  const bp = !cur.inTiebreak && oneFromGame(cur.gpts, receiver, ad)

  if (matchPt('you') || matchPt('opp')) return 3.0
  if (setPt('you') || setPt('opp')) return 2.4
  if (bp) return 2.2
  if (oneFromGameOrTB(cur, 'you', ad) || oneFromGameOrTB(cur, 'opp', ad)) return 1.4
  return cur.inTiebreak ? 1.6 : 1.0
}

// ============================================================
// Replay all points and return the full derived state.
// ============================================================
export function computeState(match) {
  const config = match.config
  const s = initState(config)

  const zero = () => ({ you: 0, opp: 0 })
  const stats = {
    pointsWon: zero(), winners: zero(), unforced: zero(), forced: zero(),
    aces: zero(), doubleFaults: zero(), netWon: zero(),
    bpTotal: zero(), bpConverted: zero(),
    firstIn: zero(), servePts: zero(),   // serve stats (attributed to server)
    deep: {
      direction: { cc: 0, dtl: 0, middle: 0 }, // your winning-shot directions
      rally: { short: 0, medium: 0, long: 0 }, // rally-length distribution
      ret: { attack: 0, neutral: 0, defensive: 0, miss: 0 }, // your return quality
    },
  }
  const perPoint = []
  const setBoundaries = []

  for (const p of match.points) {
    if (s.matchOver) break
    const cur = s.cur
    const server = cur.inTiebreak ? serverForTBPoint(s.tbServeCount, s.tbFirstServer) : s.server
    const receiver = other(server)
    const isBP = !cur.inTiebreak && oneFromGame(cur.gpts, receiver, config.adScoring)
    const weight = pointWeight(s, server)

    // stats
    const w = p.winner, l = other(w)
    stats.pointsWon[w]++
    if (p.how === 'Winner') stats.winners[w]++
    else if (p.how === 'Unforced') stats.unforced[l]++
    else if (p.how === 'Forced err') stats.forced[l]++
    else if (p.how === 'Ace') stats.aces[server]++
    else if (p.how === 'Dbl fault') stats.doubleFaults[server]++
    if ((p.shot === 'Volley' || p.shot === 'Overhead') && p.how === 'Winner') stats.netWon[w]++
    if (isBP) { stats.bpTotal[receiver]++; if (w === receiver) stats.bpConverted[receiver]++ }

    // serve stats (attributed to the server)
    if (p.serve) {
      stats.servePts[server]++
      if (p.serve === '1st' || p.serve === 'ace') stats.firstIn[server]++
    }
    // deep-scout aggregates (focused on your play)
    if (p.direction && w === 'you' && stats.deep.direction[p.direction] != null) stats.deep.direction[p.direction]++
    if (p.rally && stats.deep.rally[p.rally] != null) stats.deep.rally[p.rally]++
    if (p.returnQuality && receiver === 'you' && stats.deep.ret[p.returnQuality] != null) stats.deep.ret[p.returnQuality]++

    perPoint.push({ winner: w, server, isBP, weight })

    const setsBefore = s.completedSets.length
    applyPoint(s, p.winner)
    if (s.completedSets.length > setsBefore) setBoundaries.push(perPoint.length)
  }

  const cur = s.cur
  const curServer = cur.inTiebreak ? serverForTBPoint(s.tbServeCount, s.tbFirstServer) : s.server
  const receiver = other(curServer)
  const isBreakPoint = !s.matchOver && !cur.inTiebreak && oneFromGame(cur.gpts, receiver, config.adScoring)

  const scoreString = s.completedSets.length
    ? s.completedSets.map((x) => `${x.you}–${x.opp}`).join(', ')
    : `${cur.games.you}–${cur.games.opp}`

  return {
    config,
    server: curServer,
    isBreakPoint,
    matchOver: s.matchOver,
    matchWinner: s.matchWinner,
    setScores: s.completedSets,
    games: cur.games,
    points: s.matchOver ? null : gameDisplay(cur, config.adScoring),
    inTiebreak: cur.inTiebreak,
    curIsTBSet: cur.isMatchTBSet,
    meta: {
      setNumber: s.completedSets.length + 1,
      gameNumber: cur.games.you + cur.games.opp + 1,
      label: cur.inTiebreak ? 'TIE-BREAK' : `SET ${s.completedSets.length + 1} · GAME ${cur.games.you + cur.games.opp + 1}`,
    },
    stats,
    perPoint,
    setBoundaries,
    scoreString,
  }
}
