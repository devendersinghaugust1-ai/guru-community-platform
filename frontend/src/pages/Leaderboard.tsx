import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Avatar from '../components/Avatar'

const DOMAIN_ORDER = ['Finance Transformation', 'Supply Chain', 'HR Modernisation', 'Collections & Credit', 'Procurement']
const DOMAIN_COLORS: Record<string, string> = {
  'Finance Transformation': '#0078d4',
  'Supply Chain': '#107c10',
  'HR Modernisation': '#8764b8',
  'Collections & Credit': '#FF4E58',
  'Procurement': '#FAC778',
}

function GradeBadge({ grade }: { grade: string }) {
  const isC = grade === 'C-Suite'
  const isSVP = grade === 'SVP'
  const isVP = grade === 'VP'
  const bg = isC ? '#1B2A4A' : isSVP ? '#003087' : isVP ? '#0078d4' : '#6c757d'
  return (
    <span style={{
      background: bg, color: '#fff', fontSize: 10, fontWeight: 700,
      padding: '2px 7px', borderRadius: 4, letterSpacing: 0.5
    }}>{grade}</span>
  )
}

function RoleBadge({ isMG }: { isMG: boolean }) {
  if (!isMG) return <span style={{ fontSize: 12, color: '#555' }}>Guru</span>
  return (
    <span style={{
      background: '#fff3cd', color: '#856404', fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 10, border: '1px solid #ffc107'
    }}>⭐ Master Guru</span>
  )
}

function IndexBar({ value }: { value: number }) {
  const color = value >= 80 ? '#107c10' : value >= 50 ? '#0078d4' : '#FAC778'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6, width: 60, flexShrink: 0 }}>
        <div style={{ background: color, borderRadius: 4, height: 6, width: `${value}%`, transition: 'width 0.6s' }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 14, color }}>{value}</span>
    </div>
  )
}

