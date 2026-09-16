import { useNavigate } from 'react-router-dom'
import TabBar from '../components/TabBar'
import MatchCard from '../components/MatchCard'
import { useMatch } from '../store/MatchStore'
import { useAuth } from '../store/AuthStore'
import { matchToCard, computeCareer } from '../lib/card'
import { profile as sampleProfile, careerStats, matches as sampleMatches } from '../data/sample'

export default function Home() {
  const navigate = useNavigate()
  const { savedMatches, viewMatch } = useMatch()
  const { profile: authProfile, user } = useAuth()
  const displayName = authProfile?.name || sampleProfile.name
  const initial = (displayName[0] || 'P').toUpperCase()

  // A match is "pending" if it's yours and still has no reflection.
  const realCards = savedMatches.map((mm) => {
    const c = matchToCard(mm)
    return { ...c, pending: !c.hasReflection && c.owner === user?.id }
  })
  const cards = [...realCards, ...sampleMatches]
  const pendingCount = realCards.filter((c) => c.pending).length

  const career = savedMatches.length ? computeCareer(savedMatches) : careerStats
  const fmt = (v, suffix = '') => (v == null ? '—' : `${v}${suffix}`)

  const open = (card) => {
    if (!card.real) { navigate('/report'); return }
    viewMatch(card.id)
    navigate(card.pending ? '/reflect' : '/momentum')
  }

  return (
    <div className="app has-tabbar">
      <div className="screen-scroll">
        <div className="home-head">
          <div className="row between">
            <div>
              <div className="h-eyebrow">Welcome back</div>
              <div className="h-title">Hi, {displayName.split(' ')[0]}</div>
            </div>
            <button className="avatar" onClick={() => navigate('/profiles')}>{initial}</button>
          </div>
        </div>

        {pendingCount > 0 && (
          <button className="reflect-banner" onClick={() => open(realCards.find((c) => c.pending))}>
            ⚡ {pendingCount} match{pendingCount > 1 ? 'es' : ''} need{pendingCount > 1 ? '' : 's'} your reflection — tap to finish
          </button>
        )}

        <div className="summary">
          <div className="stat-tile"><div className="num">{career.matches}</div><div className="lbl">Matches</div></div>
          <div className="stat-tile"><div className="num acc">{fmt(career.winRate, '%')}</div><div className="lbl">Win rate</div></div>
          <div className="stat-tile"><div className="num">{fmt(career.avgMindset)}</div><div className="lbl">Avg. mindset</div></div>
        </div>

        <div className="section-head">
          <div className="t">Recent matches</div>
          <button className="a" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/history')}>See all</button>
        </div>

        {cards.slice(0, 4).map((m) => (
          <MatchCard key={m.id} m={m} pending={m.pending} onClick={() => open(m)} />
        ))}

        <div className="fab-wrap">
          <button className="btn btn-accent" onClick={() => navigate('/new')}>+&nbsp;&nbsp;New match</button>
        </div>
      </div>
      <TabBar />
    </div>
  )
}
