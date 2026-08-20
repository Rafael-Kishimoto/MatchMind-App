import { useNavigate } from 'react-router-dom'
import TabBar from '../components/TabBar'
import MatchCard from '../components/MatchCard'
import { useMatch } from '../store/MatchStore'
import { matchToCard } from '../lib/card'
import { matches as sampleMatches } from '../data/sample'

export default function History() {
  const navigate = useNavigate()
  const { savedMatches, viewMatch } = useMatch()

  const cards = [...savedMatches.map(matchToCard), ...sampleMatches]

  const open = (card) => {
    if (card.real) { viewMatch(card.id); navigate('/momentum') }
    else navigate('/report')
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
          <MatchCard key={m.id} m={m} onClick={() => open(m)} />
        ))}
      </div>
      <TabBar />
    </div>
  )
}
