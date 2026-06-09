import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import Avatar from '../components/Avatar'

export default function GuruProfile() {
  const { id } = useParams()
  const [guru, setGuru] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [notifs, setNotifs] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    api.get(`/gurus/${id}`).then(r => setGuru(r.data))
    api.get(`/gurus/${id}/stats`).then(r => setStats(r.data))
    api.get(`/notifications/${id}`).then(r => setNotifs(r.data))
  }, [id])

  if (!guru) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading profile...</div>

  const NOTIF_ICONS: Record<string, string> = { ai_guru_fail: '🔴', learner_struggle: '🟡', impact: '🟢', approval_needed: '🔵', nudge: '💬', peer_post: '👥', rejection: '❌' }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <Link to="/" style={{ color: '#0078d4', fontSize: 13, textDecoration: 'none', marginBottom: 16, display: 'block' }}>← Back to Feed</Link>

      {/* Profile header */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ background: 'linear-gradient(135deg, #003087, #0078d4)', height: 80 }} />
        <div style={{ padding: '0 24px 24px', marginTop: -32 }}>
          <Avatar initials={guru.avatar_initials} color={guru.avatar_color} size={64} />
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{guru.name}</h2>
              {guru.is_master_guru && <span style={{ background: '#ffc00020', color: '#c8960c', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, border: '1px solid #ffc000' }}>Master Guru</span>}
              <span style={{ background: '#003087', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{guru.grade}</span>
            </div>
            <div style={{ color: '#444', fontSize: 14, marginTop: 4 }}>{guru.title}</div>
            <div style={{ color: '#666', fontSize: 13 }}>📍 {guru.domain} · {guru.experience_years} years experience</div>
            <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>🎓 {guru.certifications}</div>
          </div>
        </div>
      </div>

      {/* Live Impact Metrics — agent-fed */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#003087', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚡ Live Impact Dashboard <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>Agent-fed metrics</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Use Cases Shared', value: guru.use_cases_shared, color: '#0078d4', icon: '📝' },
            { label: 'Learners Impacted', value: guru.learners_impacted, color: '#107c10', icon: '🎓' },
            { label: 'AI Guru Corrections', value: guru.ai_guru_corrections, color: '#8764b8', icon: '🔧' },
            { label: 'Domain Rank', value: `#${guru.domain_rank}`, color: '#ffc000', icon: '🏆' },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center', padding: '16px 8px', background: '#f8f9fa', borderRadius: 8, border: `1px solid ${m.color}20` }}>
              <div style={{ fontSize: 22 }}>{m.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 24, color: m.color, margin: '4px 0' }}>{m.value}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: 10, background: '#e8f4fd', borderRadius: 6, fontSize: 12, color: '#0078d4' }}>
          💡 These metrics are visible to your BU Head in the quarterly Capability Report
        </div>
      </div>

      {/* Notifications */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#003087', marginBottom: 16 }}>
          🔔 Notifications {notifs.filter(n => !n.is_read).length > 0 && <span style={{ background: '#d83b01', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 6 }}>{notifs.filter(n => !n.is_read).length}</span>}
        </div>
        {notifs.length === 0 && <div style={{ color: '#888', fontSize: 13 }}>No notifications yet.</div>}
        {notifs.map(n => (
          <div key={n.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0f0f0', opacity: n.is_read ? 0.6 : 1 }}>
            <span style={{ fontSize: 18 }}>{NOTIF_ICONS[n.type] || '🔔'}</span>
            <div>
              <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: 13 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginTop: 2 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{new Date(n.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
