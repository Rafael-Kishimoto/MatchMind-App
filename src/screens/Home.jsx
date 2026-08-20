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
  const { profile: authProfile } = useAuth()
  const displayName = authProfile?.name || sampleProfile.name
  const initial = (displayName[0] || 'P').toUpperCase()

  const realCards = savedMatches.map(matchToCard)
  const cards = [...realCards, ...sampleMatches]

  // Real career stats once you've saved matches; sample placeholders before that.
  const career = savedMatches.length ? computeCareer(savedMatches) : careerStats
  const fmt = (v, suffix = '') => (v == null ? '—' : `${v}${suffix}`)

  const open = (card) => {
    if (card.real) { viewMatch(card.id); navigate('/momentum') }
    else navigate('/report')
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
          <MatchCard key={m.id} m={m} onClick={() => open(m)} />
        ))}

        <div className="fab-wrap">
          <button className="btn btn-accent" onClick={() => navigate('/new')}>+&nbsp;&nbsp;New match</button>
        </div>
      </div>
      <TabBar />
    </div>
  )
}
