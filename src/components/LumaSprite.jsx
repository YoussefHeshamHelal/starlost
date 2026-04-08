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
    <ellipse
      cx={cx + rx * 0.18} cy={cy + ry * 0.16}
      rx={rx * 0.13} ry={ry * 0.11}
      fill="white" opacity="0.52"/>
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
const Smile = ({ cx, cy, w = 6 }) => (
  <path
    d={`M${cx - w / 2},${cy} Q${cx},${cy + 2.6} ${cx + w / 2},${cy}`}
    stroke="#3decc8" strokeWidth="1.1" fill="none"
    strokeLinecap="round" opacity="0.75"/>
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
      <LumaEye cx={42} cy={25} rx={7.5} ry={7.2} id={id} blinkDur="3.6s"/>
      {/* Cheek blush east */}
      <ellipse cx={49} cy={32} rx={4} ry={3} fill={`url(#ck${id})`}
        opacity="0.8" filter={`url(#bf${id})`}/>
      {/* Nose profile */}
      <path d="M47,30.5 Q50,33 47,35.5"
        stroke="#0a6050" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.4"/>
      {/* Mouth profile */}
      <path d="M44,38 Q47,40.5 45,43"
        stroke="#3decc8" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.5"/>

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
      <LumaEye cx={18} cy={25} rx={7.5} ry={7.2} id={id} blinkDur="3.6s"/>
      <ellipse cx={11} cy={32} rx={4} ry={3} fill={`url(#ck${id})`}
        opacity="0.8" filter={`url(#bf${id})`}/>
      <path d="M13,30.5 Q10,33 13,35.5"
        stroke="#0a6050" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.4"/>
      <path d="M16,38 Q13,40.5 15,43"
        stroke="#3decc8" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.5"/>

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
        <ellipse cx={30} cy={60} rx={18} ry={4.5} fill="#34d399" opacity="0.12" filter="url(#cG)"/>

        {/* Suit body crouched */}
        <ellipse cx={30} cy={44} rx={13} ry={10} fill="url(#cSu)"/>
        {/* Arms curled */}
        <ellipse cx={14} cy={45} rx={5.5} ry={3.5} fill="url(#cSu)" opacity="0.85"
          transform="rotate(-20,14,45)"/>
        <ellipse cx={46} cy={45} rx={5.5} ry={3.5} fill="url(#cSu)" opacity="0.85"
          transform="rotate(20,46,45)"/>
        {/* Green hands */}
        <ellipse cx={10} cy={48} rx={3.5} ry={2.6} fill="url(#cSk)"/>
        <ellipse cx={50} cy={48} rx={3.5} ry={2.6} fill="url(#cSk)"/>

        {/* Chest panel */}
        <rect x={23} y={41} width={10} height={7} rx={1.8} fill="#101820" opacity="0.8"/>
        <circle cx={26} cy={44} r={1.1} fill="#f87171" opacity="0.7"/>
        <circle cx={30} cy={44} r={1.1} fill="#fbbf24" opacity="0.7"/>

        {/* Alien head skin — hunched forward */}
        <ellipse cx={30} cy={24} rx={17} ry={19} fill="url(#cSk)"/>

        {/* Eyes closed */}
        <path d="M17,26 Q21,23 25,26"
          stroke="#3decc8" strokeWidth="1.5" fill="none"
          strokeLinecap="round" opacity="0.55"/>
        <path d="M35,26 Q39,23 43,26"
          stroke="#3decc8" strokeWidth="1.5" fill="none"
          strokeLinecap="round" opacity="0.55"/>

        {/* Helmet dome crouched */}
        <ellipse cx={30} cy={24} rx={20} ry={22} fill="url(#cHg)"/>
        <ellipse cx={30} cy={24} rx={20} ry={22}
          fill="none" stroke="#1888c8" strokeWidth="1.1" opacity="0.4"/>
        <ellipse cx={30} cy={24} rx={20} ry={22} fill="url(#cHs)"/>

        {/* Bioluminescent flickers on skin */}
        <circle cx={26} cy={30} r={1.4} fill="#2dd4bf" opacity="0.18" filter="url(#cB)">
          <animate attributeName="opacity" values="0.1;0.26;0.1" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx={34} cy={28} r={1.1} fill="#2dd4bf" opacity="0.15" filter="url(#cB)">
          <animate attributeName="opacity" values="0.1;0.20;0.1" dur="3.1s" repeatCount="indefinite"/>
        </circle>

        {/* Feet tucked */}
        <ellipse cx={20} cy={56} rx={5.8} ry={2.6}
          fill="#0e1e28" stroke="#40d8f8" strokeWidth="0.7" opacity="0.55"/>
        <ellipse cx={40} cy={56} rx={5.8} ry={2.6}
          fill="#0e1e28" stroke="#40d8f8" strokeWidth="0.7" opacity="0.55"/>

        {/* Floating "?" */}
        <text x={50} y={13} textAnchor="middle"
          fill="#2dd4bf" fontSize={14} fontFamily="monospace" fontWeight="bold">
          <animate attributeName="opacity" values="0.3;0.88;0.3" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="y"       values="13;8;13"       dur="1.8s" repeatCount="indefinite"/>
          ?
        </text>
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