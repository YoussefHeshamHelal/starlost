// GameGrid.jsx
import { AnimatePresence, motion } from 'framer-motion'
import LumaSprite from './LumaSprite'
import CrashSiteBackground from './CrashSiteBackground'

const DEFAULT_TILE_SIZE = 104

const DIRECTIONS = ['north', 'east', 'south', 'west']
const MOVE_DELTAS = { north:[0,-1], east:[1,0], south:[0,1], west:[-1,0] }

// Get what's in a specific relative direction from LUMA
function getTileInDirection(luma, relDir, level) {
  const { grid, walls = [], objects = [], goal } = level
  const facingIdx = DIRECTIONS.indexOf(luma.facing)

  const offsets = { front: 0, right: 1, back: 2, left: 3 }
  const absIdx = (facingIdx + (offsets[relDir] ?? 0) + 4) % 4
  const absFacing = DIRECTIONS[absIdx]
  const [dx, dy] = MOVE_DELTAS[absFacing]
  const ax = luma.x + dx
  const ay = luma.y + dy

  if (ax < 0 || ax >= grid.cols || ay < 0 || ay >= grid.rows)
    return { type: 'boundary', label: 'WALL!', emoji: '🚧', color: '#64748b' }
  if (walls.some(w => w.x === ax && w.y === ay))
    return { type: 'rock', label: 'BIG ROCK!', emoji: '🪨', color: '#c0845a' }
  if (goal && goal.x === ax && goal.y === ay)
    return { type: 'goal', label: 'SHIP CORE!', emoji: '⭐', color: '#f59e0b' }
  const obj = objects.find(o => o.x === ax && o.y === ay)
  if (obj?.type === 'ship_part')
    return { type: 'ship_part', label: 'SHIP PIECE!', emoji: '🛸', color: '#38bdf8' }
  if (obj?.type === 'rock')
    return { type: 'rock', label: 'BIG ROCK!', emoji: '🪨', color: '#c0845a' }
  return { type: 'open', label: 'ALL CLEAR!', emoji: '✅', color: '#4ade80' }
}

function isTileFogged(col, row, luma, sptCorrect) {
  if (sptCorrect) return false
  if (Math.abs(col - luma.x) <= 1 && Math.abs(row - luma.y) <= 1) return false
  return true
}

