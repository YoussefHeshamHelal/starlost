export default function LaunchSiteBackground({ width, height, cols, rows }) {
  const W = width
  const H = height
  const cellW = W / cols
  const cellH = H / rows

  const runwayLights = [
    [0.18, 0.52, 0.7],
    [0.28, 0.52, 0.52],
    [0.38, 0.52, 0.7],
    [0.62, 0.52, 0.7],
    [0.72, 0.52, 0.52],
    [0.82, 0.52, 0.7],
  ]

  const panelMarks = [
    [0.05, 0.3, 0.22, 0.18, 'M8 10 H54 M12 32 H44'],
    [0.72, 0.24, 0.22, 0.18, 'M10 14 H50 M18 32 H58'],
    [0.1, 0.7, 0.24, 0.18, 'M10 12 H62 M18 34 H48'],
    [0.66, 0.7, 0.26, 0.17, 'M14 14 H66 M8 34 H50'],
  ]

  const towerLights = [
    [0.13, 0.14, '#38bdf8', '2.4s'],
    [0.91, 0.28, '#a78bfa', '3.2s'],
    [0.06, 0.36, '#2dd4bf', '2.7s'],
  ]

  const floorSeams = Array.from({ length: 7 }, (_, index) => index / 6)

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="lsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#071927" />
          <stop offset="34%" stopColor="#102b42" />
          <stop offset="70%" stopColor="#1a2b39" />
          <stop offset="100%" stopColor="#101923" />
        </linearGradient>
        <linearGradient id="lsHorizonGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="34%" stopColor="#38bdf8" stopOpacity="0.18" />
          <stop offset="52%" stopColor="#fef3c7" stopOpacity="0.16" />
          <stop offset="72%" stopColor="#a78bfa" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lsPad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#66798a" />
          <stop offset="28%" stopColor="#415465" />
          <stop offset="66%" stopColor="#20303d" />
          <stop offset="100%" stopColor="#0c141d" />
        </linearGradient>
        <linearGradient id="lsPanel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8da0ad" stopOpacity="0.62" />
          <stop offset="38%" stopColor="#4c6375" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#101a24" stopOpacity="0.46" />
        </linearGradient>
        <linearGradient id="lsPanelEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#020617" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="lsRunway" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="45%" stopColor="#67e8f9" stopOpacity="0.72" />
          <stop offset="55%" stopColor="#fef3c7" stopOpacity="0.66" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lsCenterGlow" cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.23" />
          <stop offset="42%" stopColor="#38bdf8" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lsBeaconGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
          <stop offset="42%" stopColor="#38bdf8" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lsLampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.88" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <pattern id="lsMetalTexture" width="42" height="36" patternUnits="userSpaceOnUse">
          <path d="M0 35 L42 1" stroke="#dbeafe" strokeOpacity="0.035" />
          <path d="M0 8 H42 M12 0 V36" stroke="#020617" strokeOpacity="0.055" />
          <circle cx="8" cy="8" r="1.2" fill="#dbeafe" opacity="0.11" />
          <circle cx="31" cy="25" r="1" fill="#020617" opacity="0.2" />
        </pattern>
        <filter id="lsSoftBlur" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="lsFineShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#020617" floodOpacity="0.26" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#lsSky)" />
      <rect y={H * 0.18} width={W} height={H * 0.18} fill="url(#lsHorizonGlow)" opacity="0.72" />

      <g opacity="0.46">
        <path d={`M${W * 0.06} ${H * 0.28} L${W * 0.14} ${H * 0.04} L${W * 0.22} ${H * 0.28}`} fill="none" stroke="#91a8b8" strokeWidth="4.5" strokeLinecap="round" />
        <path d={`M${W * 0.1} ${H * 0.23} H${W * 0.19} M${W * 0.11} ${H * 0.17} H${W * 0.18}`} stroke="#dbeafe" strokeOpacity="0.24" strokeWidth="2" />
        <path d={`M${W * 0.78} ${H * 0.27} L${W * 0.88} ${H * 0.03} L${W * 0.96} ${H * 0.27}`} fill="none" stroke="#849cae" strokeWidth="4.5" strokeLinecap="round" />
        <path d={`M${W * 0.82} ${H * 0.19} H${W * 0.92} M${W * 0.83} ${H * 0.13} H${W * 0.91}`} stroke="#dbeafe" strokeOpacity="0.22" strokeWidth="2" />
        <path d={`M${W * 0.62} ${H * 0.22} L${W * 0.72} ${H * 0.05} L${W * 0.79} ${H * 0.22}`} fill="none" stroke="#6f879b" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx={W * 0.72} cy={H * 0.05} r="4.4" fill="#38bdf8" opacity="0.72" />
      </g>

      <rect y={H * 0.21} width={W} height={H * 0.79} fill="url(#lsPad)" />
      <rect y={H * 0.21} width={W} height={H * 0.79} fill="url(#lsMetalTexture)" opacity="0.9" />
      <rect width={W} height={H} fill="url(#lsCenterGlow)" />

      <g opacity="0.5">
        {floorSeams.map((value, index) => (
          <path
            key={`floor-perspective-${index}`}
            d={`M${W * value} ${H} L${W * (0.5 + (value - 0.5) * 0.42)} ${H * 0.2}`}
            stroke={index % 2 === 0 ? '#e0f2fe' : '#020617'}
            strokeOpacity={index % 2 === 0 ? 0.12 : 0.18}
          />
        ))}
        {[0.32, 0.48, 0.64, 0.8].map((y, index) => (
          <path
            key={`floor-cross-${index}`}
            d={`M${W * 0.02} ${H * y} C${W * 0.26} ${H * (y - 0.03)} ${W * 0.74} ${H * (y - 0.03)} ${W * 0.98} ${H * y}`}
            stroke={index % 2 === 0 ? '#e0f2fe' : '#020617'}
            strokeOpacity={index % 2 === 0 ? 0.13 : 0.15}
          />
        ))}
      </g>

      <ellipse cx={W * 0.5} cy={H * 0.5} rx={W * 0.36} ry={H * 0.21} fill="#020617" opacity="0.14" />
      <ellipse cx={W * 0.5} cy={H * 0.49} rx={W * 0.34} ry={H * 0.2} fill="none" stroke="#dbeafe" strokeOpacity="0.2" strokeWidth="10" />
      <ellipse cx={W * 0.5} cy={H * 0.49} rx={W * 0.27} ry={H * 0.155} fill="none" stroke="#38bdf8" strokeOpacity="0.28" strokeWidth="2" strokeDasharray="11 10" />
      <ellipse cx={W * 0.5} cy={H * 0.49} rx={W * 0.18} ry={H * 0.1} fill="none" stroke="#fef3c7" strokeOpacity="0.13" strokeWidth="2" />

      <path d={`M${W * 0.1} ${H * 0.52} H${W * 0.9}`} stroke="url(#lsRunway)" strokeWidth="7" strokeLinecap="round" opacity="0.58">
        <animate attributeName="opacity" values="0.38;0.74;0.38" dur="3s" repeatCount="indefinite" />
      </path>
      <path d={`M${W * 0.5} ${H * 0.14} V${H * 0.9}`} stroke="url(#lsRunway)" strokeWidth="4.5" strokeLinecap="round" opacity="0.34">
        <animate attributeName="opacity" values="0.22;0.52;0.22" dur="3.6s" repeatCount="indefinite" />
      </path>

      {runwayLights.map(([x, y, opacity], index) => (
        <g key={`runway-light-${index}`}>
          <circle cx={W * x} cy={H * y} r="10" fill="url(#lsLampGlow)" opacity={opacity * 0.22} filter="url(#lsSoftBlur)" />
          <circle cx={W * x} cy={H * y} r="2.8" fill="#e0f2fe" opacity={opacity} />
        </g>
      ))}

      {panelMarks.map(([x, y, w, h, mark], index) => (
        <g key={`panel-${index}`} filter="url(#lsFineShadow)">
          <rect x={W * x} y={H * y} width={W * w} height={H * h} rx="7" fill="url(#lsPanel)" stroke="#dbeafe" strokeOpacity="0.16" />
          <rect x={W * x + 4} y={H * y + 4} width={W * w - 8} height={H * h - 8} rx="5" fill="none" stroke="url(#lsPanelEdge)" strokeWidth="1.2" opacity="0.65" />
          <path d={mark} transform={`translate(${W * x + 6} ${H * y + 6}) scale(${Math.max(0.68, cellW / 64)})`} stroke="#020617" strokeOpacity="0.28" strokeWidth="2" strokeLinecap="round" />
          <circle cx={W * (x + w - 0.04)} cy={H * (y + 0.04)} r="2" fill="#38bdf8" opacity="0.34" />
        </g>
      ))}

      <g opacity="0.23">
        {[0.18, 0.32, 0.68, 0.82].map((x, index) => (
          <g key={`cargo-zone-${index}`}>
            <rect x={W * x - cellW * 0.38} y={H * (index % 2 === 0 ? 0.79 : 0.29)} width={cellW * 0.76} height={cellH * 0.12} fill="#020617" />
            <rect x={W * x - cellW * 0.3} y={H * (index % 2 === 0 ? 0.755 : 0.255)} width={cellW * 0.6} height={cellH * 0.19} fill="#93a7b5" />
            <path d={`M${W * x - cellW * 0.28} ${H * (index % 2 === 0 ? 0.785 : 0.285)} H${W * x + cellW * 0.28}`} stroke="#020617" strokeOpacity="0.4" />
          </g>
        ))}
      </g>

      {towerLights.map(([x, y, color, dur], index) => (
        <g key={`tower-light-${index}`}>
          <circle cx={W * x} cy={H * y} r="15" fill={color} opacity="0.15" filter="url(#lsSoftBlur)">
            <animate attributeName="opacity" values="0.07;0.24;0.07" dur={dur} repeatCount="indefinite" />
          </circle>
          <circle cx={W * x} cy={H * y} r="3.2" fill={color}>
            <animate attributeName="opacity" values="0.45;1;0.45" dur={dur} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      <g opacity="0.44">
        {Array.from({ length: rows + 1 }, (_, row) => (
          <line key={`grid-h-${row}`} x1="0" y1={row * cellH} x2={W} y2={row * cellH} stroke="#e0f2fe" strokeOpacity="0.18" />
        ))}
        {Array.from({ length: cols + 1 }, (_, col) => (
          <line key={`grid-v-${col}`} x1={col * cellW} y1="0" x2={col * cellW} y2={H} stroke="#bae6fd" strokeOpacity="0.16" />
        ))}
      </g>

      <g opacity="0.58">
        <circle cx={W * 0.5} cy={H * 0.5} r="18" fill="url(#lsBeaconGlow)" />
      </g>

      <rect width={W} height={H} fill="#020617" opacity="0.13" />
      <rect width={W} height={H} fill="none" stroke="#e0f2fe" strokeOpacity="0.08" />
    </svg>
  )
}
