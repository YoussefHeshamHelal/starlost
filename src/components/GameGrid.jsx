// GameGrid.jsx
import { useContext } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LumaSprite from './LumaSprite'
import CrashSiteBackground from './CrashSiteBackground'
import ForestTrailBackground from './ForestTrailBackground'
import RepairSiteBackground from './RepairSiteBackground'
import { ThemeContext } from '../context/theme'

const DEFAULT_TILE_SIZE = 104

const DIRECTIONS = ['north', 'east', 'south', 'west']
const MOVE_DELTAS = { north:[0,-1], east:[1,0], south:[0,1], west:[-1,0] }

// Get what's in a specific relative direction from LUMA
function getTileInDirection(luma, relDir, level) {
  const { grid, walls = [], objects = [], goal } = level
  const forestObstacle = level.world === 'forest-trail'
    ? { type: 'forest_tree', label: 'FOREST TREE!', emoji: '\u{1F332}', color: '#65a30d' }
    : { type: 'rock', label: 'BIG ROCK!', emoji: '🪨', color: '#c0845a' }
  const worldObstacle = level.world === 'repair-site'
    ? { type: 'repair_box', label: 'REPAIR BOX!', emoji: '\u{1F4E6}', color: '#38bdf8' }
    : forestObstacle
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
    return worldObstacle
  if (goal && goal.x === ax && goal.y === ay)
    return { type: 'goal', label: 'SHIP CORE!', emoji: '⭐', color: '#f59e0b' }
  const obj = objects.find(o => o.x === ax && o.y === ay)
  if (obj?.type === 'ship_part')
    return { type: 'ship_part', label: 'SHIP PIECE!', emoji: '🛸', color: '#38bdf8' }
  if (obj?.type === 'rock')
    return worldObstacle
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

function CargoCrateObstacle() {
  return (
    <svg width={68} height={58} viewBox="0 0 68 58" fill="none">
      <defs>
        <linearGradient id="crate_top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9fb7c7" />
          <stop offset="55%" stopColor="#5f788c" />
          <stop offset="100%" stopColor="#283b4c" />
        </linearGradient>
        <linearGradient id="crate_front" x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#7892a5" />
          <stop offset="52%" stopColor="#40576a" />
          <stop offset="100%" stopColor="#172535" />
        </linearGradient>
        <linearGradient id="crate_side" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#526b7f" />
          <stop offset="100%" stopColor="#101c2a" />
        </linearGradient>
        <radialGradient id="crate_glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <filter id="crate_shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#020617" floodOpacity="0.62" />
        </filter>
      </defs>
      <ellipse cx="35" cy="53" rx="27" ry="5" fill="#020617" opacity="0.48" />
      <g filter="url(#crate_shadow)">
        <path d="M12 17 L28 7 L56 14 L40 25 Z" fill="url(#crate_top)" stroke="#b7d4e6" strokeWidth="1.2" />
        <path d="M12 17 L40 25 L40 48 L12 39 Z" fill="url(#crate_front)" stroke="#b7d4e6" strokeWidth="1.2" />
        <path d="M40 25 L56 14 L56 38 L40 48 Z" fill="url(#crate_side)" stroke="#8fb6cc" strokeWidth="1.2" />
        <path d="M18 21 L34 26 L34 40 L18 35 Z" fill="#102132" opacity="0.34" />
        <path d="M44 27 L52 22 L52 34 L44 39 Z" fill="#071522" opacity="0.38" />
        <path d="M12 28 L40 37 M22 20 L22 42 M31 23 L31 45 M40 25 L40 48" stroke="#dff7ff" strokeOpacity="0.2" strokeWidth="1" />
        <path d="M17 14 L45 21" stroke="#e0f2fe" strokeOpacity="0.36" strokeWidth="1.3" />
        <rect x="21" y="28" width="12" height="4" rx="1.3" transform="rotate(16 21 28)" fill="#67e8f9" opacity="0.76" />
        <circle cx="47" cy="31" r="7" fill="url(#crate_glow)" opacity="0.55">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="47" cy="31" r="2.2" fill="#e0faff" />
      </g>
    </svg>
  )
}

function CollectionBurst({ effect, tileSize, theme }) {
  if (!effect.carriesPart) return null

  const left = effect.x * tileSize
  const top = effect.y * tileSize
  const glow = theme === 'light' ? '#0ea5e9' : '#67e8f9'
  const core = theme === 'light' ? '#fef08a' : '#ecfeff'
  const sparks = [
    { x: -26, y: -20, delay: 0 },
    { x: 24, y: -24, delay: 0.03 },
    { x: -20, y: 22, delay: 0.06 },
    { x: 28, y: 18, delay: 0.09 },
    { x: 0, y: -32, delay: 0.12 },
    { x: -34, y: 2, delay: 0.15 },
  ]

  return (
    <motion.div
      key={effect.id}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.82, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left,
        top,
        width: tileSize,
        height: tileSize,
        zIndex: 8,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.55, opacity: 0.9 }}
        animate={{ scale: 2.1, opacity: 0 }}
        transition={{ duration: 0.48, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: 46,
          height: 46,
          borderRadius: '50%',
          border: `2px solid ${glow}`,
          boxShadow: `0 0 18px ${glow}88, inset 0 0 14px ${core}66`,
        }}
      />
      <motion.div
        initial={{ y: 0, scale: 1, rotate: -8, opacity: 1 }}
        animate={{ y: -18, scale: 0.22, rotate: 28, opacity: 0 }}
        transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
        style={{ filter: `drop-shadow(0 0 16px ${glow})` }}
      >
        <ShipPart />
      </motion.div>
      <motion.div
        initial={{ scale: 0.1, opacity: 0.95 }}
        animate={{ scale: 1.55, opacity: 0 }}
        transition={{ duration: 0.36, delay: 0.16, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${core} 0%, ${glow} 42%, transparent 72%)`,
          boxShadow: `0 0 24px ${glow}`,
        }}
      />
      {sparks.map((spark, index) => (
        <motion.span
          key={index}
          initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
          animate={{ x: spark.x, y: spark.y, scale: 0, opacity: 0 }}
          transition={{ duration: 0.52, delay: spark.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: index % 2 === 0 ? core : glow,
            boxShadow: `0 0 10px ${glow}`,
          }}
        />
      ))}
    </motion.div>
  )
}

function IfPathSignal({ signal, tileSize }) {
  if (!signal) return null

  const facingIndex = DIRECTIONS.indexOf(signal.from.facing)
  const offset = signal.condition === 'left' ? -1 : signal.condition === 'right' ? 1 : 0
  const absoluteDirection = DIRECTIONS[(facingIndex + offset + DIRECTIONS.length) % DIRECTIONS.length]
  const angleByDirection = { east: 0, south: 90, west: 180, north: -90 }
  const [dx, dy] = MOVE_DELTAS[absoluteDirection]
  const originX = (signal.from.x + 0.5) * tileSize + dx * tileSize * 0.18
  const originY = (signal.from.y + 0.5) * tileSize + dy * tileSize * 0.18
  const unit = tileSize / 104
  const strokeWidth = Math.max(4, tileSize * 0.045)
  const viewBoxSize = 84
  const stroke = '#2dd4bf'
  const glow = '#67e8f9'
  const paths = [
    'M 10 -8 Q 22 0 10 8',
    'M 18 -13 Q 36 0 18 13',
    'M 26 -18 Q 50 0 26 18',
  ]

  return (
    <svg
      key={signal.id}
      width={tileSize * 1.35}
      height={tileSize * 1.35}
      viewBox={`${-viewBoxSize / 2} ${-viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`}
      style={{
        position: 'absolute',
        left: originX,
        top: originY,
        transform: 'translate(-50%, -50%)',
        zIndex: 8,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        <filter id={`if-path-glow-${signal.id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform={`rotate(${angleByDirection[absoluteDirection]}) scale(${unit})`} filter={`url(#if-path-glow-${signal.id})`}>
        {paths.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth / unit}
            strokeLinecap="round"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: [0, 1, 0], scale: [0.85, 1, 1.08] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              filter: `drop-shadow(0 0 5px ${glow})`,
            }}
          />
        ))}
      </g>
    </svg>
  )
}

