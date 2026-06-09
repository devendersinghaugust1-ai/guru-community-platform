import { useEffect, useState } from 'react'
import api from '../api'

export default function PipelineDashboard() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [sending, setSending] = useState<number | null>(null)
  const [sent, setSent] = useState<Set<number>>(new Set())
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentResult, setAgentResult] = useState<any>(null)
  const [nudgeRunning, setNudgeRunning] = useState(false)
  const [nudgeResult, setNudgeResult] = useState<any>(null)

  const load = async () => {
    const [c, s] = await Promise.all([api.get('/pipeline/candidates'), api.get('/pipeline/stats')])
    setCandidates(c.data)
    setStats(s.data)
  }

  useEffect(() => { load() }, [])

  const runAgent = async () => {
    setAgentRunning(true)
    const r = await api.post('/agents/pipeline-scan')
    setAgentResult(r.data)
    setAgentRunning(false)
    load()
  }

  const runNudge = async () => {
    setNudgeRunning(true)
    const r = await api.post('/agents/nudge-scan')
    setNudgeResult(r.data)
    setNudgeRunning(false)
  }

  const sendOutreach = async (id: number) => {
    setSending(id)
    await api.post(`/pipeline/candidates/${id}/send-outreach`, { approved: true, modified_draft: '' })
    setSent(s => new Set(s).add(id))
    setSending(null)
    load()
  }

  const STATUS_COLORS: Record<string, string> = { identified: '#ffc000', outreach_sent: '#0078d4', joined: '#107c10' }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#003087' }}>🎯 Guru Pipeline Dashboard</h2>
        <p style={{ color: '#666', fontSize: 13, margin: '4px 0 0' }}>Pipeline Identification Agent · VP/SVP candidates not yet in the community</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Identified', value: stats.total_identified, color: '#ffc000' },
            { label: 'Outreach Sent', value: stats.outreach_sent, color: '#0078d4' },
            { label: 'Joined', value: stats.joined, color: '#107c10' },
            { label: 'Pending', value: stats.pending, color: '#d83b01' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: '16px', border: `1px solid ${s.color}30`, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 28, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Agent controls */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#003087', marginBottom: 12 }}>Run Agents</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <button onClick={runAgent} disabled={agentRunning}
              style={{ width: '100%', padding: '10px 0', background: agentRunning ? '#999' : '#003087', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              {agentRunning ? '⏳ Scanning HR data...' : '🔍 Run Pipeline Agent'}
            </button>
            {agentResult && <div style={{ marginTop: 8, fontSize: 12, color: '#107c10' }}>✅ Found {agentResult.new_candidates_identified} new candidates: {agentResult.names?.join(', ')}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <button onClick={runNudge} disabled={nudgeRunning}
              style={{ width: '100%', padding: '10px 0', background: nudgeRunning ? '#999' : '#8764b8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              {nudgeRunning ? '⏳ Crafting nudges...' : '💬 Run Nudge Agent'}
            </button>
            {nudgeResult && <div style={{ marginTop: 8, fontSize: 12, color: '#107c10' }}>✅ Sent {nudgeResult.nudges_sent} personalized nudges</div>}
          </div>
        </div>
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0f4ff', borderRadius: 6, fontSize: 12, color: '#0078d4' }}>
          💡 Nudge Agent uses the FeverBee/LinkedIn formula: specific topic gap + their known project + pre-drafted content. Never generic.
        </div>
      </div>

      {/* Candidates */}
      {candidates.map(c => (
        <div key={c.id} style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#003087', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
              {c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{c.title} · {c.business_unit}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: '#0078d4', fontSize: 13 }}>Score: {c.signal_score}</div>
              <span style={{ background: STATUS_COLORS[c.status] + '20', color: STATUS_COLORS[c.status], border: `1px solid ${STATUS_COLORS[c.status]}`, borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>
                {c.status.replace('_', ' ')}
              </span>
            </div>
            <span style={{ color: '#999' }}>{expanded === c.id ? '▲' : '▼'}</span>
          </div>

          {expanded === c.id && (
            <div style={{ padding: '0 20px 16px', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ marginBottom: 12, paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>Why this candidate?</div>
                {JSON.parse(c.signals || '[]').map((s: string, i: number) => (
                  <div key={i} style={{ fontSize: 12, color: '#444', marginBottom: 3 }}>✓ {s}</div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>Agent-drafted outreach (sent by MGG team)</div>
                <div style={{ background: '#f8f9fa', borderRadius: 6, padding: 12, fontSize: 12, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap', border: '1px solid #e0e0e0' }}>
                  {c.outreach_draft}
                </div>
              </div>
              {c.status === 'identified' && !sent.has(c.id) && (
                <button onClick={() => sendOutreach(c.id)} disabled={sending === c.id}
                  style={{ padding: '8px 20px', background: '#003087', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {sending === c.id ? 'Sending...' : '📧 Approve & Send Outreach'}
                </button>
              )}
              {(c.status === 'outreach_sent' || sent.has(c.id)) && (
                <div style={{ padding: '8px 14px', background: '#e6f4ea', borderRadius: 6, color: '#107c10', fontSize: 13, fontWeight: 700, display: 'inline-block' }}>
                  ✅ Outreach sent via MGG team
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
