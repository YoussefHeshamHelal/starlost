export default function LaunchSiteBackground({ width, height, cols = 5, rows = 5 }) {
  const W = width
  const H = height
  const tileW = W / cols
  const tileH = H / rows

  const skyStars = [
    [0.06, 0.07, 1.5, 0.72], [0.12, 0.15, 1.0, 0.48], [0.21, 0.09, 1.25, 0.8], [0.31, 0.17, 0.95, 0.44],
    [0.42, 0.06, 1.6, 0.88], [0.5, 0.12, 1.0, 0.56], [0.61, 0.08, 1.3, 0.82], [0.72, 0.16, 0.96, 0.52],
    [0.81, 0.07, 1.36, 0.84], [0.9, 0.13, 1.08, 0.62], [0.96, 0.05, 1.24, 0.7],
  ]

  const guideLights = Array.from({ length: 7 }, (_, index) => index)
  const upperGuideLights = guideLights
  const lowerGuideLights = guideLights
  const ringLightCount = 24
  const ringLights = Array.from({ length: ringLightCount }, (_, index) => index)

  const ringCy = H * 0.5
  const ringRx = W * 0.275
  const ringRy = H * 0.135

  const trailJoinOffset = ringRy * 0.94
  const upperTrailTop = 0
  const upperTrailBottom = ringCy - trailJoinOffset
  const lowerTrailTop = ringCy + trailJoinOffset
  const lowerTrailBottom = H
  const mirrorY = (y) => H - y
  const trailMarkYs = [0.18, 0.36, 0.54, 0.72].map((step) => upperTrailTop + (upperTrailBottom - upperTrailTop) * step)
  const upperGuideYs = [0.16, 0.28, 0.4, 0.52, 0.64, 0.76, 0.88].map((step) => upperTrailTop + (upperTrailBottom - upperTrailTop) * step)

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    >
      <defs>
        <linearGradient id="ls_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#02040a" />
          <stop offset="44%" stopColor="#071628" />
          <stop offset="100%" stopColor="#0d1f33" />
        </linearGradient>

        <radialGradient id="ls_horizonGlow" cx="50%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.22" />
          <stop offset="46%" stopColor="#0ea5e9" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="ls_planetGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.88" />
          <stop offset="55%" stopColor="#dbeafe" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#dbeafe" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="ls_floor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#122033" />
          <stop offset="36%" stopColor="#1d3046" />
          <stop offset="68%" stopColor="#122237" />
          <stop offset="100%" stopColor="#09111d" />
        </linearGradient>

        <linearGradient id="ls_sideWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#07101c" />
          <stop offset="48%" stopColor="#102033" />
          <stop offset="100%" stopColor="#040811" />
        </linearGradient>

        <linearGradient id="ls_trailSurface" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#101a2a" />
          <stop offset="20%" stopColor="#263244" />
          <stop offset="50%" stopColor="#31455d" />
          <stop offset="80%" stopColor="#263244" />
          <stop offset="100%" stopColor="#101a2a" />
        </linearGradient>

        <linearGradient id="ls_trailLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.12" />
        </linearGradient>

        <radialGradient id="ls_ringGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="55%" stopColor="#09111d" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        <linearGradient id="ls_ringMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4e6a87" stopOpacity="0.72" />
          <stop offset="50%" stopColor="#2b3c53" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.82" />
        </linearGradient>

        <radialGradient id="ls_cyanLamp" cx="50%" cy="50%" r="58%">
          <stop offset="0%" stopColor="#effcff" stopOpacity="1" />
          <stop offset="40%" stopColor="#a5f3fc" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="ls_blueStrip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0" />
          <stop offset="50%" stopColor="#ecfeff" stopOpacity="1" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
        </linearGradient>

        <radialGradient id="ls_softOrange" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.14" />
          <stop offset="46%" stopColor="#f59e0b" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>

        <filter id="ls_softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>

        <filter id="ls_shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#020617" floodOpacity="0.44" />
        </filter>

        <pattern id="ls_microGrid" width={tileW * 0.5} height={tileH * 0.5} patternUnits="userSpaceOnUse">
          <path
            d={`M0 0 H${tileW * 0.5} V${tileH * 0.5}`}
            fill="none"
            stroke="#dbeafe"
            strokeOpacity="0.03"
            strokeWidth="1"
          />
          <circle cx={tileW * 0.1} cy={tileH * 0.11} r="1.05" fill="#dbeafe" opacity="0.07" />
        </pattern>
      </defs>

      {/* Sky */}
      <rect width={W} height={H} fill="url(#ls_sky)" />
      <rect width={W} height={H} fill="url(#ls_horizonGlow)" />
      <circle
        cx={W * 0.82}
        cy={H * 0.13}
        r={Math.min(W, H) * 0.06}
        fill="url(#ls_planetGlow)"
        opacity="0.68"
      />

      {skyStars.map(([x, y, r, opacity], index) => (
        <circle key={`star-${index}`} cx={W * x} cy={H * y} r={r} fill="#eff6ff" opacity={opacity}>
          <animate
            attributeName="opacity"
            values={`${opacity * 0.42};${opacity};${opacity * 0.42}`}
            dur={`${2 + index * 0.22}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Base floor */}
      <rect width={W} height={H} fill="url(#ls_floor)" />
      <rect width={W} height={H} fill="url(#ls_microGrid)" />
      <rect width={W} height={H} fill="url(#ls_softOrange)" />

      {/* Side structures */}
      <path d={`M0 0 H${W * 0.2} V${H} H0 Z`} fill="url(#ls_sideWing)" opacity="0.96" />
      <path d={`M${W * 0.8} 0 H${W} V${H} H${W * 0.8} Z`} fill="url(#ls_sideWing)" opacity="0.96" />
      <path d={`M${W * 0.012} 0 H${W * 0.17} L${W * 0.195} ${H} H0 Z`} fill="#030814" opacity="0.28" />
      <path d={`M${W * 0.988} 0 H${W * 0.83} L${W * 0.805} ${H} H${W} Z`} fill="#030814" opacity="0.28" />
      <path d={`M${W * 0.045} ${H * 0.18} L${W * 0.185} ${H * 0.13}`} stroke="#22d3ee" strokeOpacity="0.1" strokeWidth="2" />
      <path d={`M${W * 0.815} ${H * 0.13} L${W * 0.955} ${H * 0.18}`} stroke="#22d3ee" strokeOpacity="0.1" strokeWidth="2" />
      <path d={`M${W * 0.045} ${H * 0.46} L${W * 0.195} ${H * 0.41}`} stroke="#22d3ee" strokeOpacity="0.16" strokeWidth="2" />
      <path d={`M${W * 0.805} ${H * 0.41} L${W * 0.955} ${H * 0.46}`} stroke="#22d3ee" strokeOpacity="0.16" strokeWidth="2" />

      {/* Upper trail - flipped so wider side attaches to circle */}
      <g filter="url(#ls_shadow)">
        <path
          d={`M${W * 0.42} ${upperTrailTop} L${W * 0.58} ${upperTrailTop} L${W * 0.62} ${upperTrailBottom} L${W * 0.38} ${upperTrailBottom} Z`}
          fill="#08131f"
          opacity="0.92"
        />
        <path
          d={`M${W * 0.445} ${upperTrailTop} L${W * 0.555} ${upperTrailTop} L${W * 0.585} ${upperTrailBottom - H * 0.015} L${W * 0.415} ${upperTrailBottom - H * 0.015} Z`}
          fill="url(#ls_trailSurface)"
          stroke="#cbd5e1"
          strokeOpacity="0.12"
          strokeWidth="1.2"
        />
        <path
          d={`M${W * 0.492} ${upperTrailTop + H * 0.015} L${W * 0.508} ${upperTrailTop + H * 0.015} L${W * 0.518} ${upperTrailBottom - H * 0.045} L${W * 0.482} ${upperTrailBottom - H * 0.045} Z`}
          fill="url(#ls_trailLine)"
          opacity="0.72"
        />
        {trailMarkYs.map((y, index) => (
          <rect
            key={`upper-mark-${index}`}
            x={W * (0.49 - index * 0.004)}
            y={y}
            width={W * (0.02 + index * 0.009)}
            height="3"
            rx="1.5"
            fill="#e2e8f0"
            opacity={0.44 - index * 0.06}
          />
        ))}
      </g>

      {/* Center ring */}
      <g filter="url(#ls_shadow)">
        <ellipse cx={W * 0.5} cy={ringCy + H * 0.02} rx={ringRx * 1.08} ry={ringRy * 1.16} fill="#020617" opacity="0.58" />
        <ellipse cx={W * 0.5} cy={ringCy} rx={ringRx * 1.02} ry={ringRy * 1.06} fill="#08111d" stroke="#0b3b4a" strokeOpacity="0.46" strokeWidth="14" />
        <ellipse cx={W * 0.5} cy={ringCy} rx={ringRx} ry={ringRy} fill="url(#ls_ringGlow)" stroke="#60a5fa" strokeOpacity="0.16" strokeWidth="4" />
        <ellipse cx={W * 0.5} cy={ringCy} rx={ringRx * 0.89} ry={ringRy * 0.86} fill="#020617" stroke="url(#ls_ringMetal)" strokeWidth="6" opacity="0.95" />
        <ellipse cx={W * 0.5} cy={ringCy} rx={ringRx * 0.79} ry={ringRy * 0.73} fill="#01030a" opacity="0.95" />
      </g>

      {ringLights.map((index) => {
        const angle = (-90 + index * (360 / ringLightCount)) * (Math.PI / 180)
        const cx = W * 0.5 + Math.cos(angle) * (ringRx * 0.94)
        const cy = ringCy + Math.sin(angle) * (ringRy * 0.98)
        return (
          <ellipse key={`ring-light-${index}`} cx={cx} cy={cy} rx="8" ry="3" fill="url(#ls_cyanLamp)" filter="url(#ls_softGlow)">
            <animate
              attributeName="opacity"
              values="0.18;0.92;0.18"
              dur={`${1.8 + (index % 3) * 0.18}s`}
              begin={`${index * 0.08}s`}
              repeatCount="indefinite"
            />
          </ellipse>
        )
      })}

      {[
        [-0.7, -0.72, 0], [0.7, -0.72, 0],
        [-0.92, -0.42, 0.12], [0.92, -0.42, 0.12],
        [-1.0, -0.05, 0.24], [1.0, -0.05, 0.24],
        [-0.92, 0.32, 0.36], [0.92, 0.32, 0.36],
        [-0.7, 0.62, 0.48], [0.7, 0.62, 0.48],
      ].map(([x, y, delay], index) => (
        <ellipse
          key={`ring-edge-glint-${index}`}
          cx={W * 0.5 + ringRx * x}
          cy={ringCy + ringRy * y}
          rx="13"
          ry="4"
          fill="#eaf8ff"
          opacity="0.22"
          filter="url(#ls_softGlow)"
        >
          <animate
            attributeName="opacity"
            values="0.14;0.28;0.14"
            dur="2.2s"
            begin={`${delay}s`}
            repeatCount="indefinite"
          />
        </ellipse>
      ))}

      {/* Upper trail connection overlay keeps the trail above the ring at the join. */}
      <g filter="url(#ls_shadow)">
        <path
          d={`M${W * 0.392} ${upperTrailBottom - H * 0.09} L${W * 0.608} ${upperTrailBottom - H * 0.09} L${W * 0.62} ${upperTrailBottom} L${W * 0.38} ${upperTrailBottom} Z`}
          fill="#08131f"
          opacity="0.92"
        />
        <path
          d={`M${W * 0.423} ${upperTrailBottom - H * 0.084} L${W * 0.577} ${upperTrailBottom - H * 0.084} L${W * 0.585} ${upperTrailBottom - H * 0.015} L${W * 0.415} ${upperTrailBottom - H * 0.015} Z`}
          fill="url(#ls_trailSurface)"
          stroke="#cbd5e1"
          strokeOpacity="0.12"
          strokeWidth="1.2"
        />
        <path
          d={`M${W * 0.484} ${upperTrailBottom - H * 0.08} L${W * 0.516} ${upperTrailBottom - H * 0.08} L${W * 0.518} ${upperTrailBottom - H * 0.045} L${W * 0.482} ${upperTrailBottom - H * 0.045} Z`}
          fill="url(#ls_trailLine)"
          opacity="0.72"
        />
        <ellipse cx={W * 0.404} cy={upperTrailBottom - H * 0.032} rx="14" ry="4" fill="#eaf8ff" opacity="0.18" filter="url(#ls_softGlow)" />
        <ellipse cx={W * 0.596} cy={upperTrailBottom - H * 0.032} rx="14" ry="4" fill="#eaf8ff" opacity="0.18" filter="url(#ls_softGlow)" />
      </g>

      {/* Lower trail - wider side attached to circle */}
      <g filter="url(#ls_shadow)">
        <path
          d={`M${W * 0.38} ${lowerTrailTop} L${W * 0.62} ${lowerTrailTop} L${W * 0.58} ${lowerTrailBottom} L${W * 0.42} ${lowerTrailBottom} Z`}
          fill="#08131f"
          opacity="0.92"
        />
        <path
          d={`M${W * 0.415} ${lowerTrailTop} L${W * 0.585} ${lowerTrailTop} L${W * 0.555} ${lowerTrailBottom} L${W * 0.445} ${lowerTrailBottom} Z`}
          fill="url(#ls_trailSurface)"
          stroke="#cbd5e1"
          strokeOpacity="0.12"
          strokeWidth="1.2"
        />
        <path
          d={`M${W * 0.482} ${lowerTrailTop + H * 0.015} L${W * 0.518} ${lowerTrailTop + H * 0.015} L${W * 0.508} ${lowerTrailBottom - H * 0.045} L${W * 0.492} ${lowerTrailBottom - H * 0.045} Z`}
          fill="url(#ls_trailLine)"
          opacity="0.72"
        />
        {trailMarkYs.map((upperY, index) => (
          <rect
            key={`lower-mark-${index}`}
            x={W * (0.49 - index * 0.004)}
            y={mirrorY(upperY)}
            width={W * (0.02 + index * 0.009)}
            height="3"
            rx="1.5"
            fill="#e2e8f0"
            opacity={0.44 - index * 0.06}
          />
        ))}
      </g>

      {/* Upper guide lights */}
      {upperGuideLights.map((index) => {
        const y = upperGuideYs[index]
        const leftX = W * (0.455 - index * 0.004)
        const rightX = W * (0.545 + index * 0.004)
        return (
          <g key={`upper-guide-${index}`}>
            <ellipse cx={leftX} cy={y} rx="7" ry="2.4" fill="url(#ls_cyanLamp)" filter="url(#ls_softGlow)">
              <animate attributeName="opacity" values="0.28;0.98;0.28" dur="1.6s" begin={`${index * 0.1}s`} repeatCount="indefinite" />
            </ellipse>
            <ellipse cx={rightX} cy={y} rx="7" ry="2.4" fill="url(#ls_cyanLamp)" filter="url(#ls_softGlow)">
              <animate attributeName="opacity" values="0.28;0.98;0.28" dur="1.6s" begin={`${index * 0.1 + 0.14}s`} repeatCount="indefinite" />
            </ellipse>
          </g>
        )
      })}

      {/* Lower guide lights */}
      {lowerGuideLights.map((index) => {
        const y = mirrorY(upperGuideYs[index])
        const leftX = W * (0.435 + index * 0.004)
        const rightX = W * (0.565 - index * 0.004)
        return (
          <g key={`lower-guide-${index}`}>
            <ellipse cx={leftX} cy={y} rx="7" ry="2.4" fill="url(#ls_cyanLamp)" filter="url(#ls_softGlow)">
              <animate attributeName="opacity" values="0.28;0.98;0.28" dur="1.6s" begin={`${index * 0.1}s`} repeatCount="indefinite" />
            </ellipse>
            <ellipse cx={rightX} cy={y} rx="7" ry="2.4" fill="url(#ls_cyanLamp)" filter="url(#ls_softGlow)">
              <animate attributeName="opacity" values="0.28;0.98;0.28" dur="1.6s" begin={`${index * 0.1 + 0.14}s`} repeatCount="indefinite" />
            </ellipse>
          </g>
        )
      })}

      {/* Grid lines */}
      {Array.from({ length: cols + 1 }, (_, col) => (
        <line key={`v-${col}`} x1={col * tileW} y1={0} x2={col * tileW} y2={H} stroke="#dbeafe" strokeOpacity="0.16" strokeWidth="1.3" />
      ))}
      {Array.from({ length: rows + 1 }, (_, row) => (
        <line key={`h-${row}`} x1="0" y1={row * tileH} x2={W} y2={row * tileH} stroke="#dbeafe" strokeOpacity={row === 0 ? 0 : 0.16} strokeWidth="1.3" />
      ))}

      <rect x={W * 0.1} y={H * 0.05} width={W * 0.8} height="4" rx="2" fill="url(#ls_blueStrip)" opacity="0.25" filter="url(#ls_softGlow)" />
      <rect x={W * 0.1} y={H * 0.93} width={W * 0.8} height="4" rx="2" fill="url(#ls_blueStrip)" opacity="0.32" filter="url(#ls_softGlow)" />

      {[
        [0.08, 0.35], [0.17, 0.5], [0.08, 0.82], [0.22, 0.91],
        [0.78, 0.35], [0.92, 0.48], [0.82, 0.82], [0.94, 0.9],
      ].map(([x, y], index) => (
        <g key={`bolt-${index}`} opacity="0.48">
          <circle cx={W * x} cy={H * y} r="3" fill="#020617" />
          <circle cx={W * x} cy={H * y} r="1.35" fill="#94a3b8" opacity="0.82" />
        </g>
      ))}

      <rect width={W} height={H} fill="none" stroke="#7dd3fc" strokeOpacity="0.16" strokeWidth="2" />
      <rect width={W} height={H} fill="#020617" opacity="0.08" />
    </svg>
  )
}
