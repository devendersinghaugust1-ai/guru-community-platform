import { useEffect, useState } from 'react'
import api from '../api'
import Avatar from '../components/Avatar'
import QualityBadge from '../components/QualityBadge'

export default function MGApprovalQueue() {
  const [queue, setQueue] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [gurus, setGurus] = useState<any[]>([])
  const [activeMG, setActiveMG] = useState<number>(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<Record<string, string>>({})
  const [deciding, setDeciding] = useState<string | null>(null)
  const [decided, setDecided] = useState<Record<string, string>>({})

  const loadQueue = async () => {
    const [q, s] = await Promise.all([api.get('/approvals/queue'), api.get('/approvals/stats')])
    setQueue(q.data)
    setStats(s.data)
  }

  useEffect(() => {
    loadQueue()
    api.get('/gurus/').then(r => {
      setGurus(r.data)
      const mg = r.data.find((g: any) => g.is_master_guru)
      if (mg) setActiveMG(mg.id)
    })
  }, [])

  const decide = async (threadId: string, action: string, editedContent?: string) => {
    setDeciding(threadId)
    await api.post(`/approvals/${threadId}/decide`, {
      action, mg_id: activeMG, edited_content: editedContent || null, notes: '',
    })
    setDecided(d => ({ ...d, [threadId]: action }))
    setDeciding(null)
    await loadQueue()
  }

  const SIGNAL_LABELS: Record<string, string> = {
    rule_based: '📋 Rule checks', domain_alignment: '🎯 Domain fit',
    specificity: '📊 Specificity', llm_confidence: '🤖 LLM confidence', novelty: '✨ Novelty',
  }

  const mgObj = gurus.find(g => g.id === activeMG)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#003087' }}>🔍 MG Approval Queue</h2>
        <p style={{ color: '#666', fontSize: 13, margin: '4px 0 0' }}>
          LangGraph HITL — workflows frozen until you decide. Target: under 90 seconds per review.
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Pending', value: stats.pending, color: '#ffc000' },
            { label: 'Approved', value: stats.approved, color: '#107c10' },
            { label: 'Edited', value: stats.edited, color: '#0078d4' },
            { label: 'Rejected', value: stats.rejected, color: '#d83b01' },
            { label: 'Avg Quality', value: `${Math.round((stats.avg_quality_score || 0) * 100)}%`, color: '#8764b8' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', border: `1px solid ${s.color}30`, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* MG selector */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 13, color: '#555' }}>Reviewing as Master Guru:</span>
        {gurus.filter(g => g.is_master_guru).map(g => (
          <div key={g.id} onClick={() => setActiveMG(g.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${activeMG === g.id ? '#003087' : '#e0e0e0'}`, background: activeMG === g.id ? '#e8f0fe' : '#fff' }}>
            <Avatar initials={g.avatar_initials} color={g.avatar_color} size={24} />
            <span style={{ fontSize: 12, fontWeight: activeMG === g.id ? 700 : 400 }}>{g.name}</span>
          </div>
        ))}
      </div>

      {/* Queue items */}
      {queue.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 8, padding: 40, textAlign: 'center', border: '1px solid #e0e0e0', color: '#888' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700 }}>Queue is clear</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>All use cases have been reviewed. New submissions will appear here.</div>
        </div>
      ) : queue.map(item => (
        <div key={item.thread_id} style={{ background: '#fff', borderRadius: 8, border: decided[item.thread_id] ? '1px solid #107c10' : '1px solid #ffc000', marginBottom: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: '#fffef8' }}
            onClick={() => setExpanded(expanded === item.thread_id ? null : item.thread_id)}>
            <Avatar initials={item.guru_avatar} color={item.guru_color} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.draft_title}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{item.guru_name} ({item.guru_grade}) · {item.domain} · {new Date(item.created_at).toLocaleString()}</div>
            </div>
            <QualityBadge score={item.quality_score} />
            <span style={{ color: '#999', fontSize: 18 }}>{expanded === item.thread_id ? '▲' : '▼'}</span>
          </div>

          {/* Expanded detail */}
          {expanded === item.thread_id && (
            <div style={{ padding: '16px 20px' }}>
              {/* Quality signals */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>Quality Signal Breakdown</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {Object.entries(item.quality_signals).map(([key, val]) => (
                    <div key={key} style={{ textAlign: 'center', padding: '8px 4px', background: '#f8f9fa', borderRadius: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: (val as number) >= 0.7 ? '#107c10' : (val as number) >= 0.4 ? '#ffc000' : '#d83b01' }}>
                        {Math.round((val as number) * 100)}%
                      </div>
                      <div style={{ fontSize: 10, color: '#666' }}>{SIGNAL_LABELS[key] || key}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flags */}
              {item.quality_flags?.length > 0 && (
                <div style={{ marginBottom: 16, padding: 10, background: '#fff3cd', borderRadius: 6, border: '1px solid #ffc000' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>⚠️ Agent Flags</div>
                  {item.quality_flags.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#555' }}>• {f}</div>)}
                </div>
              )}

              {/* Draft content */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>AI-Structured Draft</div>
                <textarea
                  value={editContent[item.thread_id] ?? item.draft_content}
                  onChange={e => setEditContent(ec => ({ ...ec, [item.thread_id]: e.target.value }))}
                  rows={4}
                  style={{ width: '100%', padding: 10, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              {/* Corpus entry */}
              <div style={{ marginBottom: 16, padding: 10, background: '#f0f4ff', borderRadius: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0078d4' }}>AI Guru corpus entry: </span>
                <span style={{ fontSize: 12, color: '#444' }}>{item.corpus_entry}</span>
              </div>

              {/* Actions */}
              {decided[item.thread_id] ? (
                <div style={{ padding: '10px 16px', background: '#e6f4ea', borderRadius: 6, fontWeight: 700, color: '#107c10', fontSize: 13 }}>
                  ✅ Decision recorded: {decided[item.thread_id]}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => decide(item.thread_id, 'approve')} disabled={deciding === item.thread_id}
                    style={{ flex: 1, padding: '10px 0', background: '#107c10', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    ✅ Approve
                  </button>
                  <button onClick={() => decide(item.thread_id, 'edit', editContent[item.thread_id] || item.draft_content)} disabled={deciding === item.thread_id}
                    style={{ flex: 1, padding: '10px 0', background: '#0078d4', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    ✏️ Approve with Edits
                  </button>
                  <button onClick={() => decide(item.thread_id, 'reject')} disabled={deciding === item.thread_id}
                    style={{ flex: 1, padding: '10px 0', background: '#fff', color: '#d83b01', border: '1px solid #d83b01', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