function FogOverlay({ gridWidth, gridHeight, cols, rows, luma, sptCorrect }) {
  const W = gridWidth
  const H = gridHeight
  const TW = W / cols
  const TH = H / rows

  const clearTiles = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!isTileFogged(col, row, luma, sptCorrect)) {
        clearTiles.push({ col, row })
      }
    }
  }

  return (
    <motion.div
      animate={{ opacity: sptCorrect ? 0 : 1 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      style={{
        position: 'absolute', inset: 0, zIndex: 6,
        pointerEvents: 'none', overflow: 'hidden', borderRadius: 12,
      }}
    >
      <svg
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id="fogBase" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%"   stopColor="#b8cdd8" stopOpacity="0.97" />
            <stop offset="40%"  stopColor="#9ab8c8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#7ea8bc" stopOpacity="0.93" />
          </linearGradient>
          <radialGradient id="wisp1" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#cde0ea" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#9ab8c8" stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="wisp2" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#d8eaf0" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#aac4d0" stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="wisp3" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#a8c4d4" stopOpacity="0.80" />
            <stop offset="100%" stopColor="#8aaec0" stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="wisp4" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#c2dce8" stopOpacity="0.70" />
            <stop offset="100%" stopColor="#90b4c4" stopOpacity="0"    />
          </radialGradient>
          <mask id="fogMask">
            <rect width={W} height={H} fill="white" />
            {clearTiles.map(({ col, row }) => (
              <rect key={`clear-${col}-${row}`} x={col*TW} y={row*TH} width={TW} height={TH} fill="black" />
            ))}
            {clearTiles.map(({ col, row }) => (
              <ellipse key={`fe-${col}-${row}`} cx={col*TW+TW/2} cy={row*TH+TH/2} rx={TW*0.78} ry={TH*0.78} fill="black" />
            ))}
          </mask>
          <filter id="fogBlur"  x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
          <filter id="wispBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
          <filter id="edgeBlur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <rect width={W} height={H} fill="url(#fogBase)" mask="url(#fogMask)" />
        {[
          { x:W*0.15, y:H*0.2,  rx:W*0.38, ry:H*0.28, id:'wisp1', dur:'9s',  delay:'0s'   },
          { x:W*0.7,  y:H*0.15, rx:W*0.32, ry:H*0.24, id:'wisp2', dur:'11s', delay:'2s'   },
          { x:W*0.5,  y:H*0.55, rx:W*0.44, ry:H*0.3,  id:'wisp3', dur:'13s', delay:'1s'   },
          { x:W*0.1,  y:H*0.7,  rx:W*0.3,  ry:H*0.25, id:'wisp4', dur:'10s', delay:'3.5s' },
          { x:W*0.82, y:H*0.65, rx:W*0.28, ry:H*0.22, id:'wisp1', dur:'12s', delay:'5s'   },
          { x:W*0.38, y:H*0.85, rx:W*0.4,  ry:H*0.2,  id:'wisp2', dur:'8s',  delay:'0.5s' },
        ].map((w, i) => (
          <ellipse key={`w${i}`} cx={w.x} cy={w.y} rx={w.rx} ry={w.ry}
            fill={`url(#${w.id})`} filter="url(#wispBlur)" mask="url(#fogMask)">
            <animateTransform attributeName="transform" type="translate"
              values={`0,0; ${W*0.025*(i%2===0?1:-1)},${H*0.015*(i%3===0?1:-1)}; 0,0`}
              dur={w.dur} begin={w.delay} repeatCount="indefinite"
              calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
            <animate attributeName="opacity"
              values="0.9;1;0.85;1;0.9" dur={w.dur} begin={w.delay} repeatCount="indefinite"/>
          </ellipse>
        ))}
        {[
          { x:W*0.3,  y:H*0.35, rx:W*0.15, ry:H*0.1,  dur:'5s', delay:'0s'   },
          { x:W*0.6,  y:H*0.45, rx:W*0.18, ry:H*0.09, dur:'6s', delay:'1.2s' },
          { x:W*0.2,  y:H*0.6,  rx:W*0.14, ry:H*0.08, dur:'7s', delay:'2.5s' },
          { x:W*0.75, y:H*0.3,  rx:W*0.16, ry:H*0.1,  dur:'4s', delay:'0.8s' },
          { x:W*0.5,  y:H*0.1,  rx:W*0.2,  ry:H*0.08, dur:'6s', delay:'3s'   },
        ].map((t, i) => (
          <ellipse key={`t${i}`} cx={t.x} cy={t.y} rx={t.rx} ry={t.ry}
            fill="white" opacity="0.18" filter="url(#fogBlur)" mask="url(#fogMask)">
            <animateTransform attributeName="transform" type="translate"
              values={`0,0; ${W*0.04*(i%2===0?1:-1)},${H*0.02*(i%2===0?-1:1)}; 0,0`}
              dur={t.dur} begin={t.delay} repeatCount="indefinite"
              calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
          </ellipse>
        ))}
        <ellipse cx={W*0.35} cy={H*0.08} rx={W*0.25} ry={H*0.07}
          fill="white" opacity="0.28" filter="url(#fogBlur)" mask="url(#fogMask)" />
        <ellipse cx={W*0.72} cy={H*0.55} rx={W*0.2} ry={H*0.06}
          fill="white" opacity="0.22" filter="url(#fogBlur)" mask="url(#fogMask)" />
        {clearTiles.map(({ col, row }) => (
          <ellipse key={`edge-${col}-${row}`}
            cx={col*TW+TW/2} cy={row*TH+TH/2}
            rx={TW*0.95} ry={TH*0.95}
            fill="none"
            stroke="#9ab8c8" strokeWidth={TW*0.55} strokeOpacity={0.3}
            filter="url(#edgeBlur)"
            mask="url(#fogMask)"
          />
        ))}
      </svg>
    </motion.div>
  )
}

function ShipPart() {
  return (
    <svg width={54} height={50} viewBox="0 0 54 50" fill="none">
      <defs>
        <linearGradient id="sp_hull" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%"   stopColor="#3a6a9a"/>
          <stop offset="50%"  stopColor="#1e4060"/>
          <stop offset="100%" stopColor="#0a1c30"/>
        </linearGradient>
        <radialGradient id="sp_glow" cx="55%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="#60d8ff" stopOpacity="0.9"/>
          <stop offset="60%"  stopColor="#20a0e0" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#0060a0" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="sp_core" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"/>
          <stop offset="30%"  stopColor="#80eeff" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#00aaff" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="sp_outerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#38d0ff" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#0090cc" stopOpacity="0"/>
        </radialGradient>
        <filter id="sp_blur">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sp_bigGlow">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
      </defs>
      <ellipse cx={27} cy={26} rx={24} ry={22}
        fill="url(#sp_outerGlow)" filter="url(#sp_bigGlow)" opacity="0.7">
        <animate attributeName="opacity" values="0.4;0.85;0.45;0.80;0.4" dur="1.8s" repeatCount="indefinite"/>
      </ellipse>
      <path d="M5,16 L20,4 L42,8 L50,22 L44,40 L30,47 L12,38 L3,26 Z"
        fill="url(#sp_hull)" stroke="#50c8f8" strokeWidth="1.6"
      />
      <line x1={5} y1={16} x2={42} y2={8}  stroke="#2a4c70" strokeWidth="0.9" opacity="0.7"/>
      <line x1={12} y1={38} x2={44} y2={40} stroke="#2a4c70" strokeWidth="0.9" opacity="0.7"/>
      <line x1={20} y1={4}  x2={30} y2={47} stroke="#2a4c70" strokeWidth="0.7" opacity="0.5"/>
      <path d="M5,16 L20,4 L42,8 L50,22 L44,40 L30,47 L12,38 L3,26 Z"
        fill="url(#sp_glow)"
      />
      <circle cx={40} cy={14} r={7} fill="url(#sp_core)" filter="url(#sp_blur)">
        <animate attributeName="r" values="5;8;5.5;7.5;5" dur="1.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;1;0.65;0.95;0.6" dur="1.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx={40} cy={14} r={3} fill="white">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="0.7s" repeatCount="indefinite"/>
      </circle>
      <circle cx={40} cy={14} r={11} fill="none" stroke="#38d0ff" strokeWidth="0.8" opacity="0.5">
        <animate attributeName="r" values="9;14;9" dur="1.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0;0.5" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      {[[14,10],[24,8],[36,18],[15,32],[32,42]].map(([bx,by],i) => (
        <circle key={i} cx={bx} cy={by} r={2.2}
          fill="#0e1e30" stroke="#40b8e8" strokeWidth="0.7" opacity="0.75"/>
      ))}
      <path d="M22,24 L30,20 L28,30" stroke="#60d8ff" strokeWidth="0.8" fill="none" opacity="0.50"/>
    </svg>
  )
}

function RockObstacle() {
  return (
    <svg width={64} height={54} viewBox="0 0 64 54" fill="none">
      <defs>
        <linearGradient id="rk_main" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%"   stopColor="#d4905a"/>
          <stop offset="35%"  stopColor="#b06c38"/>
          <stop offset="70%"  stopColor="#8a4e22"/>
          <stop offset="100%" stopColor="#5c3010"/>
        </linearGradient>
        <linearGradient id="rk_top" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0%"   stopColor="#eeb07a"/>
          <stop offset="60%"  stopColor="#c87840"/>
          <stop offset="100%" stopColor="#9a5828"/>
        </linearGradient>
        <linearGradient id="rk_shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3a1c08" stopOpacity="0"/>
          <stop offset="100%" stopColor="#1e0c04" stopOpacity="0.7"/>
        </linearGradient>
        <radialGradient id="rk_glow" cx="40%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="#ffb870" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#c07030" stopOpacity="0"/>
        </radialGradient>
        <filter id="rk_dropShadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#1a0800" floodOpacity="0.7"/>
        </filter>
      </defs>
      <ellipse cx={33} cy={50} rx={24} ry={5} fill="#1a0800" opacity="0.45"/>
      <path d="M10,34 Q5,22 12,12 Q22,2 36,4 Q50,5 56,18 Q60,30 54,40 Q44,50 28,50 Q10,50 10,34 Z"
        fill="url(#rk_main)" stroke="#c07840" strokeWidth="1.5" filter="url(#rk_dropShadow)"
      />
      <path d="M12,12 Q22,4 36,4 Q50,5 56,18 Q44,11 28,13 Q18,14 12,12 Z"
        fill="url(#rk_top)" opacity="0.85"
      />
      <path d="M10,34 Q5,22 12,12 Q22,2 36,4 Q50,5 56,18 Q44,11 28,13 Q18,14 12,12 Z"
        fill="url(#rk_glow)"
      />
      <path d="M10,34 Q5,22 12,12 Q22,2 36,4 Q50,5 56,18 Q60,30 54,40 Q44,50 28,50 Q10,50 10,34 Z"
        fill="url(#rk_shadow)"
      />
      <path d="M22,18 Q25,24 23,32 Q22,36 24,42" stroke="#7a4418" strokeWidth="1.4" fill="none" opacity="0.75"/>
      <path d="M36,7  Q39,16 38,26 Q37,33 39,40"  stroke="#7a4418" strokeWidth="1.1" fill="none" opacity="0.65"/>
      <path d="M14,30 Q20,34 18,42"               stroke="#7a4418" strokeWidth="1" fill="none" opacity="0.60"/>
      <path d="M44,12 Q47,20 44,30"               stroke="#9a5828" strokeWidth="1" fill="none" opacity="0.55"/>
      <path d="M12,12 Q18,8 28,6 Q36,5 42,7"
        stroke="#f0c888" strokeWidth="1.2" fill="none" opacity="0.55"
      />
      <path d="M18,36 Q24,32 28,38 Q32,42 38,38"
        stroke="#6a9030" strokeWidth="1.5" fill="none" opacity="0.30"
      />
    </svg>
  )
}

function GoalBeacon() {
  return (
    <motion.div
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}
    >
      {[1, 1.5, 2].map((scale, i) => (
        <motion.div key={i}
          animate={{ scale:[1, scale], opacity:[0.5, 0] }}
          transition={{ duration:2, delay:i*0.5, repeat:Infinity }}
          style={{ position:'absolute', width:36, height:36, borderRadius:'50%', border:'1.5px solid #f59e0b' }}
        />
      ))}
      <svg width={40} height={40} viewBox="0 0 40 40" fill="none">
        <defs>
          <radialGradient id="coreG" cx="40%" cy="35%" r="60%">
            <stop offset="0%"  stopColor="#fcd34d"/>
            <stop offset="60%" stopColor="#f59e0b"/>
            <stop offset="100%" stopColor="#92400e"/>
          </radialGradient>
          <filter id="coreGlow">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx={20} cy={20} r={18} fill="#1a1008" stroke="#f59e0b" strokeWidth="1.5"/>
        <circle cx={20} cy={20} r={12} fill="url(#coreG)" filter="url(#coreGlow)">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx={20} cy={20} r={6} fill="#fcd34d"/>
        {[0, 90, 180, 270].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          return <circle key={i} cx={20 + 15*Math.cos(rad)} cy={20 + 15*Math.sin(rad)}
            r={2} fill="#1a1008" stroke="#f59e0b" strokeWidth="0.8"/>
        })}
      </svg>
    </motion.div>
  )
}

