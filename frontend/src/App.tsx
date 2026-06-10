import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Feed from './pages/Feed'
import GuruProfile from './pages/GuruProfile'
import MGApprovalQueue from './pages/MGApprovalQueue'
import PipelineDashboard from './pages/PipelineDashboard'
import Report from './pages/Report'
import Leaderboard from './pages/Leaderboard'
import KnowledgeDesk from './pages/KnowledgeDesk'
import PlatformFeedback from './pages/PlatformFeedback'
import api from './api'

const NAV = [
  { to: '/', label: '🎯 Community Hub' },
  { to: '/knowledge-desk', label: '📚 Knowledge Desk' },
  { to: '/approvals', label: '✅ MG Approvals' },
  { to: '/pipeline', label: '🔍 Pipeline' },
  { to: '/leaderboard', label: '🏆 Leaderboard' },
  { to: '/report', label: '📤 Exec Broadcast' },
  { to: '/feedback', label: '💬 Platform Feedback' },
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
        <nav style={{ background: '#003087', padding: '0 16px', display: 'flex', alignItems: 'center', height: 52, gap: 0 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 0.5, flexShrink: 0, marginRight: 16, whiteSpace: 'nowrap' }}>
            🧠 Guru Community
          </span>
          <div style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                style={({ isActive }) => ({
                  color: isActive ? '#ffc000' : '#cce4ff',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 13,
                  textDecoration: 'none',
                  padding: '4px 10px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  background: isActive ? 'rgba(255,192,0,0.12)' : 'transparent',
                  borderBottom: isActive ? '2px solid #ffc000' : '2px solid transparent',
                })}>
                {n.label}
              </NavLink>
            ))}
          </div>
          <NotificationBell guruId={1} />
        </nav>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/guru/:id" element={<GuruProfile />} />
          <Route path="/approvals" element={<MGApprovalQueue />} />
          <Route path="/pipeline" element={<PipelineDashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/report" element={<Report />} />
          <Route path="/knowledge-desk" element={<KnowledgeDesk />} />
          <Route path="/feedback" element={<PlatformFeedback />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
