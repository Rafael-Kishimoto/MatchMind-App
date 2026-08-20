import { useNavigate } from 'react-router-dom'

// Header for sub-screens: a back chevron + title (and optional subtitle / right slot).
export default function TopBar({ title, subtitle, to, right }) {
  const navigate = useNavigate()
  const goBack = () => (to ? navigate(to) : navigate(-1))

  return (
    <div className="topbar">
      <button className="back" onClick={goBack} aria-label="Back">‹</button>
      <div style={{ flex: 1 }}>
        <div className="tb-title">{title}</div>
        {subtitle && <div className="tb-sub">{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}
