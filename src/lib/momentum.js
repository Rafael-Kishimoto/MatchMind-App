// Builds the momentum line + markers + a plain-language insight from the
// per-point data produced by engine.computeState().

const DECAY = 0.8 // how quickly momentum reverts toward neutral

export function buildMomentum(perPoint, setBoundaries, opponentName = 'your opponent') {
  let m = 0
  const series = [0]
  perPoint.forEach((pp) => {
    const sgn = pp.winner === 'you' ? 1 : -1
    m = m * DECAY + sgn * pp.weight
    series.push(m)
  })

  // turning points = your lowest and highest momentum
  let minIdx = 0, maxIdx = 0
  series.forEach((v, i) => {
    if (v < series[minIdx]) minIdx = i
    if (v > series[maxIdx]) maxIdx = i
  })

  const setNoAt = (pointNumber) => 1 + setBoundaries.filter((b) => b < pointNumber).length

  // longest runs either way
  let bestYou = { len: 0, end: 0 }, bestOpp = { len: 0, end: 0 }
  let run = 0, prev = null
  perPoint.forEach((pp, i) => {
    run = pp.winner === prev ? run + 1 : 1
    prev = pp.winner
    const target = pp.winner === 'you' ? bestYou : bestOpp
    if (run > target.len) { target.len = run; target.end = i + 1 }
  })

  const youWon = perPoint.filter((p) => p.winner === 'you').length
  const oppWon = perPoint.length - youWon

  let insight
  if (perPoint.length < 4) {
    insight = 'Not enough points yet to read the momentum.'
  } else if (bestOpp.len >= 3 && bestOpp.len >= bestYou.len) {
    const set = setNoAt(bestOpp.end)
    insight = `Your toughest stretch was ${bestOpp.len} points in a row to ${opponentName} in Set ${set}. That run is where the match swung against you — worth reviewing what changed there.`
  } else if (bestYou.len >= 3) {
    const set = setNoAt(bestYou.end)
    insight = `Your best run was ${bestYou.len} straight points in Set ${set} — you took control when you strung points together.`
  } else {
    insight = `Momentum stayed close all match (${youWon}–${oppWon} on points) with no long runs either way.`
  }

  return {
    series,
    nPoints: perPoint.length,
    setBoundaries,
    markers: { minIdx, maxIdx },
    insight,
    youWon,
    oppWon,
    runs: {
      you: { len: bestYou.len, set: setNoAt(bestYou.end) },
      opp: { len: bestOpp.len, set: setNoAt(bestOpp.end) },
    },
  }
}
