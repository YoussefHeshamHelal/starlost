// LumaSprite.jsx — Detailed alien robot LUMA
// Before SPT answered: LUMA sits crouched, facing ground (no direction hint)
// After SPT answered correctly: LUMA stands up, rotates to face correct direction.
//
// ROTATION FIX: We receive `rotateDeg` (cumulative degrees) from useGameState.
// Each TR adds +90, each TL adds -90 to the running total, so Framer Motion
// always animates the correct direction (never takes the 270° shortcut).
import { motion } from 'framer-motion'

// ── Standing LUMA (original design) ─────────────────────────────────────────
function LumaStanding({ size, showFacing, rotateDeg }) {
  return (
    <motion.div
      key="standing"
      initial={{ opacity: 0, scale: 0.7, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.05 }}
    >
      <motion.div
        animate={{ rotate: showFacing ? rotateDeg : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="helmetG" cx="38%" cy="30%" r="65%">
              <stop offset="0%"  stopColor="#5eead4" stopOpacity="0.95"/>
              <stop offset="40%" stopColor="#0e7490" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#082f49" stopOpacity="1"/>
            </radialGradient>
            <radialGradient id="bodyG" cx="40%" cy="25%" r="70%">
              <stop offset="0%"  stopColor="#1e3a4a"/>
              <stop offset="100%" stopColor="#071018"/>
            </radialGradient>
            <radialGradient id="visorG" cx="35%" cy="30%" r="65%">
              <stop offset="0%"  stopColor="#e0f7fa" stopOpacity="0.95"/>
              <stop offset="50%" stopColor="#b2ebf2" stopOpacity="0.85"/>
              <stop offset="100%" stopColor="#4dd0e1" stopOpacity="0.7"/>
            </radialGradient>
            <radialGradient id="eyeG" cx="35%" cy="35%" r="60%">
              <stop offset="0%"  stopColor="#ffffff"/>
              <stop offset="100%" stopColor="#2dd4bf"/>
            </radialGradient>
            <filter id="lumaGlow">
              <feGaussianBlur stdDeviation="1.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="2.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Thruster flames */}
          <ellipse cx={14} cy={68} rx={5} ry={7} fill="#2dd4bf" opacity="0.4" filter="url(#strongGlow)">
            <animate attributeName="ry" values="7;10;7" dur="0.6s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="0.6s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx={50} cy={68} rx={5} ry={7} fill="#2dd4bf" opacity="0.4" filter="url(#strongGlow)">
            <animate attributeName="ry" values="7;10;7" dur="0.7s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="0.7s" repeatCount="indefinite"/>
          </ellipse>

          {/* Body */}
          <rect x={18} y={38} width={28} height={24} rx={6} fill="url(#bodyG)" stroke="#1e4a5a" strokeWidth="1.5"/>
          <line x1={22} y1={44} x2={42} y2={44} stroke="#1e4060" strokeWidth="0.7" opacity="0.8"/>
          <line x1={22} y1={50} x2={42} y2={50} stroke="#1e4060" strokeWidth="0.7" opacity="0.8"/>
          <circle cx={32} cy={47} r={5} fill="#082f49" stroke="#2dd4bf" strokeWidth="1"/>
          <circle cx={32} cy={47} r={3} fill="#2dd4bf" opacity="0.85" filter="url(#lumaGlow)">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
          </circle>
          {[44,47,50].map((yv,i) => (
            <line key={i} x1={40} y1={yv} x2={44} y2={yv} stroke="#2dd4bf" strokeWidth="0.8" opacity="0.5"/>
          ))}
          {[44,47,50].map((yv,i) => (
            <line key={i} x1={20} y1={yv} x2={24} y2={yv} stroke="#2dd4bf" strokeWidth="0.8" opacity="0.5"/>
          ))}

          {/* Legs */}
          <rect x={19} y={58} width={10} height={14} rx={3} fill="#0e1c2a" stroke="#1a3a4a" strokeWidth="1.2"/>
          <ellipse cx={24} cy={73} rx={6} ry={3} fill="#0a1420" stroke="#2dd4bf" strokeWidth="0.8"/>
          <rect x={35} y={58} width={10} height={14} rx={3} fill="#0e1c2a" stroke="#1a3a4a" strokeWidth="1.2"/>
          <ellipse cx={40} cy={73} rx={6} ry={3} fill="#0a1420" stroke="#2dd4bf" strokeWidth="0.8"/>

          {/* Arms */}
          <rect x={8} y={40} width={9} height={18} rx={4} fill="#0e1c2a" stroke="#1a3a4a" strokeWidth="1.2"/>
          <circle cx={12} cy={60} r={4} fill="#071018" stroke="#2dd4bf" strokeWidth="1"/>
          <line x1={10} y1={63} x2={8}  y2={67} stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round"/>
          <line x1={12} y1={64} x2={12} y2={68} stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round"/>
          <line x1={14} y1={63} x2={16} y2={67} stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round"/>
          <rect x={47} y={40} width={9} height={18} rx={4} fill="#0e1c2a" stroke="#1a3a4a" strokeWidth="1.2"/>
          <circle cx={52} cy={60} r={4} fill="#071018" stroke="#2dd4bf" strokeWidth="1"/>
          <line x1={50} y1={63} x2={48} y2={67} stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round"/>
          <line x1={52} y1={64} x2={52} y2={68} stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round"/>
          <line x1={54} y1={63} x2={56} y2={67} stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round"/>

          {/* Neck */}
          <rect x={26} y={33} width={12} height={8} rx={3} fill="#0a1820" stroke="#1a3a4a" strokeWidth="1"/>
          <line x1={26} y1={36} x2={38} y2={36} stroke="#1e4060" strokeWidth="0.6" opacity="0.7"/>
          <line x1={26} y1={39} x2={38} y2={39} stroke="#1e4060" strokeWidth="0.6" opacity="0.7"/>

          {/* Helmet */}
          <circle cx={32} cy={22} r={20} fill="url(#helmetG)" stroke="#67e8f9" strokeWidth="1.5"/>
          <circle cx={32} cy={22} r={18} fill="none" stroke="#0a2a3a" strokeWidth="2" opacity="0.4"/>
          <path d="M14,16 Q32,4 50,16" stroke="#7ae8d8" strokeWidth="0.8" fill="none" opacity="0.4"/>

          {/* Visor */}
          <rect x={20} y={14} width={24} height={15} rx={6} fill="url(#visorG)" stroke="#b2ebf2" strokeWidth="1"/>
          <path d="M22,16 Q28,13 34,16" stroke="white" strokeWidth="1.2" fill="none" opacity="0.5" strokeLinecap="round"/>
          <rect x={21} y={22} width={22} height={1.5} rx={0.75} fill="#2dd4bf" opacity="0.4">
            <animate attributeName="y" values="15;28;15" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;0.5;0" dur="3s" repeatCount="indefinite"/>
          </rect>

          {/* Eyes */}
          <circle cx={26} cy={19} r={3.5} fill="url(#eyeG)" filter="url(#lumaGlow)">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx={38} cy={19} r={3.5} fill="url(#eyeG)" filter="url(#lumaGlow)">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx={27} cy={19} r={1.5} fill="#082f49"/>
          <circle cx={39} cy={19} r={1.5} fill="#082f49"/>
          <circle cx={27.8} cy={18} r={0.7} fill="white" opacity="0.9"/>
          <circle cx={39.8} cy={18} r={0.7} fill="white" opacity="0.9"/>

          {/* Antenna */}
          <line x1={32} y1={2} x2={32} y2={8} stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1={32} y1={2} x2={26} y2={-2} stroke="#2dd4bf" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
          <circle cx={32} cy={2} r={2.5} fill="#2dd4bf" filter="url(#strongGlow)">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite"/>
          </circle>
          <circle cx={26} cy={-2} r={1.5} fill="#5eead4" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.8s" repeatCount="indefinite"/>
          </circle>

          {/* Direction arrow — only visible after SPT is answered correctly */}
          {showFacing && (
            <polygon
              points="32,-8 27,-2 37,-2"
              fill="#2dd4bf"
              opacity="0.9"
              filter="url(#strongGlow)"
            />
          )}
        </svg>
      </motion.div>
    </motion.div>
  )
}

// ── Crouched / sitting LUMA (no directional information) ─────────────────
// LUMA is hunched over, helmet facing down — the player cannot infer facing.
function LumaCrouched({ size }) {
  return (
    <motion.div
      key="crouched"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7, y: 8 }}
      transition={{ duration: 0.35 }}
    >
      <svg
        width={size}
        height={size * 0.78}
        viewBox="0 0 64 62"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="cHelmetG" cx="50%" cy="60%" r="60%">
            <stop offset="0%"  stopColor="#5eead4" stopOpacity="0.95"/>
            <stop offset="40%" stopColor="#0e7490" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#082f49" stopOpacity="1"/>
          </radialGradient>
          <radialGradient id="cBodyG" cx="40%" cy="30%" r="70%">
            <stop offset="0%"  stopColor="#1e3a4a"/>
            <stop offset="100%" stopColor="#071018"/>
          </radialGradient>
          <radialGradient id="cVisorG" cx="50%" cy="60%" r="60%">
            <stop offset="0%"  stopColor="#e0f7fa" stopOpacity="0.95"/>
            <stop offset="50%" stopColor="#b2ebf2" stopOpacity="0.85"/>
            <stop offset="100%" stopColor="#4dd0e1" stopOpacity="0.7"/>
          </radialGradient>
          <radialGradient id="cEyeG" cx="50%" cy="60%" r="55%">
            <stop offset="0%"  stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#2dd4bf"/>
          </radialGradient>
          <filter id="cLumaGlow">
            <feGaussianBlur stdDeviation="1.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="cStrongGlow">
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Ground shadow — wider when sitting */}
        <ellipse cx={32} cy={60} rx={22} ry={5}
          fill="rgba(0,0,0,0.55)" opacity="0.6"/>

        {/* Folded legs splayed out to sides */}
        {/* Left leg — bent, knee up */}
        <path d="M20,42 Q10,46 8,54 Q12,58 18,56 Q22,50 24,44 Z"
          fill="#0e1c2a" stroke="#1a3a4a" strokeWidth="1.2"/>
        <ellipse cx={12} cy={56} rx={6} ry={3} fill="#0a1420" stroke="#2dd4bf" strokeWidth="0.7"/>

        {/* Right leg — bent, knee up */}
        <path d="M44,42 Q54,46 56,54 Q52,58 46,56 Q42,50 40,44 Z"
          fill="#0e1c2a" stroke="#1a3a4a" strokeWidth="1.2"/>
        <ellipse cx={52} cy={56} rx={6} ry={3} fill="#0a1420" stroke="#2dd4bf" strokeWidth="0.7"/>

        {/* Body — hunched/compressed */}
        <rect x={20} y={34} width={24} height={18} rx={6}
          fill="url(#cBodyG)" stroke="#1e4a5a" strokeWidth="1.5"/>
        <line x1={24} y1={40} x2={40} y2={40} stroke="#1e4060" strokeWidth="0.7" opacity="0.7"/>
        <line x1={24} y1={46} x2={40} y2={46} stroke="#1e4060" strokeWidth="0.7" opacity="0.7"/>
        {/* Core reactor */}
        <circle cx={32} cy={43} r={4} fill="#082f49" stroke="#2dd4bf" strokeWidth="0.9"/>
        <circle cx={32} cy={43} r={2.5} fill="#2dd4bf" opacity="0.8" filter="url(#cLumaGlow)">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.2s" repeatCount="indefinite"/>
        </circle>

        {/* Arms — drooping forward, resting on ground */}
        {/* Left arm */}
        <path d="M20,36 Q10,40 9,50 Q12,54 16,52 Q18,46 22,42 Z"
          fill="#0e1c2a" stroke="#1a3a4a" strokeWidth="1.2"/>
        <circle cx={12} cy={52} r={3.5} fill="#071018" stroke="#2dd4bf" strokeWidth="0.8"/>
        {/* Right arm */}
        <path d="M44,36 Q54,40 55,50 Q52,54 48,52 Q46,46 42,42 Z"
          fill="#0e1c2a" stroke="#1a3a4a" strokeWidth="1.2"/>
        <circle cx={52} cy={52} r={3.5} fill="#071018" stroke="#2dd4bf" strokeWidth="0.8"/>

        {/* Neck — short, tilting helmet forward */}
        <rect x={27} y={28} width={10} height={8} rx={3}
          fill="#0a1820" stroke="#1a3a4a" strokeWidth="1"/>

        {/* Helmet — tilted down ~35° so visor faces ground */}
        <g transform="translate(32, 20) rotate(35) translate(-32, -20)">
          <circle cx={32} cy={20} r={18} fill="url(#cHelmetG)" stroke="#67e8f9" strokeWidth="1.5"/>
          <circle cx={32} cy={20} r={16} fill="none" stroke="#0a2a3a" strokeWidth="2" opacity="0.4"/>

          {/* Visor — now faces downward toward ground */}
          <rect x={20} y={20} width={24} height={14} rx={6}
            fill="url(#cVisorG)" stroke="#b2ebf2" strokeWidth="1"/>
          <path d="M22,22 Q28,19 34,22" stroke="white" strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round"/>

          {/* Eyes — dim, looking down */}
          <circle cx={26} cy={25} r={3} fill="url(#cEyeG)" filter="url(#cLumaGlow)" opacity="0.6">
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx={38} cy={25} r={3} fill="url(#cEyeG)" filter="url(#cLumaGlow)" opacity="0.6">
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx={27} cy={25} r={1.2} fill="#082f49"/>
          <circle cx={39} cy={25} r={1.2} fill="#082f49"/>

          {/* Antenna — drooped forward too */}
          <line x1={32} y1={2} x2={32} y2={8} stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <circle cx={32} cy={2} r={2} fill="#2dd4bf" filter="url(#cStrongGlow)" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.8s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Faint "?" question mark floating above to signal confusion */}
        <motion.text
          x={50} y={8}
          textAnchor="middle"
          fill="#2dd4bf"
          fontSize={10}
          fontFamily="monospace"
          opacity={0.55}
        >
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="y" values="8;4;8" dur="2s" repeatCount="indefinite"/>
          ?
        </motion.text>
      </svg>
    </motion.div>
  )
}

