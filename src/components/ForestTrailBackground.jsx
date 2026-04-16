export default function ForestTrailBackground({ width, height, cols, rows }) {
  const W = width
  const H = height
  const cellW = W / cols
  const cellH = H / rows

  const glowDots = [
    [0.12, 0.28, 6, '#b8ffcf', '4.2s'],
    [0.2, 0.64, 4, '#7dd3fc', '3.4s'],
    [0.34, 0.18, 5, '#d8b4fe', '3.8s'],
    [0.48, 0.72, 4, '#fde68a', '2.9s'],
    [0.62, 0.26, 5, '#86efac', '4.6s'],
    [0.74, 0.58, 4, '#c4b5fd', '3.3s'],
    [0.86, 0.24, 6, '#bef264', '4.8s'],
    [0.9, 0.72, 5, '#7dd3fc', '3.1s'],
  ]

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="ftSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f2f34" />
          <stop offset="42%" stopColor="#1d5147" />
          <stop offset="100%" stopColor="#23422f" />
        </linearGradient>
        <linearGradient id="ftMist" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d9f99d" stopOpacity="0.14" />
          <stop offset="45%" stopColor="#fef3c7" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="ftPath" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8a772" />
          <stop offset="45%" stopColor="#9b7c4f" />
          <stop offset="100%" stopColor="#6a5335" />
        </linearGradient>
        <radialGradient id="ftCanopyGlow" cx="50%" cy="24%" r="72%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#86efac" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ftGroundGlow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.16" />
          <stop offset="65%" stopColor="#a78bfa" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <filter id="ftBlurSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="ftBlurTiny" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#ftSky)" />
      <rect width={W} height={H} fill="url(#ftCanopyGlow)" />
      <rect width={W} height={H} fill="url(#ftGroundGlow)" />

      {[0.12, 0.34, 0.58, 0.82].map((x, index) => (
        <ellipse key={`mist-${index}`} cx={W * x} cy={H * (0.2 + index * 0.14)} rx={W * 0.28} ry={H * 0.1} fill="url(#ftMist)" filter="url(#ftBlurSoft)" opacity={0.56 - index * 0.08} />
      ))}

      <g opacity="0.42">
        {[0.08, 0.22, 0.38, 0.56, 0.72, 0.9].map((x, index) => (
          <path
            key={`tree-back-${index}`}
            d={`M ${W * x} ${H * 0.7} C ${W * (x - 0.012)} ${H * 0.54}, ${W * (x - 0.01)} ${H * 0.34}, ${W * x} ${H * 0.12} C ${W * (x + 0.01)} ${H * 0.34}, ${W * (x + 0.012)} ${H * 0.54}, ${W * x} ${H * 0.7}`}
            fill="#13261f"
          />
        ))}
      </g>

      <g opacity="0.72">
        {[0.12, 0.3, 0.48, 0.68, 0.84].map((x, index) => (
          <g key={`canopy-${index}`}>
            <ellipse cx={W * x} cy={H * (0.14 + (index % 2) * 0.04)} rx={W * 0.14} ry={H * 0.1} fill={index % 2 === 0 ? '#22593c' : '#2f6e47'} />
            <ellipse cx={W * (x + 0.035)} cy={H * (0.18 + (index % 2) * 0.03)} rx={W * 0.11} ry={H * 0.08} fill="#1f7a50" opacity="0.92" />
            <ellipse cx={W * (x - 0.04)} cy={H * (0.19 + (index % 2) * 0.03)} rx={W * 0.1} ry={H * 0.075} fill="#3d8d56" opacity="0.84" />
          </g>
        ))}
      </g>

      {[0.13, 0.27, 0.42, 0.61, 0.79].map((x, index) => (
        <path
          key={`light-${index}`}
          d={`M ${W * (x - 0.04)} 0 L ${W * (x + 0.02)} 0 L ${W * (x + 0.12)} ${H} L ${W * (x + 0.02)} ${H}`}
          fill="#fef3c7"
          opacity={0.08 + index * 0.012}
        />
      ))}

      <path
        d={`M ${W * 0.12} ${H * 0.98}
            C ${W * 0.18} ${H * 0.84}, ${W * 0.26} ${H * 0.75}, ${W * 0.34} ${H * 0.7}
            C ${W * 0.43} ${H * 0.64}, ${W * 0.47} ${H * 0.54}, ${W * 0.5} ${H * 0.46}
            C ${W * 0.55} ${H * 0.34}, ${W * 0.64} ${H * 0.22}, ${W * 0.78} ${H * 0.08}`}
        fill="none"
        stroke="url(#ftPath)"
        strokeWidth={Math.min(cellW, cellH) * 1.16}
        strokeLinecap="round"
        opacity="0.88"
      />
      <path
        d={`M ${W * 0.12} ${H * 0.98}
            C ${W * 0.18} ${H * 0.84}, ${W * 0.26} ${H * 0.75}, ${W * 0.34} ${H * 0.7}
            C ${W * 0.43} ${H * 0.64}, ${W * 0.47} ${H * 0.54}, ${W * 0.5} ${H * 0.46}
            C ${W * 0.55} ${H * 0.34}, ${W * 0.64} ${H * 0.22}, ${W * 0.78} ${H * 0.08}`}
        fill="none"
        stroke="#fff7d6"
        strokeWidth={Math.min(cellW, cellH) * 0.2}
        strokeLinecap="round"
        opacity="0.36"
      />

      {[0.1, 0.22, 0.38, 0.53, 0.7, 0.86].map((x, index) => (
        <g key={`root-${index}`} opacity="0.3">
          <path d={`M ${W * x} ${H * 0.9} C ${W * (x + 0.03)} ${H * 0.84}, ${W * (x + 0.05)} ${H * 0.8}, ${W * (x + 0.07)} ${H * 0.74}`} stroke="#4b3927" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d={`M ${W * x} ${H * 0.9} C ${W * (x - 0.02)} ${H * 0.85}, ${W * (x - 0.04)} ${H * 0.81}, ${W * (x - 0.05)} ${H * 0.76}`} stroke="#5f4c32" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.9" />
        </g>
      ))}

      {[0.12, 0.29, 0.46, 0.63, 0.82].map((x, index) => (
        <g key={`fern-${index}`} opacity="0.9">
          <path d={`M ${W * x} ${H * 0.92} C ${W * (x - 0.01)} ${H * 0.84}, ${W * (x - 0.02)} ${H * 0.78}, ${W * (x - 0.03)} ${H * 0.72}`} stroke="#24563c" strokeWidth="4" strokeLinecap="round" fill="none" />
          {[-0.03, -0.015, 0.015, 0.03].map((offset) => (
            <path key={`${x}-${offset}`} d={`M ${W * x} ${H * 0.84} C ${W * (x + offset)} ${H * 0.81}, ${W * (x + offset * 1.2)} ${H * 0.77}, ${W * (x + offset * 1.35)} ${H * 0.73}`} stroke="#48a86d" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          ))}
        </g>
      ))}

      {[0.16, 0.4, 0.66, 0.9].map((x, index) => (
        <g key={`mushroom-${index}`} transform={`translate(${W * x}, ${H * (0.87 - (index % 2) * 0.05)})`}>
          <ellipse cx="0" cy="0" rx="18" ry="10" fill={index % 2 === 0 ? '#8b5cf6' : '#38bdf8'} opacity="0.22" filter="url(#ftBlurTiny)" />
          <path d="M -12 0 C -11 -10, -4 -16, 0 -16 C 6 -16, 11 -10, 12 0 Z" fill={index % 2 === 0 ? '#a78bfa' : '#7dd3fc'} />
          <rect x="-2.5" y="0" width="5" height="12" rx="2.5" fill="#f5f5dc" />
          <circle cx="-5" cy="-7" r="1.5" fill="#fff" opacity="0.9" />
          <circle cx="2" cy="-10" r="1.4" fill="#fff" opacity="0.9" />
          <circle cx="7" cy="-5" r="1.2" fill="#fff" opacity="0.9" />
        </g>
      ))}

      {[0.14, 0.24, 0.36, 0.52, 0.68, 0.8].map((x, index) => (
        <ellipse key={`stone-${index}`} cx={W * x} cy={H * (0.82 - (index % 3) * 0.035)} rx={16 + (index % 2) * 6} ry={10 + (index % 3) * 2} fill={index % 2 === 0 ? '#556c5c' : '#64796a'} opacity="0.7" />
      ))}

      {glowDots.map(([x, y, r, color, dur], index) => (
        <g key={`glow-${index}`} transform={`translate(${W * x}, ${H * y})`}>
          <circle r={r * 2.2} fill={color} opacity="0.12" filter="url(#ftBlurTiny)">
            <animate attributeName="opacity" values="0.08;0.18;0.08" dur={dur} repeatCount="indefinite" />
          </circle>
          <circle r={r} fill={color}>
            <animate attributeName="opacity" values="0.6;1;0.6" dur={dur} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {[0.22, 0.43, 0.59, 0.76].map((x, index) => (
        <g key={`sparkle-${index}`} transform={`translate(${W * x}, ${H * (0.24 + index * 0.13)})`}>
          <path d="M 0 -8 L 0 8 M -8 0 L 8 0" stroke="#fef3c7" strokeWidth="1.4" opacity="0.78">
            <animate attributeName="opacity" values="0.35;0.95;0.35" dur={`${2.2 + index * 0.5}s`} repeatCount="indefinite" />
          </path>
        </g>
      ))}

      {Array.from({ length: rows + 1 }, (_, row) => (
        <line key={`grid-h-${row}`} x1="0" y1={row * cellH} x2={W} y2={row * cellH} stroke="#d9f99d" strokeOpacity="0.08" />
      ))}
      {Array.from({ length: cols + 1 }, (_, col) => (
        <line key={`grid-v-${col}`} x1={col * cellW} y1="0" x2={col * cellW} y2={H} stroke="#7dd3fc" strokeOpacity="0.06" />
      ))}
    </svg>
  )
}
