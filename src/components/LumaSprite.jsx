// LumaSprite.jsx — LUMA v9 — cleaned up
//
// Changes from v8:
//   - Removed EnergyOrb component and all usages
//   - Removed orb-only defs: orb, og, orbF (and crouched: cOrb, cOF)
//   - Removed orb ambient glow motion.div from main export
//   - Removed HelmetRing component and all usages (cyan collar oval)
//   - Removed inline cyan collar ellipses in side views (East/West)
//   - Removed the neck joint-ring ellipse (jt gradient oval at neck base)
//     in all directional sprites — this was the visible blue oval
//   - Removed back eye socket hint ellipse in FacingEast and FacingWest
//   - Fixed disappearing turn: replaced AnimatePresence facing-remount
//     with persistent layered sprite system (overlapping crossfade)
//
import { motion, AnimatePresence } from 'framer-motion'

// ─── Shared gradient & filter defs ─────────────────────────────────────────────
const LUMA_DEFS = ({ id = '' }) => (
  <defs>
    {/* Alien green skin — luminous, warm */}
    <radialGradient id={`sk${id}`} cx="38%" cy="30%" r="70%">
      <stop offset="0%"   stopColor="#a8ffdc"/>
      <stop offset="20%"  stopColor="#52f0b0"/>
      <stop offset="52%"  stopColor="#1aaf7a"/>
      <stop offset="100%" stopColor="#053d28"/>
    </radialGradient>

    {/* Alien skin back/dark side */}
    <radialGradient id={`skB${id}`} cx="55%" cy="60%" r="62%">
      <stop offset="0%"   stopColor="#1a6050"/>
      <stop offset="50%"  stopColor="#0a3a2a"/>
      <stop offset="100%" stopColor="#021810"/>
    </radialGradient>

    {/* Bubble helmet glass */}
    <radialGradient id={`hg${id}`} cx="32%" cy="22%" r="72%">
      <stop offset="0%"   stopColor="#e8f8ff" stopOpacity="0.55"/>
      <stop offset="28%"  stopColor="#b8e8ff" stopOpacity="0.28"/>
      <stop offset="62%"  stopColor="#60c8f0" stopOpacity="0.12"/>
      <stop offset="100%" stopColor="#1060a0" stopOpacity="0.18"/>
    </radialGradient>

    {/* Helmet rim ring — kept for FootPad stroke only */}
    <radialGradient id={`hr${id}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stopColor="#7af8ff"/>
      <stop offset="50%"  stopColor="#00c8e8"/>
      <stop offset="100%" stopColor="#003858"/>
    </radialGradient>

    {/* Spacesuit body */}
    <radialGradient id={`su${id}`} cx="40%" cy="30%" r="68%">
      <stop offset="0%"   stopColor="#d0e8f0"/>
      <stop offset="35%"  stopColor="#8ab0c8"/>
      <stop offset="72%"  stopColor="#4a6878"/>
      <stop offset="100%" stopColor="#1a2c38"/>
    </radialGradient>

    {/* Suit darker back */}
    <radialGradient id={`suB${id}`} cx="55%" cy="55%" r="60%">
      <stop offset="0%"   stopColor="#4a6070"/>
      <stop offset="60%"  stopColor="#1e3040"/>
      <stop offset="100%" stopColor="#080f18"/>
    </radialGradient>

    {/* Chest panel */}
    <linearGradient id={`cp${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stopColor="#2a3a48"/>
      <stop offset="100%" stopColor="#101820"/>
    </linearGradient>

    {/* Eyes */}
    <radialGradient id={`ir${id}`} cx="28%" cy="24%" r="70%">
      <stop offset="0%"   stopColor="#ffffff"/>
      <stop offset="8%"   stopColor="#e0d0ff"/>
      <stop offset="28%"  stopColor="#7c3aed"/>
      <stop offset="60%"  stopColor="#3b0f8a"/>
      <stop offset="100%" stopColor="#08001a"/>
    </radialGradient>

    {/* Eye socket */}
    <radialGradient id={`es${id}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stopColor="#0a0018"/>
      <stop offset="100%" stopColor="#010008"/>
    </radialGradient>

    {/* Ground hover glow */}
    <radialGradient id={`gw${id}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stopColor="#34d399" stopOpacity="0.45"/>
      <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0"/>
    </radialGradient>

    {/* Helmet top sheen */}
    <radialGradient id={`hs${id}`} cx="30%" cy="15%" r="58%">
      <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.72"/>
      <stop offset="40%"  stopColor="#c0eeff" stopOpacity="0.28"/>
      <stop offset="100%" stopColor="#40a0e0" stopOpacity="0"/>
    </radialGradient>

    {/* Cheek glow */}
    <radialGradient id={`ck${id}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stopColor="#4eefc8" stopOpacity="0.4"/>
      <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0"/>
    </radialGradient>

    {/* Filters */}
    <filter id={`ef${id}`} x="-55%" y="-55%" width="210%" height="210%">
      <feGaussianBlur stdDeviation="1.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id={`sf${id}`} x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id={`bf${id}`} x="-28%" y="-28%" width="156%" height="156%">
      <feGaussianBlur stdDeviation="1.0" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
)

// ─── Big glossy alien eye ───────────────────────────────────────────────────────
const LumaEye = ({
  cx, cy,
  rx = 7.8, ry = 7.5,
  id = '',
  blinkDur = '3.8s',
  showLowerHighlight = true,
}) => (
  <g filter={`url(#ef${id})`}>
    <ellipse cx={cx} cy={cy} rx={rx + 2.2} ry={ry + 2} fill={`url(#es${id})`}/>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#ir${id})`}>
      <animate
        attributeName="ry"
        values={`${ry};${ry * 0.85};${ry};${ry * 0.88};${ry}`}
        dur={blinkDur}
        repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx={cx} cy={cy + ry * 0.06} rx={rx * 0.34} ry={ry * 0.42} fill="#030008"/>
    <ellipse
      cx={cx - rx * 0.27} cy={cy - ry * 0.28}
      rx={rx * 0.32} ry={ry * 0.28}
      fill="white" opacity="0.97"/>
    {showLowerHighlight && (
      <ellipse
        cx={cx + rx * 0.18} cy={cy + ry * 0.16}
        rx={rx * 0.13} ry={ry * 0.11}
        fill="white" opacity="0.52"/>
    )}
    <circle cx={cx - rx * 0.08} cy={cy - ry * 0.44} r={rx * 0.08} fill="white" opacity="0.72"/>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
      fill="none" stroke="#14002e" strokeWidth="0.6" opacity="0.5"/>
  </g>
)

// ─── Helmet bubble dome ─────────────────────────────────────────────────────────
const HelmetDome = ({ cx, cy, rx, ry, id = '' }) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#hg${id})`}/>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
      fill="none" stroke="#1888c8" strokeWidth="1.2" opacity="0.45"/>
    <ellipse cx={cx} cy={cy} rx={rx - 1.5} ry={ry - 1.5}
      fill="none" stroke="#60d8ff" strokeWidth="0.6" opacity="0.22"/>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#hs${id})`}/>
    <ellipse cx={cx + rx * 0.55} cy={cy - ry * 0.15} rx={rx * 0.18} ry={ry * 0.38}
      fill="white" opacity="0.14" transform={`rotate(-18,${cx + rx * 0.55},${cy - ry * 0.15})`}/>
  </g>
)

// ─── Chest display panel ────────────────────────────────────────────────────────
const ChestPanel = ({ cx, cy, id = '' }) => (
  <g>
    <rect x={cx - 6} y={cy - 4} width={12} height={8} rx={1.8} fill={`url(#cp${id})`}/>
    <rect x={cx - 6} y={cy - 4} width={12} height={8} rx={1.8}
      fill="none" stroke="#40a0c8" strokeWidth="0.5" opacity="0.6"/>
    <circle cx={cx - 3} cy={cy - 1} r={1.3} fill="#f87171" opacity="0.9"/>
    <circle cx={cx}     cy={cy - 1} r={1.3} fill="#fbbf24" opacity="0.9"/>
    <circle cx={cx + 3} cy={cy - 1} r={1.3} fill="#34d399" opacity="0.9"/>
    <rect x={cx - 4} y={cy + 2} width={8} height={1.5} rx={0.8} fill="#60c8f8" opacity="0.55"/>
  </g>
)

// ─── Cheek blush ────────────────────────────────────────────────────────────────
const Cheeks = ({ lx, ly, rx, ry, id = '' }) => (
  <g>
    <ellipse cx={lx} cy={ly} rx={4.8} ry={3.2} fill={`url(#ck${id})`} opacity="0.9"
      filter={`url(#bf${id})`}/>
    <ellipse cx={rx} cy={ry} rx={4.8} ry={3.2} fill={`url(#ck${id})`} opacity="0.9"
      filter={`url(#bf${id})`}/>
  </g>
)

// ─── Tiny smile ─────────────────────────────────────────────────────────────────
const Smile = ({ cx, cy, w = 7.2 }) => (
  <path
    d={`M${cx - w / 2},${cy - 0.1} Q${cx},${cy + 2.9} ${cx + w / 2},${cy - 0.1}`}
    stroke="#3decc8" strokeWidth="1.2" fill="none"
    strokeLinecap="round" strokeLinejoin="round" opacity="0.78"/>
)

// ─── Suit foot pad ──────────────────────────────────────────────────────────────
const FootPad = ({ cx, cy, id = '' }) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={6.2} ry={2.8}
      fill="#0e1e28" stroke={`url(#hr${id})`} strokeWidth="0.8" opacity="0.94"/>
    <ellipse cx={cx} cy={cy + 1.2} rx={5.5} ry={1.4} fill="#40d8f8" opacity="0.28"
      filter={`url(#bf${id})`}/>
  </g>
)

// ─── FACING SOUTH ──────────────────────────────────────────────────────────────
function FacingSouth() {
  const id = 'S'
  return (
    <svg width={60} height={72} viewBox="0 0 60 72" fill="none">
      <LUMA_DEFS id={id}/>

      {/* Ground hover glow */}
      <ellipse cx={30} cy={68} rx={20} ry={5} fill={`url(#gw${id})`}/>

      {/* ── SUIT BODY ── */}
      <ellipse cx={30} cy={55} rx={11} ry={9.5} fill={`url(#su${id})`}/>
      {/* Neck connector */}
      <ellipse cx={30} cy={45} rx={6} ry={4.5} fill={`url(#su${id})`}/>

      {/* Left arm */}
      <ellipse cx={16} cy={55} rx={5.5} ry={3.5} fill={`url(#su${id})`}
        transform="rotate(-18,16,55)"/>
      {/* Left hand/cuff */}
      <ellipse cx={12} cy={58} rx={3.8} ry={2.8} fill={`url(#sk${id})`}/>

      {/* Right arm */}
      <ellipse cx={44} cy={55} rx={5.5} ry={3.5} fill={`url(#su${id})`}
        transform="rotate(18,44,55)"/>
      {/* Right hand/cuff */}
      <ellipse cx={48} cy={58} rx={3.8} ry={2.8} fill={`url(#sk${id})`}/>

      {/* Chest panel */}
      <ChestPanel cx={30} cy={55} id={id}/>

      {/* ── ALIEN HEAD inside helmet ── */}
      <ellipse cx={30} cy={27} rx={19} ry={21} fill={`url(#sk${id})`}>
        <animate attributeName="ry" values="21;21.6;21" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* ── FACE ── */}
      <Cheeks lx={13} ly={32} rx={47} ry={32} id={id}/>
      <LumaEye cx={19} cy={26} rx={7.8} ry={7.5} id={id} blinkDur="3.8s"/>
      <LumaEye cx={41} cy={26} rx={7.8} ry={7.5} id={id} blinkDur="4.6s"/>
      <path d={`M27.5,36 Q30,38.5 32.5,36`}
        stroke="#0a6050" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.48"/>
      <Smile cx={30} cy={40} w={6}/>

      {/* ── BUBBLE HELMET DOME ── */}
      <HelmetDome cx={30} cy={27} rx={22} ry={24} id={id}/>

      {/* ── FEET ── */}
      <FootPad cx={21} cy={65} id={id}/>
      <FootPad cx={39} cy={65} id={id}/>
    </svg>
  )
}

// ─── FACING NORTH ──────────────────────────────────────────────────────────────
function FacingNorth() {
  const id = 'N'
  return (
    <svg width={60} height={72} viewBox="0 0 60 72" fill="none">
      <LUMA_DEFS id={id}/>

      {/* Ground hover glow */}
      <ellipse cx={30} cy={68} rx={20} ry={5} fill={`url(#gw${id})`}/>

      {/* ── SUIT BODY — from behind ── */}
      <ellipse cx={30} cy={55} rx={11} ry={9.5} fill={`url(#suB${id})`}/>
      <ellipse cx={30} cy={45} rx={6}  ry={4.5} fill={`url(#suB${id})`}/>

      {/* Arms from behind */}
      <ellipse cx={16} cy={54} rx={5.5} ry={3.5} fill={`url(#suB${id})`}
        transform="rotate(18,16,54)"/>
      <ellipse cx={44} cy={54} rx={5.5} ry={3.5} fill={`url(#suB${id})`}
        transform="rotate(-18,44,54)"/>
      {/* Green hands from behind */}
      <ellipse cx={12} cy={58} rx={3.5} ry={2.6} fill={`url(#skB${id})`}/>
      <ellipse cx={48} cy={58} rx={3.5} ry={2.6} fill={`url(#skB${id})`}/>

      {/* ── BACK OF HEAD / HELMET ── */}
      <ellipse cx={30} cy={27} rx={19} ry={21} fill={`url(#skB${id})`}>
        <animate attributeName="ry" values="21;21.6;21" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* Very faint spine shimmer */}
      <path d="M30,10 Q29.5,22 30,42"
        stroke="#021818" strokeWidth="1.5" fill="none"
        strokeLinecap="round" opacity="0.16"/>

      {/* Back of helmet dome */}
      <ellipse cx={30} cy={27} rx={22} ry={24} fill="none"
        stroke="#1070b0" strokeWidth="1.4" opacity="0.38"/>
      <ellipse cx={30} cy={27} rx={22} ry={24} fill="#0840601a"/>
      {/* Back helmet sheen */}
      <ellipse cx={30} cy={47} rx={14} ry={5}
        fill="#40c8f0" opacity="0.12"/>

      {/* ── FEET from behind ── */}
      <FootPad cx={21} cy={65} id={id}/>
      <FootPad cx={39} cy={65} id={id}/>
    </svg>
  )
}

// ─── FACING EAST ───────────────────────────────────────────────────────────────
function FacingEast() {
  const id = 'E'
  return (
    <svg width={60} height={72} viewBox="0 0 60 72" fill="none">
      <LUMA_DEFS id={id}/>

      {/* Ground hover glow — shifted right */}
      <ellipse cx={32} cy={68} rx={18} ry={4.5} fill={`url(#gw${id})`}/>

      {/* ── SUIT BODY — side view ── */}
      <ellipse cx={30} cy={55} rx={9.5} ry={9.5} fill={`url(#su${id})`}/>
      <ellipse cx={32} cy={45} rx={6}   ry={4.5} fill={`url(#su${id})`}/>

      {/* Leading arm (east) */}
      <ellipse cx={42} cy={54} rx={5} ry={3.2} fill={`url(#su${id})`}
        transform="rotate(-12,42,54)"/>
      {/* Leading hand/cuff */}
      <ellipse cx={47} cy={57} rx={3.5} ry={2.6} fill={`url(#sk${id})`}/>

      {/* Chest panel — partial side view */}
      <rect x={27} y={51} width={8} height={7} rx={1.6} fill={`url(#cp${id})`}/>
      <rect x={27} y={51} width={8} height={7} rx={1.6}
        fill="none" stroke="#40a0c8" strokeWidth="0.5" opacity="0.55"/>
      <circle cx={29} cy={54} r={1.2} fill="#f87171" opacity="0.9"/>
      <circle cx={32} cy={54} r={1.2} fill="#34d399" opacity="0.9"/>

      {/* ── HEAD/HELMET — side profile ── */}
      {/* Back half of head — darker */}
      <ellipse cx={25} cy={27} rx={17} ry={21} fill={`url(#skB${id})`}>
        <animate attributeName="ry" values="21;21.6;21" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* Front half of head — brighter skin */}
      <ellipse cx={32} cy={26} rx={17} ry={20} fill={`url(#sk${id})`}>
        <animate attributeName="ry" values="20;20.5;20" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* ── FACE east side — ONE large eye ── */}
      <LumaEye cx={42} cy={25} rx={7.5} ry={7.2} id={id} blinkDur="3.6s" showLowerHighlight={false}/>
      {/* Nose profile */}
      <path d="M47,30.5 Q50,33 47,35.5"
        stroke="#0a6050" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.4"/>
      {/* Mouth profile */}
      <path d="M38.3,36.8 Q43.6,39.9 40.2,38.5"
        stroke="#3decc8" strokeWidth="1.15" fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.64"/>

      {/* ── HELMET DOME side ── */}
      {/* Back dome half */}
      <ellipse cx={25} cy={27} rx={20} ry={23} fill="#0840601a"/>
      <ellipse cx={25} cy={27} rx={20} ry={23}
        fill="none" stroke="#1070b0" strokeWidth="0.8" opacity="0.28"/>
      {/* Front dome glass */}
      <ellipse cx={32} cy={26} rx={20} ry={22} fill={`url(#hg${id})`}/>
      <ellipse cx={32} cy={26} rx={20} ry={22}
        fill="none" stroke="#1888c8" strokeWidth="1.0" opacity="0.4"/>
      {/* Helmet sheen */}
      <ellipse cx={32} cy={26} rx={20} ry={22} fill={`url(#hs${id})`}/>

      {/* ── ONE FOOT PAD — leading (east) ── */}
      <FootPad cx={37} cy={65} id={id}/>
    </svg>
  )
}

