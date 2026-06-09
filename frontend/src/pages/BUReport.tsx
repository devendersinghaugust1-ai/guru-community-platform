import { useEffect, useState } from 'react'
import api from '../api'

export default function BUReport() {
  const [report, setReport] = useState<any>(null)

  useEffect(() => { api.get('/reports/bu-report').then(r => setReport(r.data)) }, [])

  if (!report) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Generating report...</div>

  const { summary, top_gurus_by_domain, pipeline, domain_health } = report

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #003087, #0078d4)', borderRadius: 8, padding: '24px 28px', marginBottom: 20, color: '#fff' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 }}>Quarterly Capability Report</div>
        <h2 style={{ margin: '6px 0 4px', fontSize: 22 }}>Guru Community — {report.quarter}</h2>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Auto-generated · Sent to BU Heads · {new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div style={{ marginTop: 12, fontSize: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '6px 12px', display: 'inline-block' }}>
          💡 These metrics are visible to your BU Head every quarter
        </div>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Gurus', value: `${summary.total_active_gurus} / ${summary.total_gurus}`, sub: 'Contributing this quarter', color: '#0078d4', icon: '👥' },
          { label: 'Learners Impacted', value: summary.total_learners_impacted, sub: 'Proficiency improvements', color: '#107c10', icon: '🎓' },
          { label: 'Use Cases Contributed', value: summary.total_use_cases_contributed, sub: 'Reusable knowledge assets', color: '#8764b8', icon: '📝' },
          { label: 'AI Guru Improvements', value: summary.ai_guru_improvements, sub: 'Expert-validated corrections', color: '#d83b01', icon: '🔧' },
          { label: 'New Gurus Onboarded', value: summary.new_gurus_onboarded, sub: 'Via Pipeline Agent', color: '#ffc000', icon: '🚀' },
          { label: 'Pipeline Candidates', value: summary.pipeline_candidates_identified, sub: 'VP/SVPs identified', color: '#038387', icon: '🎯' },
        ].map(m => (
          <div key={m.label} style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', border: `1px solid ${m.color}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>{m.label}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 26, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Top Gurus by Domain */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#003087', marginBottom: 16 }}>🏆 Top Gurus by Domain (Leverage Metrics, not Vanity)</div>
        {Object.entries(top_gurus_by_domain).map(([domain, gurus]: [string, any]) => (
          <div key={domain} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0078d4', marginBottom: 8, paddingBottom: 4, borderBottom: '2px solid #0078d420' }}>{domain}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    {['Name', 'Grade', 'Use Cases', 'Learners Impacted', 'AI Corrections', 'Role'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#666', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(gurus as any[]).map((g: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{g.name}</td>
                      <td style={{ padding: '8px 10px' }}><span style={{ background: '#003087', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>{g.grade}</span></td>
                      <td style={{ padding: '8px 10px', color: '#0078d4', fontWeight: 700 }}>{g.use_cases_shared}</td>
                      <td style={{ padding: '8px 10px', color: '#107c10', fontWeight: 700 }}>{g.learners_impacted}</td>
                      <td style={{ padding: '8px 10px', color: '#8764b8', fontWeight: 700 }}>{g.ai_guru_corrections}</td>
                      <td style={{ padding: '8px 10px' }}>{g.is_master_guru ? <span style={{ background: '#ffc00020', color: '#c8960c', border: '1px solid #ffc000', borderRadius: 8, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>Master Guru</span> : 'Guru'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline & Domain Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#003087', marginBottom: 12 }}>🎯 Pipeline Status</div>
          {[['Identified', pipeline.identified, '#ffc000'], ['Outreach Sent', pipeline.outreach_sent, '#0078d4'], ['Joined', pipeline.joined, '#107c10']].map(([label, val, color]) => (
            <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 13 }}>{label}</span>
              <span style={{ fontWeight: 700, color: color as string, fontSize: 16 }}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#003087', marginBottom: 12 }}>🏥 Domain Health</div>
          {(domain_health || []).map((d: any) => (
            <div key={d.domain} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{d.domain}</div>
                <div style={{ fontSize: 11, color: '#888' }}>Top: {d.top_guru}</div>
              </div>
              <span style={{ background: '#0078d420', color: '#0078d4', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{d.guru_count} Gurus</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
