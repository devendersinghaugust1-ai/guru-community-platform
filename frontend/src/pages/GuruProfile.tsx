import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import Avatar from '../components/Avatar'

function StatCard({ icon, label, value, color, sub }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${color}25`, padding: '16px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 4, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function GuruProfile() {
  const { id } = useParams()
  const [guru, setGuru] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [notifs, setNotifs] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    api.get(`/gurus/${id}`).then(r => setGuru(r.data))
    api.get(`/notifications/${id}`).then(r => setNotifs(r.data))
    api.get('/feed/').then(r => {
      setPosts(r.data.filter((p: any) => String(p.guru_id) === String(id)))
    })
  }, [id])

  if (!guru) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading profile...</div>

  const ci = guru.contribution_index || 0
  const ciColor = ci >= 80 ? '#107c10' : ci >= 50 ? '#0078d4' : '#ffc000'

  const NOTIF_ICONS: Record<string, string> = {
    ai_guru_fail: '🔴', learner_struggle: '🟡', impact: '🟢',
    approval_needed: '🔵', nudge: '💬', peer_post: '👥',
    rejection: '❌', corpus_response: '🧠', broadcast_sent: '📤',
  }

  const POST_ICONS: Record<string, string> = {
    use_case: '💡', ai_correction: '🔧', domain_insight: '📊',
    milestone: '🏆', question: '❓', lesson_learned: '📖', resource_share: '📎',
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      <Link to="/" style={{ color: '#0078d4', fontSize: 13, textDecoration: 'none', marginBottom: 16, display: 'block' }}>
        ← Back to Community Hub
      </Link>

      {/* ── Profile Header ── */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ background: 'linear-gradient(135deg, #003087 0%, #0078d4 100%)', height: 90 }} />
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 20, alignItems: 'flex-end', marginTop: -36 }}>
          <div style={{ flexShrink: 0 }}>
            <Avatar initials={guru.avatar_initials} color={guru.avatar_color} size={72} />
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 20, color: '#1B2A4A' }}>{guru.name}</h2>
              {guru.is_master_guru && (
                <span style={{ background: '#ffc00020', color: '#c8960c', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 10, border: '1px solid #ffc000' }}>
                  ⭐ Master Guru
                </span>
              )}
              <span style={{ background: '#003087', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 10 }}>
                {guru.grade}
              </span>
            </div>
            <div style={{ color: '#444', fontSize: 13, marginTop: 4 }}>{guru.title}</div>
            <div style={{ color: '#777', fontSize: 12, marginTop: 3 }}>
              📍 {guru.domain} &nbsp;·&nbsp; {guru.experience_years} yrs experience
            </div>
            <div style={{ color: '#777', fontSize: 12, marginTop: 2 }}>🎓 {guru.certifications}</div>
          </div>

          {/* Contribution Index badge */}
          <div style={{ flexShrink: 0, textAlign: 'center', background: '#1B2A4A', borderRadius: 10, padding: '12px 20px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#FAC778', lineHeight: 1 }}>{ci}</div>
            <div style={{ fontSize: 10, color: '#aac0e0', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Contribution Index</div>
            <div style={{ marginTop: 8, background: '#fff2', borderRadius: 4, height: 6, width: 80 }}>
              <div style={{ background: ciColor, borderRadius: 4, height: 6, width: `${ci}%` }} />
            </div>
            <div style={{ fontSize: 10, color: '#aac0e0', marginTop: 3 }}>{ci}/100</div>
          </div>
        </div>

        {/* Narrative */}
        {guru.narrative && (
          <div style={{ margin: '0 24px 20px', padding: '10px 14px', background: '#f0f4ff', borderRadius: 6, fontSize: 12, color: '#333', lineHeight: 1.6, borderLeft: '3px solid #0078d4' }}>
            {guru.narrative}
          </div>
        )}
      </div>

      {/* ── Key Metrics Grid ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#003087', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          📊 Performance Dashboard — visible to your BU Head
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          <StatCard icon="📝" label="Posts Published" value={guru.use_cases_shared || 0} color="#0078d4" sub="Use cases & insights shared" />
          <StatCard icon="✅" label="Content Validated" value={guru.reviews_completed || 0} color="#107c10" sub="KM drafts reviewed" />
          <StatCard icon="🔧" label="AI Corrections" value={guru.ai_guru_corrections || 0} color="#8764b8" sub="Corpus improvements" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <StatCard icon="⚡" label="Escalation Saves" value={guru.escalation_saves || 0} color="#d83b01" sub="AI failures intercepted" />
          <StatCard icon="🎓" label="Learners Impacted" value={guru.learners_impacted || 0} color="#ca5010" sub="Estimated reach" />
          <StatCard icon="🏆" label="Domain Rank" value={`#${guru.domain_rank || '—'}`} color="#ffc000" sub={guru.domain} />
        </div>
      </div>

      {/* ── Review Performance ── */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#003087', marginBottom: 14 }}>⏱ Review Performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Reviews Completed', value: guru.reviews_completed || 0, unit: '', bar: Math.min(100, (guru.reviews_completed || 0) * 5), color: '#107c10' },
            { label: 'Avg Turnaround', value: guru.review_turnaround_hrs || 0, unit: 'hrs', bar: Math.max(0, 100 - (guru.review_turnaround_hrs || 0) * 4), color: '#0078d4' },
            { label: 'Escalation Saves', value: guru.escalation_saves || 0, unit: '', bar: Math.min(100, (guru.escalation_saves || 0) * 8), color: '#d83b01' },
          ].map(m => (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}{m.unit}</span>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6 }}>
                <div style={{ background: m.color, borderRadius: 4, height: 6, width: `${m.bar}%`, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Posts ── */}
      {posts.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#003087', marginBottom: 14 }}>
            💬 Community Posts <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>({posts.length})</span>
          </div>
          {posts.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{POST_ICONS[p.post_type] || '📝'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1B2A4A' }}>{p.title}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  {p.domain} · {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  &nbsp;·&nbsp; 👁 {p.views} &nbsp;·&nbsp; ❤️ {p.reaction_count || 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Notifications ── */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#003087', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          🔔 Notifications
          {notifs.filter(n => !n.is_read).length > 0 && (
            <span style={{ background: '#d83b01', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
              {notifs.filter(n => !n.is_read).length} new
            </span>
          )}
        </div>
        {notifs.length === 0 ? (
          <div style={{ color: '#aaa', fontSize: 13 }}>No notifications yet.</div>
        ) : (
          notifs.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5', opacity: n.is_read ? 0.55 : 1 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{NOTIF_ICONS[n.type] || '🔔'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: 13, color: '#1B2A4A' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>
                  {new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
