// A single match row, used on Home and History.
export default function MatchCard({ m, onClick }) {
  const won = m.result === 'W'
  return (
    <button className="match-card" onClick={onClick}>
      <div className={`res ${won ? 'w' : 'l'}`}>{m.result}</div>
      <div className="mc-main">
        <div className="mc-opp">vs. {m.opponent}</div>
        <div className="mc-sub">{m.score} · {m.surface} · {m.when}</div>
      </div>
      <svg className="spark" viewBox="0 0 54 30">
        <polyline
          points={m.spark}
          fill="none"
          stroke={won ? '#34D399' : '#FB7185'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