// ─── FACING WEST ───────────────────────────────────────────────────────────────
function FacingWest() {
  const id = 'W'
  return (
    <svg width={60} height={72} viewBox="0 0 60 72" fill="none">
      <LUMA_DEFS id={id}/>

      {/* Ground hover glow — shifted left */}
      <ellipse cx={28} cy={68} rx={18} ry={4.5} fill={`url(#gw${id})`}/>

      {/* ── SUIT BODY ── */}
      <ellipse cx={30} cy={55} rx={9.5} ry={9.5} fill={`url(#su${id})`}/>
      <ellipse cx={28} cy={45} rx={6}   ry={4.5} fill={`url(#su${id})`}/>

      {/* Leading arm (west) */}
      <ellipse cx={18} cy={54} rx={5} ry={3.2} fill={`url(#su${id})`}
        transform="rotate(12,18,54)"/>
      <ellipse cx={13} cy={57} rx={3.5} ry={2.6} fill={`url(#sk${id})`}/>

      {/* Chest panel partial */}
      <rect x={25} y={51} width={8} height={7} rx={1.6} fill={`url(#cp${id})`}/>
      <rect x={25} y={51} width={8} height={7} rx={1.6}
        fill="none" stroke="#40a0c8" strokeWidth="0.5" opacity="0.55"/>
      <circle cx={27} cy={54} r={1.2} fill="#f87171" opacity="0.9"/>
      <circle cx={30} cy={54} r={1.2} fill="#34d399" opacity="0.9"/>

      {/* ── HEAD/HELMET side ── */}
      {/* Back half (east — darker) */}
      <ellipse cx={35} cy={27} rx={17} ry={21} fill={`url(#skB${id})`}>
        <animate attributeName="ry" values="21;21.6;21" dur="4s" repeatCount="indefinite"/>
      </ellipse>
      {/* Front half (west — brighter) */}
      <ellipse cx={28} cy={26} rx={17} ry={20} fill={`url(#sk${id})`}>
        <animate attributeName="ry" values="20;20.5;20" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* ONE eye — west side */}
      <LumaEye cx={18} cy={25} rx={7.5} ry={7.2} id={id} blinkDur="3.6s" showLowerHighlight={false}/>
      <path d="M13,30.5 Q10,33 13,35.5"
        stroke="#0a6050" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.4"/>
      <path d="M21.7,36.8 Q16.4,39.9 19.8,38.5"
        stroke="#3decc8" strokeWidth="1.15" fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.64"/>

      {/* Helmet dome west */}
      <ellipse cx={35} cy={27} rx={20} ry={23} fill="#0840601a"/>
      <ellipse cx={35} cy={27} rx={20} ry={23}
        fill="none" stroke="#1070b0" strokeWidth="0.8" opacity="0.28"/>
      <ellipse cx={28} cy={26} rx={20} ry={22} fill={`url(#hg${id})`}/>
      <ellipse cx={28} cy={26} rx={20} ry={22}
        fill="none" stroke="#1888c8" strokeWidth="1.0" opacity="0.4"/>
      <ellipse cx={28} cy={26} rx={20} ry={22} fill={`url(#hs${id})`}/>

      {/* ONE foot pad — leading (west) */}
      <FootPad cx={23} cy={65} id={id}/>
    </svg>
  )
}

