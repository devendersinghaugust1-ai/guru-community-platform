import { useEffect, useState } from 'react'
import api from '../api'

const NAVY = '#003087'
const CORAL = '#FF4E58'

const ISSUE_TYPES = ['Bug', 'Suggestion', 'Data Issue', 'Content Error', 'Other']
const ROLES = ['Guru', 'Knowledge Manager (KM)', 'Master Guru', 'Other']

const STATUS_COLORS: Record<string, string> = {
  open: '#ffc000',
  acknowledged: '#0078d4',
  resolved: '#107c10',
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function PlatformFeedback() {
  const [form, setForm] = useState({ submitter_name: '', submitter_role: 'Guru', issue_type: 'Bug', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const load = () => {
    api.get('/feedback/').then(r => setHistory(r.data)).finally(() => setLoadingHistory(false))
  }
  useEffect(() => { load() }, [])

  const canSubmit = form.submitter_name.trim() && form.description.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    await api.post('/feedback/', form)
    setSubmitted(true)
    setSubmitting(false)
    load()
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 16px', display: 'flex', gap: 24 }}>

      {/* Left — Submit form */}
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, color: NAVY, fontWeight: 700 }}>💬 Platform Feedback</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
            Facing an issue or have a suggestion? Let the tech team know directly.
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e0e0e0' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: NAVY, marginBottom: 6 }}>Feedback submitted</div>
              <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
                The tech team has been notified. You can track the status in the log below.
              </p>
              <button onClick={() => { setSubmitted(false); setForm({ ...form, description: '' }) }}
                style={{ padding: '8px 22px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Submit Another
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Your Name</label>
                  <input value={form.submitter_name} onChange={e => setForm({ ...form, submitter_name: e.target.value })}
                    placeholder="e.g. Rahul Desai"
                    style={inp} />
                </div>
                <div>
                  <label style={lbl}>Your Role</label>
                  <select value={form.submitter_role} onChange={e => setForm({ ...form, submitter_role: e.target.value })} style={inp}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Issue Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ISSUE_TYPES.map(t => (
                    <button key={t} onClick={() => setForm({ ...form, issue_type: t })}
                      style={{
                        padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        border: `1.5px solid ${form.issue_type === t ? NAVY : '#ddd'}`,
                        background: form.issue_type === t ? '#eef2fa' : '#fff',
                        fontWeight: form.issue_type === t ? 700 : 400,
                        color: form.issue_type === t ? NAVY : '#555',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Description <span style={{ color: CORAL }}>*</span></label>
                <textarea value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={5} placeholder="Describe the issue or suggestion clearly. Include what you were trying to do, what happened, and what you expected. Screenshots or page names help."
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
              </div>

              <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                style={{
                  padding: '10px 24px', background: canSubmit ? NAVY : '#ccc', color: '#fff',
                  border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}>
                {submitting ? 'Submitting…' : 'Send to Tech Team'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right — Submission log */}
      <div style={{ width: 320, flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: 12 }}>
          Submission Log
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: '#888' }}>{history.length} total</span>
        </div>

        {loadingHistory ? (
          <div style={{ color: '#aaa', fontSize: 13 }}>Loading…</div>
        ) : history.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, textAlign: 'center', border: '1px solid #e0e0e0', color: '#aaa', fontSize: 13 }}>
            No submissions yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(item => (
              <div key={item.id} style={{ background: '#fff', borderRadius: 8, padding: '12px 14px', border: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#333' }}>{item.submitter_name}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                    background: STATUS_COLORS[item.status] + '20',
                    color: STATUS_COLORS[item.status], border: `1px solid ${STATUS_COLORS[item.status]}40`,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{item.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, background: '#f0f4ff', color: '#0078d4', padding: '1px 7px', borderRadius: 10 }}>{item.issue_type}</span>
                  <span style={{ fontSize: 10, color: '#888' }}>{item.submitter_role}</span>
                </div>
                <div style={{ fontSize: 12, color: '#444', lineHeight: 1.5, marginBottom: 4 }}>
                  {item.description.length > 100 ? item.description.slice(0, 100) + '…' : item.description}
                </div>
                <div style={{ fontSize: 10, color: '#bbb' }}>{timeAgo(item.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: 'block', fontWeight: 600, fontSize: 12, color: '#1B2A4A', marginBottom: 6,
}
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 11px', border: '1px solid #ddd', borderRadius: 7,
  fontSize: 13, color: '#1B2A4A', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
}
