// A single match row, used on Home and History.
// `pending` = this is the player's match and it still needs their reflection.
export default function MatchCard({ m, onClick, pending }) {
  const won = m.result === 'W'
  return (
    <button className={`match-card${pending ? ' pending' : ''}`} onClick={onClick}>
      <div className={`res ${won ? 'w' : 'l'}`}>{m.result}</div>
      <div className="mc-main">
        <div className="mc-opp">vs. {m.opponent}</div>
        <div className="mc-sub">{m.managedName ? `👶 ${m.managedName} · ` : ''}{m.score} · {m.surface} · {m.when}</div>
      </div>
      {pending ? (
        <span className="reflect-badge">⚡ Reflect</span>
      ) : (
        <svg className="spark" viewBox="0 0 54 30">
          <polyline points={m.spark} fill="none" stroke={won ? '#34D399' : '#FB7185'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
