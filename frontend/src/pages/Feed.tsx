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

// ── Corpus Discussion card ──────────────────────────────────
function SparkCard({ item, activeGuruId, activeGuru, onRespond }: any) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [responses, setResponses] = useState<any[]>(item.responses || [])

  const submit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    await onRespond(item.id, text.trim())
    setResponses((r: any[]) => [...r, {
      id: Date.now(), guru_id: activeGuruId,
      guru_name: activeGuru?.name || 'You',
      guru_initials: activeGuru?.avatar_initials || '?',
      guru_color: activeGuru?.avatar_color || '#999',
      guru_title: activeGuru?.title || '',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }])
    setText('')
    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #ddd', marginBottom: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B2A4A, #2d4a7a)', padding: '10px 16px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#FAC778', textTransform: 'uppercase', letterSpacing: 1 }}>🧠 Corpus Discussion · {item.domain}</span>
        <div style={{ fontSize: 10, color: '#aac0e0', marginTop: 2 }}>Agent-detected gap in AI Guru corpus · {timeAgo(item.created_at)}</div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Prompt */}
        <div style={{ fontSize: 12, color: '#444', background: '#f3f2f1', padding: 12, borderRadius: 6, lineHeight: 1.7, fontStyle: 'italic', whiteSpace: 'pre-line', marginBottom: 14 }}>
          {item.prompt}
        </div>

        {/* Existing responses */}
        {responses.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8764b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              {responses.length} Guru response{responses.length !== 1 ? 's' : ''} — sent to KM
            </div>
            {responses.map((r: any) => (
              <div key={r.id} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <Avatar initials={r.guru_initials} color={r.guru_color} size={28} />
                <div style={{ flex: 1, background: '#f3f0fa', borderRadius: 8, padding: '8px 12px', border: '1px solid #8764b820' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1B2A4A' }}>{r.guru_name}
                    <span style={{ fontWeight: 400, color: '#888', marginLeft: 6 }}>{r.guru_title}</span>
                    <span style={{ color: '#bbb', marginLeft: 8 }}>{timeAgo(r.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#333', marginTop: 4, lineHeight: 1.6 }}>{r.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Response input — always visible */}
        {submitted ? (
          <div style={{ padding: '10px 14px', background: '#e6f4ea', borderRadius: 8, fontSize: 12, color: '#107c10', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            ✓ Your read has been sent to the KM for corpus improvement
            <button onClick={() => setSubmitted(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 11 }}>Add another</button>
          </div>
        ) : (
          <div style={{ background: '#fafafa', borderRadius: 8, border: '1px solid #e0e0e0', padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 8 }}>
              💬 Your expert read — goes to KM for corpus improvement
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              {activeGuru && <Avatar initials={activeGuru.avatar_initials} color={activeGuru.avatar_color} size={28} />}
              <div style={{ flex: 1 }}>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={2}
                  placeholder="What have you seen on client engagements? What's the correct answer or the missing piece?"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit() }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: '#bbb' }}>Ctrl+Enter to submit</span>
                  <button onClick={submit} disabled={!text.trim() || submitting}
                    style={{ padding: '5px 16px', background: text.trim() ? '#1B2A4A' : '#ccc', color: '#fff', border: 'none', borderRadius: 6, cursor: text.trim() ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600 }}>
                    {submitting ? 'Sending…' : '→ Send to KM'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
  const [sparks, setSparks] = useState<any[]>([])
  const navigate = useNavigate()

  const load = () => {
    api.get('/gurus/').then(r => setGurus(r.data))
    api.get('/feed/').then(r => setPosts(r.data))
    api.get('/km/spark').then(r => setSparks(r.data))
  }

  useEffect(() => { load() }, [])

  const activeGuru = gurus.find(g => g.id === activeGuruId)
  const react = async (postId: number, type: string) => {
    await api.post(`/feed/posts/${postId}/react`, { guru_id: activeGuruId, reaction_type: type })
    api.get('/feed/').then(r => setPosts(r.data))
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', display: 'flex', gap: 22 }}>
      {/* Sidebar */}
      <div style={{ width: 210, flexShrink: 0 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 14, border: '1px solid #e0e0e0', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>Viewing as</div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {gurus.map(g => (
              <div key={g.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, marginBottom: 3,
                  background: activeGuruId === g.id ? '#e8f0fe' : 'transparent',
                  border: activeGuruId === g.id ? '1px solid #0078d4' : '1px solid transparent' }}>
                <div onClick={() => setActiveGuruId(g.id)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <Avatar initials={g.avatar_initials} color={g.avatar_color} size={26} />
                </div>
                <div onClick={() => setActiveGuruId(g.id)} style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {g.name.split(' ')[0]}
                    {g.is_master_guru && <span style={{ fontSize: 8, background: '#ffc000', color: '#000', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>MG</span>}
                  </div>
                  <div style={{ fontSize: 9, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</div>
                </div>
                <span onClick={() => navigate(`/guru/${g.id}`)} title="View profile"
                  style={{ fontSize: 12, color: '#0078d4', cursor: 'pointer', flexShrink: 0, padding: '2px 4px', borderRadius: 4, opacity: 0.7 }}>
                  👤
                </span>
              </div>
            ))}
          </div>
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

        {/* ── Corpus Discussion ── */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e0e0e0', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #8764b8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🧠</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1B2A4A' }}>Corpus Discussion</div>
                <div style={{ fontSize: 11, color: '#888' }}>Agent scans AI Guru corpus for knowledge gaps — share your expertise to improve it. Zero obligation.</div>
              </div>
            </div>
            <button onClick={async () => {
              await api.post('/agents/ai-guru-quality')
              api.get('/km/spark').then(r => setSparks(r.data))
            }} style={{ flexShrink: 0, padding: '5px 12px', background: '#f0eafa', color: '#8764b8', border: '1px solid #8764b8', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
              ↻ Refresh
            </button>
          </div>
          {sparks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#888', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🧠</div>
              No corpus gaps flagged right now. Click Refresh to run the agent scan.
            </div>
          ) : (
            sparks.map(s => <SparkCard key={s.id} item={s} activeGuruId={activeGuruId} activeGuru={activeGuru} onRespond={async (id: number, content: string) => {
              await api.post(`/km/spark/${id}/respond`, { guru_id: activeGuruId, content })
              api.get('/km/spark').then(r => setSparks(r.data))
            }} />)
          )}
        </div>

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