// ─── CROUCHED — direction unknown ─────────────────────────────────────────────
function LumaCrouched({ size }) {
  return (
    <motion.div
      key="crouched"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1   }}
      exit={{    opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.35 }}
    >
      <svg width={size} height={size * 0.9} viewBox="0 0 60 64" fill="none">
        <defs>
          {/* Skin */}
          <radialGradient id="cSk" cx="48%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="#52f0b0"/>
            <stop offset="55%"  stopColor="#1aaf7a"/>
            <stop offset="100%" stopColor="#053d28"/>
          </radialGradient>
          {/* Suit */}
          <radialGradient id="cSu" cx="42%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#b0c8d8"/>
            <stop offset="50%"  stopColor="#5a7888"/>
            <stop offset="100%" stopColor="#1a2c38"/>
          </radialGradient>
          {/* Helmet glass */}
          <radialGradient id="cHg" cx="30%" cy="20%" r="72%">
            <stop offset="0%"   stopColor="#e8f8ff" stopOpacity="0.55"/>
            <stop offset="50%"  stopColor="#60c8f0" stopOpacity="0.14"/>
            <stop offset="100%" stopColor="#1060a0" stopOpacity="0.18"/>
          </radialGradient>
          {/* Helmet sheen */}
          <radialGradient id="cHs" cx="30%" cy="15%" r="58%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.68"/>
            <stop offset="45%"  stopColor="#c0eeff" stopOpacity="0.24"/>
            <stop offset="100%" stopColor="#40a0e0" stopOpacity="0"/>
          </radialGradient>
          <filter id="cG" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="cB" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.0" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Ground glow */}
        <ellipse cx={31} cy={60} rx={20} ry={4.8} fill="#34d399" opacity="0.12" filter="url(#cG)"/>

        {/* Rear leg and planted foot */}
        <path
          d="M21,47 C18,49 17,52 18.5,55.5 C19.7,58 21.8,58.8 24,58.2 C25.5,57.8 26.1,56.6 25.4,55
             C24.1,51.9 24.8,49.2 27.2,46.8"
          fill="url(#cSu)" opacity="0.92"/>
        <ellipse cx={22.6} cy={57.6} rx={6.4} ry={2.7}
          fill="#0e1e28" stroke="#40d8f8" strokeWidth="0.75" opacity="0.78"
          transform="rotate(-8,22.6,57.6)"/>

        {/* Front leg and forward foot */}
        <path
          d="M34.5,46.2 C39,48.4 41.8,51.2 42.4,54.8 C42.8,57.2 41.7,58.5 39.6,58.7
             C36.8,59 34.2,57.8 33.1,55.2 C32.2,53.1 32.6,50.5 34.5,46.2"
          fill="url(#cSu)"/>
        <ellipse cx={39.4} cy={58.2} rx={7.2} ry={2.8}
          fill="#0e1e28" stroke="#40d8f8" strokeWidth="0.8" opacity="0.88"
          transform="rotate(7,39.4,58.2)"/>

        {/* Hips / lower torso anchor */}
        <ellipse cx={30.2} cy={46.6} rx={10.2} ry={7.7}
          fill="url(#cSu)" transform="rotate(-10,30.2,46.6)"/>

        {/* Upper torso leaning forward */}
        <path
          d="M20.8,41.8 C22.2,36.8 26.5,33.8 32.6,34.3 C37.8,34.7 41.2,37.5 41.6,41.9
             C42.1,46.7 39.2,49.7 33.1,50 C25.5,50.4 19.6,47.2 20.8,41.8 Z"
          fill="url(#cSu)"/>

        {/* Protective shoulders */}
        <ellipse cx={24} cy={39.2} rx={4.8} ry={3.7} fill="url(#cSu)"
          transform="rotate(-28,24,39.2)"/>
        <ellipse cx={36.5} cy={40} rx={4.8} ry={3.8} fill="url(#cSu)"
          transform="rotate(26,36.5,40)"/>

        {/* Arms tucked close with slight asymmetry */}
        <ellipse cx={19.6} cy={46.2} rx={5.9} ry={3.2} fill="url(#cSu)" opacity="0.94"
          transform="rotate(-34,19.6,46.2)"/>
        <ellipse cx={39.8} cy={45.5} rx={6.1} ry={3.1} fill="url(#cSu)" opacity="0.92"
          transform="rotate(24,39.8,45.5)"/>

        {/* Green hands near knee/body */}
        <ellipse cx={16.1} cy={49.1} rx={3.3} ry={2.5} fill="url(#cSk)"
          transform="rotate(-18,16.1,49.1)"/>
        <ellipse cx={43.8} cy={47.8} rx={3.4} ry={2.5} fill="url(#cSk)"
          transform="rotate(14,43.8,47.8)"/>

        {/* Chest panel angled with the lean */}
        <g transform="rotate(-10,30.5,43.5)">
          <rect x={25.5} y={40} width={10} height={7} rx={1.8} fill="#101820" opacity="0.82"/>
          <circle cx={28.2} cy={43.2} r={1.1} fill="#f87171" opacity="0.72"/>
          <circle cx={31.8} cy={43.2} r={1.1} fill="#fbbf24" opacity="0.72"/>
          <rect x={27.3} y={45.2} width={6.2} height={1.2} rx={0.6} fill="#60c8f8" opacity="0.3"/>
        </g>

        {/* Alien head skin — hunched forward */}
        <ellipse cx={31.2} cy={26} rx={17} ry={19} fill="url(#cSk)"
          transform="rotate(13,31.2,26)"/>

        {/* Eyes closed */}
        <g transform="rotate(13,31.2,26)">
          <ellipse cx={21.9} cy={27.5} rx={8.1} ry={7.6} fill="#06000f" opacity="0.92"/>
          <ellipse cx={40.2} cy={28.4} rx={7.8} ry={7.3} fill="#06000f" opacity="0.92"/>

          <ellipse cx={22.3} cy={27.8} rx={6.2} ry={6.5} fill="#5b21b6"/>
          <ellipse cx={40.1} cy={28.7} rx={6.0} ry={6.2} fill="#5b21b6"/>

          <ellipse cx={22.5} cy={29.7} rx={2.1} ry={2.5} fill="#030008"/>
          <ellipse cx={40.2} cy={30.4} rx={2.0} ry={2.4} fill="#030008"/>

          <ellipse cx={20.5} cy={24.8} rx={1.8} ry={1.4} fill="white" opacity="0.9"/>
          <ellipse cx={38.4} cy={25.8} rx={1.7} ry={1.3} fill="white" opacity="0.9"/>
          <ellipse cx={24.4} cy={30.2} rx={0.8} ry={0.6} fill="white" opacity="0.45"/>
          <ellipse cx={42} cy={31} rx={0.8} ry={0.6} fill="white" opacity="0.45"/>

          <path d="M17.6,21.7 Q21.7,19.7 25.4,21.2"
            stroke="#0a6050" strokeWidth="0.85" fill="none"
            strokeLinecap="round" opacity="0.38"/>
          <path d="M35.6,22.7 Q39.2,20.9 42.8,22.3"
            stroke="#0a6050" strokeWidth="0.85" fill="none"
            strokeLinecap="round" opacity="0.38"/>

          <path d="M27.2,38 Q30.3,35 33.4,37.9"
            stroke="#3decc8" strokeWidth="1.08" fill="none"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.68"/>
        </g>

        {/* Helmet dome crouched */}
        <ellipse cx={31.2} cy={26} rx={20} ry={22} fill="url(#cHg)"
          transform="rotate(13,31.2,26)"/>
        <ellipse cx={31.2} cy={26} rx={20} ry={22}
          fill="none" stroke="#1888c8" strokeWidth="1.1" opacity="0.4"
          transform="rotate(13,31.2,26)"/>
        <ellipse cx={31.2} cy={26} rx={20} ry={22} fill="url(#cHs)"
          transform="rotate(13,31.2,26)"/>

        {/* Bioluminescent flickers on skin */}
        <circle cx={27.3} cy={31.5} r={1.4} fill="#2dd4bf" opacity="0.18" filter="url(#cB)">
          <animate attributeName="opacity" values="0.1;0.26;0.1" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx={35.8} cy={29.4} r={1.1} fill="#2dd4bf" opacity="0.15" filter="url(#cB)">
          <animate attributeName="opacity" values="0.1;0.20;0.1" dur="3.1s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </motion.div>
  )
}

