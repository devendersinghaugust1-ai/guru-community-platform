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
  const [decided, setDecided] = useState<Record<string, { action: string; label: string }>>({})
  const [mgNotes, setMgNotes] = useState<Record<string, string>>({})

  const loadQueue = async () => {
    const [q, s] = await Promise.all([
      api.get('/approvals/full-queue'),
      api.get('/approvals/stats'),
    ])
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

  // ── Use Case decision (existing HITL flow) ──────────────────
  const decideUseCase = async (threadId: string, action: string, editedContent?: string) => {
    setDeciding(threadId)
    await api.post(`/approvals/${threadId}/decide`, {
      action, mg_id: activeMG, edited_content: editedContent || null, notes: '',
    })
    setDecided(d => ({ ...d, [threadId]: { action, label: action === 'approve' ? '✅ Approved' : action === 'edit' ? '✏️ Approved with edits' : '❌ Rejected' } }))
    setDeciding(null)
    await loadQueue()
  }

  // ── KM Draft decision (escalated from Knowledge Desk) ───────
  const decideKMDraft = async (draftId: number, action: string) => {
    const key = `km_${draftId}`
    setDeciding(key)
    await api.post(`/km/drafts/${draftId}/mg-decide`, {
      mg_id: activeMG,
      action,
      notes: mgNotes[key] || '',
    })
    setDecided(d => ({ ...d, [key]: { action, label: action === 'approve' ? '✅ Approved' : '🔄 Sent back for revision' } }))
    setDeciding(null)
    await loadQueue()
  }

  const SIGNAL_LABELS: Record<string, string> = {
    rule_based: '📋 Rule checks', domain_alignment: '🎯 Domain fit',
    specificity: '📊 Specificity', llm_confidence: '🤖 LLM confidence', novelty: '✨ Novelty',
  }

  const useCasePending = queue.filter(i => i.item_type === 'use_case').length
  const kmDraftPending = queue.filter(i => i.item_type === 'km_draft').length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#003087' }}>✅ MG Approval Queue</h2>
        <p style={{ color: '#666', fontSize: 13, margin: '4px 0 0' }}>
          All items waiting for your decision — use cases, and KM drafts escalated by Gurus.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Use Cases', value: useCasePending, color: '#ffc000' },
            { label: 'KM Drafts', value: kmDraftPending, color: '#8764b8' },
            { label: 'Approved', value: stats.approved, color: '#107c10' },
            { label: 'Edited', value: stats.edited, color: '#0078d4' },
            { label: 'Avg Quality', value: `${Math.round((stats.avg_quality_score || 0) * 100)}%`, color: '#d83b01' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', border: `1px solid ${s.color}30`, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* MG selector */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#555' }}>Reviewing as Master Guru:</span>
        {gurus.filter(g => g.is_master_guru).map(g => (
          <div key={g.id} onClick={() => setActiveMG(g.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${activeMG === g.id ? '#003087' : '#e0e0e0'}`,
              background: activeMG === g.id ? '#e8f0fe' : '#fff' }}>
            <Avatar initials={g.avatar_initials} color={g.avatar_color} size={24} />
            <span style={{ fontSize: 12, fontWeight: activeMG === g.id ? 700 : 400 }}>{g.name}</span>
          </div>
        ))}
      </div>

      {/* Queue */}
      {queue.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 8, padding: 40, textAlign: 'center', border: '1px solid #e0e0e0', color: '#888' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700 }}>Queue is clear</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>All items reviewed. New submissions will appear here automatically.</div>
        </div>
      ) : (
        queue.map(item => {
          const key = item.item_type === 'use_case' ? item.thread_id : `km_${item.id}`
          const isExpanded = expanded === key
          const isDone = !!decided[key]

          // ── USE CASE card ─────────────────────────────────────
          if (item.item_type === 'use_case') {
            return (
              <div key={key} style={{ background: '#fff', borderRadius: 8, border: isDone ? '1px solid #107c10' : '1px solid #ffc000', marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: '#fffef8' }}
                  onClick={() => setExpanded(isExpanded ? null : key)}>
                  <Avatar initials={item.submitter_avatar} color={item.submitter_color} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, background: '#ffc00020', color: '#c8960c', border: '1px solid #ffc000', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Use Case</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{item.submitter_name} ({item.submitter_grade}) · {item.domain}</div>
                  </div>
                  <QualityBadge score={item.quality_score} />
                  <span style={{ color: '#999', fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>Quality Signal Breakdown</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {Object.entries(item.quality_signals || {}).map(([key, val]) => (
                          <div key={key} style={{ textAlign: 'center', padding: '8px 4px', background: '#f8f9fa', borderRadius: 6 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: (val as number) >= 0.7 ? '#107c10' : (val as number) >= 0.4 ? '#ffc000' : '#d83b01' }}>
                              {Math.round((val as number) * 100)}%
                            </div>
                            <div style={{ fontSize: 10, color: '#666' }}>{SIGNAL_LABELS[key] || key}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {item.quality_flags?.length > 0 && (
                      <div style={{ marginBottom: 16, padding: 10, background: '#fff3cd', borderRadius: 6, border: '1px solid #ffc000' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>⚠️ Agent Flags</div>
                        {item.quality_flags.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#555' }}>• {f}</div>)}
                      </div>
                    )}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>AI-Structured Draft</div>
                      <textarea value={editContent[key] ?? item.content} onChange={e => setEditContent(ec => ({ ...ec, [key]: e.target.value }))}
                        rows={4} style={{ width: '100%', padding: 10, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>
                    {item.corpus_entry && (
                      <div style={{ marginBottom: 16, padding: 10, background: '#f0f4ff', borderRadius: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#0078d4' }}>AI Guru corpus entry: </span>
                        <span style={{ fontSize: 12, color: '#444' }}>{item.corpus_entry}</span>
                      </div>
                    )}
                    {isDone ? (
                      <div style={{ padding: '10px 16px', background: '#e6f4ea', borderRadius: 6, fontWeight: 700, color: '#107c10', fontSize: 13 }}>
                        {decided[key].label}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => decideUseCase(item.thread_id, 'approve')} disabled={deciding === key}
                          style={actionBtn('#107c10')}>✅ Approve</button>
                        <button onClick={() => decideUseCase(item.thread_id, 'edit', editContent[key] || item.content)} disabled={deciding === key}
                          style={actionBtn('#0078d4')}>✏️ Approve with Edits</button>
                        <button onClick={() => decideUseCase(item.thread_id, 'reject')} disabled={deciding === key}
                          style={{ ...actionBtn('#fff'), color: '#d83b01', border: '1px solid #d83b01' }}>❌ Reject</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }

          // ── KM DRAFT card ─────────────────────────────────────
          if (item.item_type === 'km_draft') {
            return (
              <div key={key} style={{ background: '#fff', borderRadius: 8, border: isDone ? '1px solid #107c10' : '1px solid #8764b8', marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: '#faf8ff' }}
                  onClick={() => setExpanded(isExpanded ? null : key)}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#8764b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>KM</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, background: '#8764b820', color: '#8764b8', border: '1px solid #8764b8', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>KM Draft Escalated</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{item.km_name} · {item.domain}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#8764b8', fontWeight: 600 }}>
                    {item.escalated_by?.length || 0} Guru{(item.escalated_by?.length || 0) !== 1 ? 's' : ''} escalated
                  </div>
                  <span style={{ color: '#999', fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div style={{ padding: '16px 20px' }}>
                    {/* Who escalated + their feedback */}
                    {item.escalated_by?.length > 0 && (
                      <div style={{ marginBottom: 14, padding: 12, background: '#f3effa', borderRadius: 8, border: '1px solid #8764b830' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#8764b8', marginBottom: 8 }}>GURU FEEDBACK</div>
                        {item.escalated_by.map((g: any, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                            <Avatar initials={g.initials} color={g.color} size={22} />
                            <div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{g.name}</span>
                              {g.feedback && <div style={{ fontSize: 11, color: '#555', marginTop: 2, fontStyle: 'italic' }}>"{g.feedback}"</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Draft content */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>KM Draft Content</div>
                      <div style={{ padding: 12, background: '#f8f9fa', borderRadius: 6, fontSize: 12, color: '#333', lineHeight: 1.7 }}>
                        {item.content}
                      </div>
                    </div>

                    {/* MG notes */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>Your Notes (optional)</div>
                      <textarea value={mgNotes[key] || ''} onChange={e => setMgNotes(n => ({ ...n, [key]: e.target.value }))}
                        rows={2} placeholder="Add guidance for KM if rejecting, or confirm approval with a note..."
                        style={{ width: '100%', padding: 9, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>

                    {isDone ? (
                      <div style={{ padding: '10px 16px', background: '#e6f4ea', borderRadius: 6, fontWeight: 700, color: '#107c10', fontSize: 13 }}>
                        {decided[key].label}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => decideKMDraft(item.id, 'approve')} disabled={deciding === key}
                          style={actionBtn('#107c10')}>✅ Approve Draft</button>
                        <button onClick={() => decideKMDraft(item.id, 'reject')} disabled={deciding === key}
                          style={{ ...actionBtn('#fff'), color: '#d83b01', border: '1px solid #d83b01' }}>🔄 Send Back for Revision</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }

          return null
        })
      )}
    </div>
  )
}

function actionBtn(bg: string): React.CSSProperties {
  return {
    flex: 1, padding: '10px 0', background: bg, color: '#fff',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13,
  }
}
