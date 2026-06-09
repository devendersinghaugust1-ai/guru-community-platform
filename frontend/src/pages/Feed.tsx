import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Avatar from '../components/Avatar'

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const POST_ICONS: Record<string, string> = {
  use_case: '💡', ai_correction: '🔧', domain_insight: '📊', milestone: '🏆',
  question: '❓', lesson_learned: '📖', resource_share: '📎',
}
const POST_COLORS: Record<string, string> = {
  use_case: '#0078d4', ai_correction: '#d83b01', domain_insight: '#8764b8',
  milestone: '#ffc000', question: '#038387', lesson_learned: '#ca5010', resource_share: '#00b294',
}

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

// ── Reality Check card ──────────────────────────────────────
function RealityCheckCard({ draft, activeGuruId, onRated }: any) {
  const [expanded, setExpanded] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [missingLink, setMissingLink] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const myRating = draft.ratings?.find((r: any) => r.guru_id === activeGuruId)

  useEffect(() => {
    if (myRating) { setRating(myRating.rating); setSubmitted(true) }
  }, [myRating])

  const submit = async () => {
    if (!rating) return
    setSubmitting(true)
    await api.post(`/km/drafts/${draft.id}/rate`, { guru_id: activeGuruId, rating, missing_link: missingLink })
    setSubmitted(true); setSubmitting(false); onRated()
  }

  const ratingColors: Record<number, string> = { 1: '#d83b01', 2: '#ffc000', 3: '#107c10' }
  const ratingLabels: Record<number, string> = { 1: "Misses the real picture", 2: "Close, something's missing", 3: "I'd stake my reputation on this" }

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ background: '#1B2A4A', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#FAC778', textTransform: 'uppercase', letterSpacing: 1 }}>KM Draft · {draft.domain}</span>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginTop: 2 }}>{draft.title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {draft.avg_rating > 0 && (
            <div style={{ background: ratingColors[Math.round(draft.avg_rating)] || '#888', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
              Avg {draft.avg_rating.toFixed(1)} / 3
            </div>
          )}
          <span style={{ background: draft.status === 'approved' ? '#107c10' : draft.status === 'needs_revision' ? '#d83b01' : '#ffc000', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
            {draft.status === 'approved' ? '✓ Approved' : draft.status === 'needs_revision' ? '⚠ Needs revision' : '⏳ Pending'}
          </span>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: '#555', fontStyle: 'italic', lineHeight: 1.6, background: '#f8f9fa', padding: 12, borderRadius: 6, borderLeft: '3px solid #FAC778' }}>
          {draft.agent_prompt}
        </div>

        <button onClick={() => setExpanded(!expanded)}
          style={{ marginTop: 10, fontSize: 12, color: '#0078d4', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {expanded ? '▲ Hide draft content' : '▼ View full KM draft'}
        </button>

        {expanded && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#333', lineHeight: 1.7, padding: 12, background: '#f3f2f1', borderRadius: 6 }}>
            {draft.content}
          </div>
        )}

        {draft.ratings?.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {draft.ratings.map((r: any) => (
              <div key={r.guru_id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8f9fa', borderRadius: 20, padding: '4px 10px', border: `1px solid ${ratingColors[r.rating]}` }}>
                <Avatar initials={r.guru_initials} color={r.guru_color} size={20} />
                <span style={{ fontSize: 11, fontWeight: 600, color: ratingColors[r.rating] }}>
                  {r.guru_name.split(' ')[0]} rated {r.rating}/3
                </span>
                {r.missing_link && <span title={r.missing_link} style={{ fontSize: 11, color: '#888', cursor: 'help' }}>· 💬</span>}
              </div>
            ))}
          </div>
        )}

        {!submitted ? (
          <div style={{ marginTop: 14, padding: 14, background: '#fffbea', borderRadius: 8, border: '1px solid #ffc000' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#856404', marginBottom: 10 }}>Your Reality Check</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setRating(n)}
                  style={{ flex: 1, padding: '10px 0', border: `2px solid ${rating === n ? ratingColors[n] : '#e0e0e0'}`,
                    background: rating === n ? `${ratingColors[n]}15` : '#fff', borderRadius: 8,
                    cursor: 'pointer', fontWeight: 700, fontSize: 16, color: rating === n ? ratingColors[n] : '#666' }}>
                  {n}
                </button>
              ))}
            </div>
            {rating && <div style={{ fontSize: 11, color: ratingColors[rating], fontWeight: 600, marginBottom: 8 }}>{ratingLabels[rating]}</div>}
            {rating && rating < 3 && (
              <textarea value={missingLink} onChange={e => setMissingLink(e.target.value)} rows={2}
                placeholder="What's the one thing that's missing or wrong? (one line is enough)"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, resize: 'none', fontFamily: 'inherit' }} />
            )}
            <button onClick={submit} disabled={!rating || submitting}
              style={{ marginTop: 8, padding: '8px 20px', background: rating ? '#1B2A4A' : '#ccc', color: '#fff', border: 'none', borderRadius: 6, cursor: rating ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13 }}>
              {submitting ? 'Submitting...' : '⚡ Submit Reality Check'}
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 10, padding: '8px 14px', background: '#e6f4ea', borderRadius: 6, fontSize: 12, color: '#107c10', fontWeight: 600 }}>
            ✓ You rated this {rating}/3{missingLink ? ` · Your correction noted` : ''}
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
  const confidencePct = Math.round(item.confidence_score * 100)
  const isTagged = item.tagged_mg?.id === activeGuruId

  const resolve = async () => {
    if (!correction.trim()) return
    setSubmitting(true)
    await api.post(`/km/stump/${item.id}/resolve`, { mg_id: activeGuruId, correction })
    setSubmitting(false); onResolved()
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: `1px solid ${item.status === 'resolved' ? '#107c10' : '#FF4E58'}`, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ background: item.status === 'resolved' ? '#107c10' : '#FF4E58', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}>
            {item.status === 'resolved' ? '✓ Resolved' : '🧱 Stumped'} · {item.domain}
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

        {item.status === 'resolved' ? (
          <div style={{ padding: 12, background: '#e6f4ea', borderRadius: 6, borderLeft: '3px solid #107c10' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#107c10', marginBottom: 4 }}>✓ EXPERT CORRECTION — GOING TO CORPUS</div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6 }}>{item.mg_correction}</div>
          </div>
        ) : isTagged ? (
          <div style={{ padding: 12, background: '#fffbea', borderRadius: 8, border: '1px solid #ffc000' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#856404', marginBottom: 8 }}>
              You've been tagged — approve the KM draft or drop the missing link
            </div>
            <textarea value={correction} onChange={e => setCorrection(e.target.value)} rows={3}
              placeholder="Approve with a note, or correct the KM draft with what's actually right..."
              style={{ width: '100%', padding: 8, border: '1px solid #ffc000', borderRadius: 6, fontSize: 12, resize: 'none', fontFamily: 'inherit' }} />
            <button onClick={resolve} disabled={!correction.trim() || submitting}
              style={{ marginTop: 8, padding: '8px 20px', background: '#1B2A4A', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {submitting ? 'Saving...' : '✓ Submit Expert Sign-off'}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>
            Waiting for {item.tagged_mg?.name || 'tagged Master Guru'} to resolve this escalation.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Organic Spark card ──────────────────────────────────────
function SparkCard({ item, onRespond }: any) {
  const [responded, setResponded] = useState(false)
  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #1B2A4A, #2d4a7a)', padding: '10px 16px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#FAC778', textTransform: 'uppercase', letterSpacing: 1 }}>📡 Organic Spark · {item.domain}</span>
        <div style={{ fontSize: 10, color: '#aac0e0', marginTop: 2 }}>Agent-detected signal · {timeAgo(item.created_at)}</div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: '#444', background: '#f3f2f1', padding: 12, borderRadius: 6, lineHeight: 1.7, fontStyle: 'italic', whiteSpace: 'pre-line' }}>
          {item.prompt}
        </div>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#888' }}>
            {item.response_count} Guru{item.response_count !== 1 ? 's' : ''} responded
          </span>
          {!responded ? (
            <button onClick={() => { setResponded(true); onRespond(item.id) }}
              style={{ padding: '6px 16px', background: '#1B2A4A', color: '#fff', border: 'none', borderRadius: 16, cursor: 'pointer', fontSize: 12 }}>
              💬 I've seen this — share my read
            </button>
          ) : (
            <span style={{ fontSize: 12, color: '#107c10', fontWeight: 600 }}>✓ Response noted</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Organic post card (original Guru posts) ─────────────────
function PostCard({ post, activeGuru, onReact, onComment }: any) {
  const navigate = useNavigate()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')

  const loadComments = async () => {
    if (!showComments) {
      const r = await api.get(`/feed/posts/${post.id}/comments`)
      setComments(r.data)
    }
    setShowComments(!showComments)
  }

  const addComment = async () => {
    if (!commentText.trim()) return
    await api.post(`/feed/posts/${post.id}/comments`, { guru_id: activeGuru?.id, content: commentText })
    setCommentText('')
    const r = await api.get(`/feed/posts/${post.id}/comments`)
    setComments(r.data)
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e0e0e0', marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div onClick={() => navigate(`/guru/${post.guru_id}`)} style={{ cursor: 'pointer' }}>
          <Avatar initials={post.guru_avatar} color={post.guru_avatar_color} size={36} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span onClick={() => navigate(`/guru/${post.guru_id}`)} style={{ fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#003087' }}>{post.guru_name}</span>
            {post.is_master_guru && <span style={{ background: '#ffc00020', color: '#c8960c', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, border: '1px solid #ffc000' }}>MG</span>}
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>{post.guru_title} · {timeAgo(post.created_at)}</div>
        </div>
        <span style={{ fontSize: 16 }}>{POST_ICONS[post.post_type] || '📝'}</span>
      </div>
      <div style={{ borderLeft: `3px solid ${POST_COLORS[post.post_type] || '#ccc'}`, paddingLeft: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{post.title}</div>
        <div style={{ fontSize: 12, color: '#444', lineHeight: 1.6 }}>{post.content}</div>
      </div>
      {post.tags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {post.tags.split(',').map((t: string) => (
            <span key={t} style={{ background: '#f0f4ff', color: '#0078d4', fontSize: 10, padding: '1px 7px', borderRadius: 10 }}>#{t.trim()}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['👍 Insightful', 'insightful'], ['✅ Agree', 'agree'], ['🎯 Useful', 'useful']].map(([label, type]) => (
            <button key={type} onClick={() => onReact(post.id, type)}
              style={{ padding: '3px 8px', border: '1px solid #e0e0e0', background: '#fff', borderRadius: 12, cursor: 'pointer', fontSize: 11 }}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#888' }}>
          <span>👁 {post.views}</span>
          <span>❤️ {post.reaction_count}</span>
          <button onClick={loadComments} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#0078d4' }}>
            💬 {post.comment_count}
          </button>
        </div>
      </div>
      {showComments && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
          {comments.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Avatar initials={c.commenter_avatar} color={c.commenter_color} size={24} />
              <div style={{ background: '#f3f2f1', borderRadius: 8, padding: '5px 10px', flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 11 }}>{c.commenter_name}</div>
                <div style={{ fontSize: 12, color: '#333' }}>{c.content}</div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Avatar initials={activeGuru?.avatar_initials || '?'} color={activeGuru?.avatar_color || '#999'} size={24} />
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addComment()}
              placeholder="Add a comment..."
              style={{ flex: 1, padding: '5px 10px', border: '1px solid #e0e0e0', borderRadius: 14, fontSize: 12 }} />
            <button onClick={addComment} style={{ padding: '5px 12px', background: '#003087', color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer', fontSize: 11 }}>Post</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Compose Box ────────────────────────────────────────────
const POST_TYPES = [
  { value: 'use_case', label: '💡 Use Case', placeholder: 'Describe a real project — what was the problem, what did you do, what was the outcome with numbers?' },
  { value: 'question', label: '❓ Question', placeholder: 'Ask the community something. E.g. "Anyone dealt with a client resisting RPA in AR?"' },
  { value: 'lesson_learned', label: '📖 Lesson Learned', placeholder: 'What would you do differently? No client names needed.' },
  { value: 'ai_correction', label: '🔧 AI Correction', placeholder: 'AI Guru gave a wrong answer. What was the question and what is the correct answer?' },
  { value: 'domain_insight', label: '📊 Domain Insight', placeholder: 'A pattern you\'re seeing across clients that others should know about.' },
  { value: 'resource_share', label: '📎 Resource', placeholder: 'A framework or tool that genuinely helped you. What is it and how did you use it?' },
  { value: 'milestone', label: '🏆 Milestone', placeholder: 'Celebrate a project go-live or team win. Keep it specific.' },
]

function ComposeBox({ activeGuru, onSubmitted }: { activeGuru: any; onSubmitted: () => void }) {
  const [open, setOpen] = useState(false)
  const [postType, setPostType] = useState('use_case')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const selected = POST_TYPES.find(t => t.value === postType) || POST_TYPES[0]
  const typeColors: Record<string, string> = {
    use_case: '#0078d4', question: '#038387', lesson_learned: '#ca5010',
    ai_correction: '#d83b01', domain_insight: '#8764b8', resource_share: '#00b294', milestone: '#ffc000'
  }

  const submit = async () => {
    if (!text.trim() || !activeGuru) return
    setSubmitting(true)
    try {
      const r = await api.post('/approvals/submit', {
        guru_id: activeGuru.id, domain: activeGuru.domain || 'Finance Transformation',
        raw_text: text, post_type: postType,
      })
      setResult(r.data); setText(''); onSubmitted()
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{ marginBottom: 16, background: '#f8f9fa', borderRadius: 8, padding: 12, border: '1px solid #e0e0e0' }}>
      {!open ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {activeGuru && <Avatar initials={activeGuru.avatar_initials} color={activeGuru.avatar_color} size={32} />}
          <div onClick={() => setOpen(true)}
            style={{ flex: 1, padding: '8px 14px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 20, cursor: 'text', color: '#999', fontSize: 13 }}>
            Share something with the community... (optional)
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {POST_TYPES.map(t => (
              <button key={t.value} onClick={() => setPostType(t.value)}
                style={{ padding: '4px 10px', border: `1px solid ${postType === t.value ? typeColors[t.value] : '#e0e0e0'}`,
                  background: postType === t.value ? `${typeColors[t.value]}15` : '#fff',
                  color: postType === t.value ? typeColors[t.value] : '#666',
                  borderRadius: 14, cursor: 'pointer', fontSize: 11, fontWeight: postType === t.value ? 700 : 400 }}>
                {t.label}
              </button>
            ))}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
            placeholder={selected.placeholder}
            style={{ width: '100%', padding: 10, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: '#888' }}>Agent will score and route this before publishing</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setOpen(false); setResult(null); setText('') }}
                style={{ padding: '6px 14px', border: '1px solid #e0e0e0', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
              <button onClick={submit} disabled={submitting || !text.trim()}
                style={{ padding: '6px 14px', background: text.trim() ? '#1B2A4A' : '#ccc', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                {submitting ? 'Processing...' : '⚡ Submit via Agent'}
              </button>
            </div>
          </div>
          {result && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 6,
              background: result.routing === 'fast_lane' ? '#e6f4ea' : result.routing === 'rejected' ? '#fce8e6' : '#fff3cd',
              border: `1px solid ${result.routing === 'fast_lane' ? '#107c10' : result.routing === 'rejected' ? '#d83b01' : '#ffc000'}` }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {result.routing === 'fast_lane' ? '✅ Fast-tracked — live on feed!' : result.routing === 'rejected' ? '❌ Too vague — needs revision' : '⏳ Sent to MG Approval Queue'}
              </div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Quality score: {Math.round((result.quality_score || 0) * 100)}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Feed page ──────────────────────────────────────────
export default function Feed() {
  const [gurus, setGurus] = useState<any[]>([])
  const [activeGuruId, setActiveGuruId] = useState(1)
  const [posts, setPosts] = useState<any[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  const [stumps, setStumps] = useState<any[]>([])
  const [sparks, setSparks] = useState<any[]>([])
  const navigate = useNavigate()

  const load = () => {
    api.get('/gurus/').then(r => setGurus(r.data))
    api.get('/feed/').then(r => setPosts(r.data))
    api.get('/km/drafts').then(r => setDrafts(r.data))
    api.get('/km/stump').then(r => setStumps(r.data))
    api.get('/km/spark').then(r => setSparks(r.data))
  }

  useEffect(() => { load() }, [])

  const activeGuru = gurus.find(g => g.id === activeGuruId)
  const react = async (postId: number, type: string) => {
    await api.post(`/feed/posts/${postId}/react`, { guru_id: activeGuruId, reaction_type: type })
    api.get('/feed/').then(r => setPosts(r.data))
  }

  const pendingDrafts = drafts.filter(d => d.status === 'pending' || d.status === 'needs_revision')
  const openStumps = stumps.filter(s => s.status === 'open')

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', display: 'flex', gap: 22 }}>
      {/* Sidebar */}
      <div style={{ width: 210, flexShrink: 0 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 14, border: '1px solid #e0e0e0', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>Viewing as</div>
          {gurus.map(g => (
            <div key={g.id} onClick={() => setActiveGuruId(g.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 3,
                background: activeGuruId === g.id ? '#e8f0fe' : 'transparent',
                border: activeGuruId === g.id ? '1px solid #0078d4' : '1px solid transparent' }}>
              <Avatar initials={g.avatar_initials} color={g.avatar_color} size={26} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{g.name.split(' ')[0]}</div>
                <div style={{ fontSize: 10, color: '#888' }}>{g.grade} · {g.is_master_guru ? 'MG' : 'Guru'}</div>
              </div>
            </div>
          ))}
        </div>

        {activeGuru && (
          <div style={{ background: '#fff', borderRadius: 8, padding: 14, border: '1px solid #e0e0e0' }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div onClick={() => navigate(`/guru/${activeGuru.id}`)} style={{ cursor: 'pointer', display: 'inline-block' }}>
                <Avatar initials={activeGuru.avatar_initials} color={activeGuru.avatar_color} size={48} />
              </div>
              <div onClick={() => navigate(`/guru/${activeGuru.id}`)}
                style={{ fontWeight: 700, marginTop: 6, fontSize: 13, cursor: 'pointer', color: '#003087' }}>
                {activeGuru.name}
              </div>
              <div style={{ fontSize: 10, color: '#888' }}>{activeGuru.title}</div>
            </div>

            {/* Contribution Index */}
            <div style={{ background: '#1B2A4A', borderRadius: 8, padding: 10, textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#FAC778' }}>{activeGuru.contribution_index || 0}</div>
              <div style={{ fontSize: 9, color: '#aac0e0', textTransform: 'uppercase', letterSpacing: 1 }}>Contribution Index</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
              {[['Reviews', activeGuru.reviews_completed], ['Saves', activeGuru.escalation_saves],
                ['Turnaround', `${activeGuru.review_turnaround_hrs || 0}h`], ['Learners', activeGuru.learners_impacted]].map(([label, val]) => (
                <div key={String(label)} style={{ textAlign: 'center', background: '#f3f2f1', borderRadius: 6, padding: '5px 4px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0078d4' }}>{val}</div>
                  <div style={{ color: '#888', fontSize: 9 }}>{label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate(`/guru/${activeGuru.id}`)}
              style={{ marginTop: 10, width: '100%', padding: '5px 0', background: 'transparent', border: '1px solid #0078d4', color: '#0078d4', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
              View Full Profile →
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1 }}>

        {/* ── Section 1: Reality Check ── */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e0e0e0', marginBottom: 20 }}>
          <SectionHeader icon="🎯" title="Reality Check Queue"
            subtitle={`${pendingDrafts.length} KM draft${pendingDrafts.length !== 1 ? 's' : ''} waiting for your expert judgment — takes 30 seconds`}
            color="#FAC778" />
          {pendingDrafts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#888', fontSize: 12 }}>✓ All KM drafts reviewed. Check back tomorrow.</div>
          ) : (
            pendingDrafts.map(d => <RealityCheckCard key={d.id} draft={d} activeGuruId={activeGuruId} onRated={() => api.get('/km/drafts').then(r => setDrafts(r.data))} />)
          )}
        </div>

        {/* ── Section 2: Stump the Master ── */}
        {(openStumps.length > 0 || stumps.filter(s => s.status === 'resolved').length > 0) && (
          <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e0e0e0', marginBottom: 20 }}>
            <SectionHeader icon="🧱" title="Stump the Master"
              subtitle={`${openStumps.length} AI escalation${openStumps.length !== 1 ? 's' : ''} need expert sign-off · Your correction goes directly to the corpus`}
              color="#FF4E58" />
            {stumps.map(s => <StumpCard key={s.id} item={s} activeGuruId={activeGuruId} onResolved={() => api.get('/km/stump').then(r => setStumps(r.data))} />)}
          </div>
        )}

        {/* ── Section 3: Organic Spark ── */}
        {sparks.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e0e0e0', marginBottom: 20 }}>
            <SectionHeader icon="📡" title="Organic Spark"
              subtitle="Agent-detected signals from across client engagements — share your read if it's on your mind. Zero obligation."
              color="#8764b8" />
            {sparks.map(s => <SparkCard key={s.id} item={s} onRespond={(id: number) => api.post(`/km/spark/${id}/respond`, { guru_id: activeGuruId })} />)}
          </div>
        )}

        {/* ── Original posts (optional sharing) ── */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e0e0e0' }}>
          <SectionHeader icon="💬" title="Community Posts"
            subtitle="Original posts from Gurus — shared when they feel like it"
            color="#0078d4" />
          <ComposeBox activeGuru={activeGuru} onSubmitted={() => api.get('/feed/').then(r => setPosts(r.data))} />
          {posts.map(post => (
            <PostCard key={post.id} post={post} activeGuru={activeGuru}
              onReact={react} onComment={() => {}} />
          ))}
        </div>
      </div>
    </div>
  )
}