// ─── Standing LUMA — persistent layered crossfade, no remount on turn ──────────
// All 4 directional sprites are always mounted and stacked.
// Only opacity changes when facing changes — no exit/enter gap.
function LumaStanding({ size, facing }) {
  const directions = ['south', 'north', 'east', 'west']
  const sprites = {
    south: FacingSouth,
    north: FacingNorth,
    east:  FacingEast,
    west:  FacingWest,
  }

  return (
    <div style={{
      position:        'relative',
      width:            size,
      height:           size,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
    }}>
      {directions.map((dir) => {
        const Sprite = sprites[dir]
        const isActive = facing === dir
        return (
          <motion.div
            key={dir}
            animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position:        'absolute',
              top:              0,
              left:             0,
              width:            '100%',
              height:           '100%',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              pointerEvents:   'none',
            }}
          >
            <Sprite/>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Main export ────────────────────────────────────────────────────────────────
export default function LumaSprite({
  x, y,
  facing     = 'south',
  tileSize,
  showFacing = false,
}) {
  const size = tileSize * 0.84

  return (
    <motion.div
      style={{
        position:       'absolute',
        width:           tileSize,
        height:          tileSize,
        top:             0,
        left:            0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        pointerEvents:  'none',
        zIndex:          10,
      }}
      animate={{ x: x * tileSize, y: y * tileSize }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
    >
      {/* Ground shadow */}
      <motion.div
        animate={{ scaleX: [1, 1.07, 1], opacity: [0.18, 0.30, 0.18] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position:     'absolute',
          bottom:        2,
          width:         tileSize * 0.54,
          height:        10,
          borderRadius: '50%',
          background:   'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
        }}
      />

      {/* Bioluminescent ambient glow — cyan-teal breathing */}
      <motion.div
        animate={{ opacity: [0.10, 0.38, 0.10], scale: [0.88, 1.08, 0.88] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position:     'absolute',
          width:         tileSize * 0.88,
          height:        tileSize * 0.88,
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(64,200,248,0.20) 0%, transparent 66%)',
        }}
      />

      {/* Sprite layer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {showFacing
            ? (
              <motion.div
                key="standing"
                initial={{ opacity: 0.5, scale: 0.93 }}
                animate={{ opacity: 1,   scale: 1    }}
                exit={{    opacity: 0.5, scale: 0.93 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <LumaStanding size={size} facing={facing}/>
              </motion.div>
            )
            : <LumaCrouched key="crouched" size={size}/>
          }
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
