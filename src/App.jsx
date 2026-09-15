import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './screens.css'
import { AuthProvider, useAuth } from './store/AuthStore'
import { MatchProvider } from './store/MatchStore'

import Home from './screens/Home'
import History from './screens/History'
import Profiles from './screens/Profiles'
import NewMatch from './screens/NewMatch'
import LiveScouting from './screens/LiveScouting'
import Momentum from './screens/Momentum'
import Reflection from './screens/Reflection'
import Report from './screens/Report'
import Welcome from './screens/Welcome'
import SetNewPassword from './screens/SetNewPassword'

// Requires login when Supabase is configured; otherwise runs in local mode.
function Gate({ children }) {
  const { configured, user, loading, recovery } = useAuth()
  const { pathname } = useLocation()
  if (!configured) return children
  if (loading) {
    return <div className="app"><div className="spin-wrap"><div className="spinner" /></div></div>
  }
  if (recovery) return <SetNewPassword /> // arrived via a reset link — must set a new password
  if (!user && pathname !== '/welcome') return <Navigate to="/welcome" replace />
  if (user && pathname === '/welcome') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <MatchProvider>
        <HashRouter>
          <Gate>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/new" element={<NewMatch />} />
              <Route path="/scout" element={<LiveScouting />} />
              <Route path="/momentum" element={<Momentum />} />
              <Route path="/reflect" element={<Reflection />} />
              <Route path="/report" element={<Report />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Gate>
        </HashRouter>
      </MatchProvider>
    </AuthProvider>
  )
}
