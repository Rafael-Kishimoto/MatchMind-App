// Draws the momentum line from a series of values (positive = you ahead).
// Green area above the centre line, red below, with set dividers + turning points.
export default function MomentumChart({ series, setBoundaries = [], markers, moods = [] }) {
  const W = 300, H = 150, PAD = 16, C = H / 2
  const n = series.length

  if (n < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <line x1="0" y1={C} x2={W} y2={C} stroke="rgba(255,255,255,.14)" strokeWidth="1" strokeDasharray="3 3" />
        <text x={W / 2} y={C - 8} fill="#5E6B7A" fontSize="9" textAnchor="middle">Log points to build the graph</text>
      </svg>
    )
  }

  const maxAbs = Math.max(1, ...series.map((v) => Math.abs(v)))
  const xOf = (i) => (i / (n - 1)) * W
  const yOf = (v) => C - (v / maxAbs) * (C - PAD)

  const line = series.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')
  const area = `M ${xOf(0)},${yOf(series[0])} `
    + series.map((v, i) => `L ${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')
    + ` L ${xOf(n - 1)},${C} L ${xOf(0)},${C} Z`

  // set segments for labels
  const bounds = [0, ...setBoundaries.filter((b) => b > 0 && b < n - 1), n - 1]
  const segments = []
  for (let i = 0; i < bounds.length - 1; i++) segments.push([bounds[i], bounds[i + 1]])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <clipPath id="mm-top"><rect x="0" y="0" width={W} height={C} /></clipPath>
        <clipPath id="mm-bot"><rect x="0" y={C} width={W} height={H - C} /></clipPath>
      </defs>

      {/* centre line */}
      <line x1="0" y1={C} x2={W} y2={C} stroke="rgba(255,255,255,.14)" strokeWidth="1" strokeDasharray="3 3" />

      {/* set dividers + labels */}
      {setBoundaries.filter((b) => b > 0 && b < n - 1).map((b, i) => (
        <line key={i} x1={xOf(b)} y1="6" x2={xOf(b)} y2={H - 6} stroke="rgba(255,255,255,.08)" strokeWidth="1" />
      ))}
      {segments.length > 1 && segments.map((seg, i) => (
        <text key={i} x={(xOf(seg[0]) + xOf(seg[1])) / 2} y="14" fill="#5E6B7A" fontSize="8" textAnchor="middle">SET {i + 1}</text>
      ))}

      {/* shaded areas */}
      <path d={area} fill="rgba(52,211,153,.16)" clipPath="url(#mm-top)" />
      <path d={area} fill="rgba(251,113,133,.16)" clipPath="url(#mm-bot)" />

      {/* the line */}
      <polyline points={line} fill="none" stroke="#EAF0F6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

      {/* turning points */}
      {markers && (
        <>
          <circle cx={xOf(markers.minIdx)} cy={yOf(series[markers.minIdx])} r="4.5" fill="#FB7185" stroke="#0E1419" strokeWidth="2" />
          <circle cx={xOf(markers.maxIdx)} cy={yOf(series[markers.maxIdx])} r="4.5" fill="#34D399" stroke="#0E1419" strokeWidth="2" />
        </>
      )}

      {/* optional mood markers */}
      {moods.map((md, i) => (
        <text key={i} x={xOf(md.atPoint)} y={yOf(series[md.atPoint] ?? 0) - 8} fontSize="11" textAnchor="middle">{md.emoji}</text>
      ))}
    </svg>
  )
}
