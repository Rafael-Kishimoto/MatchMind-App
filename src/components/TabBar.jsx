import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/history', label: 'History', icon: '≣' },
  { to: '/profiles', label: 'Profile', icon: '👤' },
]

// Bottom navigation, shown on the main screens.
export default function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const active = pathname === t.to
        return (
          <button key={t.to} className={`tab${active ? ' on' : ''}`} onClick={() => navigate(t.to)}>
            <span className="ic">{t.icon}</span>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
