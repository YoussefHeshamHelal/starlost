export default function ForestTrailBackground({ width, height, cols, rows }) {
  const W = width
  const H = height
  const cellW = W / cols
  const cellH = H / rows

  const backTrunks = [
    [0.06, 0.12, 0.028, '#10271d', 0.54],
    [0.18, 0.04, 0.022, '#153323', 0.48],
    [0.32, 0.09, 0.03, '#0f261d', 0.5],
    [0.48, 0.02, 0.025, '#173923', 0.45],
    [0.64, 0.1, 0.032, '#10281d', 0.52],
    [0.82, 0.05, 0.024, '#173622', 0.46],
    [0.94, 0.13, 0.028, '#0e231b', 0.54],
  ]

  const canopyClusters = [
    [0.08, 0.1, 0.2, 0.11, '#17452f'],
    [0.24, 0.08, 0.22, 0.13, '#1f5b38'],
    [0.42, 0.11, 0.24, 0.12, '#24683f'],
    [0.62, 0.07, 0.23, 0.13, '#1b5235'],
    [0.82, 0.12, 0.24, 0.12, '#2b7044'],
    [0.96, 0.08, 0.2, 0.11, '#173f2d'],
  ]

  const roots = [
    [0.08, 0.9, 0.18, 0.78],
    [0.22, 0.88, 0.34, 0.73],
    [0.42, 0.93, 0.52, 0.76],
    [0.64, 0.9, 0.75, 0.72],
    [0.83, 0.91, 0.94, 0.76],
  ]

  const ferns = [
    [0.11, 0.88, 1.05],
    [0.27, 0.82, 0.88],
    [0.41, 0.9, 0.98],
    [0.58, 0.84, 0.9],
    [0.76, 0.89, 1],
    [0.91, 0.82, 0.82],
  ]

  const leafLitter = [
    [0.08, 0.78, '#9aa848'], [0.15, 0.88, '#d49b3f'], [0.25, 0.72, '#6ea64e'],
    [0.33, 0.86, '#b86b38'], [0.44, 0.76, '#8fb34d'], [0.52, 0.91, '#d6a64b'],
    [0.61, 0.8, '#5f9f52'], [0.7, 0.9, '#a46b37'], [0.82, 0.75, '#b8b94a'],
    [0.93, 0.86, '#739e45'], [0.18, 0.66, '#94633b'], [0.72, 0.66, '#d0a24c'],
  ]

  const glowDots = [
    [0.12, 0.28, 5, '#b8ffcf', '4.2s'],
    [0.2, 0.64, 3, '#7dd3fc', '3.4s'],
    [0.34, 0.18, 4, '#d8b4fe', '3.8s'],
    [0.48, 0.72, 3, '#fde68a', '2.9s'],
    [0.62, 0.26, 4, '#86efac', '4.6s'],
    [0.74, 0.58, 3, '#c4b5fd', '3.3s'],
    [0.86, 0.24, 5, '#bef264', '4.8s'],
    [0.9, 0.72, 4, '#7dd3fc', '3.1s'],
  ]

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="ftSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#082019" />
          <stop offset="36%" stopColor="#174533" />
          <stop offset="68%" stopColor="#1f4b31" />
          <stop offset="100%" stopColor="#213920" />
        </linearGradient>
        <linearGradient id="ftForestFloor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2b4a29" />
          <stop offset="45%" stopColor="#314525" />
          <stop offset="100%" stopColor="#1c2b1d" />
        </linearGradient>
        <linearGradient id="ftMist" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d9f99d" stopOpacity="0.1" />
          <stop offset="45%" stopColor="#dcfce7" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="ftCanopyGlow" cx="50%" cy="18%" r="76%">
          <stop offset="0%" stopColor="#fff7c2" stopOpacity="0.24" />
          <stop offset="38%" stopColor="#a7f3d0" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ftGroundGlow" cx="50%" cy="76%" r="66%">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.18" />
          <stop offset="48%" stopColor="#4ade80" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <pattern id="ftMossSpeckles" width="34" height="30" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="6" r="1.2" fill="#7fb95b" opacity="0.34" />
          <circle cx="20" cy="9" r="1.5" fill="#a3c65a" opacity="0.24" />
          <circle cx="30" cy="22" r="1" fill="#4f8a43" opacity="0.42" />
          <path d="M8 22 Q13 18 18 23" stroke="#5f8f45" strokeWidth="1.2" fill="none" opacity="0.28" />
        </pattern>
        <filter id="ftBlurSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="ftBlurTiny" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="ftTexture" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022 0.035" numOctaves="3" seed="8" />
          <feColorMatrix type="saturate" values="0.35" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.12" />
          </feComponentTransfer>
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#ftSky)" />
      <rect y={H * 0.44} width={W} height={H * 0.56} fill="url(#ftForestFloor)" />
      <rect width={W} height={H} fill="url(#ftCanopyGlow)" />
      <rect width={W} height={H} fill="url(#ftGroundGlow)" />
      <rect width={W} height={H} filter="url(#ftTexture)" opacity="0.35" />
      <rect y={H * 0.48} width={W} height={H * 0.52} fill="url(#ftMossSpeckles)" opacity="0.58" />

      {[0.1, 0.32, 0.55, 0.78].map((x, index) => (
        <ellipse key={`mist-${index}`} cx={W * x} cy={H * (0.2 + index * 0.15)} rx={W * 0.3} ry={H * 0.095} fill="url(#ftMist)" filter="url(#ftBlurSoft)" opacity={0.52 - index * 0.06} />
      ))}

      <g opacity="0.52">
        {backTrunks.map(([x, y, trunkW, color, opacity], index) => (
          <path
            key={`tree-back-${index}`}
            d={`M ${W * (x - trunkW)} ${H}
                C ${W * (x - trunkW * 0.64)} ${H * 0.72}, ${W * (x - trunkW * 0.35)} ${H * 0.38}, ${W * (x - trunkW * 0.2)} ${H * y}
                L ${W * (x + trunkW * 0.22)} ${H * y}
                C ${W * (x + trunkW * 0.34)} ${H * 0.38}, ${W * (x + trunkW * 0.64)} ${H * 0.72}, ${W * (x + trunkW)} ${H}
                Z`}
            fill={color}
            opacity={opacity}
          />
        ))}
      </g>

      <g opacity="0.9">
        {canopyClusters.map(([x, y, rx, ry, color], index) => (
          <g key={`canopy-${index}`}>
            <ellipse cx={W * x} cy={H * y} rx={W * rx} ry={H * ry} fill={color} opacity="0.86" />
            <ellipse cx={W * (x + 0.05)} cy={H * (y + 0.06)} rx={W * rx * 0.68} ry={H * ry * 0.7} fill="#2e7a49" opacity="0.68" />
            <ellipse cx={W * (x - 0.06)} cy={H * (y + 0.07)} rx={W * rx * 0.62} ry={H * ry * 0.66} fill="#3f8b52" opacity="0.54" />
          </g>
        ))}
      </g>

      {[0.12, 0.31, 0.5, 0.69, 0.86].map((x, index) => (
        <path
          key={`light-${index}`}
          d={`M ${W * (x - 0.04)} 0 L ${W * (x + 0.018)} 0 L ${W * (x + 0.12)} ${H} L ${W * (x + 0.02)} ${H} Z`}
          fill="#fef3c7"
          opacity={0.07 + index * 0.006}
        />
      ))}

      {roots.map(([x1, y1, x2, y2], index) => (
        <g key={`root-${index}`} opacity="0.46">
          <path d={`M ${W * x1} ${H * y1} C ${W * (x1 + 0.035)} ${H * (y1 - 0.08)}, ${W * (x2 - 0.05)} ${H * (y2 + 0.06)}, ${W * x2} ${H * y2}`} stroke="#3d2f20" strokeWidth={Math.max(3, cellW * 0.05)} strokeLinecap="round" fill="none" />
          <path d={`M ${W * x1} ${H * y1} C ${W * (x1 - 0.02)} ${H * (y1 - 0.04)}, ${W * (x1 - 0.04)} ${H * (y1 - 0.08)}, ${W * (x1 - 0.06)} ${H * (y1 - 0.12)}`} stroke="#5b472e" strokeWidth={Math.max(2, cellW * 0.026)} strokeLinecap="round" fill="none" opacity="0.9" />
        </g>
      ))}

      {ferns.map(([x, y, scale], index) => (
        <g key={`fern-${index}`} transform={`translate(${W * x}, ${H * y}) scale(${scale})`} opacity="0.9">
          <path d={`M 0 ${H * 0.06} C ${-cellW * 0.04} ${H * 0.01}, ${-cellW * 0.05} ${-H * 0.05}, ${-cellW * 0.07} ${-H * 0.12}`} stroke="#1f5137" strokeWidth="4" strokeLinecap="round" fill="none" />
          {[-0.08, -0.045, -0.012, 0.026, 0.06].map((offset) => (
            <path key={`${x}-${offset}`} d={`M ${-cellW * 0.03} ${-H * 0.035} C ${W * offset} ${-H * 0.05}, ${W * offset * 0.9} ${-H * 0.1}, ${W * offset * 1.18} ${-H * 0.13}`} stroke="#5fc378" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.9" />
          ))}
        </g>
      ))}

      {leafLitter.map(([x, y, color], index) => (
        <ellipse key={`leaf-${index}`} cx={W * x} cy={H * y} rx={cellW * 0.055} ry={cellH * 0.024} fill={color} opacity="0.48" transform={`rotate(${index * 31} ${W * x} ${H * y})`} />
      ))}

      {[0.16, 0.39, 0.67, 0.9].map((x, index) => (
        <g key={`mushroom-${index}`} transform={`translate(${W * x}, ${H * (0.86 - (index % 2) * 0.045)})`}>
          <ellipse cx="0" cy="0" rx="18" ry="10" fill={index % 2 === 0 ? '#8b5cf6' : '#38bdf8'} opacity="0.2" filter="url(#ftBlurTiny)" />
          <path d="M -12 0 C -11 -10, -4 -16, 0 -16 C 6 -16, 11 -10, 12 0 Z" fill={index % 2 === 0 ? '#a78bfa' : '#7dd3fc'} />
          <rect x="-2.5" y="0" width="5" height="12" rx="2.5" fill="#ece8c9" />
          <circle cx="-5" cy="-7" r="1.5" fill="#fff" opacity="0.9" />
          <circle cx="2" cy="-10" r="1.4" fill="#fff" opacity="0.9" />
          <circle cx="7" cy="-5" r="1.2" fill="#fff" opacity="0.9" />
        </g>
      ))}

      {glowDots.map(([x, y, r, color, dur], index) => (
        <g key={`glow-${index}`} transform={`translate(${W * x}, ${H * y})`}>
          <circle r={r * 2.2} fill={color} opacity="0.12" filter="url(#ftBlurTiny)">
            <animate attributeName="opacity" values="0.06;0.18;0.06" dur={dur} repeatCount="indefinite" />
          </circle>
          <circle r={r} fill={color}>
            <animate attributeName="opacity" values="0.55;1;0.55" dur={dur} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {Array.from({ length: rows + 1 }, (_, row) => (
        <line key={`grid-h-${row}`} x1="0" y1={row * cellH} x2={W} y2={row * cellH} stroke="#d9f99d" strokeOpacity="0.09" />
      ))}
      {Array.from({ length: cols + 1 }, (_, col) => (
        <line key={`grid-v-${col}`} x1={col * cellW} y1="0" x2={col * cellW} y2={H} stroke="#7dd3fc" strokeOpacity="0.065" />
      ))}
    </svg>
  )
}
