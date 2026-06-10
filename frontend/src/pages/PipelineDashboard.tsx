import { useEffect, useState } from 'react'
import api from '../api'

const STAGES = [
  { key: 'identified', label: 'Identified', color: '#ffc000', bg: '#fffbf0', icon: '🔍', desc: 'Matched by agent — awaiting MGG review' },
  { key: 'outreach_sent', label: 'Invited', color: '#0078d4', bg: '#f0f6ff', icon: '📧', desc: 'Invite sent by MGG team' },
  { key: 'joined', label: 'Joined', color: '#107c10', bg: '#f0faf0', icon: '✅', desc: 'Now active in the community' },
]

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = { MD: '#1B2A4A', SVP: '#003087', VP: '#0078d4' }
  return (
    <span style={{ background: colors[grade] || '#666', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 4 }}>
      {grade}
    </span>
  )
}

function ScoreDot({ score }: { score: number }) {
  const color = score >= 60 ? '#107c10' : score >= 45 ? '#ffc000' : '#d83b01'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}</span>
    </div>
  )
}

function EmailModal({ candidate, onClose, onSend }: { candidate: any; onClose: () => void; onSend: () => void }) {
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const handleSend = async () => {
    setSending(true)
    await onSend()
    setDone(true)
    setSending(false)
    setTimeout(onClose, 1200)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 580, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>

        {/* Modal header */}
        <div style={{ background: '#1B2A4A', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>📧 Review Invite — {candidate.name}</div>
            <div style={{ color: '#aac0e0', fontSize: 11, marginTop: 2 }}>{candidate.title} · {candidate.business_unit}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aac0e0', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Why this person */}
        <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Why the agent flagged this person
          </div>
          {JSON.parse(candidate.signals || '[]').map((s: string, i: number) => (
            <div key={i} style={{ fontSize: 12, color: '#333', marginBottom: 3 }}>✓ {s}</div>
          ))}
        </div>

        {/* Email draft */}
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Invite email — sent by MGG Team
          </div>
          <div style={{ background: '#f5f8ff', border: '1px solid #c8d8f0', borderRadius: 8, padding: '14px 16px', fontSize: 12, color: '#222', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', maxHeight: 320, overflowY: 'auto' }}>
            {candidate.outreach_draft}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
            💡 Short, prestige-focused. No skill gaps mentioned. Sent from MGG team — not from a specific Guru.
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #e0e0e0', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          {done ? (
            <div style={{ padding: '8px 18px', background: '#e6f4ea', color: '#107c10', borderRadius: 6, fontWeight: 700, fontSize: 13 }}>✅ Invite sent</div>
          ) : (
            <button onClick={handleSend} disabled={sending}
              style={{ padding: '8px 20px', background: '#003087', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              {sending ? 'Sending…' : '📧 Approve & Send Invite'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CandidateCard({ candidate, onAction }: { candidate: any; onAction: (c: any, action: 'send' | 'joined') => void }) {
  const initials = candidate.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8', padding: '12px 14px', marginBottom: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#003087', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1B2A4A' }}>{candidate.name}</span>
            <GradeBadge grade={candidate.grade} />
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate.title}</div>
          <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{candidate.business_unit}</div>
        </div>
        <ScoreDot score={candidate.signal_score} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        <span style={{ background: '#f0f4ff', color: '#0078d4', fontSize: 10, padding: '2px 7px', borderRadius: 10 }}>
          {candidate.domain}
        </span>
      </div>

      {candidate.status === 'identified' && (
        <button onClick={() => onAction(candidate, 'send')}
          style={{ width: '100%', padding: '7px 0', background: '#003087', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
          Review & Send Invite →
        </button>
      )}

      {candidate.status === 'outreach_sent' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: '6px 10px', background: '#f0f6ff', borderRadius: 6, fontSize: 11, color: '#0078d4', fontWeight: 600 }}>
            📧 Invite sent
          </div>
          <button onClick={() => onAction(candidate, 'joined')}
            style={{ padding: '6px 12px', background: '#107c10', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
            ✅ Mark Joined
          </button>
        </div>
      )}

      {candidate.status === 'joined' && (
        <div style={{ padding: '6px 10px', background: '#e6f4ea', borderRadius: 6, fontSize: 11, color: '#107c10', fontWeight: 700 }}>
          🎉 Active Guru in community
        </div>
      )}
    </div>
  )
}

export default function PipelineDashboard() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentResult, setAgentResult] = useState<any>(null)
  const [nudgeRunning, setNudgeRunning] = useState(false)
  const [nudgeResult, setNudgeResult] = useState<any>(null)
  const [reviewCandidate, setReviewCandidate] = useState<any>(null)

  const load = async () => {
    const [c, s] = await Promise.all([api.get('/pipeline/candidates'), api.get('/pipeline/stats')])
    setCandidates(c.data)
    setStats(s.data)
  }

  useEffect(() => { load() }, [])

  const runAgent = async () => {
    setAgentRunning(true)
    setAgentResult(null)
    const r = await api.post('/agents/pipeline-scan')
    setAgentResult(r.data)
    setAgentRunning(false)
    load()
  }

  const runNudge = async () => {
    setNudgeRunning(true)
    setNudgeResult(null)
    const r = await api.post('/agents/nudge-scan')
    setNudgeResult(r.data)
    setNudgeRunning(false)
  }

  const handleAction = async (candidate: any, action: 'send' | 'joined') => {
    if (action === 'send') {
      setReviewCandidate(candidate)
    } else {
      await api.post(`/pipeline/candidates/${candidate.id}/mark-joined`)
      load()
    }
  }

  const doSend = async () => {
    if (!reviewCandidate) return
    await api.post(`/pipeline/candidates/${reviewCandidate.id}/send-outreach`, { approved: true, modified_draft: '' })
    load()
  }

  const byStage = (key: string) => candidates.filter(c => c.status === key)

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ background: '#1B2A4A', borderRadius: 10, padding: '20px 28px', marginBottom: 24, color: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#FAC778', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
          New Leader Problem
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🎯 Guru Pipeline Dashboard</div>
        <div style={{ fontSize: 13, color: '#aac0e0' }}>
          Agent scans for VP/SVP/MD profiles not yet in the community. MGG reviews each match and sends a personalised invite. Track Identified → Invited → Joined.
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Identified', value: stats.total_identified, color: '#ffc000' },
            { label: 'Invites Sent', value: stats.outreach_sent, color: '#0078d4' },
            { label: 'Joined', value: stats.joined, color: '#107c10' },
            { label: 'Awaiting Action', value: stats.pending, color: '#d83b01' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: 16, border: `1px solid ${s.color}30`, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 28, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Run agents panel */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#003087', marginBottom: 12 }}>Run Agents</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <button onClick={runAgent} disabled={agentRunning}
              style={{ width: '100%', padding: '10px 0', background: agentRunning ? '#999' : '#003087', color: '#fff', border: 'none', borderRadius: 6, cursor: agentRunning ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
              {agentRunning ? '⏳ Scanning HR data...' : '🔍 Run Pipeline Agent'}
            </button>
            {agentResult && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: agentResult.new_candidates_identified > 0 ? '#e6f4ea' : '#f5f5f5', borderRadius: 6, fontSize: 12, color: agentResult.new_candidates_identified > 0 ? '#107c10' : '#888', fontWeight: 600 }}>
                {agentResult.new_candidates_identified > 0
                  ? `✅ ${agentResult.new_candidates_identified} new candidate${agentResult.new_candidates_identified > 1 ? 's' : ''} found: ${agentResult.names?.join(', ')} — review below ↓`
                  : '✓ No new candidates this run — pipeline is up to date'}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <button onClick={runNudge} disabled={nudgeRunning}
              style={{ width: '100%', padding: '10px 0', background: nudgeRunning ? '#999' : '#8764b8', color: '#fff', border: 'none', borderRadius: 6, cursor: nudgeRunning ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
              {nudgeRunning ? '⏳ Crafting nudges...' : '💬 Run Nudge Agent'}
            </button>
            {nudgeResult && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#f3f0fa', borderRadius: 6, fontSize: 12, color: '#8764b8', fontWeight: 600 }}>
                ✅ {nudgeResult.nudges_sent} personalised nudges sent
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0f4ff', borderRadius: 6, fontSize: 11, color: '#0078d4' }}>
          💡 Invite emails are short, prestige-focused, and sent by MGG Team — no skill gap language. Nudge Agent uses specific topic gaps + known project context.
        </div>
      </div>

      {/* Kanban pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {STAGES.map(stage => {
          const items = byStage(stage.key)
          return (
            <div key={stage.key}>
              {/* Stage header */}
              <div style={{ background: stage.bg, border: `1px solid ${stage.color}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{stage.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: stage.color }}>{stage.label}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>{stage.desc}</div>
                </div>
                <div style={{ background: stage.color, color: '#fff', borderRadius: 12, padding: '2px 9px', fontSize: 12, fontWeight: 700 }}>
                  {items.length}
                </div>
              </div>

              {/* Cards in this stage */}
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: '#bbb', fontSize: 12, border: '2px dashed #e8e8e8', borderRadius: 8 }}>
                  {stage.key === 'identified' ? 'Run the Pipeline Agent to find candidates' : 'None yet'}
                </div>
              ) : (
                items.map(c => (
                  <CandidateCard key={c.id} candidate={c} onAction={handleAction} />
                ))
              )}
            </div>
          )
        })}
      </div>

      {/* Email review modal */}
      {reviewCandidate && (
        <EmailModal
          candidate={reviewCandidate}
          onClose={() => setReviewCandidate(null)}
          onSend={doSend}
        />
      )}
    </div>
  )
}
