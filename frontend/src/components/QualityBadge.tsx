interface Props { score: number; routing?: string }
export default function QualityBadge({ score, routing }: Props) {
  const pct = Math.round(score * 100)
  const color = pct >= 85 ? '#107c10' : pct >= 60 ? '#ffc000' : '#d83b01'
  const label = pct >= 85 ? 'Fast-tracked' : pct >= 30 ? 'MG Review' : 'Needs Revision'
  return (
    <span style={{
      background: color + '20', color, border: `1px solid ${color}`,
      borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600,
    }}>
      {pct}% · {label}
    </span>
  )
}
