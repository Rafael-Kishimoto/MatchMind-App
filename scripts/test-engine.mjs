import { createMatch, computeState } from '../src/lib/engine.js'

let pass = 0, fail = 0
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗ FAIL:', name, extra) }
}
function mk(cfg) {
  return createMatch({ opponent: 'Test', playerName: 'Me', surface: 'Hard', adScoring: true, finalSetTb: true, firstServer: 'you', mood: false, format: 'Best of 3', ...cfg })
}
function play(m, winners, how = 'Winner', shot = 'Forehand') {
  winners.forEach((w) => m.points.push({ winner: w, how, shot }))
}
const rep = (w, n) => Array(n).fill(w)

console.log('\n1) Hold serve to love')
{
  const m = mk({})
  play(m, rep('you', 4))
  const s = computeState(m)
  check('games you = 1', s.games.you === 1, JSON.stringify(s.games))
  check('server flips to opp', s.server === 'opp', s.server)
  check('points reset to 0-0', s.points.you === '0' && s.points.opp === '0')
}

console.log('\n2) Win a 6–0 set')
{
  const m = mk({})
  play(m, rep('you', 24))
  const s = computeState(m)
  check('set score 6–0', s.setScores[0] && s.setScores[0].you === 6 && s.setScores[0].opp === 0, JSON.stringify(s.setScores))
  check('match not over (need 2 sets)', s.matchOver === false)
  check('now in set 2', s.meta.setNumber === 2, s.meta.setNumber)
}

console.log('\n3) Break point detection + conversion')
{
  const m = mk({})        // you serve first
  play(m, rep('opp', 3))  // 0–40 on your serve
  let s = computeState(m)
  check('break point flagged at 0–40', s.isBreakPoint === true)
  play(m, ['opp'])        // opp converts
  s = computeState(m)
  check('break converted -> opp games 1', s.games.opp === 1)
  check('bp opportunities for opp = 1', s.stats.bpTotal.opp === 1, JSON.stringify(s.stats.bpTotal))
  check('bp converted for opp = 1', s.stats.bpConverted.opp === 1)
}

console.log('\n4) No-ad: deciding point at deuce')
{
  const m = mk({ adScoring: false })
  play(m, ['you', 'you', 'you', 'opp', 'opp', 'opp']) // 3-3 deuce
  let s = computeState(m)
  check('deuce shown as 40–40', s.points.you === '40' && s.points.opp === '40')
  play(m, ['you']) // deciding point
  s = computeState(m)
  check('game won on deciding point', s.games.you === 1, JSON.stringify(s.games))
}

console.log('\n5) Set tiebreak at 6–6')
{
  const m = mk({})
  for (let i = 0; i < 6; i++) { play(m, rep('you', 4)); play(m, rep('opp', 4)) } // 6-6
  let s = computeState(m)
  check('entered tiebreak at 6–6', s.inTiebreak === true, JSON.stringify(s.games))
  play(m, rep('you', 7)) // win TB 7-0
  s = computeState(m)
  check('set recorded 7–6', s.setScores[0].you === 7 && s.setScores[0].opp === 6, JSON.stringify(s.setScores))
  check('tiebreak score stored', s.setScores[0].tb && s.setScores[0].tb.you === 7)
}

console.log('\n6) Match tiebreak format (first to 10)')
{
  const m = mk({ format: 'Match TB (10)' })
  play(m, rep('you', 10))
  const s = computeState(m)
  check('match over', s.matchOver === true)
  check('winner = you', s.matchWinner === 'you')
  check('score 10–0 (TB)', s.setScores[0].you === 10 && s.setScores[0].isTB === true, JSON.stringify(s.setScores))
}

console.log('\n7) Best-of-3 with final-set tiebreak')
{
  const m = mk({ finalSetTb: true })
  play(m, rep('you', 24)) // set 1: 6-0 you
  play(m, rep('opp', 24)) // set 2: 6-0 opp -> 1-1
  let s = computeState(m)
  check('third set is a tiebreak set', s.inTiebreak === true && s.curIsTBSet === true)
  play(m, rep('you', 10)) // win match TB 10-0
  s = computeState(m)
  check('match over, winner you', s.matchOver === true && s.matchWinner === 'you')
  check('3 sets recorded, last is TB', s.setScores.length === 3 && s.setScores[2].isTB === true, JSON.stringify(s.setScores))
}

console.log('\n8) Stats tally')
{
  const m = mk({})
  m.points.push({ winner: 'you', how: 'Ace', shot: 'Serve' })       // you serving -> ace
  m.points.push({ winner: 'you', how: 'Winner', shot: 'Volley' })   // net winner
  m.points.push({ winner: 'opp', how: 'Unforced', shot: 'Forehand' })// your unforced error
  const s = computeState(m)
  check('ace counted for you', s.stats.aces.you === 1, JSON.stringify(s.stats.aces))
  check('net winner counted', s.stats.netWon.you === 1)
  check('your unforced error counted', s.stats.unforced.you === 1, JSON.stringify(s.stats.unforced))
}

console.log('\n9) Serve stats (first-serve %)')
{
  const m = mk({}) // you serve first
  m.points.push({ winner: 'you', serve: '1st', how: 'Winner', shot: 'Forehand' })
  m.points.push({ winner: 'you', serve: 'ace', how: 'Ace', shot: 'Serve' })
  m.points.push({ winner: 'you', serve: '2nd', how: 'Winner', shot: 'Forehand' })
  m.points.push({ winner: 'opp', serve: 'df', how: 'Dbl fault', shot: 'Serve' })
  const s = computeState(m)
  check('serve points for you = 4', s.stats.servePts.you === 4, JSON.stringify(s.stats.servePts))
  check('first serves in = 2 (1st + ace)', s.stats.firstIn.you === 2, JSON.stringify(s.stats.firstIn))
  check('ace counted', s.stats.aces.you === 1)
  check('double fault counted', s.stats.doubleFaults.you === 1)
}

console.log('\n10) Deep aggregates')
{
  const m = mk({}) // you serve game 1
  for (let i = 0; i < 4; i++) m.points.push({ winner: 'you', serve: '1st', how: 'Winner', shot: 'Forehand', direction: 'cc', rally: 'long' })
  // game 2: opp serves, you are the receiver
  m.points.push({ winner: 'you', serve: '1st', how: 'Winner', shot: 'Backhand', direction: 'dtl', rally: 'short', returnQuality: 'attack' })
  const s = computeState(m)
  check('crosscourt winners = 4', s.stats.deep.direction.cc === 4, JSON.stringify(s.stats.deep.direction))
  check('down-the-line winner = 1', s.stats.deep.direction.dtl === 1)
  check('rally long=4, short=1', s.stats.deep.rally.long === 4 && s.stats.deep.rally.short === 1)
  check('your return (as receiver) counted', s.stats.deep.ret.attack === 1, JSON.stringify(s.stats.deep.ret))
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`)
process.exit(fail ? 1 : 0)
