export default function LaunchSiteBackground({ width, height, cols = 5, rows = 5 }) {
  const tileW = width / cols
  const tileH = height / rows

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    >
      <defs>
        <linearGradient id="launch-floor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#101928" />
          <stop offset="42%" stopColor="#233548" />
          <stop offset="100%" stopColor="#07111f" />
        </linearGradient>
        <linearGradient id="launch-runway" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64748b" stopOpacity="0.48" />
          <stop offset="45%" stopColor="#1f3348" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#020817" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="launch-cyan-strip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="launch-pad-aura" cx="50%" cy="18%" r="68%">
          <stop offset="0%" stopColor="#e0faff" stopOpacity="0.24" />
          <stop offset="45%" stopColor="#22d3ee" stopOpacity="0.11" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
        <filter id="launch-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <rect width={width} height={height} fill="url(#launch-floor)" />
      <rect width={width} height={height} fill="url(#launch-pad-aura)" />

      <path
        d={`M${width * 0.2} 0 L${width * 0.8} 0 L${width * 0.62} ${height} L${width * 0.38} ${height} Z`}
        fill="url(#launch-runway)"
        stroke="#94a3b8"
        strokeOpacity="0.22"
        strokeWidth="2"
      />

      {Array.from({ length: rows + 1 }, (_, row) => (
        <line
          key={`h-${row}`}
          x1="0"
          x2={width}
          y1={row * tileH}
          y2={row * tileH}
          stroke="#cbd5e1"
          strokeOpacity={row === 0 || row === rows ? 0.2 : 0.13}
          strokeWidth={row === 0 || row === rows ? 2 : 1}
        />
      ))}
      {Array.from({ length: cols + 1 }, (_, col) => (
        <line
          key={`v-${col}`}
          y1="0"
          y2={height}
          x1={col * tileW}
          x2={col * tileW}
          stroke="#cbd5e1"
          strokeOpacity={col === 0 || col === cols ? 0.2 : 0.13}
          strokeWidth={col === 0 || col === cols ? 2 : 1}
        />
      ))}

      {Array.from({ length: rows }, (_, row) => (
        <g key={`panel-${row}`}>
          <rect
            x={tileW * 0.08}
            y={row * tileH + tileH * 0.43}
            width={tileW * 0.34}
            height={tileH * 0.05}
            rx="2"
            fill="url(#launch-cyan-strip)"
            opacity="0.55"
          />
          <rect
            x={width - tileW * 0.42}
            y={row * tileH + tileH * 0.52}
            width={tileW * 0.34}
            height={tileH * 0.05}
            rx="2"
            fill="url(#launch-cyan-strip)"
            opacity="0.55"
          />
        </g>
      ))}

      {Array.from({ length: 7 }, (_, index) => {
        const y = height * (0.1 + index * 0.13)
        return (
          <g key={`mark-${index}`} opacity={0.58 - index * 0.03}>
            <rect x={width * 0.47} y={y} width={width * 0.06} height={height * 0.018} rx="2" fill="#e2e8f0" opacity="0.42" />
            <rect x={width * 0.485} y={y + height * 0.026} width={width * 0.03} height={height * 0.01} rx="2" fill="#67e8f9" opacity="0.48" />
          </g>
        )
      })}

      <ellipse cx={width * 0.5} cy={height * 0.06} rx={width * 0.28} ry={height * 0.08} fill="#67e8f9" opacity="0.12" filter="url(#launch-soft-glow)" />
      <path d={`M0 ${height * 0.88} C${width * 0.25} ${height * 0.8} ${width * 0.65} ${height * 0.95} ${width} ${height * 0.84}`} stroke="#38bdf8" strokeOpacity="0.16" strokeWidth="3" fill="none" />
    </svg>
  )
}