function ForestTreeObstacle() {
  return (
    <svg width={66} height={66} viewBox="0 0 66 66" fill="none">
      <defs>
        <linearGradient id="tree_trunk" x1="0.18" y1="0" x2="0.82" y2="1">
          <stop offset="0%" stopColor="#9a6732"/>
          <stop offset="44%" stopColor="#5c371b"/>
          <stop offset="100%" stopColor="#251206"/>
        </linearGradient>
        <linearGradient id="tree_bark" x1="0.1" y1="0" x2="0.9" y2="0">
          <stop offset="0%" stopColor="#c58a45" stopOpacity="0.76"/>
          <stop offset="52%" stopColor="#4b2b14" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#1b0e05" stopOpacity="0.72"/>
        </linearGradient>
        <linearGradient id="tree_leaf_mass" x1="0.25" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#a9e96a"/>
          <stop offset="38%" stopColor="#4f9b3d"/>
          <stop offset="72%" stopColor="#246836"/>
          <stop offset="100%" stopColor="#103b24"/>
        </linearGradient>
        <linearGradient id="tree_leaf_dark" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#4f9c40"/>
          <stop offset="55%" stopColor="#236233"/>
          <stop offset="100%" stopColor="#0d2d1c"/>
        </linearGradient>
        <radialGradient id="tree_leaf_highlight" cx="38%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#d5ff8a" stopOpacity="0.72"/>
          <stop offset="58%" stopColor="#8bd65f" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#234f2c" stopOpacity="0"/>
        </radialGradient>
        <filter id="tree_shadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#06140a" floodOpacity="0.72"/>
        </filter>
      </defs>
      <ellipse cx="34" cy="60" rx="23" ry="5" fill="#071207" opacity="0.52"/>
      <g filter="url(#tree_shadow)">
        <path
          d="M25 58 C27 49 28 40 27 31 C30 33 34 33 38 31 C37 41 38 50 42 58 Z"
          fill="url(#tree_trunk)"
          stroke="#211105"
          strokeWidth="1.2"
        />
        <path d="M32 58 C29 48 33 41 31 31" stroke="url(#tree_bark)" strokeWidth="1.7" strokeLinecap="round" opacity="0.92"/>
        <path d="M38 56 C34 47 37 39 36 31" stroke="#281407" strokeWidth="1.1" strokeLinecap="round" opacity="0.78"/>
        <path d="M27 56 C22 57 18 60 14 63" stroke="#3c2815" strokeWidth="3.2" strokeLinecap="round" opacity="0.82"/>
        <path d="M40 56 C46 57 50 60 54 63" stroke="#3c2815" strokeWidth="3.2" strokeLinecap="round" opacity="0.82"/>
        <path
          d="M11 37 C8 28 13 21 22 19 C22 10 29 5 37 7 C43 5 51 10 52 18 C60 22 61 32 54 39 C56 47 46 52 38 48 C32 53 22 51 19 44 C14 44 11 41 11 37 Z"
          fill="url(#tree_leaf_dark)"
          stroke="#0d2f1a"
          strokeWidth="1.2"
        />
        <path
          d="M15 34 C14 27 19 22 27 22 C27 14 33 10 40 12 C46 12 51 17 51 24 C56 27 56 35 50 39 C48 45 39 46 34 43 C28 47 20 44 20 38 C17 38 15 36 15 34 Z"
          fill="url(#tree_leaf_mass)"
          opacity="0.94"
        />
        <path
          d="M19 27 C23 19 31 17 38 19 C43 18 48 21 50 27 C42 24 33 23 25 25 C22 25 20 26 19 27 Z"
          fill="url(#tree_leaf_highlight)"
        />
        <path d="M18 36 C25 32 34 31 46 34" stroke="#c7f68b" strokeWidth="1.35" strokeLinecap="round" opacity="0.34"/>
        <path d="M25 23 C31 20 38 20 45 24" stroke="#e5ffad" strokeWidth="1.1" strokeLinecap="round" opacity="0.36"/>
        <path d="M26 43 C31 40 38 40 44 43" stroke="#a7e86b" strokeWidth="1" strokeLinecap="round" opacity="0.26"/>
        <path d="M16 46 C19 43 22 42 25 43" stroke="#68b857" strokeWidth="2" strokeLinecap="round" opacity="0.82"/>
        <path d="M48 46 C51 43 54 42 58 43" stroke="#68b857" strokeWidth="2" strokeLinecap="round" opacity="0.74"/>
      </g>
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
function VisorRepairBox({ zone, W, H }) {
  const isFront = zone === 'front'
  const isLeft = zone === 'left'
  const cx = isFront ? W * 0.5 : isLeft ? W * 0.06 : W * 0.94
  const cy = isFront ? H * 0.45 : H * 0.48
  const scale = isFront ? 1.35 : 1.18
  const s = Math.min(W, H) * (isFront ? 0.23 : 0.22)
  const mirror = !isFront
  const u = s * scale
  const point = (x, y) => ({ x: cx + x * u, y: cy + y * u })
  const path = points => points.map((pt, index) => `${index === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ') + ' Z'
  const topLeft = point(-0.62, -0.18)
  const topBack = point(-0.18, -0.48)
  const topRightBack = point(0.64, -0.28)
  const topRight = point(0.24, 0.08)
  const bottomLeft = point(-0.62, 0.62)
  const bottomRight = point(0.24, 0.86)
  const sideBottom = point(0.64, 0.56)
  const shadowCenter = point(0.04, isFront ? 0.99 : 0.94)
  const panel = point(-0.44, 0.1)
  const glow = point(0.36, 0.08)
  const labelStart = point(-0.35, -0.31)
  const labelEnd = point(0.3, -0.12)

  return (
    <g transform={mirror ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}>
      <ellipse cx={shadowCenter.x} cy={shadowCenter.y} rx={u * (isFront ? 0.6 : 0.58)} ry={u * (isFront ? 0.105 : 0.11)} fill="#020617" opacity={isFront ? 0.48 : 0.54} />
      <g filter="url(#visor_box_shadow)">
        <path
          d={path([topLeft, topBack, topRightBack, topRight])}
          fill="url(#box_front_top)"
          stroke="#dbeafe"
          strokeWidth={isFront ? 2 : 1.5}
        />
        <path
          d={path([topLeft, topRight, bottomRight, bottomLeft])}
          fill="url(#box_front_face)"
          stroke="#dbeafe"
          strokeWidth={isFront ? 2 : 1.5}
        />
        <path
          d={path([topRight, topRightBack, sideBottom, bottomRight])}
          fill="url(#box_front_side)"
          stroke="#93c5fd"
          strokeWidth={isFront ? 2 : 1.5}
        />
        <path
          d={`M${topLeft.x + u * 0.11},${topLeft.y + u * 0.18} L${topRight.x - u * 0.18},${topRight.y + u * 0.16}
              M${topLeft.x + u * 0.08},${topLeft.y + u * 0.44} L${topRight.x - u * 0.08},${topRight.y + u * 0.52}
              M${topRight.x},${topRight.y} L${bottomRight.x},${bottomRight.y}`}
          stroke="#e0f2fe"
          strokeOpacity="0.24"
          strokeWidth={isFront ? 2 : 1.4}
          strokeLinecap="round"
        />
        <rect
          x={panel.x}
          y={panel.y}
          width={u * 0.22}
          height={u * 0.08}
          rx={u * 0.025}
          fill="#67e8f9"
          opacity="0.75"
          transform={`rotate(11 ${panel.x} ${panel.y})`}
        />
        <circle cx={glow.x} cy={glow.y} r={u * 0.085} fill="url(#box_light_glow)" opacity="0.72">
          <animate attributeName="opacity" values="0.32;0.78;0.32" dur="1.7s" repeatCount="indefinite" />
        </circle>
        <circle cx={glow.x} cy={glow.y} r={u * 0.026} fill="#e0faff" />
        <path
          d={`M${labelStart.x},${labelStart.y} L${labelEnd.x},${labelEnd.y}`}
          stroke="#e0f2fe"
          strokeOpacity="0.38"
          strokeWidth={isFront ? 1.8 : 1.2}
          strokeLinecap="round"
        />
      </g>
    </g>
  )
}

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

  if (tile.type === 'forest_tree') {
    if (isFront) {
      return (
        <g transform={`translate(${W * 0.5} ${H * 0.04}) scale(0.56 0.86) translate(${-W * 0.5} 0)`}>
          <ellipse cx={W * 0.5} cy={H * 0.93} rx={W * 0.29} ry={H * 0.055} fill="#020b04" opacity="0.64"/>
          <path
            d={`M${W * 0.39},${H} C${W * 0.43},${H * 0.76} ${W * 0.43},${H * 0.5} ${W * 0.42},${H * 0.25}
                C${W * 0.47},${H * 0.29} ${W * 0.54},${H * 0.29} ${W * 0.59},${H * 0.25}
                C${W * 0.57},${H * 0.5} ${W * 0.59},${H * 0.76} ${W * 0.64},${H} Z`}
            fill="url(#tree_front_trunk)" stroke="#140a04" strokeWidth="2"
          />
          <path d={`M${W * 0.48},${H * 0.96} C${W * 0.44},${H * 0.72} ${W * 0.51},${H * 0.5} ${W * 0.48},${H * 0.27}`}
            stroke="#2b1708" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7"/>
          <path d={`M${W * 0.56},${H * 0.95} C${W * 0.52},${H * 0.73} ${W * 0.55},${H * 0.47} ${W * 0.55},${H * 0.27}`}
            stroke="#7a4a24" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.55"/>
          <path d={`M${W * 0.42},${H * 0.92} C${W * 0.32},${H * 0.95} ${W * 0.22},${H * 0.99} ${W * 0.13},${H}`}
            stroke="#2b190b" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.8"/>
          <path d={`M${W * 0.59},${H * 0.92} C${W * 0.7},${H * 0.94} ${W * 0.8},${H * 0.98} ${W * 0.9},${H}`}
            stroke="#2b190b" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.8"/>
          <path
            d={`M${W * 0.18},${H * 0.39} C${W * 0.1},${H * 0.27} ${W * 0.2},${H * 0.16} ${W * 0.34},${H * 0.17}
                C${W * 0.35},${H * 0.05} ${W * 0.49},${H * 0.02} ${W * 0.58},${H * 0.1}
                C${W * 0.72},${H * 0.1} ${W * 0.82},${H * 0.22} ${W * 0.76},${H * 0.35}
                C${W * 0.84},${H * 0.47} ${W * 0.72},${H * 0.58} ${W * 0.57},${H * 0.53}
                C${W * 0.48},${H * 0.62} ${W * 0.31},${H * 0.57} ${W * 0.29},${H * 0.47}
                C${W * 0.23},${H * 0.48} ${W * 0.19},${H * 0.45} ${W * 0.18},${H * 0.39} Z`}
            fill="url(#tree_front_leaf)"
            stroke="#0e2f17"
            strokeWidth="2"
          />
          <path
            d={`M${W * 0.26},${H * 0.35} C${W * 0.26},${H * 0.25} ${W * 0.37},${H * 0.2} ${W * 0.48},${H * 0.23}
                C${W * 0.56},${H * 0.18} ${W * 0.69},${H * 0.23} ${W * 0.71},${H * 0.34}
                C${W * 0.66},${H * 0.42} ${W * 0.55},${H * 0.42} ${W * 0.49},${H * 0.39}
                C${W * 0.42},${H * 0.45} ${W * 0.3},${H * 0.43} ${W * 0.26},${H * 0.35} Z`}
            fill="url(#tree_front_leaf_alt)"
            opacity="0.72"
          />
          <path d={`M${W * 0.25},${H * 0.32} C${W * 0.37},${H * 0.21} ${W * 0.57},${H * 0.2} ${W * 0.69},${H * 0.3}`}
            stroke="#d9f99d" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.38"/>
          <path d={`M${W * 0.27},${H * 0.46} C${W * 0.39},${H * 0.41} ${W * 0.55},${H * 0.42} ${W * 0.68},${H * 0.48}`}
            stroke="#a7f3d0" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.26"/>
        </g>
      )
    }

    return (
      <g transform={isLeft
        ? `translate(${-W * 0.095} 0) scale(0.56 0.96)`
        : `translate(${W * 1.095} 0) scale(0.56 0.96) translate(${-W} 0)`
      }>
        <ellipse cx={isLeft ? W * 0.13 : W * 0.87} cy={H * 0.94} rx={W * 0.2} ry={H * 0.05} fill="#020b04" opacity="0.58"/>
        <path
          d={isLeft
            ? `M0,${H} C${W * 0.03},${H * 0.78} ${W * 0.04},${H * 0.52} ${W * 0.035},${H * 0.24}
               C${W * 0.07},${H * 0.2} ${W * 0.13},${H * 0.2} ${W * 0.18},${H * 0.24}
               C${W * 0.15},${H * 0.48} ${W * 0.17},${H * 0.76} ${W * 0.25},${H} Z`
            : `M${W},${H} C${W * 0.97},${H * 0.78} ${W * 0.96},${H * 0.52} ${W * 0.965},${H * 0.24}
               C${W * 0.93},${H * 0.2} ${W * 0.87},${H * 0.2} ${W * 0.82},${H * 0.24}
               C${W * 0.85},${H * 0.48} ${W * 0.83},${H * 0.76} ${W * 0.75},${H} Z`
          }
          fill="url(#tree_front_trunk)" stroke="#140a04" strokeWidth="1.4"
        />
        <path
          d={isLeft
            ? `M${W * 0.08},${H * 0.94} C${W * 0.05},${H * 0.7} ${W * 0.09},${H * 0.47} ${W * 0.08},${H * 0.25}`
            : `M${W * 0.92},${H * 0.94} C${W * 0.95},${H * 0.7} ${W * 0.91},${H * 0.47} ${W * 0.92},${H * 0.25}`
          }
          stroke="#2b1708"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.72"
        />
        <path
          d={isLeft
            ? `M${W * 0.16},${H * 0.9} C${W * 0.23},${H * 0.94} ${W * 0.3},${H * 0.98} ${W * 0.35},${H}`
            : `M${W * 0.84},${H * 0.9} C${W * 0.77},${H * 0.94} ${W * 0.7},${H * 0.98} ${W * 0.65},${H}`
          }
          stroke="#2b190b"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <path
          d={isLeft
            ? `M0,${H * 0.49} C0,${H * 0.32} ${W * 0.04},${H * 0.17} ${W * 0.17},${H * 0.16}
               C${W * 0.18},${H * 0.06} ${W * 0.31},${H * 0.05} ${W * 0.38},${H * 0.13}
               C${W * 0.49},${H * 0.13} ${W * 0.54},${H * 0.27} ${W * 0.47},${H * 0.38}
               C${W * 0.5},${H * 0.5} ${W * 0.37},${H * 0.59} ${W * 0.24},${H * 0.52}
               C${W * 0.14},${H * 0.59} ${W * 0.04},${H * 0.56} 0,${H * 0.49} Z`
            : `M${W},${H * 0.49} C${W},${H * 0.32} ${W * 0.96},${H * 0.17} ${W * 0.83},${H * 0.16}
               C${W * 0.82},${H * 0.06} ${W * 0.69},${H * 0.05} ${W * 0.62},${H * 0.13}
               C${W * 0.51},${H * 0.13} ${W * 0.46},${H * 0.27} ${W * 0.53},${H * 0.38}
               C${W * 0.5},${H * 0.5} ${W * 0.63},${H * 0.59} ${W * 0.76},${H * 0.52}
               C${W * 0.86},${H * 0.59} ${W * 0.96},${H * 0.56} ${W},${H * 0.49} Z`
          }
          fill="url(#tree_front_leaf)"
          stroke="#0e2f17"
          strokeWidth="1.4"
        />
        <path
          d={isLeft
            ? `M${W * 0.03},${H * 0.38} C${W * 0.08},${H * 0.27} ${W * 0.2},${H * 0.22} ${W * 0.31},${H * 0.27}
               C${W * 0.39},${H * 0.25} ${W * 0.46},${H * 0.32} ${W * 0.44},${H * 0.41}
               C${W * 0.34},${H * 0.47} ${W * 0.18},${H * 0.46} ${W * 0.03},${H * 0.38} Z`
            : `M${W * 0.97},${H * 0.38} C${W * 0.92},${H * 0.27} ${W * 0.8},${H * 0.22} ${W * 0.69},${H * 0.27}
               C${W * 0.61},${H * 0.25} ${W * 0.54},${H * 0.32} ${W * 0.56},${H * 0.41}
               C${W * 0.66},${H * 0.47} ${W * 0.82},${H * 0.46} ${W * 0.97},${H * 0.38} Z`
          }
          fill="url(#tree_front_leaf_alt)"
          opacity="0.66"
        />
        <path
          d={isLeft
            ? `M${W * 0.04},${H * 0.33} C${W * 0.15},${H * 0.22} ${W * 0.32},${H * 0.22} ${W * 0.43},${H * 0.34}`
            : `M${W * 0.96},${H * 0.33} C${W * 0.85},${H * 0.22} ${W * 0.68},${H * 0.22} ${W * 0.57},${H * 0.34}`
          }
          stroke="#d9f99d"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />
        <path
          d={isLeft
            ? `M${W * 0.05},${H * 0.5} C${W * 0.17},${H * 0.44} ${W * 0.31},${H * 0.45} ${W * 0.43},${H * 0.51}`
            : `M${W * 0.95},${H * 0.5} C${W * 0.83},${H * 0.44} ${W * 0.69},${H * 0.45} ${W * 0.57},${H * 0.51}`
          }
          stroke="#a7f3d0"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.24"
        />
      </g>
    )
  }

  if (tile.type === 'repair_box') {
    return <VisorRepairBox zone={zone} W={W} H={H} />
  }

  if (tile.type === 'rock' || tile.type === 'boundary') {
    if (isFront) {
      return (
        <g transform={`translate(${W * 0.5} ${H * 0.18}) scale(0.46 0.58) translate(${-W * 0.5} 0)`}>
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
      <g transform={isLeft
        ? `translate(${-W * 0.04} 0) scale(0.88 1)`
        : `translate(${W * 1.04} 0) scale(0.88 1) translate(${-W} 0)`
      }>
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
          <ellipse cx={W*0.5} cy={H*0.43} rx={W*0.18} ry={H*0.04} fill="#38bdf8" opacity="0.14">
            <animate attributeName="opacity" values="0.08;0.24;0.08" dur="1.5s" repeatCount="indefinite"/>
          </ellipse>
          {/* Ship fragment floating */}
          <g transform={`translate(${W*0.34}, ${H*0.115})`}>
            <animate attributeName="transform"
              values={`translate(${W*0.34}, ${H*0.115}); translate(${W*0.34}, ${H*0.095}); translate(${W*0.34}, ${H*0.115})`}
              dur="2s" repeatCount="indefinite"/>
            <ellipse cx={W*0.16} cy={H*0.13} rx={W*0.18} ry={H*0.16} fill="url(#ship_fragment_glow)" opacity="0.55"/>
            <path d={`M0,${H*0.16} L${W*0.08},${H*0.02} L${W*0.21},${H*0.035} L${W*0.29},${H*0.13} L${W*0.24},${H*0.24} L${W*0.06},${H*0.25} Z`}
              fill="url(#ship_part_front)" stroke="#38bdf8" strokeWidth="2"/>
            <path d={`M${W*0.035},${H*0.16} L${W*0.11},${H*0.08} L${W*0.2},${H*0.09} L${W*0.255},${H*0.14}`}
              stroke="#7dd3fc" strokeWidth="1.4" fill="none" opacity="0.65"/>
            <path d={`M${W*0.07},${H*0.24} L${W*0.16},${H*0.16} L${W*0.24},${H*0.23}`}
              stroke="#0ea5e9" strokeWidth="1.2" fill="none" opacity="0.55"/>
            <circle cx={W*0.215} cy={H*0.085} r={W*0.032} fill="#38bdf8" opacity="0.8">
              <animate attributeName="opacity" values="0.4;1;0.5;0.9;0.4" dur="1.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx={W*0.215} cy={H*0.085} r={W*0.014} fill="#e0faff"/>
            <circle cx={W*0.1} cy={H*0.12} r={W*0.012} fill="#071927" stroke="#7dd3fc" strokeWidth="1"/>
            <circle cx={W*0.18} cy={H*0.205} r={W*0.01} fill="#071927" stroke="#38bdf8" strokeWidth="0.9"/>
          </g>
          {/* Glow on ground */}
          <ellipse cx={W*0.5} cy={H*0.47} rx={W*0.17} ry={H*0.032} fill="#38bdf8" opacity="0.18">
            <animate attributeName="opacity" values="0.1;0.28;0.1" dur="1.5s" repeatCount="indefinite"/>
          </ellipse>
        </g>
      )
    }
    // Side ship part — glowing on the edge
    return (
      <g transform={isLeft
        ? `translate(${-W * 0.075} 0) scale(0.82 1)`
        : `translate(${W * 1.075} 0) scale(0.82 1) translate(${-W} 0)`
      }>
        <ellipse cx={isLeft ? W*0.11 : W*0.89} cy={H*0.36} rx={W*0.15} ry={H*0.13} fill="url(#ship_fragment_glow)" opacity="0.65">
          <animate attributeName="opacity" values="0.35;0.78;0.35" dur="1.5s" repeatCount="indefinite"/>
        </ellipse>
        <path
          d={isLeft
            ? `M0,${H*0.45} L${W*0.07},${H*0.22} L${W*0.24},${H*0.17} L${W*0.34},${H*0.32}
               L${W*0.26},${H*0.5} L${W*0.08},${H*0.55} Z`
            : `M${W},${H*0.45} L${W*0.93},${H*0.22} L${W*0.76},${H*0.17} L${W*0.66},${H*0.32}
               L${W*0.74},${H*0.5} L${W*0.92},${H*0.55} Z`
          }
          fill="url(#ship_part_front)"
          stroke="#38bdf8"
          strokeWidth="1.8"
        />
        <path
          d={isLeft
            ? `M${W*0.03},${H*0.44} L${W*0.11},${H*0.28} L${W*0.25},${H*0.24} M${W*0.09},${H*0.53} L${W*0.18},${H*0.38} L${W*0.3},${H*0.34}`
            : `M${W*0.97},${H*0.44} L${W*0.89},${H*0.28} L${W*0.75},${H*0.24} M${W*0.91},${H*0.53} L${W*0.82},${H*0.38} L${W*0.7},${H*0.34}`
          }
          stroke="#7dd3fc"
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
          opacity="0.68"
        />
        <circle cx={isLeft ? W*0.24 : W*0.76} cy={H*0.27} r={W*0.028} fill="#38bdf8" opacity="0.9">
          <animate attributeName="opacity" values="0.45;1;0.45" dur="1.1s" repeatCount="indefinite"/>
        </circle>
        <circle cx={isLeft ? W*0.24 : W*0.76} cy={H*0.27} r={W*0.012} fill="#e0faff"/>
        <ellipse cx={isLeft ? W*0.17 : W*0.83} cy={H*0.57} rx={W*0.12} ry={H*0.025} fill="#38bdf8" opacity="0.14"/>
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
          <ellipse cx={W*0.5} cy={H*0.38} rx={W*0.15} ry={H*0.13} fill="url(#ship_core_glow)" opacity="0.36"/>
          {[1, 1.48, 2.1].map((scale, i) => (
            <circle key={i} cx={W*0.5} cy={H*0.35} r={W*0.056*scale}
              fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.28">
              <animate attributeName="r"
                values={`${W*0.048*scale};${W*0.068*scale};${W*0.048*scale}`}
                dur="2s" begin={`${i*0.42}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity"
                values="0.35;0.06;0.35" dur="2s" begin={`${i*0.42}s`} repeatCount="indefinite"/>
            </circle>
          ))}
          <circle cx={W*0.5} cy={H*0.35} r={W*0.09} fill="#1a1008" stroke="#f59e0b" strokeWidth="2.2"/>
          <circle cx={W*0.5} cy={H*0.35} r={W*0.058} fill="url(#ship_core_map)" filter="url(#glowFilter)">
            <animate attributeName="opacity" values="0.72;1;0.72" dur="1.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx={W*0.5} cy={H*0.35} r={W*0.027} fill="#fcd34d"/>
          <path d={`M${W*0.458},${H*0.315} Q${W*0.5},${H*0.29} ${W*0.542},${H*0.315}`}
            stroke="#fff7c2" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.78"/>
          {[0, 90, 180, 270].map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            return (
              <circle key={i}
                cx={W*0.5 + W*0.076*Math.cos(rad)}
                cy={H*0.35 + W*0.076*Math.sin(rad)}
                r={W*0.012}
                fill="#1a1008"
                stroke="#f59e0b"
                strokeWidth="0.9"
              />
            )
          })}
          <ellipse cx={W*0.5} cy={H*0.5} rx={W*0.15} ry={H*0.032} fill="#f59e0b" opacity="0.2">
            <animate attributeName="opacity" values="0.12;0.3;0.12" dur="1.8s" repeatCount="indefinite"/>
          </ellipse>
        </g>
      )
    }
    return (
      <g transform={isLeft
        ? `translate(${-W * 0.17} ${-H * 0.035}) scale(1.42 1.42)`
        : `translate(${-W * 0.25} ${-H * 0.035}) scale(1.42 1.42)`
      }>
        <ellipse cx={isLeft ? W*0.14 : W*0.86} cy={H*0.36} rx={W*0.1} ry={H*0.12} fill="url(#ship_core_glow)" opacity="0.42">
          <animate attributeName="opacity" values="0.32;0.74;0.32" dur="2s" repeatCount="indefinite"/>
        </ellipse>
        {[1, 1.55].map((scale, i) => (
          <circle key={i} cx={isLeft ? W*0.15 : W*0.85} cy={H*0.35} r={W*0.042*scale}
            fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.24">
            <animate attributeName="r"
              values={`${W*0.034*scale};${W*0.052*scale};${W*0.034*scale}`}
              dur="2s" begin={`${i*0.35}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity"
              values="0.35;0;0.35" dur="2s" begin={`${i*0.35}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        <circle cx={isLeft ? W*0.15 : W*0.85} cy={H*0.35} r={W*0.064} fill="#1a1008" stroke="#f59e0b" strokeWidth="1.7"/>
        <circle cx={isLeft ? W*0.15 : W*0.85} cy={H*0.35} r={W*0.04} fill="url(#ship_core_map)" filter="url(#glowFilter)">
          <animate attributeName="opacity" values="0.65;1;0.65" dur="1.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx={isLeft ? W*0.15 : W*0.85} cy={H*0.35} r={W*0.014} fill="#fff7c2"/>
        {[-1, 1].map((dir, i) => (
          <circle key={i}
            cx={(isLeft ? W*0.15 : W*0.85) + dir*W*0.048}
            cy={H*0.35}
            r={W*0.009}
            fill="#1a1008"
            stroke="#f59e0b"
            strokeWidth="0.7"
          />
        ))}
        <ellipse cx={isLeft ? W*0.15 : W*0.85} cy={H*0.54} rx={W*0.08} ry={H*0.023} fill="#f59e0b" opacity="0.14"/>
      </g>
    )
  }

  return null
}

// ── Immersive single-screen VisorView ──────────────────────────────────────────
// Shows a true first-person helmet-cam: left side-content bleeds in from the
// left edge, right from the right edge, and the front is the full-width center.
// Kid-friendly labels with big emojis make it clear what LUMA can see.
function VisorView({ ahead, leftTile, rightTile, gridWidth, gridHeight, onClose }) {
  const W = gridWidth
  const H = gridHeight

  // ── Horizon/sky colors based on what's ahead ──────────────────────────────
  const aheadAccent =
    ahead.type === 'forest_tree' ? '#65a30d' :
    ahead.type === 'rock'      ? '#c0845a' :
    ahead.type === 'repair_box' ? '#38bdf8' :
    ahead.type === 'boundary'  ? '#64748b' :
    ahead.type === 'ship_part' ? '#38bdf8' :
    ahead.type === 'goal'      ? '#f59e0b' :
    '#2dd4bf'
  const visorLabel = tile => {
    if (tile.type === 'boundary') return 'BOUNDARY'
    if (tile.type === 'repair_box') return 'REPAIR BOX'
    return tile.label
  }

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
          <linearGradient id="box_front_top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a8c5d8"/>
            <stop offset="55%" stopColor="#5d7890"/>
            <stop offset="100%" stopColor="#26384a"/>
          </linearGradient>
          <linearGradient id="box_front_face" x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#7c98ad"/>
            <stop offset="58%" stopColor="#354d62"/>
            <stop offset="100%" stopColor="#0d1b2b"/>
          </linearGradient>
          <linearGradient id="box_front_side" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#526e84"/>
            <stop offset="100%" stopColor="#0a1624"/>
          </linearGradient>
          <radialGradient id="box_light_glow" cx="50%" cy="50%" r="56%">
            <stop offset="0%" stopColor="#e0faff" stopOpacity="0.96"/>
            <stop offset="42%" stopColor="#67e8f9" stopOpacity="0.54"/>
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
          </radialGradient>
          {/* Forest tree gradients */}
          <linearGradient id="tree_front_trunk" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#8b5a2b"/>
            <stop offset="45%" stopColor="#5b371d"/>
            <stop offset="100%" stopColor="#241207"/>
          </linearGradient>
          <radialGradient id="tree_front_leaf" cx="38%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#9be66a"/>
            <stop offset="48%" stopColor="#3f8f3e"/>
            <stop offset="100%" stopColor="#124a27"/>
          </radialGradient>
          <radialGradient id="tree_front_leaf_alt" cx="44%" cy="22%" r="68%">
            <stop offset="0%" stopColor="#c5f96f"/>
            <stop offset="50%" stopColor="#5aa541"/>
            <stop offset="100%" stopColor="#1f5c31"/>
          </radialGradient>
          {/* Ship part gradient */}
          <linearGradient id="ship_part_front" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%"  stopColor="#1e3a5a"/>
            <stop offset="100%" stopColor="#0a1828"/>
          </linearGradient>
          <radialGradient id="ship_fragment_glow" cx="50%" cy="45%" r="56%">
            <stop offset="0%"  stopColor="#7dd3fc" stopOpacity="0.68"/>
            <stop offset="52%" stopColor="#38bdf8" stopOpacity="0.24"/>
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="ship_core_glow" cx="50%" cy="50%" r="58%">
            <stop offset="0%"  stopColor="#fff7c2" stopOpacity="0.82"/>
            <stop offset="42%" stopColor="#fbbf24" stopOpacity="0.38"/>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="ship_core_map" cx="40%" cy="35%" r="60%">
            <stop offset="0%"  stopColor="#fcd34d"/>
            <stop offset="60%" stopColor="#f59e0b"/>
            <stop offset="100%" stopColor="#92400e"/>
          </radialGradient>
          {/* Left/right edge vignette */}
          <linearGradient id="vignette_left" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#000508" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#000508" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="vignette_right" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%"   stopColor="#000508" stopOpacity="0.22"/>
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
          <clipPath id="leftZoneClip">
            <rect x="0" y="0" width={W*0.3} height={H}/>
          </clipPath>
          <clipPath id="frontZoneClip">
            <rect x={W*0.3} y="0" width={W*0.4} height={H}/>
          </clipPath>
          <clipPath id="rightZoneClip">
            <rect x={W*0.7} y="0" width={W*0.3} height={H}/>
          </clipPath>
          {/* Glow filter */}
          <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="visor_box_shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#020617" floodOpacity="0.58" />
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
        <g clipPath="url(#leftZoneClip)">
          <ZoneContent tile={leftTile} zone="left" W={W} H={H} />
        </g>

        {/* ── RIGHT side content (peeks in from right edge) ── */}
        <g clipPath="url(#rightZoneClip)">
          <ZoneContent tile={rightTile} zone="right" W={W} H={H} />
        </g>

        {/* ── FRONT center content ── */}
        <g clipPath="url(#frontZoneClip)">
          <ZoneContent tile={ahead} zone="front" W={W} H={H} />
        </g>

        {/* ── Left/Right edge vignette — blends side content naturally ── */}
        <rect width={W*0.28} height={H} fill="url(#vignette_left)"/>
        <rect x={W*0.72} width={W*0.28} height={H} fill="url(#vignette_right)"/>

        {/* ── DIVIDER LINES — subtle borders separating zones ── */}
        {/* Left zone divider */}
        <line
          x1={W*0.24} y1={H*0.0}
          x2={W*0.24} y2={H}
          stroke="#a78bfa" strokeWidth="0.6" opacity="0.22"
          strokeDasharray="4 6"
        />
        {/* Right zone divider */}
        <line
          x1={W*0.76} y1={H*0.0}
          x2={W*0.76} y2={H}
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
            fontSize: 8, color: '#ffffff',
            fontFamily: 'monospace', fontWeight: 700,
            letterSpacing: 1,
          }}>
            {visorLabel(leftTile)}
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
            fontSize: 8, color: '#ffffff',
            fontFamily: 'monospace', fontWeight: 700,
            letterSpacing: 1,
          }}>
            {visorLabel(rightTile)}
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
              {visorLabel(ahead)}
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
function EchoProbe({ facing = 'east', activated = false }) {
  const footRotation = { south: 0, west: 90, north: 180, east: -90 }[facing] ?? 0
  const glow = activated ? '#a78bfa' : '#67e8f9'

  return (
    <motion.div
      animate={{
        y: activated ? [-4, -9, -4] : [-3, -7, -3],
        scale: activated ? [1, 1.06, 1] : [1, 1.025, 1],
        filter: activated
          ? [`drop-shadow(0 0 12px ${glow})`, `drop-shadow(0 0 22px ${glow})`, `drop-shadow(0 0 14px ${glow})`]
          : [`drop-shadow(0 0 8px ${glow})`, `drop-shadow(0 0 14px ${glow})`, `drop-shadow(0 0 8px ${glow})`],
      }}
      transition={{ duration: activated ? 1.05 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}
    >
      <svg width={88} height={88} viewBox="-7 -4 88 90" fill="none" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="echo_metal" cx="42%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#ff9b91" />
            <stop offset="32%" stopColor="#dc2626" />
            <stop offset="70%" stopColor="#8f141d" />
            <stop offset="100%" stopColor="#35070b" />
          </radialGradient>
          <linearGradient id="echo_rotor_metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ef7a72" />
            <stop offset="48%" stopColor="#a51d26" />
            <stop offset="100%" stopColor="#35070b" />
          </linearGradient>
          <linearGradient id="echo_gold_panel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="55%" stopColor="#020617" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <radialGradient id="echo_lens" cx="44%" cy="42%" r="58%">
            <stop offset="0%" stopColor="#ecfeff" />
            <stop offset="36%" stopColor="#22d3ee" />
            <stop offset="64%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#06131a" />
          </radialGradient>
          <radialGradient id="echo_glass" cx="36%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.72" />
            <stop offset="24%" stopColor="#fca5a5" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#130306" stopOpacity="0" />
          </radialGradient>
          <filter id="echo_soft_glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="echo_lens_glow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <ellipse cx="37" cy="67" rx="25" ry="5" fill="#020617" opacity="0.34" />
        <ellipse cx="37" cy="64" rx="18" ry="4" fill="#67e8f9" opacity={activated ? 0.26 : 0.13}>
          <animate attributeName="opacity" values="0.1;0.28;0.1" dur="1.8s" repeatCount="indefinite" />
        </ellipse>

        <g opacity="0.98">
          <path d="M19 25 H31 M43 25 H55" stroke="#5f1017" strokeWidth="5.5" strokeLinecap="round" opacity="0.84" />
          <path d="M-1 22 C-1 14 6 10 15 11 C24 12 28 17 27 24 C26 31 20 34 11 33 C3 32 -2 28 -1 22 Z"
            fill="url(#echo_rotor_metal)" stroke="#120307" strokeWidth="2.2" />
          <path d="M75 22 C75 14 68 10 59 11 C50 12 46 17 47 24 C48 31 54 34 63 33 C71 32 76 28 75 22 Z"
            fill="url(#echo_rotor_metal)" stroke="#120307" strokeWidth="2.2" />
          <ellipse cx="13" cy="23" rx="11.3" ry="6.6" fill="#06070a" stroke="#ef4444" strokeWidth="1.3" />
          <ellipse cx="61" cy="23" rx="11.3" ry="6.6" fill="#06070a" stroke="#ef4444" strokeWidth="1.3" />
          <path d="M4 23 C9 18 17 18 22 23 C17 28 9 28 4 23 Z M52 23 C57 18 65 18 70 23 C65 28 57 28 52 23 Z"
            fill="#111827" opacity="0.86" />
          <path d="M5 23 H21 M13 16 V30 M7 18 L19 28 M7 28 L19 18 M53 23 H69 M61 16 V30 M55 18 L67 28 M55 28 L67 18"
            stroke="#4b5563" strokeWidth="1.25" strokeLinecap="round" opacity="0.85" />
          <path d="M2 16 C9 13 18 13 25 16 M49 16 C56 13 65 13 72 16" stroke="#fecaca" strokeWidth="1" strokeLinecap="round" opacity="0.38" />
          <path d="M3 29 C11 33 19 31 25 27 M49 27 C55 31 63 33 71 29" stroke="#22d3ee" strokeWidth="1.05" strokeLinecap="round" opacity={activated ? 0.72 : 0.38} />
        </g>

        <circle cx="37" cy="38" r="24" fill="url(#echo_metal)" stroke="#071717" strokeWidth="2" filter="url(#echo_soft_glow)" />
        <circle cx="37" cy="38" r="22" fill="url(#echo_glass)" opacity="0.62" />
        <path d="M27 17 C34 12 45 13 51 20" fill="none" stroke="#fecaca" strokeWidth="1.4" strokeLinecap="round" opacity="0.24" />
        <path d="M23 28 L28 26 M20 35 L24 34 M48 24 L52 26 M50 55 L54 53 M25 53 L21 51" stroke="#fecaca" strokeWidth="0.8" strokeLinecap="round" opacity="0.22" />

        <circle cx="37" cy="39" r="16.8" fill="#071113" stroke="#0f2f2b" strokeWidth="2" />
        <circle cx="37" cy="39" r="13.1" fill="#050b0d" stroke="#172124" strokeWidth="1.2" />
        <circle cx="37" cy="39" r="10.4" fill="#081014" />
        <circle cx="37" cy="39" r="8.2" fill="#22d3ee" opacity="0.94" filter="url(#echo_lens_glow)">
          <animate attributeName="opacity" values="0.78;1;0.78" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="37" cy="39" r="4.9" fill="#031115" opacity="0.96" />
        <path d="M30 34 C34 30 42 30 46 35" stroke="#ecfeff" strokeWidth="1.2" strokeLinecap="round" opacity="0.32" />
        <circle cx="33" cy="31" r="2.1" fill="#ffffff" opacity="0.75" />
        <circle cx="37" cy="20" r="3.9" fill="#ffffff" opacity="0.95" filter="url(#echo_lens_glow)" />
        <path d="M28 28 C35 23 45 24 50 32" stroke="#d1fae5" strokeWidth="1.4" strokeLinecap="round" opacity="0.42" />

        <g transform={`translate(37 77) rotate(${footRotation}) translate(-37 -77)`}>
          <path d="M37 86 L28 72 H46 Z" fill="#fef08a" stroke="#fff7c2" strokeWidth="1.5" opacity="0.96" />
          <path d="M37 72 V66" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" opacity="0.96" />
        </g>
      </svg>
    </motion.div>
  )
}

function EchoSignalCloud({ tileSize, selectable = false, selected = false, result = null }) {
  const ringColor = result === 'success' ? '#22c55e' : result === 'retry' ? '#fb7185' : '#67e8f9'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 1.03, filter: 'blur(3px)' }}
      transition={{ duration: 0.06, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        inset: 3,
        zIndex: 6,
        pointerEvents: 'none',
        borderRadius: 12,
        overflow: 'visible',
        background: 'transparent',
        border: 'none',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <filter id={`echo-cloud-soft-${result ?? 'idle'}`} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
          <linearGradient id={`echo-cloud-fill-${result ?? 'idle'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="55%" stopColor="#e5e7eb" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.93" />
          </linearGradient>
        </defs>
        <path
          d="M15 66 C5 62 6 47 17 44 C16 34 26 27 36 31 C41 19 58 18 64 31 C76 29 88 38 86 52 C96 57 91 71 79 72 C71 80 56 78 49 72 C39 80 21 76 15 66 Z"
          fill={`url(#echo-cloud-fill-${result ?? 'idle'})`}
          stroke={selectable ? ringColor : '#f8fafc'}
          strokeWidth={selectable ? 2.8 : 1.2}
          strokeLinejoin="round"
          filter={`url(#echo-cloud-soft-${result ?? 'idle'})`}
        />
        <path
          d="M21 59 C27 53 36 52 43 57 M49 43 C56 35 70 37 75 49 M17 49 C23 43 31 42 38 47 M61 63 C68 60 76 61 81 66"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.68"
        />
      </svg>
      {selectable && (
        <motion.div
          initial={{ opacity: 0, scale: 0.78 }}
          animate={selected
            ? {
                opacity: 1,
                scale: [1, 1.08, 1],
                rotate: result === 'success' ? [0, -1.5, 1.5, 0] : [0, 1.4, -1.4, 0],
              }
            : { opacity: [0.76, 1, 0.76], scale: [1, 1.04, 1] }}
          transition={selected
            ? { duration: 0.46, ease: 'easeOut' }
            : { duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: -1,
            zIndex: 4,
            border: `4px solid ${selected ? ringColor : '#f59e0b'}`,
            borderRadius: 8,
            background: selected ? `${ringColor}1f` : 'rgba(245,158,11,0.10)',
            boxSizing: 'border-box',
            boxShadow: selected
              ? `0 0 26px ${ringColor}99, inset 0 0 22px ${ringColor}33`
              : '0 0 18px rgba(245,158,11,0.48), inset 0 0 16px rgba(255,255,255,0.2)',
          }}
        >
          {selected && (
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.1, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                right: 6,
                top: 6,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: ringColor,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 900,
                boxShadow: `0 0 14px ${ringColor}aa`,
              }}
            >
              {result === 'success' ? '✓' : '!'}
            </motion.div>
          )}
        </motion.div>
      )}
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.span
          key={index}
          animate={{
            x: [0, tileSize * (index % 2 === 0 ? 0.04 : -0.04), 0],
            y: [0, tileSize * (index === 1 ? 0.035 : -0.025), 0],
            opacity: [0.72, 0.98, 0.72],
          }}
          transition={{ duration: 2 + index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: `${2 + index * 16}%`,
            top: `${28 + (index % 2) * 14}%`,
            width: tileSize * (index === 2 ? 0.5 : 0.36),
            height: tileSize * (index === 2 ? 0.28 : 0.24),
            borderRadius: '50%',
            background: index % 2 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(226,232,240,0.86)',
            filter: 'blur(5px)',
          }}
        />
      ))}
      {[0, 1, 2, 3].map((index) => (
        <motion.span
          key={`spark-${index}`}
          animate={{ opacity: [0.15, 0.65, 0.15], scale: [0.75, 1.1, 0.75] }}
          transition={{ duration: 1.1 + index * 0.12, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: `${18 + index * 18}%`,
            top: `${28 + ((index * 17) % 38)}%`,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 0 8px #ffffff',
          }}
        />
      ))}
    </motion.div>
  )
}

