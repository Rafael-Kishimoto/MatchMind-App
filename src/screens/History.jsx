import { useNavigate } from 'react-router-dom'
import TabBar from '../components/TabBar'
import MatchCard from '../components/MatchCard'
import { useMatch } from '../store/MatchStore'
import { useAuth } from '../store/AuthStore'
import { matchToCard } from '../lib/card'
import { matches as sampleMatches } from '../data/sample'

export default function History() {
  const navigate = useNavigate()
  const { savedMatches, viewMatch } = useMatch()
  const { user } = useAuth()

  const realCards = savedMatches.map((mm) => {
    const c = matchToCard(mm)
    return { ...c, pending: !c.hasReflection && c.owner === user?.id }
  })
  const cards = [...realCards, ...sampleMatches]

  const open = (card) => {
    if (!card.real) { navigate('/report'); return }
    viewMatch(card.id)
    navigate(card.pending ? '/reflect' : '/momentum')
  }

  return (
    <div className="app has-tabbar">
      <div className="screen-scroll">
        <div className="home-head">
          <div className="h-eyebrow">All matches</div>
          <div className="h-title">Match history</div>
        </div>

        <div style={{ height: 8 }} />
        {cards.map((m) => (
          <MatchCard key={m.id} m={m} pending={m.pending} onClick={() => open(m)} />
        ))}
      </div>
      <TabBar />
    </div>
  )
}