// Static star data — pre-computed outside component to avoid Math.random() in render
const STAR_DATA = [
  { sx:0.08, sy:0.06, r:1.2, op:0.45, v0:0.35, v1:0.85, dur:'3.2s', begin:'0s'   },
  { sx:0.18, sy:0.12, r:0.9, op:0.55, v0:0.30, v1:0.75, dur:'2.8s', begin:'0.4s' },
  { sx:0.35, sy:0.04, r:1.4, op:0.40, v0:0.40, v1:0.90, dur:'4.1s', begin:'1.1s' },
  { sx:0.55, sy:0.08, r:1.0, op:0.50, v0:0.32, v1:0.80, dur:'3.7s', begin:'0.7s' },
  { sx:0.72, sy:0.05, r:1.3, op:0.38, v0:0.28, v1:0.72, dur:'2.5s', begin:'1.8s' },
  { sx:0.85, sy:0.14, r:0.8, op:0.60, v0:0.45, v1:0.95, dur:'3.4s', begin:'0.2s' },
  { sx:0.92, sy:0.07, r:1.1, op:0.42, v0:0.36, v1:0.82, dur:'4.5s', begin:'2.3s' },
  { sx:0.15, sy:0.20, r:1.5, op:0.35, v0:0.30, v1:0.70, dur:'3.9s', begin:'1.5s' },
  { sx:0.62, sy:0.17, r:0.9, op:0.52, v0:0.38, v1:0.88, dur:'2.6s', begin:'0.9s' },
  { sx:0.44, sy:0.21, r:1.2, op:0.48, v0:0.42, v1:0.92, dur:'3.3s', begin:'1.3s' },
  { sx:0.28, sy:0.15, r:1.0, op:0.44, v0:0.34, v1:0.78, dur:'4.8s', begin:'0.6s' },
  { sx:0.78, sy:0.19, r:0.8, op:0.58, v0:0.40, v1:0.86, dur:'2.9s', begin:'2.0s' },
  { sx:0.50, sy:0.03, r:1.3, op:0.36, v0:0.30, v1:0.74, dur:'3.6s', begin:'1.7s' },
  { sx:0.03, sy:0.16, r:1.1, op:0.50, v0:0.44, v1:0.94, dur:'4.2s', begin:'0.3s' },
]