export default function GameGrid({
  levelConfig, luma, visorActive, onVisorClose,
  sptCorrect, collectedParts = new Set(), gridPx,
  predictionModeActive = false,
  predictionTile = null,
  predictionResult = null,
  checkpointChoiceActive = false,
  checkpointChoiceTiles = [],
  checkpointChoiceSelection = null,
  onCheckpointTileClick,
  collectionEffects = [],
  activeIfPathSignal = null,
  echoActivated = false,
  echoCloudsRevealed = false,
  echoSelectionActive = false,
  echoSelectedCloud = null,
  onEchoCloudTileClick,
  onTileClick,
  // effectiveLevel: merged level with generated walls/objects (from useGameState)
  effectiveLevel,
}) {
  const theme = useContext(ThemeContext)
  const isLight = theme === 'light'

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
  const checkpointTiles = checkpointChoiceActive ? checkpointChoiceTiles : []
  const activeLumaCollection = collectionEffects.findLast
    ? collectionEffects.findLast((effect) => effect.x === luma.x && effect.y === luma.y)
    : [...collectionEffects].reverse().find((effect) => effect.x === luma.x && effect.y === luma.y)

  // Theme-specific label colors
  const scanLabelColor  = isLight ? '#0d9488' : '#2dd4bf'
  const coordLabelColor = isLight ? '#0d6e66' : '#64748b'
  const gridBoxShadow   = isLight
    ? '0 4px 32px rgba(20,184,166,0.18), 0 0 0 2px #14b8a644'
    : '0 0 60px rgba(45,212,191,0.08), 0 0 0 1.5px #1e2a42'
  const firstObstacle = walls[0] ?? objects.find(objectItem => objectItem.type === 'rock') ?? null
  const shipParts = objects.filter(objectItem => objectItem.type === 'ship_part')
  const firstShipFragment = shipParts.find((part, index) => !collectedParts.has(index)) ?? null
  const echoProbe = activeLevel.echoProbe ?? null
  const echoClouds = activeLevel.echoClouds ?? []
  const isEchoClouded = (col, row) =>
    !echoCloudsRevealed && echoClouds.some(cloud => cloud.x === col && cloud.y === row)
  const isForestTrail = activeLevel.world === 'forest-trail'
  const isRepairSite = activeLevel.world === 'repair-site'
  const ObstacleVisual = isRepairSite ? CargoCrateObstacle : isForestTrail ? ForestTreeObstacle : RockObstacle
  const BackgroundComponent = isRepairSite ? RepairSiteBackground : isForestTrail ? ForestTrailBackground : CrashSiteBackground
  const scanLabel = isRepairSite
    ? 'ORBITAL SCAN - REPAIR SITE W3'
    : isForestTrail
      ? 'ORBITAL SCAN - FOREST TRAIL W2'
      : 'ORBITAL SCAN - CRASH SITE W1'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div data-tutorial-id="grid-label" style={{ fontSize:9, color: scanLabelColor, fontFamily:'monospace', letterSpacing:3, opacity: isLight ? 0.9 : 0.5, fontWeight: isLight ? 700 : 400 }}>
        {scanLabel}
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
              fontWeight: 700,
            }}
          >
            🎯 TAP A TILE TO SET YOUR PREDICTION
          </motion.div>
        )}
      </AnimatePresence>

      <div data-tutorial-id="grid-panel" style={{
        position:'relative', width: gridWidth, height: gridHeight,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: gridBoxShadow,
        cursor: predictionModeActive ? 'crosshair' : checkpointChoiceActive || echoSelectionActive ? 'pointer' : 'default',
      }}>
        <BackgroundComponent width={gridWidth} height={gridHeight} cols={cols} rows={rows} />

        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const isWall  = walls.some(w => w.x === col && w.y === row)
            const isGoal  = goal && goal.x === col && goal.y === row
            const obj     = objects.find(o => o.x === col && o.y === row)
            const isEchoProbe = echoProbe && echoProbe.x === col && echoProbe.y === row
            const echoOverlapsLuma = isEchoProbe && luma.x === col && luma.y === row
            const cloudedByEcho = isEchoClouded(col, row)
            const isEchoSelectableCloud = echoSelectionActive && cloudedByEcho
            const isEchoSelectedCloud =
              echoSelectedCloud &&
              echoSelectedCloud.x === col &&
              echoSelectedCloud.y === row
            const isPredicted = predictionTile && predictionTile.x === col && predictionTile.y === row
            const isCheckpointChoice = checkpointTiles.some(tile => tile.x === col && tile.y === row)
            const isCheckpointSelected =
              checkpointChoiceSelection &&
              checkpointChoiceSelection.x === col &&
              checkpointChoiceSelection.y === row
            const checkpointSelectedColor = checkpointChoiceSelection?.result === 'success'
              ? '#22c55e'
              : '#ef4444'
            return (
              <div
                key={`${col}-${row}`}
                onClick={() => {
                  if (isEchoSelectableCloud && onEchoCloudTileClick) {
                    onEchoCloudTileClick({ x: col, y: row })
                    return
                  }

                  if (checkpointChoiceActive && isCheckpointChoice && onCheckpointTileClick) {
                    onCheckpointTileClick(col, row)
                    return
                  }

                  if (predictionModeActive && onTileClick) onTileClick(col, row)
                }}
                data-tutorial-id={
                  luma.x === col && luma.y === row ? 'luma-marker'
                  : isGoal ? 'goal-marker'
                  : firstObstacle && firstObstacle.x === col && firstObstacle.y === row ? (isRepairSite ? 'box-tile' : 'rock-tile')
                  : firstShipFragment && firstShipFragment.x === col && firstShipFragment.y === row ? 'ship-fragment-tile'
                  : undefined
                }
                style={{
                  position:'absolute', left: col * TILE_SIZE, top: row * TILE_SIZE,
                  width: TILE_SIZE, height: TILE_SIZE, zIndex: echoOverlapsLuma ? 10 : 2,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor: isEchoSelectableCloud ? 'pointer' : undefined,
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
                      fontFamily:'monospace', fontWeight: 700,
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

                {isCheckpointChoice && (
                  <motion.div
                    initial={{ opacity:0, scale:0.78 }}
                    animate={isCheckpointSelected
                      ? {
                          opacity: 1,
                          scale: [1, 1.08, 1],
                          rotate: checkpointChoiceSelection.result === 'success' ? [0, -1.5, 1.5, 0] : [0, 1.4, -1.4, 0],
                        }
                      : { opacity:[0.76,1,0.76], scale:[1,1.04,1] }}
                    transition={isCheckpointSelected
                      ? { duration:0.46, ease:'easeOut' }
                      : { duration:1.3, repeat:Infinity, ease:'easeInOut' }}
                    style={{
                      position:'absolute', inset:0,
                      border:`4px solid ${isCheckpointSelected ? checkpointSelectedColor : '#f59e0b'}`,
                      borderRadius:8,
                      background:isCheckpointSelected
                        ? `${checkpointSelectedColor}1f`
                        : 'rgba(245,158,11,0.12)',
                      zIndex:5,
                      pointerEvents:'none',
                      boxSizing:'border-box',
                      boxShadow:isCheckpointSelected
                        ? `0 0 26px ${checkpointSelectedColor}99, inset 0 0 22px ${checkpointSelectedColor}33`
                        : '0 0 18px rgba(245,158,11,0.48), inset 0 0 16px rgba(255,255,255,0.2)',
                    }}
                  >
                    {isCheckpointSelected && (
                      <motion.div
                        initial={{ scale: 0.2, opacity: 0 }}
                        animate={{ scale: [0.2, 1.1, 1], opacity: [0, 1, 1] }}
                        transition={{ duration: 0.34, ease: 'easeOut' }}
                        style={{
                          position:'absolute',
                          right:6,
                          top:6,
                          width:24,
                          height:24,
                          borderRadius:'50%',
                          background:checkpointSelectedColor,
                          color:'#ffffff',
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'center',
                          fontSize:15,
                          fontWeight:900,
                          boxShadow:`0 0 14px ${checkpointSelectedColor}aa`,
                        }}
                      >
                        {checkpointChoiceSelection.result === 'success' ? '✓' : '!'}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {isWall && !cloudedByEcho && <div style={{ filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}><ObstacleVisual /></div>}
                {isGoal && !isWall && !cloudedByEcho && <GoalBeacon />}
                {isEchoProbe && (
                  <div data-tutorial-id="echo-probe" style={{ zIndex: echoOverlapsLuma ? 11 : 4 }}>
                    <EchoProbe facing={echoProbe.facing} activated={echoActivated} />
                  </div>
                )}
                {obj?.type === 'ship_part' && !isWall && !isGoal && !cloudedByEcho && (() => {
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
                {obj?.type === 'rock' && !isWall && !isGoal && !cloudedByEcho && (
                  <div style={{ filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.7))' }}><ObstacleVisual /></div>
                )}
                <AnimatePresence>
                  {cloudedByEcho && (
                    <EchoSignalCloud
                      key={`echo-cloud-${col}-${row}`}
                      tileSize={TILE_SIZE}
                      selectable={isEchoSelectableCloud}
                      selected={Boolean(isEchoSelectedCloud)}
                      result={isEchoSelectedCloud ? echoSelectedCloud.result : null}
                    />
                  )}
                </AnimatePresence>
              </div>
            )
          })
        )}

        {levelConfig.fog && (
          <div data-tutorial-id="fog-area" style={{ position:'absolute', inset:0, zIndex:6, pointerEvents:'none' }}>
            <FogOverlay
              gridWidth={gridWidth} gridHeight={gridHeight}
              cols={cols} rows={rows}
              luma={luma} sptCorrect={sptCorrect}
            />
          </div>
        )}

        <AnimatePresence>
          {activeIfPathSignal && isRepairSite && (
            <IfPathSignal
              key={activeIfPathSignal.id}
              signal={activeIfPathSignal}
              tileSize={TILE_SIZE}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {collectionEffects.map((effect) => (
            <CollectionBurst
              key={effect.id}
              effect={effect}
              tileSize={TILE_SIZE}
              theme={theme}
            />
          ))}
        </AnimatePresence>

        <div style={{ position:'absolute', inset:0, zIndex: activeLumaCollection ? 9 : 7, pointerEvents:'none' }}>
          <LumaSprite
            x={luma.x}
            y={luma.y}
            facing={luma.facing}
            rotateDeg={luma.rotateDeg ?? 0}
            tileSize={TILE_SIZE}
            showFacing={sptCorrect || !!levelConfig.skipIdentify}
            collectEffectKey={activeLumaCollection?.id ?? null}
          />
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

      <div data-tutorial-id="luma-coords" style={{ fontSize:9, color: coordLabelColor, fontFamily:'monospace', letterSpacing:2, fontWeight: isLight ? 600 : 400 }}>
        LUMA [{luma.x},{luma.y}] · {luma.facing.toUpperCase()}
      </div>
    </div>
  )
}

