export default function RepairSiteBackground({ width, height, cols, rows }) {
  const W = width
  const H = height
  const cellW = W / cols
  const cellH = H / rows

  const workLights = [
    [0.16, 0.58, 0.58],
    [0.3, 0.44, 0.44],
    [0.43, 0.64, 0.56],
    [0.58, 0.4, 0.52],
    [0.72, 0.62, 0.48],
    [0.86, 0.46, 0.58],
  ]

  const panelMarks = [
    [0.05, 0.33, 0.2, 0.16, 'M8 10 H54 M12 32 H44'],
    [0.75, 0.34, 0.19, 0.16, 'M10 14 H50 M18 32 H58'],
    [0.08, 0.73, 0.22, 0.16, 'M10 12 H62 M18 34 H48'],
    [0.69, 0.72, 0.23, 0.16, 'M14 14 H66 M8 34 H50'],
  ]

  const serviceLights = [
    [0.13, 0.16, '#38bdf8', '2.4s'],
    [0.89, 0.24, '#a78bfa', '3.2s'],
    [0.08, 0.38, '#2dd4bf', '2.7s'],
    [0.74, 0.12, '#fbbf24', '2.1s'],
  ]

  const floorSeams = Array.from({ length: 7 }, (_, index) => index / 6)
  const cableRuns = [
    [0.03, 0.6, 0.22, 0.7, 0.44, 0.62],
    [0.58, 0.71, 0.76, 0.6, 0.97, 0.67],
    [0.17, 0.88, 0.38, 0.8, 0.56, 0.88],
    [0.02, 0.42, 0.2, 0.36, 0.36, 0.44],
  ]
  const deckPanels = [
    [0.28, 0.38, 0.16, 0.11],
    [0.48, 0.36, 0.18, 0.12],
    [0.35, 0.55, 0.17, 0.11],
    [0.56, 0.56, 0.18, 0.1],
    [0.31, 0.77, 0.16, 0.09],
    [0.5, 0.78, 0.18, 0.09],
  ]

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="rsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06131f" />
          <stop offset="36%" stopColor="#102639" />
          <stop offset="70%" stopColor="#172430" />
          <stop offset="100%" stopColor="#0b121a" />
        </linearGradient>
        <linearGradient id="rsHorizonGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="30%" stopColor="#38bdf8" stopOpacity="0.2" />
          <stop offset="52%" stopColor="#fbbf24" stopOpacity="0.18" />
          <stop offset="72%" stopColor="#a78bfa" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rsFloor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c8d99" />
          <stop offset="30%" stopColor="#485a67" />
          <stop offset="68%" stopColor="#22313d" />
          <stop offset="100%" stopColor="#0a121b" />
        </linearGradient>
        <linearGradient id="rsPanel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8da0ad" stopOpacity="0.62" />
          <stop offset="38%" stopColor="#4c6375" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#101a24" stopOpacity="0.46" />
        </linearGradient>
        <linearGradient id="rsPanelEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#020617" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="rsServiceGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="28%" stopColor="#67e8f9" stopOpacity="0.36" />
          <stop offset="68%" stopColor="#fbbf24" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rsShipHull" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9fb6c8" stopOpacity="0.58" />
          <stop offset="38%" stopColor="#4d6377" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#162230" stopOpacity="0.52" />
        </linearGradient>
        <linearGradient id="rsGantry" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ea4b6" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#314353" stopOpacity="0.44" />
        </linearGradient>
        <radialGradient id="rsCenterGlow" cx="50%" cy="50%" r="58%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.23" />
          <stop offset="42%" stopColor="#38bdf8" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rsWelderGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.95" />
          <stop offset="32%" stopColor="#fbbf24" stopOpacity="0.64" />
          <stop offset="78%" stopColor="#38bdf8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rsLampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.88" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <pattern id="rsMetalTexture" width="42" height="36" patternUnits="userSpaceOnUse">
          <path d="M0 35 L42 1" stroke="#dbeafe" strokeOpacity="0.035" />
          <path d="M0 8 H42 M12 0 V36" stroke="#020617" strokeOpacity="0.055" />
          <circle cx="8" cy="8" r="1.2" fill="#dbeafe" opacity="0.11" />
          <circle cx="31" cy="25" r="1" fill="#020617" opacity="0.2" />
        </pattern>
        <filter id="rsSoftBlur" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="rsFineShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#020617" floodOpacity="0.26" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#rsSky)" />
      <rect y={H * 0.15} width={W} height={H * 0.22} fill="url(#rsHorizonGlow)" opacity="0.78" />

      <g opacity="0.42">
        <path d={`M${W * 0.04} ${H * 0.29} H${W * 0.96}`} stroke="#93a8b7" strokeWidth="5" strokeLinecap="round" />
        <path d={`M${W * 0.08} ${H * 0.29} V${H * 0.08} M${W * 0.92} ${H * 0.29} V${H * 0.08}`} stroke="url(#rsGantry)" strokeWidth="6" strokeLinecap="round" />
        <path d={`M${W * 0.08} ${H * 0.1} L${W * 0.18} ${H * 0.29} M${W * 0.2} ${H * 0.1} L${W * 0.31} ${H * 0.29} M${W * 0.8} ${H * 0.1} L${W * 0.68} ${H * 0.29} M${W * 0.92} ${H * 0.1} L${W * 0.82} ${H * 0.29}`} stroke="#dbeafe" strokeOpacity="0.2" strokeWidth="2" />
        <path d={`M${W * 0.21} ${H * 0.16} H${W * 0.78}`} stroke="#38bdf8" strokeOpacity="0.22" strokeWidth="2" strokeDasharray="10 8" />
        <path d={`M${W * 0.13} ${H * 0.24} C${W * 0.32} ${H * 0.08} ${W * 0.68} ${H * 0.08} ${W * 0.87} ${H * 0.24}`} fill="none" stroke="#6f879b" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      <g opacity="0.32">
        <path d={`M${W * 0.28} ${H * 0.24} C${W * 0.38} ${H * 0.14} ${W * 0.6} ${H * 0.14} ${W * 0.72} ${H * 0.24} L${W * 0.66} ${H * 0.32} C${W * 0.56} ${H * 0.28} ${W * 0.44} ${H * 0.28} ${W * 0.34} ${H * 0.32} Z`} fill="url(#rsShipHull)" stroke="#dbeafe" strokeOpacity="0.22" strokeWidth="2" />
        <path d={`M${W * 0.4} ${H * 0.22} H${W * 0.6} M${W * 0.37} ${H * 0.28} H${W * 0.63}`} stroke="#020617" strokeOpacity="0.28" strokeWidth="3" />
        <circle cx={W * 0.36} cy={H * 0.27} r="7" fill="#38bdf8" opacity="0.2" />
        <circle cx={W * 0.65} cy={H * 0.25} r="5" fill="#fbbf24" opacity="0.24" />
      </g>

      <g opacity="0.48">
        <path d={`M${W * 0.16} ${H * 0.32} C${W * 0.21} ${H * 0.23} ${W * 0.28} ${H * 0.21} ${W * 0.36} ${H * 0.26}`} fill="none" stroke="#9fb4c5" strokeWidth="5" strokeLinecap="round" />
        <path d={`M${W * 0.84} ${H * 0.31} C${W * 0.79} ${H * 0.23} ${W * 0.72} ${H * 0.21} ${W * 0.64} ${H * 0.26}`} fill="none" stroke="#899fb2" strokeWidth="5" strokeLinecap="round" />
        <circle cx={W * 0.36} cy={H * 0.26} r="5" fill="#dbeafe" opacity="0.56" />
        <circle cx={W * 0.64} cy={H * 0.26} r="5" fill="#dbeafe" opacity="0.46" />
      </g>

      <rect y={H * 0.24} width={W} height={H * 0.76} fill="url(#rsFloor)" />
      <rect y={H * 0.24} width={W} height={H * 0.76} fill="url(#rsMetalTexture)" opacity="0.92" />
      <rect width={W} height={H} fill="url(#rsCenterGlow)" />

      <g opacity="0.38">
        {floorSeams.map((value, index) => (
          <path
            key={`floor-perspective-${index}`}
            d={`M${W * value} ${H} L${W * (0.5 + (value - 0.5) * 0.44)} ${H * 0.24}`}
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

      <g opacity="0.5" filter="url(#rsFineShadow)">
        <path
          d={`M${W * 0.27} ${H * 0.37} H${W * 0.72} L${W * 0.78} ${H * 0.83} H${W * 0.2} Z`}
          fill="#101a24"
          opacity="0.28"
        />
        {deckPanels.map(([x, y, w, h], index) => (
          <g key={`deck-panel-${index}`}>
            <path
              d={`M${W * x} ${H * y} H${W * (x + w)} L${W * (x + w + 0.035)} ${H * (y + h)} H${W * (x - 0.025)} Z`}
              fill={index % 2 === 0 ? '#465c6c' : '#2a3c4a'}
              opacity="0.55"
              stroke="#dbeafe"
              strokeOpacity="0.13"
              strokeWidth="1.2"
            />
            <path
              d={`M${W * (x + 0.02)} ${H * (y + h * 0.48)} H${W * (x + w - 0.02)}`}
              stroke="#020617"
              strokeOpacity="0.24"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>

      <g opacity="0.46">
        <rect x={W * 0.33} y={H * 0.44} width={W * 0.13} height={H * 0.06} rx="5" fill="#101a24" stroke="#67e8f9" strokeOpacity="0.22" />
        <rect x={W * 0.53} y={H * 0.68} width={W * 0.14} height={H * 0.055} rx="5" fill="#101a24" stroke="#fbbf24" strokeOpacity="0.2" />
        <path d={`M${W * 0.35} ${H * 0.47} H${W * 0.44} M${W * 0.55} ${H * 0.705} H${W * 0.65}`} stroke="#e0f2fe" strokeOpacity="0.24" strokeWidth="1.4" />
      </g>

      <g opacity="0.42">
        <path d={`M${W * 0.18} ${H * 0.38} L${W * 0.27} ${H * 0.34} M${W * 0.73} ${H * 0.36} L${W * 0.86} ${H * 0.42}`} stroke="url(#rsServiceGlow)" strokeWidth="3.5" strokeLinecap="round" />
        <path d={`M${W * 0.21} ${H * 0.82} C${W * 0.34} ${H * 0.76} ${W * 0.48} ${H * 0.78} ${W * 0.62} ${H * 0.74}`} stroke="url(#rsServiceGlow)" strokeWidth="3" strokeLinecap="round" />
      </g>

      <g opacity="0.34">
        {[0, 1, 2, 3, 4].map((index) => (
          <path
            key={`caution-stripe-${index}`}
            d={`M${W * (0.39 + index * 0.045)} ${H * 0.34} l${W * 0.035} ${H * 0.035}`}
            stroke={index % 2 === 0 ? '#fbbf24' : '#020617'}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ))}
      </g>

      {workLights.map(([x, y, opacity], index) => (
        <g key={`work-light-${index}`}>
          <circle cx={W * x} cy={H * y} r="10" fill="url(#rsLampGlow)" opacity={opacity * 0.22} filter="url(#rsSoftBlur)" />
          <circle cx={W * x} cy={H * y} r="2.8" fill="#e0f2fe" opacity={opacity} />
        </g>
      ))}

      {cableRuns.map(([x1, y1, cx1, cy1, x2, y2], index) => (
        <path
          key={`cable-run-${index}`}
          d={`M${W * x1} ${H * y1} C${W * cx1} ${H * cy1} ${W * (cx1 + x2) * 0.5} ${H * (cy1 + y2) * 0.5} ${W * x2} ${H * y2}`}
          fill="none"
          stroke={index === 1 ? '#67e8f9' : '#020617'}
          strokeOpacity={index === 1 ? 0.26 : 0.36}
          strokeWidth={index === 1 ? 3 : 5}
          strokeLinecap="round"
        />
      ))}

      {panelMarks.map(([x, y, w, h, mark], index) => (
        <g key={`panel-${index}`} filter="url(#rsFineShadow)">
          <rect x={W * x} y={H * y} width={W * w} height={H * h} rx="7" fill="url(#rsPanel)" stroke="#dbeafe" strokeOpacity="0.16" />
          <rect x={W * x + 4} y={H * y + 4} width={W * w - 8} height={H * h - 8} rx="5" fill="none" stroke="url(#rsPanelEdge)" strokeWidth="1.2" opacity="0.65" />
          <path d={mark} transform={`translate(${W * x + 6} ${H * y + 6}) scale(${Math.max(0.68, cellW / 64)})`} stroke="#020617" strokeOpacity="0.28" strokeWidth="2" strokeLinecap="round" />
          <circle cx={W * (x + w - 0.04)} cy={H * (y + 0.04)} r="2" fill="#38bdf8" opacity="0.34" />
        </g>
      ))}

      <g opacity="0.18">
        {[
          [0.16, 0.28, 0.1, 0.04],
          [0.83, 0.3, 0.1, 0.04],
          [0.2, 0.79, 0.12, 0.04],
          [0.78, 0.78, 0.11, 0.04],
        ].map(([x, y, w, h], index) => (
          <g key={`tool-station-${index}`}>
            <rect x={W * x} y={H * y} width={W * w} height={H * h} rx="4" fill="#93a7b5" />
            <rect x={W * (x + 0.01)} y={H * (y - 0.025)} width={W * (w - 0.02)} height={H * 0.025} rx="3" fill="#172535" />
            <path d={`M${W * (x + 0.02)} ${H * (y + h * 0.5)} H${W * (x + w - 0.02)}`} stroke="#67e8f9" strokeOpacity="0.5" />
          </g>
        ))}
      </g>

      <g opacity="0.52">
        <rect x={W * 0.03} y={H * 0.27} width={W * 0.12} height={H * 0.08} rx="6" fill="#162536" stroke="#dbeafe" strokeOpacity="0.16" />
        <rect x={W * 0.84} y={H * 0.29} width={W * 0.12} height={H * 0.08} rx="6" fill="#162536" stroke="#dbeafe" strokeOpacity="0.16" />
        <path d={`M${W * 0.06} ${H * 0.31} H${W * 0.12} M${W * 0.87} ${H * 0.33} H${W * 0.93}`} stroke="#67e8f9" strokeOpacity="0.46" strokeWidth="2" />
      </g>

      <g opacity="0.7">
        <circle cx={W * 0.68} cy={H * 0.24} r="24" fill="url(#rsWelderGlow)" opacity="0.25" filter="url(#rsSoftBlur)">
          <animate attributeName="opacity" values="0.12;0.42;0.18;0.5;0.12" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={W * 0.68} cy={H * 0.24} r="2.8" fill="#fef3c7">
          <animate attributeName="opacity" values="0.35;1;0.45;0.9;0.35" dur="1.4s" repeatCount="indefinite" />
        </circle>
        {[0, 1, 2, 3, 4].map((index) => (
          <path
            key={`spark-${index}`}
            d={`M${W * 0.68} ${H * 0.24} l${(index - 2) * 5} ${8 + index * 2}`}
            stroke="#fef3c7"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.55"
          >
            <animate attributeName="opacity" values="0;0.85;0" dur={`${0.8 + index * 0.16}s`} repeatCount="indefinite" />
          </path>
        ))}
      </g>

      {serviceLights.map(([x, y, color, dur], index) => (
        <g key={`service-light-${index}`}>
          <circle cx={W * x} cy={H * y} r="15" fill={color} opacity="0.15" filter="url(#rsSoftBlur)">
            <animate attributeName="opacity" values="0.07;0.24;0.07" dur={dur} repeatCount="indefinite" />
          </circle>
          <circle cx={W * x} cy={H * y} r="3.2" fill={color}>
            <animate attributeName="opacity" values="0.45;1;0.45" dur={dur} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      <g opacity="0.44">
        {Array.from({ length: rows + 1 }, (_, row) => (
          <line key={`grid-h-${row}`} x1="0" y1={row * cellH} x2={W} y2={row * cellH} stroke="#e0f2fe" strokeOpacity="0.23" strokeWidth="1.25" />
        ))}
        {Array.from({ length: cols + 1 }, (_, col) => (
          <line key={`grid-v-${col}`} x1={col * cellW} y1="0" x2={col * cellW} y2={H} stroke="#bae6fd" strokeOpacity="0.21" strokeWidth="1.25" />
        ))}
      </g>

      <g opacity="0.45">
        <circle cx={W * 0.39} cy={H * 0.47} r="12" fill="url(#rsWelderGlow)" opacity="0.36" />
        <circle cx={W * 0.6} cy={H * 0.7} r="10" fill="url(#rsLampGlow)" opacity="0.34" />
      </g>

      <rect width={W} height={H} fill="#020617" opacity="0.13" />
      <rect width={W} height={H} fill="none" stroke="#e0f2fe" strokeOpacity="0.08" />
    </svg>
  )
}
