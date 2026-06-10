import { useEffect, useState } from 'react'
import api from '../api'
import Avatar from '../components/Avatar'

// ── Section header ──────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, color }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${color}` }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1B2A4A' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#888' }}>{subtitle}</div>
      </div>
    </div>
  )
}

// ── Content Validation card ─────────────────────────────────
type ValidationChoice = 'approved' | 'not_approved' | 'mg_review' | null

function RealityCheckCard({ draft, activeGuruId, onRated }: any) {
  const [expanded, setExpanded] = useState(false)
  const [choice, setChoice] = useState<ValidationChoice>(null)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const myRating = draft.ratings?.find((r: any) => r.guru_id === activeGuruId)

  useEffect(() => {
    if (myRating) setSubmitted(true)
  }, [myRating])

  const choiceToRating: Record<string, number> = { approved: 3, not_approved: 1, mg_review: 2 }

  const [notifiedMGs, setNotifiedMGs] = useState<any[]>([])

  const submit = async () => {
    if (!choice) return
    if ((choice === 'not_approved' || choice === 'mg_review') && !feedback.trim()) return
    setSubmitting(true)
    const res = await api.post(`/km/drafts/${draft.id}/rate`, {
      guru_id: activeGuruId,
      rating: choiceToRating[choice],
      missing_link: feedback,
    })
    if (res.data.notified_mgs?.length) setNotifiedMGs(res.data.notified_mgs)
    setSubmitted(true); setSubmitting(false); onRated()
  }

  const statusBg = draft.status === 'approved' ? '#107c10' : draft.status === 'needs_revision' ? '#d83b01' : '#ffc000'
  const statusLabel = draft.status === 'approved' ? '✓ Approved' : draft.status === 'needs_revision' ? '⚠ Needs Revision' : '⏳ Pending'

  const OPTIONS = [
    { key: 'approved', label: '✅ Approved', desc: 'Content is accurate — ready to publish', color: '#107c10', bg: '#e6f4ea' },
    { key: 'not_approved', label: '❌ Not Approved', desc: 'Has issues — needs rework before publishing', color: '#d83b01', bg: '#fce8e6' },
    { key: 'mg_review', label: '🔄 Send to MG for Approval', desc: 'Good direction — share feedback and escalate to Master Guru', color: '#8764b8', bg: '#f3effa' },
  ]

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ background: '#1B2A4A', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#FAC778', textTransform: 'uppercase', letterSpacing: 1 }}>KM Learning Content · {draft.domain}</span>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginTop: 2 }}>{draft.title}</div>
        </div>
        <span style={{ background: statusBg, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
          {statusLabel}
        </span>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: '#555', fontStyle: 'italic', lineHeight: 1.6, background: '#f8f9fa', padding: 12, borderRadius: 6, borderLeft: '3px solid #FAC778' }}>
          {draft.agent_prompt}
        </div>

        <button onClick={() => setExpanded(!expanded)}
          style={{ marginTop: 10, fontSize: 12, color: '#0078d4', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {expanded ? '▲ Hide content' : '▼ View full content'}
        </button>

        {expanded && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#333', lineHeight: 1.7, padding: 12, background: '#f3f2f1', borderRadius: 6 }}>
            {draft.content}
          </div>
        )}

        {draft.ratings?.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {draft.ratings.map((r: any) => {
              const label = r.rating === 3 ? '✅ Approved' : r.rating === 1 ? '❌ Not Approved' : '🔄 Sent to MG'
              const col = r.rating === 3 ? '#107c10' : r.rating === 1 ? '#d83b01' : '#8764b8'
              return (
                <div key={r.guru_id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8f9fa', borderRadius: 20, padding: '4px 10px', border: `1px solid ${col}` }}>
                  <Avatar initials={r.guru_initials} color={r.guru_color} size={20} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: col }}>{r.guru_name.split(' ')[0]} · {label}</span>
                  {r.missing_link && <span title={r.missing_link} style={{ fontSize: 11, color: '#888', cursor: 'help' }}>· 💬</span>}
                </div>
              )
            })}
          </div>
        )}

        {!submitted ? (
          <div style={{ marginTop: 14, padding: 14, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1B2A4A', marginBottom: 12 }}>Your Validation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => { setChoice(opt.key as ValidationChoice); setFeedback('') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    border: `2px solid ${choice === opt.key ? opt.color : '#e0e0e0'}`,
                    background: choice === opt.key ? opt.bg : '#fff',
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: choice === opt.key ? opt.color : '#333' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {choice === opt.key && <span style={{ color: opt.color, fontSize: 16 }}>●</span>}
                </button>
              ))}
            </div>

            {(choice === 'not_approved' || choice === 'mg_review') && (
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                placeholder={choice === 'not_approved'
                  ? 'What needs to be fixed before this can be approved? Be specific.'
                  : 'Share your feedback for the Master Guru — what needs their expert review?'}
                style={{ width: '100%', padding: 10, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, resize: 'vertical', fontFamily: 'inherit', marginBottom: 8, boxSizing: 'border-box' }} />
            )}

            <button onClick={submit}
              disabled={!choice || submitting || ((choice === 'not_approved' || choice === 'mg_review') && !feedback.trim())}
              style={{ padding: '8px 20px', background: choice ? '#1B2A4A' : '#ccc', color: '#fff', border: 'none', borderRadius: 6,
                cursor: choice ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13 }}>
              {submitting ? 'Submitting...' : choice === 'approved' ? '✅ Confirm Approval' : choice === 'not_approved' ? '❌ Submit Rejection' : '🔄 Send to MG'}
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 10, padding: '10px 14px', background: '#e6f4ea', borderRadius: 6, fontSize: 12, color: '#107c10' }}>
            <div style={{ fontWeight: 600 }}>✓ Your validation submitted{feedback ? ' · Feedback noted' : ''}</div>
            {notifiedMGs.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#555' }}>Escalated to:</span>
                {notifiedMGs.map(mg => (
                  <div key={mg.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: '1px solid #8764b8', borderRadius: 16, padding: '3px 10px' }}>
                    <Avatar initials={mg.initials} color={mg.color} size={18} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8764b8' }}>{mg.name.split(' ')[0]}</span>
                    <span style={{ fontSize: 10, color: '#888' }}>· Master Guru</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stump the Master card ───────────────────────────────────
function StumpCard({ item, activeGuruId, onResolved }: any) {
  const [correction, setCorrection] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resolved, setResolved] = useState(false)
  const confidencePct = Math.round(item.confidence_score * 100)
  const isTagged = item.tagged_mg?.id === activeGuruId
  const alreadyResolved = item.status === 'resolved' || resolved

  const resolve = async () => {
    if (!correction.trim()) return
    setSubmitting(true)
    await api.post(`/km/stump/${item.id}/resolve`, { mg_id: activeGuruId, correction })
    setSubmitting(false)
    setResolved(true)
    onResolved()
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: `1px solid ${alreadyResolved ? '#107c10' : '#FF4E58'}`, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ background: alreadyResolved ? '#107c10' : '#FF4E58', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}>
            {alreadyResolved ? '✓ Resolved' : '🧱 Stumped'} · {item.domain}
          </span>
          <div style={{ color: '#fff', fontSize: 11, marginTop: 2, opacity: 0.9 }}>
            AI Guru confidence: {confidencePct}% · {item.failure_count} unanswered queries
          </div>
        </div>
        {item.tagged_mg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#fff', opacity: 0.8 }}>Tagged:</span>
            <Avatar initials={item.tagged_mg.initials} color={item.tagged_mg.color} size={24} />
            <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{item.tagged_mg.name.split(' ')[0]}</span>
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1B2A4A', marginBottom: 8 }}>"{item.query}"</div>

        <div style={{ fontSize: 12, color: '#555', fontStyle: 'italic', lineHeight: 1.6, background: '#fff8f0', padding: 10, borderRadius: 6, borderLeft: '3px solid #FF4E58', marginBottom: 10 }}>
          {item.agent_prompt}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div style={{ padding: 10, background: '#fce8e6', borderRadius: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#d83b01', marginBottom: 4 }}>AI GURU ATTEMPTED</div>
            <div style={{ fontSize: 11, color: '#444', lineHeight: 1.5 }}>{item.ai_attempt}</div>
          </div>
          <div style={{ padding: 10, background: '#e8f4fd', borderRadius: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0078d4', marginBottom: 4 }}>KM STAGED RESPONSE</div>
            <div style={{ fontSize: 11, color: '#444', lineHeight: 1.5 }}>{item.km_draft}</div>
          </div>
        </div>

        {alreadyResolved ? (
          <div style={{ padding: 12, background: '#e6f4ea', borderRadius: 6, borderLeft: '3px solid #107c10' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#107c10', marginBottom: 4 }}>✓ EXPERT CORRECTION — GOING TO CORPUS</div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6 }}>{item.mg_correction || correction}</div>
          </div>
        ) : (
          <div style={{ padding: 12, background: isTagged ? '#fffbea' : '#f8f9fa', borderRadius: 8, border: `1px solid ${isTagged ? '#ffc000' : '#e0e0e0'}` }}>
            {isTagged ? (
              <div style={{ fontSize: 12, fontWeight: 600, color: '#856404', marginBottom: 8 }}>
                You've been tagged — approve the KM draft or drop the missing link
              </div>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2A4A', marginBottom: 8 }}>
                Domain expert? You can also submit your correction — any Guru's sign-off counts
              </div>
            )}
            <textarea value={correction} onChange={e => setCorrection(e.target.value)} rows={3}
              placeholder="Approve with a note, or correct the KM draft with what's actually right..."
              style={{ width: '100%', padding: 8, border: `1px solid ${isTagged ? '#ffc000' : '#ddd'}`, borderRadius: 6, fontSize: 12, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            <button onClick={resolve} disabled={!correction.trim() || submitting}
              style={{ marginTop: 8, padding: '8px 20px', background: correction.trim() ? '#1B2A4A' : '#ccc', color: '#fff', border: 'none', borderRadius: 6, cursor: correction.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13 }}>
              {submitting ? 'Saving...' : '✓ Submit Expert Sign-off'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Knowledge Desk page ────────────────────────────────
export default function KnowledgeDesk() {
  const [gurus, setGurus] = useState<any[]>([])
  const [activeGuruId, setActiveGuruId] = useState(1)
  const [drafts, setDrafts] = useState<any[]>([])
  const [stumps, setStumps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    await Promise.all([
      api.get('/gurus/').then(r => setGurus(r.data)),
      api.get('/km/drafts').then(r => setDrafts(r.data)),
      api.get('/km/stump').then(r => setStumps(r.data)),
    ])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const pendingDrafts = drafts.filter(d => d.status === 'pending' || d.status === 'needs_revision')
  const openStumps = stumps.filter(s => s.status === 'open')
  const resolvedStumps = stumps.filter(s => s.status === 'resolved')

  const totalActions = pendingDrafts.length + openStumps.length

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', display: 'flex', gap: 22 }}>

      {/* Sidebar — Guru switcher */}
      <div style={{ width: 210, flexShrink: 0 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 14, border: '1px solid #e0e0e0', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>Viewing as</div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {gurus.map(g => (
              <div key={g.id} onClick={() => setActiveGuruId(g.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 3,
                  background: activeGuruId === g.id ? '#e8f0fe' : 'transparent',
                  border: activeGuruId === g.id ? '1px solid #0078d4' : '1px solid transparent' }}>
                <Avatar initials={g.avatar_initials} color={g.avatar_color} size={26} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {g.name.split(' ')[0]}
                    {g.is_master_guru && <span style={{ fontSize: 8, background: '#ffc000', color: '#000', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>MG</span>}
                  </div>
                  <div style={{ fontSize: 9, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary card */}
        <div style={{ background: '#1B2A4A', borderRadius: 8, padding: 14, color: '#fff' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#FAC778', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Knowledge Desk</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['Pending Reviews', pendingDrafts.length, '#107c10'],
              ['Open Escalations', openStumps.length, '#FF4E58'],
              ['Resolved', resolvedStumps.length, '#FAC778'],
              ['Total Drafts', drafts.length, '#0078d4'],
            ].map(([label, val, color]) => (
              <div key={String(label)} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 4px' }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: String(color) }}>{val}</div>
                <div style={{ color: '#aac0e0', fontSize: 9, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          {totalActions > 0 && (
            <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(255,78,88,0.2)', borderRadius: 6, fontSize: 11, color: '#FF9A9E', textAlign: 'center' }}>
              {totalActions} action{totalActions !== 1 ? 's' : ''} waiting for you
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
        ) : (
          <>
            {/* ── Content Validation Queue ── */}
            <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e0e0e0', marginBottom: 20 }}>
              <SectionHeader icon="✅" title="Content Validation Queue"
                subtitle={`${pendingDrafts.length} KM learning content${pendingDrafts.length !== 1 ? 's' : ''} waiting for your expert validation — takes 30 seconds`}
                color="#107c10" />
              {pendingDrafts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#888', fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                  All KM drafts reviewed. Check back tomorrow.
                </div>
              ) : (
                pendingDrafts.map(d => (
                  <RealityCheckCard key={d.id} draft={d} activeGuruId={activeGuruId}
                    onRated={() => api.get('/km/drafts').then(r => setDrafts(r.data))} />
                ))
              )}
            </div>

            {/* ── Stump the Master ── */}
            <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e0e0e0' }}>
              <SectionHeader icon="🧱" title="Stump the Master"
                subtitle={`${openStumps.length} AI escalation${openStumps.length !== 1 ? 's' : ''} need expert sign-off · Your correction goes directly to the corpus`}
                color="#FF4E58" />
              {stumps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#888', fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
                  No AI escalations right now. AI Guru is performing well.
                </div>
              ) : (
                stumps.map(s => (
                  <StumpCard key={s.id} item={s} activeGuruId={activeGuruId}
                    onResolved={() => api.get('/km/stump').then(r => setStumps(r.data))} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
