import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
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
  { to: '/pipeline', label: '🔍 Pipeline' },
  { to: '/', label: '🎯 Community Hub' },
  { to: '/knowledge-desk', label: '📚 Knowledge Desk' },
  { to: '/approvals', label: '✅ MG Approvals' },
  { to: '/leaderboard', label: '🏆 Leaderboard' },
  { to: '/report', label: '📤 Exec Broadcast' },
  { to: '/feedback', label: '💬 Platform Feedback' },
]

const NOTIF_ICONS: Record<string, string> = {
  ai_guru_fail: '🔴', learner_struggle: '🟡', impact: '🟢',
  approval_needed: '🔵', nudge: '💬', peer_post: '👥',
  rejection: '❌', corpus_response: '🧠', broadcast_sent: '📤',
  content_stale: '📋',
}

function NotificationBell({ guruId }: { guruId: number }) {
  const [notifs, setNotifs] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const load = () => {
    if (!guruId) return
    api.get(`/notifications/${guruId}`).then(r => setNotifs(r.data)).catch(() => {})
  }

  useEffect(() => { load() }, [guruId])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifs.filter(n => !n.is_read).length

  const openPanel = () => {
    setOpen(o => !o)
    if (!open && unread > 0) {
      api.post(`/notifications/guru/${guruId}/read-all`).then(load).catch(() => {})
    }
  }

  return (
    <div ref={panelRef} style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
      {/* Bell button */}
      <div onClick={openPanel} style={{ position: 'relative', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: open ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#d83b01', color: '#fff', borderRadius: 10,
            fontSize: 10, fontWeight: 700, padding: '1px 5px', minWidth: 16, textAlign: 'center'
          }}>{unread}</span>
        )}
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 42, right: 0, width: 340, maxHeight: 480, overflowY: 'auto',
          background: '#fff', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid #e0e0e0', zIndex: 999,
        }}>
          {/* Panel header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1B2A4A' }}>🔔 Notifications</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {unread === 0 && <span style={{ fontSize: 10, color: '#aaa' }}>All caught up</span>}
              <span onClick={() => { navigate(`/guru/${guruId}`); setOpen(false) }}
                style={{ fontSize: 11, color: '#0078d4', cursor: 'pointer', textDecoration: 'underline' }}>
                View profile →
              </span>
            </div>
          </div>

          {/* Notification list */}
          {notifs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No notifications yet.</div>
          ) : (
            notifs.map(n => (
              <div key={n.id} style={{
                display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f8f8f8',
                background: n.is_read ? '#fff' : '#f0f6ff', opacity: n.is_read ? 0.75 : 1,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{NOTIF_ICONS[n.type] || '🔔'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: 12, color: '#1B2A4A', lineHeight: 1.3 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 3, lineHeight: 1.5 }}>{n.message.slice(0, 120)}{n.message.length > 120 ? '…' : ''}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 3 }}>
                    {new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [activeGuruId, setActiveGuruId] = useState<number>(() => {
    const saved = localStorage.getItem('activeGuruId')
    return saved ? parseInt(saved) : 1
  })

  const handleGuruChange = (id: number) => {
    setActiveGuruId(id)
    localStorage.setItem('activeGuruId', String(id))
  }

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
          <NotificationBell guruId={activeGuruId} />
        </nav>
        <Routes>
          <Route path="/" element={<Feed activeGuruId={activeGuruId} onGuruChange={handleGuruChange} />} />
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