export default function Leaderboard() {
  const [gurus, setGurus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/km/guru-stats').then(r => setGurus(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading leaderboard...</div>

  // Group by domain
  const grouped: Record<string, any[]> = {}
  for (const g of gurus) {
    const d = g.domain || 'Other'
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(g)
  }
  // Sort each domain by contribution_index desc
  for (const d in grouped) {
    grouped[d].sort((a, b) => b.contribution_index - a.contribution_index)
  }

  const domains = DOMAIN_ORDER.filter(d => grouped[d])
  const otherDomains = Object.keys(grouped).filter(d => !DOMAIN_ORDER.includes(d))
  const allDomains = [...domains, ...otherDomains]
  const filteredDomains = selectedDomain ? [selectedDomain] : allDomains

  const totalGurus = gurus.length
  const totalMGs = gurus.filter(g => g.is_master_guru).length
  const totalLearners = gurus.reduce((a, g) => a + (g.learners_impacted || 0), 0)
  const totalSaves = gurus.reduce((a, g) => a + (g.escalation_saves || 0), 0)

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ background: '#1B2A4A', borderRadius: 10, padding: '20px 28px', marginBottom: 24, color: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#FAC778', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
          Community Rankings
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          🏆 Top Gurus by Domain
        </div>
        <div style={{ fontSize: 13, color: '#aac0e0' }}>
          Ranked by Proactive Contribution Index — not post count or seniority
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Gurus', value: totalGurus, icon: '👥', color: '#0078d4' },
          { label: 'Master Gurus', value: totalMGs, icon: '⭐', color: '#856404' },
          { label: 'Learners Impacted', value: totalLearners.toLocaleString(), icon: '🎓', color: '#107c10' },
          { label: 'AI Escalation Saves', value: totalSaves, icon: '🧱', color: '#FF4E58' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Domain filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedDomain(null)}
          style={{
            padding: '5px 14px', borderRadius: 20, border: '1px solid #e0e0e0', cursor: 'pointer', fontSize: 12,
            background: !selectedDomain ? '#1B2A4A' : '#fff', color: !selectedDomain ? '#fff' : '#555', fontWeight: !selectedDomain ? 700 : 400
          }}>
          All Domains
        </button>
        {allDomains.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDomain(d === selectedDomain ? null : d)}
            style={{
              padding: '5px 14px', borderRadius: 20, border: `1px solid ${DOMAIN_COLORS[d] || '#e0e0e0'}`,
              cursor: 'pointer', fontSize: 12,
              background: selectedDomain === d ? (DOMAIN_COLORS[d] || '#0078d4') : '#fff',
              color: selectedDomain === d ? '#fff' : (DOMAIN_COLORS[d] || '#555'),
              fontWeight: selectedDomain === d ? 700 : 400
            }}>
            {d}
          </button>
        ))}
      </div>

      {/* Domain tables */}
      {filteredDomains.map(domain => {
        const rows = grouped[domain]
        if (!rows || rows.length === 0) return null
        const domainColor = DOMAIN_COLORS[domain] || '#0078d4'
        return (
          <div key={domain} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 20, overflow: 'hidden' }}>

            {/* Domain header */}
            <div style={{ background: domainColor, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{domain}</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>
                {rows.length} Guru{rows.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '32px 2fr 90px 110px 120px 110px 140px',
              padding: '8px 16px', background: '#f8f9fa',
              borderBottom: '1px solid #e0e0e0', gap: 8
            }}>
              {['#', 'Name', 'Grade', 'Use Cases', 'Learners Impacted', 'AI Corrections', 'Contribution Index'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {rows.map((g, i) => (
              <div key={g.id} onClick={() => navigate(`/guru/${g.id}`)} style={{
                display: 'grid', gridTemplateColumns: '32px 2fr 90px 110px 120px 110px 140px',
                padding: '12px 16px', borderBottom: i < rows.length - 1 ? '1px solid #f0f0f0' : 'none',
                alignItems: 'center', gap: 8, cursor: 'pointer',
                background: i === 0 ? 'rgba(250,199,120,0.06)' : 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f8ff')}
              onMouseLeave={e => (e.currentTarget.style.background = i === 0 ? 'rgba(250,199,120,0.06)' : 'transparent')}>
                {/* Rank */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 11,
                  background: i === 0 ? '#FAC778' : i === 1 ? '#e0e0e0' : '#f5f5f5',
                  color: i === 0 ? '#1B2A4A' : '#666'
                }}>{i + 1}</div>

                {/* Name + avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flexShrink: 0, border: '2px solid #fff', borderRadius: '50%', boxShadow: '0 0 0 1px #e0e0e0' }}>
                    <Avatar initials={g.initials} color={g.color} size={36} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1B2A4A', lineHeight: 1.2 }}>{g.name}</div>
                    <RoleBadge isMG={g.is_master_guru} />
                  </div>
                </div>

                {/* Grade */}
                <div><GradeBadge grade={g.grade} /></div>

                {/* Use Cases (reviews as proxy) */}
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#0078d4', lineHeight: 1 }}>{g.reviews_completed}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>reviews</div>
                </div>

                {/* Learners Impacted */}
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#107c10', lineHeight: 1 }}>{(g.learners_impacted || 0).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>learners</div>
                </div>

                {/* AI Corrections */}
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#d83b01', lineHeight: 1 }}>{g.escalation_saves}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>AI saves</div>
                </div>

                {/* Contribution Index */}
                <IndexBar value={g.contribution_index} />
              </div>
            ))}
          </div>
        )
      })}

      {/* Legend */}
      <div style={{ background: '#1B2A4A', borderRadius: 8, padding: '14px 18px', color: '#aac0e0', fontSize: 11, lineHeight: 1.8 }}>
        <span style={{ color: '#FAC778', fontWeight: 700 }}>How Contribution Index is calculated: </span>
        (Reviews × 5) + (AI Saves × 8) — capped at 100. Post count is not a factor.
        &nbsp;·&nbsp;
        <span style={{ color: '#FAC778', fontWeight: 700 }}>Learners Impacted</span> = unique learners who engaged with this Guru's approved content on Genome.ai.
      </div>
    </div>
  )
}
