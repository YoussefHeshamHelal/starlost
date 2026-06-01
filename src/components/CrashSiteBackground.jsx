// CrashSiteBackground.jsx
// Rich alien crash-site terrain for STARLOST.
// Vivid alien world: ochre/rust soil, dramatic ship wreckage, smouldering fire,
// alien plant life, impact craters, scattered debris, atmospheric haze.
// Designed to be exciting and readable for ages 8-10.

export default function CrashSiteBackground({ width, height, cols, rows }) {
  const tileW = width / cols
  const tileH = height / rows
  const W = width
  const H = height

  return (
    <svg
      width={W} height={H}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: 12 }}
    >
      <defs>
        {/* ── TERRAIN GRADIENTS ── */}
        <linearGradient id="bg_ground" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%"   stopColor="#7a3e1a"/>
          <stop offset="30%"  stopColor="#6a3214"/>
          <stop offset="60%"  stopColor="#5c2a0e"/>
          <stop offset="100%" stopColor="#3e1c08"/>
        </linearGradient>

        {/* Bright alien sun from top-right */}
        <radialGradient id="bg_sun" cx="78%" cy="0%" r="85%">
          <stop offset="0%"   stopColor="#ffb84d" stopOpacity="0.32"/>
          <stop offset="40%"  stopColor="#e07830" stopOpacity="0.16"/>
          <stop offset="100%" stopColor="#7a3800" stopOpacity="0"/>
        </radialGradient>

        {/* Atmospheric haze — pinkish alien sky at the horizon */}
        <linearGradient id="bg_haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#d4607a" stopOpacity="0.14"/>
          <stop offset="40%"  stopColor="#c05040" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#7a3010" stopOpacity="0"/>
        </linearGradient>

        {/* Ship hull — dark gunmetal */}
        <linearGradient id="bg_metal1" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%"   stopColor="#3a5470"/>
          <stop offset="50%"  stopColor="#243848"/>
          <stop offset="100%" stopColor="#121e2c"/>
        </linearGradient>
        <linearGradient id="bg_metal2" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%"   stopColor="#4a6880"/>
          <stop offset="60%"  stopColor="#2a4458"/>
          <stop offset="100%" stopColor="#152030"/>
        </linearGradient>
        {/* Scorched/burnt metal */}
        <linearGradient id="bg_burnt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#8a3a18" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#3e1808" stopOpacity="0"/>
        </linearGradient>

        {/* Glowing fire */}
        <radialGradient id="bg_fire" cx="50%" cy="70%" r="60%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95"/>
          <stop offset="20%"  stopColor="#ffe066" stopOpacity="0.9"/>
          <stop offset="50%"  stopColor="#ff8020" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#cc2200" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="bg_fireGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ff6600" stopOpacity="0.7"/>
          <stop offset="60%"  stopColor="#ff3300" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#990000" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="bg_embers" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffcc44" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#ff4400" stopOpacity="0"/>
        </radialGradient>

        {/* Teal electronics glow */}
        <radialGradient id="bg_teal" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00e5c8" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#00a090" stopOpacity="0"/>
        </radialGradient>

        {/* Purple alien flora glow */}
        <radialGradient id="bg_flora" cx="50%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="#e060ff" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#8020cc" stopOpacity="0"/>
        </radialGradient>
        {/* Green bioluminescent spore */}
        <radialGradient id="bg_spore" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#80ff60" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#20aa00" stopOpacity="0"/>
        </radialGradient>

        {/* Crater shadow */}
        <radialGradient id="bg_crater" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#1a0800" stopOpacity="0.85"/>
          <stop offset="70%"  stopColor="#3a1400" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#5a2800" stopOpacity="0"/>
        </radialGradient>

        {/* Dust plume */}
        <radialGradient id="bg_dust" cx="50%" cy="60%" r="60%">
          <stop offset="0%"   stopColor="#e0a060" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#a06020" stopOpacity="0"/>
        </radialGradient>

        {/* Vignette */}
        <radialGradient id="bg_vignette" cx="50%" cy="50%" r="72%">
          <stop offset="0%"   stopColor="black" stopOpacity="0"/>
          <stop offset="100%" stopColor="black" stopOpacity="0.55"/>
        </radialGradient>

        {/* Soil texture noise — soft blobs */}
        <filter id="bg_softBlur2"><feGaussianBlur stdDeviation="2"/></filter>
        <filter id="bg_softBlur4"><feGaussianBlur stdDeviation="4"/></filter>
        <filter id="bg_softBlur6"><feGaussianBlur stdDeviation="6"/></filter>
        <filter id="bg_softBlur10"><feGaussianBlur stdDeviation="10"/></filter>
        <filter id="bg_softBlur14"><feGaussianBlur stdDeviation="14"/></filter>
      </defs>

      {/* ═══════════════════════════════════════════════════════
          LAYER 1 — BASE TERRAIN
      ═══════════════════════════════════════════════════════ */}
      <rect width={W} height={H} fill="url(#bg_ground)"/>
      <rect width={W} height={H} fill="url(#bg_sun)"/>
      <rect width={W} height={H} fill="url(#bg_haze)"/>

      {/* Soil colour variation — alien rocky terrain patches */}
      {[
        [0.06, 0.12, 88, 40, '#8a4a22', 0.35],
        [0.40, 0.06, 110,30, '#944e26', 0.28],
        [0.75, 0.18, 78, 36, '#7a3e18', 0.32],
        [0.12, 0.52, 95, 44, '#6a3210', 0.30],
        [0.52, 0.44, 118,46, '#823c1a', 0.25],
        [0.88, 0.58, 70, 30, '#6e3414', 0.33],
        [0.30, 0.80, 90, 28, '#7e4220', 0.28],
        [0.68, 0.85, 100,24, '#743a16', 0.30],
        [0.5,  0.96, 130,20, '#6a3010', 0.20],
        // Lighter dust drifts
        [0.20, 0.32, 72, 24, '#d09060', 0.10],
        [0.76, 0.52, 58, 20, '#c88050', 0.08],
        [0.45, 0.70, 80, 18, '#bc7848', 0.09],
        // Dark rocky outcroppings
        [0.60, 0.30, 50, 22, '#3a1c08', 0.35],
        [0.15, 0.75, 44, 18, '#3e2010', 0.30],
        [0.85, 0.88, 38, 16, '#321808', 0.38],
      ].map(([fx, fy, rx, ry, col, op], i) => (
        <ellipse key={`soil${i}`}
          cx={fx*W} cy={fy*H} rx={rx} ry={ry}
          fill={col} opacity={op}
        />
      ))}

      {/* Small pebble field — scattered rocks on the surface */}
      {[
        [0.08, 0.28, 5, 3, '#5a3818'],
        [0.22, 0.14, 4, 3, '#6a4020'],
        [0.55, 0.22, 6, 4, '#523010'],
        [0.70, 0.72, 5, 3, '#5e3820'],
        [0.90, 0.42, 4, 3, '#4e2c10'],
        [0.18, 0.88, 5, 4, '#624022'],
        [0.42, 0.92, 4, 3, '#563418'],
        [0.82, 0.10, 5, 3, '#6a4220'],
        [0.35, 0.48, 3, 2, '#4a2c14'],
        [0.64, 0.58, 4, 3, '#583818'],
        [0.78, 0.94, 5, 3, '#5a3618'],
      ].map(([fx, fy, rx, ry, col], i) => (
        <ellipse key={`peb${i}`}
          cx={fx*W} cy={fy*H} rx={rx} ry={ry}
          fill={col} opacity={0.7}
        />
      ))}

      {/* ═══════════════════════════════════════════════════════
          LAYER 2 — IMPACT CRATERS
      ═══════════════════════════════════════════════════════ */}

      {/* Main impact crater — lower left, deep shadow */}
      <ellipse cx={W*0.22} cy={H*0.62} rx={W*0.20} ry={H*0.12} fill="url(#bg_crater)" opacity="0.90"/>
      {/* Crater rim highlight */}
      <ellipse cx={W*0.22} cy={H*0.59} rx={W*0.22} ry={H*0.075}
        fill="none" stroke="#c07840" strokeWidth="3" strokeOpacity="0.30"
        filter="url(#bg_softBlur4)"
      />
      {/* Inner shadow ring */}
      <ellipse cx={W*0.22} cy={H*0.62} rx={W*0.14} ry={H*0.07}
        fill="none" stroke="#1a0800" strokeWidth="5" strokeOpacity="0.55"
      />
      {/* Rim debris — small rocks ejected outward */}
      {[[-0.15,0.02],[0.14,-0.03],[0.02,0.10],[-0.10,-0.08],[0.18,0.06]].map(([dx,dy],i)=>(
        <ellipse key={`rim${i}`}
          cx={W*(0.22+dx)} cy={H*(0.62+dy)}
          rx={4+i} ry={3+i*0.5}
          fill="#7a4820" opacity={0.6}
        />
      ))}

      {/* Secondary crater — upper right */}
      <ellipse cx={W*0.80} cy={H*0.22} rx={W*0.11} ry={H*0.07} fill="url(#bg_crater)" opacity="0.75"/>
      <ellipse cx={W*0.80} cy={H*0.20} rx={W*0.13} ry={H*0.05}
        fill="none" stroke="#a86830" strokeWidth="2" strokeOpacity="0.28"
        filter="url(#bg_softBlur2)"
      />

      {/* Small crater — bottom right */}
      <ellipse cx={W*0.88} cy={H*0.82} rx={W*0.07} ry={H*0.04} fill="url(#bg_crater)" opacity="0.65"/>
      <ellipse cx={W*0.88} cy={H*0.80} rx={W*0.08} ry={H*0.03}
        fill="none" stroke="#9a5e28" strokeWidth="1.5" strokeOpacity="0.25"
      />

      {/* ═══════════════════════════════════════════════════════
          LAYER 3 — GROUND CRACKS (radiating from craters)
      ═══════════════════════════════════════════════════════ */}
      <g stroke="#2a1206" strokeWidth="1.4" fill="none" opacity="0.6">
        {/* Main crater cracks */}
        <path d={`M${W*0.22},${H*0.62} l${W*0.14},${H*0.08} l${W*0.05},${H*0.10}`}/>
        <path d={`M${W*0.22},${H*0.62} l-${W*0.12},${H*0.07} l-${W*0.04},${H*0.11}`}/>
        <path d={`M${W*0.22},${H*0.62} l${W*0.07},-${H*0.10} l${W*0.10},-${H*0.05}`}/>
        <path d={`M${W*0.22},${H*0.62} l-${W*0.08},-${H*0.09} l-${W*0.03},-${H*0.06}`}/>
        <path d={`M${W*0.22},${H*0.62} l${W*0.00},${H*0.13} l${W*0.04},${H*0.06}`}/>
        {/* Secondary crater cracks */}
        <path d={`M${W*0.80},${H*0.22} l${W*0.10},${H*0.09}`}/>
        <path d={`M${W*0.80},${H*0.22} l-${W*0.09},${H*0.08}`}/>
        <path d={`M${W*0.80},${H*0.22} l${W*0.06},-${H*0.08}`}/>
        <path d={`M${W*0.80},${H*0.22} l-${W*0.05},-${H*0.07}`}/>
        {/* Surface crack network across terrain */}
        <path d={`M${W*0.40},${H*0.35} l${W*0.08},${H*0.12} l${W*0.06},${H*0.04}`} strokeWidth="0.8" opacity="0.4"/>
        <path d={`M${W*0.55},${H*0.70} l${W*0.10},-${H*0.08} l${W*0.04},${H*0.06}`} strokeWidth="0.8" opacity="0.4"/>
        <path d={`M${W*0.10},${H*0.40} l${W*0.06},${H*0.10}`} strokeWidth="0.7" opacity="0.35"/>
      </g>
      {/* Crack light-catch edges */}
      <g stroke="#9a6030" strokeWidth="0.6" fill="none" opacity="0.22">
        <path d={`M${W*0.22},${H*0.62} l${W*0.14},${H*0.08}`}/>
        <path d={`M${W*0.22},${H*0.62} l-${W*0.12},${H*0.07}`}/>
        <path d={`M${W*0.22},${H*0.62} l${W*0.07},-${H*0.10}`}/>
      </g>

      {/* ═══════════════════════════════════════════════════════
          LAYER 4 — DUST PLUMES (settling after impact)
      ═══════════════════════════════════════════════════════ */}
      <ellipse cx={W*0.22} cy={H*0.46} rx={W*0.16} ry={H*0.09}
        fill="url(#bg_dust)" filter="url(#bg_softBlur10)" opacity="0.75">
        <animate attributeName="opacity" values="0.5;0.85;0.55;0.80;0.5" dur="7s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate"
          values="0,0; 4,-3; -2,2; 3,-2; 0,0" dur="7s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx={W*0.80} cy={H*0.12} rx={W*0.09} ry={H*0.055}
        fill="url(#bg_dust)" filter="url(#bg_softBlur6)" opacity="0.55">
        <animate attributeName="opacity" values="0.3;0.65;0.35;0.6;0.3" dur="9s" repeatCount="indefinite"/>
      </ellipse>
      {/* Dust streak from main impact */}
      <ellipse cx={W*0.38} cy={H*0.58} rx={W*0.22} ry={H*0.05}
        fill="#c08040" opacity="0.06" filter="url(#bg_softBlur10)"
        transform={`rotate(-15, ${W*0.38}, ${H*0.58})`}
      />

      {/* ═══════════════════════════════════════════════════════
          LAYER 5 — MAIN SHIP WRECKAGE
      ═══════════════════════════════════════════════════════ */}

      {/* ── Fuselage main body — crashed diagonally across lower-left ── */}
      <g opacity="0.95">
        <path d={`
          M${W*0.00},${H*0.78}
          L${W*0.04},${H*0.62}
          L${W*0.10},${H*0.57}
          L${W*0.30},${H*0.52}
          L${W*0.36},${H*0.58}
          L${W*0.33},${H*0.72}
          L${W*0.14},${H*0.84}
          Z`}
          fill="url(#bg_metal1)" stroke="#4a6888" strokeWidth="2"
        />
        {/* Burnt overlay */}
        <path d={`
          M${W*0.00},${H*0.78}
          L${W*0.04},${H*0.62}
          L${W*0.10},${H*0.57}
          L${W*0.30},${H*0.52}
          L${W*0.36},${H*0.58}
          L${W*0.33},${H*0.72}
          L${W*0.14},${H*0.84}
          Z`}
          fill="url(#bg_burnt)"
        />
        {/* Hull panel lines */}
        <line x1={W*0.06} y1={H*0.65} x2={W*0.31} y2={H*0.55} stroke="#5a7898" strokeWidth="1.2" opacity="0.75"/>
        <line x1={W*0.10} y1={H*0.72} x2={W*0.33} y2={H*0.64} stroke="#5a7898" strokeWidth="1.2" opacity="0.70"/>
        <line x1={W*0.13} y1={H*0.78} x2={W*0.33} y2={H*0.70} stroke="#4a6888" strokeWidth="1" opacity="0.60"/>
        {/* Hull bolts */}
        {[
          [0.09, 0.58],[0.14, 0.57],[0.20, 0.56],[0.26, 0.54],[0.31, 0.54],
          [0.09, 0.68],[0.16, 0.67],[0.22, 0.65],[0.28, 0.63],
        ].map(([fx,fy],i) => (
          <circle key={`bolt${i}`} cx={fx*W} cy={fy*H} r={2}
            fill="#1e2e42" stroke="#5a7898" strokeWidth="0.8"
          />
        ))}
        {/* Window ports — dark with faint light inside */}
        {[[0.13,0.60],[0.20,0.58],[0.27,0.56]].map(([fx,fy],i) => (
          <g key={`win${i}`}>
            <rect x={fx*W-6} y={fy*H-4} width={12} height={8} rx={2}
              fill="#0a1018" stroke="#3a5878" strokeWidth="0.8"
            />
            <rect x={fx*W-4} y={fy*H-2} width={8} height={5} rx={1}
              fill="#1a3040" opacity={0.5}
            />
          </g>
        ))}
        {/* Main fire/burn gash */}
        <path d={`M${W*0.16},${H*0.62} l${W*0.05},${H*0.025} l-${W*0.012},${H*0.05} l${W*0.035},${H*0.012}`}
          stroke="#ff9040" strokeWidth="2.5" fill="none" opacity="0.9"
        />
        {/* Fire glow bloom */}
        <ellipse cx={W*0.18} cy={H*0.645} rx={28} ry={20}
          fill="url(#bg_fireGlow)" filter="url(#bg_softBlur6)" opacity="0.80">
          <animate attributeName="opacity" values="0.5;0.9;0.6;0.85;0.5" dur="2.2s" repeatCount="indefinite"/>
        </ellipse>
        {/* Fire flame */}
        <ellipse cx={W*0.18} cy={H*0.637} rx={9} ry={13}
          fill="url(#bg_fire)" filter="url(#bg_softBlur2)">
          <animate attributeName="ry" values="10;15;11;14;10" dur="0.9s" repeatCount="indefinite"/>
          <animate attributeName="cx" values={`${W*0.175};${W*0.185};${W*0.178};${W*0.183};${W*0.175}`} dur="0.9s" repeatCount="indefinite"/>
        </ellipse>
        {/* Bright ember core */}
        <circle cx={W*0.18} cy={H*0.642} r={4.5} fill="#ffe066" opacity="0.95">
          <animate attributeName="opacity" values="0.6;1;0.7;1;0.6" dur="0.7s" repeatCount="indefinite"/>
          <animate attributeName="r" values="3;5.5;3.5;5;3" dur="0.7s" repeatCount="indefinite"/>
        </circle>
        {/* Secondary fire along hull */}
        <ellipse cx={W*0.08} cy={H*0.72} rx={7} ry={10}
          fill="url(#bg_fire)" filter="url(#bg_softBlur2)" opacity="0.65">
          <animate attributeName="ry" values="8;12;9;11;8" dur="1.2s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx={W*0.08} cy={H*0.72} rx={18} ry={14}
          fill="url(#bg_fireGlow)" filter="url(#bg_softBlur6)" opacity="0.55">
          <animate attributeName="opacity" values="0.3;0.65;0.4;0.6;0.3" dur="2.5s" repeatCount="indefinite"/>
        </ellipse>
      </g>

      {/* ── Engine/thruster section — left side buried ── */}
      <g opacity="0.88">
        <ellipse cx={W*0.06} cy={H*0.72} rx={W*0.055} ry={H*0.06}
          fill="#0e1820" stroke="#2a3e54" strokeWidth="2"
          transform={`rotate(-20, ${W*0.06}, ${H*0.72})`}
        />
        <ellipse cx={W*0.06} cy={H*0.72} rx={W*0.035} ry={H*0.04}
          fill="#08101a"
          transform={`rotate(-20, ${W*0.06}, ${H*0.72})`}
        />
        {/* Engine still faintly alive — teal thruster glow */}
        <ellipse cx={W*0.06} cy={H*0.72} rx={W*0.025} ry={H*0.03}
          fill="url(#bg_teal)" filter="url(#bg_softBlur4)"
          transform={`rotate(-20, ${W*0.06}, ${H*0.72})`}>
          <animate attributeName="opacity" values="0.1;0.5;0.15;0.45;0.1" dur="4.5s" repeatCount="indefinite"/>
        </ellipse>
      </g>

      {/* ── Wing section — upper right, torn and bent ── */}
      <g opacity="0.92">
        <path d={`
          M${W*0.58},${H*0.04}
          L${W*0.96},${H*0.16}
          L${W*0.98},${H*0.32}
          L${W*0.80},${H*0.36}
          L${W*0.62},${H*0.24}
          Z`}
          fill="url(#bg_metal2)" stroke="#4a6888" strokeWidth="2"
        />
        <path d={`
          M${W*0.58},${H*0.04}
          L${W*0.96},${H*0.16}
          L${W*0.98},${H*0.32}
          L${W*0.80},${H*0.36}
          L${W*0.62},${H*0.24}
          Z`}
          fill="url(#bg_burnt)" opacity="0.55"
        />
        {/* Wing structural ribs */}
        {[0,1,2,3].map(i => (
          <line key={`rib${i}`}
            x1={W*(0.63+i*0.09)} y1={H*0.07}
            x2={W*(0.67+i*0.09)} y2={H*0.34}
            stroke="#3a5878" strokeWidth="1.6" opacity="0.80"
          />
        ))}
        {/* Wing panel seam */}
        <line x1={W*0.62} y1={H*0.16} x2={W*0.96} y2={H*0.24}
          stroke="#4a6888" strokeWidth="1" opacity="0.65"
        />
        {/* Wing tip tear — jagged break */}
        <path d={`M${W*0.92},${H*0.18} l${W*0.04},-${H*0.06} l${W*0.02},${H*0.04} l${W*0.01},-${H*0.04}`}
          stroke="#ff8030" strokeWidth="1.5" fill="none" opacity="0.75"
        />
        <ellipse cx={W*0.93} cy={H*0.18} rx={14} ry={10}
          fill="url(#bg_fireGlow)" filter="url(#bg_softBlur4)" opacity="0.50">
          <animate attributeName="opacity" values="0.25;0.60;0.30;0.55;0.25" dur="3.2s" repeatCount="indefinite"/>
        </ellipse>
        {/* Thruster nozzle — wing tip */}
        <ellipse cx={W*0.78} cy={H*0.34} rx={20} ry={13}
          fill="#0e1820" stroke="#243850" strokeWidth="2"
        />
        <ellipse cx={W*0.78} cy={H*0.34} rx={13} ry={8} fill="#080e16"/>
        <ellipse cx={W*0.78} cy={H*0.34} rx={9} ry={5.5}
          fill="url(#bg_teal)" filter="url(#bg_softBlur2)">
          <animate attributeName="opacity" values="0.15;0.60;0.20;0.55;0.15" dur="3.8s" repeatCount="indefinite"/>
        </ellipse>
        {/* Thruster heat rings */}
        {[1,1.6,2.2].map((s,i) => (
          <ellipse key={`thr${i}`} cx={W*0.78} cy={H*0.34} rx={9*s} ry={5.5*s}
            fill="none" stroke="#00e5c8" strokeWidth="0.8" opacity={0.4-i*0.12}>
            <animate attributeName="opacity"
              values={`${0.4-i*0.12};0;${0.4-i*0.12}`} dur={`${2+i*0.5}s`}
              begin={`${i*0.6}s`} repeatCount="indefinite"
            />
          </ellipse>
        ))}
        {/* Wing rivets */}
        {[[0.65,0.09],[0.72,0.09],[0.79,0.10],[0.86,0.12],[0.92,0.14]].map(([fx,fy],i)=>(
          <circle key={`wbolt${i}`} cx={fx*W} cy={fy*H} r={2}
            fill="#1e2e42" stroke="#4a6888" strokeWidth="0.7"
          />
        ))}
      </g>

      {/* ── Cockpit/nose cone — buried in ground top-centre ── */}
      <g opacity="0.85">
        <path d={`
          M${W*0.43},${H*0.00}
          L${W*0.56},${H*0.00}
          L${W*0.54},${H*0.20}
          L${W*0.45},${H*0.20}
          Z`}
          fill="url(#bg_metal1)" stroke="#3a5878" strokeWidth="1.8"
        />
        {/* Cracked cockpit glass */}
        <path d={`M${W*0.46},${H*0.02} L${W*0.43},${H*0.00} L${W*0.45},${H*0.07}`}
          fill="#0a1420" stroke="#ff7030" strokeWidth="1" opacity="0.8"
        />
        {/* Panel seam */}
        <line x1={W*0.49} y1={H*0.00} x2={W*0.49} y2={H*0.20}
          stroke="#3a5878" strokeWidth="1" opacity="0.7"
        />
        {/* Small cockpit fire */}
        <ellipse cx={W*0.47} cy={H*0.04} rx={5} ry={7}
          fill="url(#bg_fire)" filter="url(#bg_softBlur2)" opacity="0.70">
          <animate attributeName="ry" values="5;9;6;8;5" dur="1.1s" repeatCount="indefinite"/>
        </ellipse>
      </g>

      {/* ── Broken tail section — right edge ── */}
      <g opacity="0.80">
        <path d={`
          M${W*0.96},${H*0.50}
          L${W*1.00},${H*0.46}
          L${W*1.00},${H*0.70}
          L${W*0.94},${H*0.68}
          Z`}
          fill="url(#bg_metal1)" stroke="#3a5878" strokeWidth="1.5"
        />
        <line x1={W*0.96} y1={H*0.52} x2={W*0.96} y2={H*0.67}
          stroke="#4a6888" strokeWidth="1" opacity="0.6"
        />
      </g>

      {/* ═══════════════════════════════════════════════════════
          LAYER 6 — SCATTERED DEBRIS
      ═══════════════════════════════════════════════════════ */}

      {/* Bent pipe — bottom centre */}
      <rect x={W*0.33} y={H*0.88} width={W*0.12} height={10} rx={5}
        fill="#1e2e42" stroke="#304858" strokeWidth="1.5"
        transform={`rotate(-10, ${W*0.39}, ${H*0.89})`}
        opacity="0.85"
      />
      <circle cx={W*0.33} cy={H*0.88} r={6}
        fill="url(#bg_teal)" filter="url(#bg_softBlur4)" opacity="0.65">
        <animate attributeName="opacity" values="0.3;0.75;0.35;0.70;0.3" dur="3.1s" repeatCount="indefinite"/>
      </circle>

      {/* Warped panel — bottom right area */}
      <path d={`M${W*0.76},${H*0.90} l${W*0.07},-${H*0.05} l${W*0.025},${H*0.07} l-${W*0.06},${H*0.04} Z`}
        fill="#1e2e42" stroke="#304858" strokeWidth="1.5" opacity="0.80"
      />
      <path d={`M${W*0.76},${H*0.90} l${W*0.07},-${H*0.05} l${W*0.025},${H*0.07} l-${W*0.06},${H*0.04} Z`}
        fill="url(#bg_burnt)" opacity="0.55"
      />

      {/* Sparking electronics shard */}
      <rect x={W*0.58} y={H*0.80} width={16} height={9} rx={2}
        fill="#162030" stroke="#00e5c8" strokeWidth="1" opacity="0.85"
      />
      <circle cx={W*0.58+8} cy={H*0.80+4.5} r={5}
        fill="url(#bg_teal)" filter="url(#bg_softBlur4)" opacity="0.55">
        <animate attributeName="opacity" values="0.2;0.80;0.25;0.75;0.2" dur="1.9s" repeatCount="indefinite"/>
      </circle>

      {/* Fuel canister — upper area */}
      <rect x={W*0.40} y={H*0.08} width={14} height={22} rx={4}
        fill="#1e2e42" stroke="#304858" strokeWidth="1.2"
        transform={`rotate(25, ${W*0.47}, ${H*0.09})`}
        opacity="0.75"
      />
      <rect x={W*0.40} y={H*0.08} width={14} height={22} rx={4}
        fill="url(#bg_burnt)" opacity="0.4"
        transform={`rotate(25, ${W*0.47}, ${H*0.09})`}
      />

      {/* Small hull fragments — scattered */}
      {[
        [0.48, 0.46, 8,  5, 30],
        [0.66, 0.66, 10, 6, -15],
        [0.20, 0.96, 9,  5, 10],
        [0.92, 0.76, 8,  4, -25],
        [0.38, 0.14, 7,  4, 18],
        [0.52, 0.88, 9,  5, -8],
      ].map(([fx,fy,w,h,rot],i) => (
        <rect key={`frag${i}`}
          x={fx*W-w/2} y={fy*H-h/2} width={w} height={h} rx={1.5}
          fill="#1e2e42" stroke="#3a5470" strokeWidth="0.8"
          transform={`rotate(${rot}, ${fx*W}, ${fy*H})`}
          opacity={0.65+i*0.04}
        />
      ))}

      {/* Leaking fuel/plasma trail from fuselage */}
      <path d={`M${W*0.30},${H*0.58} Q${W*0.42},${H*0.55} ${W*0.50},${H*0.60}`}
        stroke="#00c8a8" strokeWidth="2.5" fill="none" opacity="0.35"
        filter="url(#bg_softBlur2)"
      />
      <path d={`M${W*0.30},${H*0.58} Q${W*0.42},${H*0.55} ${W*0.50},${H*0.60}`}
        stroke="#00ffe0" strokeWidth="0.8" fill="none" opacity="0.5"
      />

      {/* ═══════════════════════════════════════════════════════
          LAYER 7 — ALIEN FLORA (bioluminescent plants)
      ═══════════════════════════════════════════════════════ */}

      {/* Purple spiky alien plants — left edge */}
      {[[0.02,0.40],[0.00,0.50],[0.03,0.58]].map(([fx,fy],i) => (
        <g key={`plant_l${i}`}>
          {[-18,-10,-3,5,13].map((angle,j) => {
            const rad = (angle - 80) * Math.PI / 180
            const len = 14 + j * 3
            return (
              <line key={j}
                x1={fx*W} y1={fy*H}
                x2={fx*W + Math.cos(rad)*len}
                y2={fy*H + Math.sin(rad)*len}
                stroke="#cc44ff" strokeWidth={1.5-j*0.2} opacity={0.7}
              />
            )
          })}
          <circle cx={fx*W} cy={fy*H} r={4}
            fill="url(#bg_flora)" filter="url(#bg_softBlur4)" opacity="0.6">
            <animate attributeName="opacity"
              values="0.4;0.8;0.45;0.75;0.4" dur={`${2.5+i*0.8}s`} repeatCount="indefinite"/>
          </circle>
        </g>
      ))}

      {/* Green bioluminescent moss patches */}
      {[[0.06,0.84,18,8],[0.14,0.92,22,9],[0.72,0.96,20,8]].map(([fx,fy,rx,ry],i) => (
        <g key={`moss${i}`}>
          <ellipse cx={fx*W} cy={fy*H} rx={rx} ry={ry}
            fill="#1a4010" opacity="0.85"
          />
          <ellipse cx={fx*W} cy={fy*H} rx={rx*0.7} ry={ry*0.7}
            fill="url(#bg_spore)" filter="url(#bg_softBlur4)" opacity="0.55">
            <animate attributeName="opacity"
              values="0.3;0.65;0.35;0.60;0.3" dur={`${3+i}s`} repeatCount="indefinite"/>
          </ellipse>
        </g>
      ))}

      {/* Tall alien stalks — bottom right */}
      {[[0.93,0.88,22],[0.97,0.82,18],[0.90,0.96,16]].map(([fx,fy,h],i) => (
        <g key={`stalk${i}`}>
          <line x1={fx*W} y1={fy*H} x2={fx*W+(i-1)*4} y2={fy*H-h}
            stroke="#9930cc" strokeWidth="2" opacity="0.7"
          />
          {/* Glowing tip */}
          <circle cx={fx*W+(i-1)*4} cy={fy*H-h} r={3.5}
            fill="url(#bg_flora)" filter="url(#bg_softBlur2)" opacity="0.8">
            <animate attributeName="opacity"
              values="0.5;1;0.55;0.9;0.5" dur={`${2+i*0.6}s`} repeatCount="indefinite"/>
          </circle>
        </g>
      ))}

      {/* Alien mushroom — near wreckage, eerie blue */}
      <g>
        <line x1={W*0.38} y1={H*0.78} x2={W*0.38} y2={H*0.70}
          stroke="#2244aa" strokeWidth="3" opacity="0.7"
        />
        <ellipse cx={W*0.38} cy={H*0.70} rx={10} ry={5}
          fill="#1a2a80" stroke="#4466cc" strokeWidth="1" opacity="0.85"
        />
        <ellipse cx={W*0.38} cy={H*0.70} rx={7} ry={3.5}
          fill="url(#bg_teal)" filter="url(#bg_softBlur2)" opacity="0.45">
          <animate attributeName="opacity" values="0.2;0.55;0.25;0.50;0.2" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        {/* Spore dots */}
        {[[-8,3],[8,2],[-4,7],[5,6],[0,9]].map(([dx,dy],i)=>(
          <circle key={`sp${i}`} cx={W*0.38+dx} cy={H*0.70+dy} r={1.2}
            fill="#4488ff" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${1.5+i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </g>

      {/* ═══════════════════════════════════════════════════════
          LAYER 8 — ATMOSPHERIC EXTRAS
      ═══════════════════════════════════════════════════════ */}

      {/* Floating embers from fire — drifting up */}
      {[
        [W*0.17, H*0.62, '2s', '0s'],
        [W*0.20, H*0.65, '2.8s', '0.4s'],
        [W*0.15, H*0.68, '3.2s', '0.8s'],
        [W*0.19, H*0.60, '2.4s', '1.2s'],
        [W*0.22, H*0.63, '3s', '0.2s'],
      ].map(([cx,cy,dur,begin],i) => (
        <circle key={`ember${i}`} cx={cx} cy={cy} r={1.8}
          fill="#ffcc44" opacity="0">
          <animate attributeName="cy"
            values={`${cy};${cy - H*0.18};${cy - H*0.28}`}
            dur={dur} begin={begin} repeatCount="indefinite"/>
          <animate attributeName="opacity"
            values="0;0.9;0.6;0" dur={dur} begin={begin} repeatCount="indefinite"/>
          <animate attributeName="r"
            values="2;1.5;0.8;0" dur={dur} begin={begin} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* Distant alien mountains/horizon silhouette — faint */}
      <path d={`M0,${H*0.05} Q${W*0.12},${H*0.01} ${W*0.18},${H*0.04}
        Q${W*0.25},${H*0.00} ${W*0.32},${H*0.03}
        Q${W*0.40},${H*0.07} ${W*0.44},${H*0.04} L${W*0.44},${H*0.00} L0,${H*0.00} Z`}
        fill="#4a1c08" opacity="0.50"
      />
      <path d={`M${W*0.55},${H*0.00} L${W*0.56},${H*0.03}
        Q${W*0.58},${H*0.05} ${W*0.60},${H*0.02} L${W*0.60},${H*0.00} Z`}
        fill="#3e1808" opacity="0.45"
      />

      {/* Stars peeking through thin atmosphere — upper corners */}
      {[
        [0.04,0.02],[0.10,0.04],[0.15,0.01],[0.03,0.07],
        [0.92,0.01],[0.97,0.04],[0.88,0.03],[0.95,0.07],
      ].map(([fx,fy],i) => (
        <circle key={`star${i}`} cx={fx*W} cy={fy*H} r={i%3===0?1.5:1}
          fill="white" opacity={0.3+0.15*(i%3)}>
          <animate attributeName="opacity"
            values={`${0.2+0.1*(i%3)};${0.5+0.2*(i%3)};${0.2+0.1*(i%3)}`}
            dur={`${2+i*0.4}s`} begin={`${i*0.3}s`} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* ═══════════════════════════════════════════════════════
          LAYER 9 — GRID OVERLAY
      ═══════════════════════════════════════════════════════ */}
      <g>
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line key={`vg${i}`}
            x1={(i+1)*tileW} y1={0} x2={(i+1)*tileW} y2={H}
            stroke="#c07840" strokeWidth="1.3" opacity="0.36"
          />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <line key={`hg${i}`}
            x1={0} y1={(i+1)*tileH} x2={W} y2={(i+1)*tileH}
            stroke="#c07840" strokeWidth="1.3" opacity="0.36"
          />
        ))}
        {/* Grid intersection dots */}
        {Array.from({ length: cols-1 }, (_, ci) =>
          Array.from({ length: rows-1 }, (_, ri) => (
            <circle key={`gd${ci}-${ri}`}
              cx={(ci+1)*tileW} cy={(ri+1)*tileH} r={2}
              fill="#d08040" opacity="0.34"
            />
          ))
        )}
      </g>

      {/* ═══════════════════════════════════════════════════════
          LAYER 10 — VIGNETTE (depth & mood)
      ═══════════════════════════════════════════════════════ */}
      <rect width={W} height={H} fill="url(#bg_vignette)"/>
    </svg>
  )
}
