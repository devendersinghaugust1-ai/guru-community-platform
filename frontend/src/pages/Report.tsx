import { useEffect, useState } from 'react'
import api from '../api'
import Avatar from '../components/Avatar'

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6, width: '100%' }}>
      <div style={{ background: color, borderRadius: 4, height: 6, width: `${Math.min(100, (value / max) * 100)}%`, transition: 'width 0.6s ease' }} />
    </div>
  )
}

export default function Report() {
  const [stats, setStats] = useState<any[]>([])
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/km/guru-stats'), api.get('/km/broadcasts')])
      .then(([s, b]) => { setStats(s.data); setBroadcasts(b.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading BU Report...</div>

  const totalReviews = stats.reduce((a, g) => a + g.reviews_completed, 0)
  const totalSaves = stats.reduce((a, g) => a + g.escalation_saves, 0)
  const totalLearners = stats.reduce((a, g) => a + g.learners_impacted, 0)
  const broadcastsSent = broadcasts.filter(b => b.status === 'sent').length
  const avgIndex = stats.length ? Math.round(stats.reduce((a, g) => a + g.contribution_index, 0) / stats.length) : 0

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ background: '#1B2A4A', borderRadius: 10, padding: '20px 28px', marginBottom: 24, color: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#FAC778', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Quarterly BU Report</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Guru Capability Governance — Q3 2026</div>
        <div style={{ fontSize: 13, color: '#aac0e0' }}>
          Auto-generated from agent activity · Shared with BU Heads via Executive Broadcast trigger
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: 8, borderLeft: '3px solid #FAC778', fontSize: 12, color: '#e0e8f4', lineHeight: 1.6 }}>
          💡 These metrics are visible to your BU Head every quarter. When you resolve an AI escalation or complete 3 reviews in a month, an Executive Broadcast fires automatically to the person who determines your performance rating.
        </div>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'KM Drafts Reviewed', value: totalReviews, color: '#0078d4', icon: '🎯' },
          { label: 'AI Escalation Saves', value: totalSaves, color: '#FF4E58', icon: '🧱' },
          { label: 'Learners Protected', value: totalLearners.toLocaleString(), color: '#107c10', icon: '🎓' },
          { label: 'Avg Contribution Index', value: avgIndex, color: '#FAC778', icon: '📊' },
          { label: 'Executive Broadcasts Sent', value: broadcastsSent, color: '#8764b8', icon: '📤' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 8, padding: '16px 14px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Left: Guru leaderboard */}
        <div>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <div style={{ background: '#FF4E58', padding: '12px 16px' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>🏆 Governance Leaderboard</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 }}>
                Ranked by Proactive Contribution Index — not post count
              </div>
            </div>
            {stats.map((g, i) => (
              <div key={g.id} style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#FAC778' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: i === 0 ? '#1B2A4A' : '#888', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <Avatar initials={g.initials} color={g.color} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1B2A4A' }}>{g.name}</div>
                      <div style={{ fontSize: 10, color: '#888' }}>{g.grade} · {g.domain}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#0078d4' }}>{g.contribution_index}</div>
                      <div style={{ fontSize: 9, color: '#888' }}>Index</div>
                    </div>
                  </div>

                  <ScoreBar value={g.contribution_index} color={i === 0 ? '#FAC778' : '#0078d4'} />

                  <div style={{ marginTop: 6, fontSize: 10, color: '#555', lineHeight: 1.5, fontStyle: 'italic' }}>
                    {g.narrative}
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    {[['Reviews', g.reviews_completed], ['Saves', g.escalation_saves], [`${g.review_turnaround_hrs}h avg`, 'turnaround']].map(([val, label]) => (
                      <div key={String(label)} style={{ fontSize: 10, color: '#666' }}>
                        <span style={{ fontWeight: 700, color: '#0078d4' }}>{val}</span> {label}
                      </div>
                    ))}
                  </div>

                  {/* Broadcast progress */}
                  <div style={{ marginTop: 8, padding: '6px 8px', background: g.reviews_to_broadcast === 0 ? '#e6f4ea' : '#f8f9fa', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11 }}>📤</span>
                    {g.reviews_to_broadcast === 0 ? (
                      <span style={{ fontSize: 10, color: '#107c10', fontWeight: 600 }}>Executive Broadcast triggered ✓</span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#666' }}>
                        <span style={{ fontWeight: 700, color: '#8764b8' }}>{g.reviews_to_broadcast} more review{g.reviews_to_broadcast !== 1 ? 's' : ''}</span> to trigger Executive Broadcast to BU Head
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Executive Broadcasts */}
        <div>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: '#8764b8', padding: '12px 16px' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>📤 Executive Broadcasts</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 }}>
                Auto-sent from Prashant Shukla's office to BU Heads when Gurus hit their monthly target
              </div>
            </div>

            {broadcasts.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#888', fontSize: 12 }}>No broadcasts sent yet this quarter.</div>
            ) : (
              broadcasts.map(b => (
                <div key={b.id} style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    {b.guru && <Avatar initials={b.guru.initials} color={b.guru.color} size={36} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{b.guru?.name}</div>
                        <span style={{ background: b.status === 'sent' ? '#107c10' : '#ffc000', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                          {b.status === 'sent' ? '✓ Sent' : '⏳ Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>To: {b.bu_head_name}</div>
                      {b.sent_at && <div style={{ fontSize: 10, color: '#aaa' }}>{new Date(b.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    {[['Reviews', b.reviews_this_month, '#0078d4'], ['AI Saves', b.escalation_saves, '#FF4E58'], ['Learners', b.learners_protected.toLocaleString(), '#107c10']].map(([l, v, c]) => (
                      <div key={String(l)} style={{ textAlign: 'center', background: '#f8f9fa', borderRadius: 6, padding: '6px 4px' }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: String(c) }}>{v}</div>
                        <div style={{ fontSize: 9, color: '#888' }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#f3f2f1', borderRadius: 6, padding: 10, fontSize: 11, color: '#333', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '3px solid #8764b8' }}>
                    "{b.message_preview}"
                  </div>
                </div>
              ))
            )}
          </div>

          {/* How broadcast works */}
          <div style={{ background: '#1B2A4A', borderRadius: 8, padding: 16, color: '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FAC778', marginBottom: 10 }}>How the Executive Broadcast works</div>
            {[
              ['🎯', 'Guru completes 3 high-signal reviews in a month', '#aac0e0'],
              ['🤖', 'Platform checks monthly stats automatically', '#aac0e0'],
              ['📤', 'Formatted digest sent from Prashant Shukla\'s name to BU Head', '#FAC778'],
              ['👤', 'BU Head receives: exact reviews, AI saves, learners protected', '#aac0e0'],
              ['📈', 'Guru\'s contribution framed as enterprise risk mitigation — not task completion', '#aac0e0'],
            ].map(([icon, text, color]) => (
              <div key={String(text)} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 11, color: String(color), lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