// ── Main LumaSprite ───────────────────────────────────────────────────────
// Props:
//   x, y        — grid position (integer col/row)
//   facing      — 'north' | 'east' | 'south' | 'west'
//   rotateDeg   — cumulative rotation in degrees (from useGameState).
//                 Each TR adds +90, each TL adds -90, so Framer Motion
//                 always animates the correct short arc.
//   tileSize    — pixel size of one grid tile
//   showFacing  — whether to reveal LUMA's direction (after SPT answered)
export default function LumaSprite({ x, y, rotateDeg, tileSize, showFacing = false }) {
  const size = tileSize * 0.78

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: tileSize,
        height: tileSize,
        top: 0,
        left: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      animate={{ x: x * tileSize, y: y * tileSize }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
    >
      {/* Ground shadow */}
      <motion.div
        animate={{ scaleX: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: 6,
          width: tileSize * 0.55,
          height: 10,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, transparent 70%)',
        }}
      />

      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.65, 0.3], scale: [0.85, 1.05, 0.85] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: tileSize * 0.85,
          height: tileSize * 0.85,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,212,191,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Toggle between crouched (SPT not answered) and standing (SPT answered) */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {showFacing
          ? <LumaStanding size={size} showFacing={showFacing} rotateDeg={rotateDeg} />
          : <LumaCrouched size={size} />
        }
      </div>
    </motion.div>
  )
}