// ── Helper: background scene fill per tile type ──────────────────────────
// Returns SVG path/shape data for what occupies a zone
function ZoneContent({ tile, zone, W, H }) {
  // zone: 'front' | 'left' | 'right'
  // Each zone renders its terrain from LUMA's POV perspective
  const isLeft  = zone === 'left'
  const isFront = zone === 'front'

  if (tile.type === 'open') {
    return (
      <g>
        {/* Open sky path suggestion */}
        <text
          x={isFront ? W/2 : isLeft ? W*0.12 : W*0.88}
          y={H*0.32}
          textAnchor="middle"
          fill="#4ade80"
          fontSize={isFront ? 18 : 13}
          fontFamily="monospace"
          opacity="0.55"
          letterSpacing="3"
        >
          {isFront ? 'PATH IS CLEAR!' : 'OPEN'}
        </text>
      </g>
    )
  }

  if (tile.type === 'rock' || tile.type === 'boundary') {
    if (isFront) {
      return (
        <g>
          {/* Large rock blocking full front view */}
          <path
            d={`M${W*0.06},${H} Q${W*0.04},${H*0.36} ${W*0.2},${H*0.16}
                Q${W*0.36},${H*0.04} ${W*0.5},${H*0.06}
                Q${W*0.66},${H*0.04} ${W*0.8},${H*0.16}
                Q${W*0.96},${H*0.36} ${W*0.94},${H} Z`}
            fill="url(#rock_front)" stroke="#2a2010" strokeWidth="2"
          />
          {/* Rock surface cracks */}
          <path d={`M${W*0.28},${H*0.18} Q${W*0.32},${H*0.34} ${W*0.3},${H*0.58}`}
            stroke="#0e0a06" strokeWidth="2.5" fill="none" opacity="0.7"/>
          <path d={`M${W*0.58},${H*0.15} Q${W*0.61},${H*0.30} ${W*0.57},${H*0.52}`}
            stroke="#0e0a06" strokeWidth="2" fill="none" opacity="0.6"/>
          <path d={`M${W*0.44},${H*0.08} Q${W*0.5},${H*0.27} ${W*0.46},${H*0.5}`}
            stroke="#0e0a06" strokeWidth="1.6" fill="none" opacity="0.55"/>
          {/* Highlight ridge */}
          <path
            d={`M${W*0.2},${H*0.16} Q${W*0.36},${H*0.09} ${W*0.5},${H*0.06}
                Q${W*0.66},${H*0.09} ${W*0.8},${H*0.16}
                Q${W*0.6},${H*0.13} ${W*0.5},${H*0.11}
                Q${W*0.38},${H*0.13} ${W*0.2},${H*0.16} Z`}
            fill="#4a3a24" opacity="0.55"
          />
        </g>
      )
    }
    // Side rock — peeks in from the edge
    return (
      <g>
        <path
          d={isLeft
            ? `M0,${H} Q0,${H*0.3} ${W*0.08},${H*0.18} Q${W*0.16},${H*0.08} ${W*0.26},${H*0.1}
               Q${W*0.32},${H*0.12} ${W*0.3},${H*0.3} L${W*0.28},${H} Z`
            : `M${W},${H} Q${W},${H*0.3} ${W*0.92},${H*0.18} Q${W*0.84},${H*0.08} ${W*0.74},${H*0.1}
               Q${W*0.68},${H*0.12} ${W*0.7},${H*0.3} L${W*0.72},${H} Z`
          }
          fill="url(#rock_side)" stroke="#2a2010" strokeWidth="1.2"
        />
        {/* Side rock surface lines */}
        {isLeft ? (
          <>
            <path d={`M${W*0.08},${H*0.35} Q${W*0.12},${H*0.5} ${W*0.1},${H*0.7}`}
              stroke="#0e0a06" strokeWidth="1.5" fill="none" opacity="0.6"/>
            <path d={`M${W*0.18},${H*0.2} Q${W*0.22},${H*0.4} ${W*0.2},${H*0.6}`}
              stroke="#0e0a06" strokeWidth="1.2" fill="none" opacity="0.5"/>
          </>
        ) : (
          <>
            <path d={`M${W*0.92},${H*0.35} Q${W*0.88},${H*0.5} ${W*0.9},${H*0.7}`}
              stroke="#0e0a06" strokeWidth="1.5" fill="none" opacity="0.6"/>
            <path d={`M${W*0.82},${H*0.2} Q${W*0.78},${H*0.4} ${W*0.8},${H*0.6}`}
              stroke="#0e0a06" strokeWidth="1.2" fill="none" opacity="0.5"/>
          </>
        )}
      </g>
    )
  }

  if (tile.type === 'ship_part') {
    if (isFront) {
      return (
        <g>
          {/* Ground path */}
          <polygon
            points={`${W*0.4},${H*0.44} ${W*0.6},${H*0.44} ${W*0.85},${H} ${W*0.15},${H}`}
            fill="#0e0c08" opacity="0.55"
          />
          {/* Ship fragment floating */}
          <g transform={`translate(${W*0.38}, ${H*0.08})`}>
            <animate attributeName="transform"
              values={`translate(${W*0.38}, ${H*0.08}); translate(${W*0.38}, ${H*0.06}); translate(${W*0.38}, ${H*0.08})`}
              dur="2s" repeatCount="indefinite"/>
            <path d={`M0,${H*0.14} L${W*0.07},${H*0.02} L${W*0.17},${H*0.04} L${W*0.22},${H*0.12} L${W*0.19},${H*0.2} L${W*0.05},${H*0.21} Z`}
              fill="url(#ship_part_front)" stroke="#38bdf8" strokeWidth="2"/>
            <circle cx={W*0.165} cy={H*0.065} r={W*0.025} fill="#38bdf8" opacity="0.8">
              <animate attributeName="opacity" values="0.4;1;0.5;0.9;0.4" dur="1.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx={W*0.165} cy={H*0.065} r={W*0.012} fill="#7dd3fc"/>
          </g>
          {/* Glow on ground */}
          <ellipse cx={W*0.5} cy={H*0.44} rx={W*0.12} ry={H*0.025} fill="#38bdf8" opacity="0.18">
            <animate attributeName="opacity" values="0.1;0.28;0.1" dur="1.5s" repeatCount="indefinite"/>
          </ellipse>
        </g>
      )
    }
    // Side ship part — glowing on the edge
    return (
      <g>
        <ellipse
          cx={isLeft ? W*0.06 : W*0.94}
          cy={H*0.35}
          rx={W*0.07} ry={H*0.08}
          fill="#38bdf8" opacity="0.2"
        >
          <animate attributeName="opacity" values="0.1;0.35;0.1" dur="1.5s" repeatCount="indefinite"/>
        </ellipse>
        <text
          x={isLeft ? W*0.09 : W*0.91}
          y={H*0.36}
          textAnchor="middle"
          fontSize={18}
          fill="#38bdf8"
          opacity="0.8"
        >
          🛸
        </text>
      </g>
    )
  }

  if (tile.type === 'goal') {
    if (isFront) {
      return (
        <g>
          <polygon
            points={`${W*0.4},${H*0.44} ${W*0.6},${H*0.44} ${W*0.85},${H} ${W*0.15},${H}`}
            fill="#0e0c08" opacity="0.55"
          />
          {/* Glowing beacon */}
          <circle cx={W*0.5} cy={H*0.28} r={W*0.08} fill="#92400e" stroke="#f59e0b" strokeWidth="2.5">
            <animate attributeName="r"
              values={`${W*0.07};${W*0.1};${W*0.07}`} dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx={W*0.5} cy={H*0.28} r={W*0.05} fill="#fcd34d">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          {/* Beacon rings */}
          {[1.8, 2.6, 3.5].map((scale, i) => (
            <circle key={i} cx={W*0.5} cy={H*0.28} r={W*0.08*scale}
              fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.25">
              <animate attributeName="r"
                values={`${W*0.06*scale};${W*0.12*scale};${W*0.06*scale}`}
                dur="2s" begin={`${i*0.4}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity"
                values="0.3;0;0.3" dur="2s" begin={`${i*0.4}s`} repeatCount="indefinite"/>
            </circle>
          ))}
          {/* Ground glow */}
          <ellipse cx={W*0.5} cy={H*0.44} rx={W*0.14} ry={H*0.025} fill="#f59e0b" opacity="0.22">
            <animate attributeName="opacity" values="0.12;0.3;0.12" dur="1.8s" repeatCount="indefinite"/>
          </ellipse>
        </g>
      )
    }
    return (
      <g>
        <ellipse
          cx={isLeft ? W*0.06 : W*0.94}
          cy={H*0.35}
          rx={W*0.07} ry={H*0.08}
          fill="#f59e0b" opacity="0.25"
        >
          <animate attributeName="opacity" values="0.1;0.38;0.1" dur="2s" repeatCount="indefinite"/>
        </ellipse>
        <text
          x={isLeft ? W*0.09 : W*0.91}
          y={H*0.36}
          textAnchor="middle"
          fontSize={20}
          fill="#fcd34d"
          opacity="0.9"
        >
          ⭐
        </text>
      </g>
    )
  }

  return null
}

// ── Immersive single-screen VisorView ──────────────────────────────────────────
// Shows a true first-person helmet-cam: left side-content bleeds in from the
// left edge, right from the right edge, and the front is the full-width center.
// Kid-friendly labels with big emojis make it clear what LUMA can see.
function VisorView({ ahead, leftTile, rightTile, luma, gridWidth, gridHeight, onClose }) {
  const W = gridWidth
  const H = gridHeight
  const dirLabel = { north:'UP ↑', east:'RIGHT →', south:'DOWN ↓', west:'LEFT ←' }

  // ── Horizon/sky colors based on what's ahead ──────────────────────────────
  const aheadAccent =
    ahead.type === 'rock'      ? '#c0845a' :
    ahead.type === 'boundary'  ? '#64748b' :
    ahead.type === 'ship_part' ? '#38bdf8' :
    ahead.type === 'goal'      ? '#f59e0b' :
    '#2dd4bf'

  return (
    <motion.div
      key="visor"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0,
        background: '#010305',
        zIndex: 20,
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: 12,
      }}
    >
      {/* ── Main SVG scene — full immersive POV ── */}
      <svg
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="pov_sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#010508"/>
            <stop offset="100%" stopColor="#030d0a"/>
          </linearGradient>
          {/* Ground gradient */}
          <linearGradient id="pov_ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#0d0b06"/>
            <stop offset="100%" stopColor="#050402"/>
          </linearGradient>
          {/* Horizon glow — color based on what's ahead */}
          <radialGradient id="pov_horizon" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor={aheadAccent} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={aheadAccent} stopOpacity="0"/>
          </radialGradient>
          {/* Rock gradients */}
          <linearGradient id="rock_front" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%"  stopColor="#d4905a"/>
            <stop offset="35%" stopColor="#b06c38"/>
            <stop offset="70%" stopColor="#8a4e22"/>
            <stop offset="100%" stopColor="#5c3010"/>
          </linearGradient>
          <linearGradient id="rock_side" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%"  stopColor="#b07840"/>
            <stop offset="60%" stopColor="#7a4c22"/>
            <stop offset="100%" stopColor="#3c2008"/>
          </linearGradient>
          {/* Ship part gradient */}
          <linearGradient id="ship_part_front" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%"  stopColor="#1e3a5a"/>
            <stop offset="100%" stopColor="#0a1828"/>
          </linearGradient>
          {/* Left/right edge vignette */}
          <linearGradient id="vignette_left" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#000508" stopOpacity="0.75"/>
            <stop offset="100%" stopColor="#000508" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="vignette_right" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%"   stopColor="#000508" stopOpacity="0.75"/>
            <stop offset="100%" stopColor="#000508" stopOpacity="0"/>
          </linearGradient>
          {/* Scanline filter */}
          <pattern id="scanlines" x="0" y="0" width={W} height="4" patternUnits="userSpaceOnUse">
            <rect width={W} height="4" fill="transparent"/>
            <rect width={W} height="1" y="3" fill="#2dd4bf" fillOpacity="0.022"/>
          </pattern>
          {/* Helmet oval clip */}
          <clipPath id="helmetOval">
            <ellipse cx={W/2} cy={H/2} rx={W*0.498} ry={H*0.498}/>
          </clipPath>
          {/* Glow filter */}
          <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Sky */}
        <rect width={W} height={H*0.44} fill="url(#pov_sky)"/>
        {/* Ground */}
        <rect y={H*0.44} width={W} height={H*0.56} fill="url(#pov_ground)"/>
        {/* Horizon glow */}
        <ellipse cx={W*0.5} cy={H*0.44} rx={W*0.55} ry={H*0.14} fill="url(#pov_horizon)"/>

        {/* ── Stars in sky ── */}
        {STAR_DATA.map((s, i) => (
          <circle key={`star-${i}`} cx={W*s.sx} cy={H*s.sy} r={s.r}
            fill="white" opacity={s.op}>
            <animate attributeName="opacity"
              values={`${s.v0};${s.v1};${s.v0}`}
              dur={s.dur}
              begin={s.begin}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* ── Perspective grid lines on ground ── */}
        {[-4,-3,-2,-1,0,1,2,3,4].map(i => {
          const vx = W*0.5 + i*(W*0.05)
          return (
            <line key={`vg-${i}`}
              x1={vx} y1={H*0.44}
              x2={W*0.5 + i*W*0.65} y2={H}
              stroke="#1c1408" strokeWidth={i === 0 ? 1 : 0.5} opacity={i === 0 ? 0.6 : 0.35}
            />
          )
        })}
        {[0, 0.2, 0.45, 0.75].map((t,i) => {
          const py = H*0.44 + t*(H*0.56)
          const hw = W*(0.03 + t*0.5)
          return (
            <line key={`hg-${i}`}
              x1={W*0.5-hw} y1={py} x2={W*0.5+hw} y2={py}
              stroke="#1c1408" strokeWidth="0.5" opacity={0.15+t*0.25}
            />
          )
        })}

        {/* ── LEFT side content (peeks in from left edge) ── */}
        <ZoneContent tile={leftTile} zone="left" W={W} H={H} />

        {/* ── RIGHT side content (peeks in from right edge) ── */}
        <ZoneContent tile={rightTile} zone="right" W={W} H={H} />

        {/* ── FRONT center content ── */}
        <ZoneContent tile={ahead} zone="front" W={W} H={H} />

        {/* ── Left/Right edge vignette — blends side content naturally ── */}
        <rect width={W*0.28} height={H} fill="url(#vignette_left)"/>
        <rect x={W*0.72} width={W*0.28} height={H} fill="url(#vignette_right)"/>

        {/* ── DIVIDER LINES — subtle borders separating zones ── */}
        {/* Left zone divider */}
        <line
          x1={W*0.3} y1={H*0.0}
          x2={W*0.3} y2={H}
          stroke="#a78bfa" strokeWidth="0.6" opacity="0.22"
          strokeDasharray="4 6"
        />
        {/* Right zone divider */}
        <line
          x1={W*0.7} y1={H*0.0}
          x2={W*0.7} y2={H}
          stroke="#a78bfa" strokeWidth="0.6" opacity="0.22"
          strokeDasharray="4 6"
        />

        {/* ── Scanlines overlay ── */}
        <rect width={W} height={H} fill="url(#scanlines)"/>

        {/* ── Crosshair / center reticle ── */}
        <line x1={W*0.5-18} y1={H*0.44} x2={W*0.5+18} y2={H*0.44}
          stroke="#2dd4bf" strokeWidth="1" opacity="0.5"/>
        <line x1={W*0.5} y1={H*0.44-18} x2={W*0.5} y2={H*0.44+18}
          stroke="#2dd4bf" strokeWidth="1" opacity="0.5"/>
        <circle cx={W*0.5} cy={H*0.44} r={5}
          fill="none" stroke="#2dd4bf" strokeWidth="0.8" opacity="0.45"/>
        <circle cx={W*0.5} cy={H*0.44} r={14}
          fill="none" stroke="#2dd4bf" strokeWidth="0.5" opacity="0.2"/>

        {/* ── HUD: Corner brackets ── */}
        {/* TL */}
        <path d={`M${W*0.04},${H*0.12} L${W*0.04},${H*0.06} L${W*0.12},${H*0.06}`}
          fill="none" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.7"/>
        {/* TR */}
        <path d={`M${W*0.88},${H*0.06} L${W*0.96},${H*0.06} L${W*0.96},${H*0.12}`}
          fill="none" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.7"/>
        {/* BL */}
        <path d={`M${W*0.04},${H*0.88} L${W*0.04},${H*0.94} L${W*0.12},${H*0.94}`}
          fill="none" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.7"/>
        {/* BR */}
        <path d={`M${W*0.88},${H*0.94} L${W*0.96},${H*0.94} L${W*0.96},${H*0.88}`}
          fill="none" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.7"/>
      </svg>

      {/* ── KID-FRIENDLY ZONE LABELS ── (HTML overlay for easy emoji + text) */}
      {/* LEFT ZONE LABEL */}
      <div style={{
        position: 'absolute',
        left: W * 0.03,
        top: H * 0.06,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 3,
        pointerEvents: 'none',
      }}>
        <div style={{
          background: `${leftTile.color}22`,
          border: `1.5px solid ${leftTile.color}55`,
          borderRadius: 10,
          padding: '5px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}>
          <span style={{ fontSize: 9, color: '#a78bfa', fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700 }}>
            ◀ MY LEFT
          </span>
          <span style={{ fontSize: 16 }}>{leftTile.emoji}</span>
          <span style={{
            fontSize: 8, color: leftTile.color,
            fontFamily: 'monospace', fontWeight: 700,
            letterSpacing: 1,
          }}>
            {leftTile.label}
          </span>
        </div>
      </div>

      {/* RIGHT ZONE LABEL */}
      <div style={{
        position: 'absolute',
        right: W * 0.03,
        top: H * 0.06,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 3,
        pointerEvents: 'none',
      }}>
        <div style={{
          background: `${rightTile.color}22`,
          border: `1.5px solid ${rightTile.color}55`,
          borderRadius: 10,
          padding: '5px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}>
          <span style={{ fontSize: 9, color: '#a78bfa', fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700 }}>
            MY RIGHT ▶
          </span>
          <span style={{ fontSize: 16 }}>{rightTile.emoji}</span>
          <span style={{
            fontSize: 8, color: rightTile.color,
            fontFamily: 'monospace', fontWeight: 700,
            letterSpacing: 1,
          }}>
            {rightTile.label}
          </span>
        </div>
      </div>

      {/* FRONT ZONE LABEL — bottom center */}
      <div style={{
        position: 'absolute',
        bottom: H * 0.05,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        pointerEvents: 'none',
      }}>
        <div style={{
          background: `${ahead.color}25`,
          border: `2px solid ${ahead.color}66`,
          borderRadius: 14,
          padding: '6px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: `0 0 20px ${ahead.color}33`,
        }}>
          <span style={{ fontSize: 20 }}>{ahead.emoji}</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
            <span style={{
              fontSize: 8, color: '#2dd4bf',
              fontFamily: 'monospace', letterSpacing: 2,
            }}>
              ▲ IN FRONT OF ME
            </span>
            <span style={{
              fontSize: 11, color: ahead.color,
              fontFamily: 'monospace', fontWeight: 900,
              letterSpacing: 1,
            }}>
              {ahead.label}
            </span>
          </div>
        </div>
      </div>

      {/* HUD header */}
      <div style={{
        position: 'absolute',
        top: H * 0.03,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(2,10,18,0.85)',
          border: '1px solid #2dd4bf44',
          borderRadius: 20,
          padding: '4px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 8, color: '#2dd4bf', fontFamily: 'monospace', letterSpacing: 3 }}>
            👁 LUMA'S HELMET CAM
          </span>
          <span style={{
            fontSize: 7, color: '#94a3b8',
            fontFamily: 'monospace', letterSpacing: 1,
          }}>
            FACING {dirLabel[luma.facing]}
          </span>
        </div>
      </div>

      {/* "TAP TO CLOSE" hint */}
      <motion.div
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          position: 'absolute',
          top: H * 0.03,
          right: W * 0.04,
          fontSize: 8,
          color: '#475569',
          fontFamily: 'monospace',
          letterSpacing: 1,
          pointerEvents: 'none',
        }}
      >
        TAP TO CLOSE ✕
      </motion.div>

      {/* Helmet oval frame overlay — gives a real helmet-visor feel */}
      <svg
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {/* Dark oval vignette around edges */}
        <defs>
          <radialGradient id="helmetVignette" cx="50%" cy="50%" r="50%">
            <stop offset="70%"  stopColor="transparent"/>
            <stop offset="100%" stopColor="rgba(0,2,6,0.4)"/>
          </radialGradient>
          {/* Animated CRT flicker */}
          <filter id="crtNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2"/>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.008"/>
            </feComponentTransfer>
            <feComposite in="SourceGraphic" operator="over"/>
          </filter>
        </defs>
        {/* Vignette */}
        <rect width={W} height={H} fill="url(#helmetVignette)"/>
        {/* CRT noise grain */}
        <rect width={W} height={H} filter="url(#crtNoise)" opacity="0.15"/>
        {/* Subtle green tint on edges for night-vision feel */}
        <rect width={W} height={H}
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="2"
          strokeOpacity="0.08"
          rx="12"
        />
      </svg>
    </motion.div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function GameGrid({
  levelConfig, luma, visorActive, onVisorClose,
  sptCorrect, collectedParts = new Set(), gridPx,
  predictionModeActive = false,
  predictionTile = null,
  predictionResult = null,
  onTileClick,
  // effectiveLevel: merged level with generated walls/objects (from useGameState)
  effectiveLevel,
}) {
  // Use effectiveLevel if provided, otherwise fall back to levelConfig
  const activeLevel = effectiveLevel ?? levelConfig
  const { grid, walls = [], objects = [], goal } = activeLevel
  const cols = grid?.cols ?? 5
  const rows = grid?.rows ?? 5

  const TILE_SIZE = gridPx ? Math.floor(gridPx / Math.max(cols, rows)) : DEFAULT_TILE_SIZE
  const gridWidth  = cols * TILE_SIZE
  const gridHeight = rows * TILE_SIZE

  // Always compute from activeLevel (effectiveLevel) so generated walls/objects are used
  const ahead     = getTileInDirection(luma, 'front', activeLevel)
  const leftTile  = getTileInDirection(luma, 'left',  activeLevel)
  const rightTile = getTileInDirection(luma, 'right', activeLevel)

  const predictionHighlight =
    predictionResult === 'correct' ? '#4ade80' :
    predictionResult === 'wrong'   ? '#fb7185' :
    '#38bdf8'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div style={{ fontSize:9, color:'#2dd4bf', fontFamily:'monospace', letterSpacing:3, opacity:0.5 }}>
        ◈ ORBITAL SCAN — CRASH SITE W1
      </div>

      <AnimatePresence>
        {predictionModeActive && !predictionTile && (
          <motion.div
            initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
            style={{
              fontSize:9, color:'#38bdf8', fontFamily:'monospace',
              letterSpacing:2, textAlign:'center',
              background:'rgba(56,189,248,0.08)',
              border:'1px solid #38bdf822',
              borderRadius:6, padding:'4px 12px',
            }}
          >
            🎯 TAP A TILE TO SET YOUR PREDICTION
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        position:'relative', width: gridWidth, height: gridHeight,
        borderRadius: 12, overflow: 'hidden',
        boxShadow:'0 0 60px rgba(45,212,191,0.08), 0 0 0 1.5px #1e2a42',
        cursor: predictionModeActive ? 'crosshair' : 'default',
      }}>
        <CrashSiteBackground width={gridWidth} height={gridHeight} cols={cols} rows={rows} />

        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const isWall  = walls.some(w => w.x === col && w.y === row)
            const isGoal  = goal && goal.x === col && goal.y === row
            const obj     = objects.find(o => o.x === col && o.y === row)
            const isPredicted = predictionTile && predictionTile.x === col && predictionTile.y === row
            return (
              <div
                key={`${col}-${row}`}
                onClick={() => predictionModeActive && onTileClick && onTileClick(col, row)}
                style={{
                  position:'absolute', left: col * TILE_SIZE, top: row * TILE_SIZE,
                  width: TILE_SIZE, height: TILE_SIZE, zIndex: 2,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >
                {isPredicted && (
                  <motion.div
                    initial={{ opacity:0, scale:0.7 }}
                    animate={{ opacity:1, scale:1 }}
                    style={{
                      position:'absolute', inset:4,
                      border:`2px solid ${predictionHighlight}`,
                      borderRadius:6,
                      background:`${predictionHighlight}18`,
                      zIndex:5,
                      pointerEvents:'none',
                      boxShadow:`0 0 16px ${predictionHighlight}44`,
                    }}
                  >
                    {[
                      { top:0, left:0,   borderTop:`2px solid ${predictionHighlight}`, borderLeft:`2px solid ${predictionHighlight}` },
                      { top:0, right:0,  borderTop:`2px solid ${predictionHighlight}`, borderRight:`2px solid ${predictionHighlight}` },
                      { bottom:0, left:0,  borderBottom:`2px solid ${predictionHighlight}`, borderLeft:`2px solid ${predictionHighlight}` },
                      { bottom:0, right:0, borderBottom:`2px solid ${predictionHighlight}`, borderRight:`2px solid ${predictionHighlight}` },
                    ].map((s,i) => (
                      <div key={i} style={{ position:'absolute', width:8, height:8, ...s }}/>
                    ))}
                    <span style={{
                      position:'absolute', top:'50%', left:'50%',
                      transform:'translate(-50%,-50%)',
                      fontSize:10, color: predictionHighlight,
                      fontFamily:'monospace',
                    }}>
                      {predictionResult === 'correct' ? '✓' : predictionResult === 'wrong' ? '✗' : '?'}
                    </span>
                  </motion.div>
                )}

                {predictionModeActive && !isPredicted && !isWall && (
                  <div style={{
                    position:'absolute', inset:0,
                    background:'rgba(56,189,248,0.04)',
                    zIndex:3, pointerEvents:'none',
                    transition:'background 0.1s',
                  }}/>
                )}

                {isWall && <div style={{ filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}><RockObstacle /></div>}
                {isGoal && !isWall && <GoalBeacon />}
                {obj?.type === 'ship_part' && !isWall && !isGoal && (() => {
                  const partIndex = objects.filter(o => o.type === 'ship_part').findIndex(p => p.x === col && p.y === row)
                  const isCollected = collectedParts.has(partIndex)
                  if (isCollected) return null
                  return (
                    <motion.div
                      animate={{ y:[0,-4,0], rotate:[-2,2,-2], scale:[1,1.05,1] }}
                      transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
                      style={{ filter:'drop-shadow(0 0 12px rgba(56,200,255,0.7))' }}
                    ><ShipPart /></motion.div>
                  )
                })()}
                {obj?.type === 'rock' && !isWall && !isGoal && (
                  <div style={{ filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.7))' }}><RockObstacle /></div>
                )}
              </div>
            )
          })
        )}

        {levelConfig.fog && (
          <FogOverlay
            gridWidth={gridWidth} gridHeight={gridHeight}
            cols={cols} rows={rows}
            luma={luma} sptCorrect={sptCorrect}
          />
        )}

        <div style={{ position:'absolute', inset:0, zIndex:7, pointerEvents:'none' }}>
          <LumaSprite x={luma.x} y={luma.y} rotateDeg={luma.rotateDeg ?? 0} tileSize={TILE_SIZE} showFacing={sptCorrect || !!levelConfig.skipIdentify} />
        </div>

        <AnimatePresence>
          {visorActive && (
            <VisorView
              ahead={ahead}
              leftTile={leftTile}
              rightTile={rightTile}
              luma={luma}
              gridWidth={gridWidth}
              gridHeight={gridHeight}
              onClose={onVisorClose}
            />
          )}
        </AnimatePresence>
      </div>

      <div style={{ fontSize:9, color:'#1e3040', fontFamily:'monospace', letterSpacing:2 }}>
        LUMA [{luma.x},{luma.y}]{sptCorrect ? ` · ${luma.facing.toUpperCase()}` : ' · FACING UNKNOWN'}
      </div>
    </div>
  )
}