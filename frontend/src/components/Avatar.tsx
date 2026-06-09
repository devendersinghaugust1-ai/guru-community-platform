interface Props { initials: string; color: string; size?: number }
export default function Avatar({ initials, color, size = 40 }: Props) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}
