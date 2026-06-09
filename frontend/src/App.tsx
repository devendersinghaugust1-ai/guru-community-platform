import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Feed from './pages/Feed'
import GuruProfile from './pages/GuruProfile'
import MGApprovalQueue from './pages/MGApprovalQueue'
import PipelineDashboard from './pages/PipelineDashboard'
import Report from './pages/Report'
import Leaderboard from './pages/Leaderboard'
import api from './api'

const NAV = [
  { to: '/', label: '🎯 Community Hub' },
  { to: '/approvals', label: '✅ MG Approvals' },
  { to: '/pipeline', label: '🔍 Pipeline' },
  { to: '/leaderboard', label: '🏆 Leaderboard' },
  { to: '/report', label: '📤 Executive Broadcast' },
]

function NotificationBell({ guruId }: { guruId: number }) {
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/notifications/${guruId}`).then(r => {
      setUnread(r.data.filter((n: any) => !n.is_read).length)
    }).catch(() => {})
  }, [guruId])

  return (
    <div onClick={() => navigate(`/guru/${guruId}`)}
      style={{ position: 'relative', cursor: 'pointer', marginLeft: 'auto', padding: '4px 8px' }}>
      <span style={{ fontSize: 20 }}>🔔</span>
      {unread > 0 && (
        <span style={{
          position: 'absolute', top: 0, right: 0,
          background: '#d83b01', color: '#fff', borderRadius: 10,
          fontSize: 10, fontWeight: 700, padding: '1px 5px', minWidth: 16, textAlign: 'center'
        }}>{unread}</span>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f3f2f1' }}>
        <nav style={{ background: '#003087', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32, height: 52 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>
            🧠 Guru Community
          </span>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              style={({ isActive }) => ({
                color: isActive ? '#ffc000' : '#cce4ff',
                fontWeight: isActive ? 700 : 400,
                fontSize: 14,
                textDecoration: 'none',
                paddingBottom: 4,
                borderBottom: isActive ? '2px solid #ffc000' : '2px solid transparent',
              })}>
              {n.label}
            </NavLink>
          ))}
          <NotificationBell guruId={1} />
        </nav>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/guru/:id" element={<GuruProfile />} />
          <Route path="/approvals" element={<MGApprovalQueue />} />
          <Route path="/pipeline" element={<PipelineDashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
