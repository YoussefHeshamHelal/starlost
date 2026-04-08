// LumaSprite.jsx — LUMA v7 — CUTE ALIEN CHILD
//
// Luma is a top-down 2D alien child for a kids' puzzle-adventure game.
// She is NOT a robot, NOT an insect, NOT a blob, NOT a sea creature.
//
// Design language:
//   - Oversized smooth round head (takes ~60% of the total sprite height)
//   - Enormous round glossy eyes — the emotional centerpiece
//   - Tiny soft nose ridge + tiny warm smile (south & profile only)
//   - Very small soft body below the head
//   - Tiny smooth arm stubs, small rounded foot pads
//   - One optional tiny smooth alien nub on top of head (never reads as antenna)
//   - Bright cheerful luminous green-teal skin, purple-blue glossy eyes
//   - Subtle cheek blush circles for extra cuteness
//   - No antennae, no fronds, no fins, no insect anatomy
//
// 4 DIRECTIONAL SPRITES:
//   south : both eyes visible, cutest most open view
//   north : back of smooth head, dorsal amber glow, eyes hidden
//   east  : one eye, head points right, ONE foot pad only
//   west  : one eye, head points left, ONE foot pad only
//
// CROUCHED: direction unknown, eyes closed, "?" floats
//
// ANIMATION: cross-fade transitions only — Luma never disappears mid-turn.
//
import { motion, AnimatePresence } from 'framer-motion'

// ─── Shared gradient & filter defs ────────────────────────────────────────────
const LUMA_DEFS = ({ id = '' }) => (
  <defs>
    {/* Head skin — bright luminous green-teal, very cheerful */}
    <radialGradient id={`hF${id}`} cx="40%" cy="32%" r="68%">
      <stop offset="0%"   stopColor="#88ffe4"/>
      <stop offset="22%"  stopColor="#3decc8"/>
      <stop offset="55%"  stopColor="#0fa88e"/>
      <stop offset="100%" stopColor="#023830"/>
    </radialGradient>

    {/* Head back — deeper teal-indigo, still bright enough */}
    <radialGradient id={`hB${id}`} cx="55%" cy="58%" r="62%">
      <stop offset="0%"   stopColor="#1a6060"/>
      <stop offset="48%"  stopColor="#0a3245"/>
      <stop offset="100%" stopColor="#030e1a"/>
    </radialGradient>

    {/* Body — slightly richer green, small and cute */}
    <radialGradient id={`bd${id}`} cx="48%" cy="38%" r="62%">
      <stop offset="0%"   stopColor="#44e8c0"/>
      <stop offset="50%"  stopColor="#0c8070"/>
      <stop offset="100%" stopColor="#021e18"/>
    </radialGradient>

    {/* Eyes — round, dreamy, rich purple-blue iris, very glossy */}
    <radialGradient id={`ir${id}`} cx="30%" cy="26%" r="68%">
      <stop offset="0%"   stopColor="#ffffff"/>
      <stop offset="10%"  stopColor="#ddd0ff"/>
      <stop offset="30%"  stopColor="#6d28d9"/>
      <stop offset="62%"  stopColor="#2e1065"/>
      <stop offset="100%" stopColor="#08001a"/>
    </radialGradient>

    {/* Eye socket — very dark deep purple-black */}
    <radialGradient id={`sk${id}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stopColor="#0a0018"/>
      <stop offset="100%" stopColor="#010008"/>
    </radialGradient>

    {/* Dorsal back glow — warm amber, organic, soft blob */}
    <radialGradient id={`dg${id}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stopColor="#fef08a" stopOpacity="0.95"/>
      <stop offset="38%"  stopColor="#f59e0b" stopOpacity="0.65"/>
      <stop offset="100%" stopColor="#451a03" stopOpacity="0"/>
    </radialGradient>

    {/* Hover glow under feet */}
    <radialGradient id={`hg${id}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stopColor="#34d399" stopOpacity="0.5"/>
      <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0"/>
    </radialGradient>

    {/* Top cranium sheen — bright specular */}
    <radialGradient id={`sh${id}`} cx="45%" cy="18%" r="55%">
      <stop offset="0%"   stopColor="#ccfff2" stopOpacity="0.55"/>
      <stop offset="60%"  stopColor="#88ffe4" stopOpacity="0.1"/>
      <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0"/>
    </radialGradient>

    {/* Cheek blush — very subtle warm teal highlight */}
    <radialGradient id={`ck${id}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stopColor="#5eead4" stopOpacity="0.35"/>
      <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0"/>
    </radialGradient>

    {/* Filters */}
    <filter id={`eg${id}`} x="-55%" y="-55%" width="210%" height="210%">
      <feGaussianBlur stdDeviation="1.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id={`sg${id}`} x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id={`df${id}`} x="-90%" y="-90%" width="280%" height="280%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id={`bf${id}`} x="-28%" y="-28%" width="156%" height="156%">
      <feGaussianBlur stdDeviation="1.1" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
)

// ─── Big round glossy eye ─────────────────────────────────────────────────────
// Rounder and softer — childlike and innocent.
// rx and ry are nearly equal for a round rather than almond shape.
const LumaEye = ({
  cx, cy,
  rx = 7.5, ry = 7.2,
  id = '',
  blinkDur = '3.8s',
  dimmed = false,
}) => (
  <g opacity={dimmed ? 0.15 : 1} filter={`url(#eg${id})`}>
    {/* Socket — large, soft dark surround */}
    <ellipse cx={cx} cy={cy} rx={rx + 2} ry={ry + 1.8} fill={`url(#sk${id})`}/>
    {/* Iris — rich purple-violet round */}
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#ir${id})`}>
      <animate
        attributeName="ry"
        values={`${ry};${ry * 0.86};${ry};${ry * 0.9};${ry}`}
        dur={blinkDur}
        repeatCount="indefinite"/>
    </ellipse>
    {/* Pupil — round, deep */}
    <ellipse cx={cx} cy={cy + ry * 0.06} rx={rx * 0.36} ry={ry * 0.44} fill="#04000c"/>
    {/* Primary highlight — big bright star-like spot */}
    <ellipse
      cx={cx - rx * 0.28}
      cy={cy - ry * 0.30}
      rx={rx * 0.30}
      ry={ry * 0.26}
      fill="white"
      opacity="0.96"/>
    {/* Secondary soft highlight */}
    <ellipse
      cx={cx + rx * 0.20}
      cy={cy + ry * 0.14}
      rx={rx * 0.12}
      ry={ry * 0.10}
      fill="white"
      opacity="0.55"/>
    {/* Tiny sparkle dot */}
    <circle cx={cx - rx * 0.10} cy={cy - ry * 0.42} r={rx * 0.07} fill="white" opacity="0.7"/>
    {/* Limbal ring */}
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
      fill="none" stroke="#16003a" strokeWidth="0.65" opacity="0.55"/>
  </g>
)

// ─── Organic dorsal back glow ─────────────────────────────────────────────────
// A soft warm amber bioluminescent patch — biological, not gadget-like.
const DorsalMark = ({ cx, cy, id = '' }) => (
  <g filter={`url(#df${id})`}>
    <ellipse cx={cx} cy={cy} rx={13} ry={10} fill={`url(#dg${id})`} opacity="0.38">
      <animate attributeName="opacity" values="0.26;0.52;0.26" dur="2.8s" repeatCount="indefinite"/>
      <animate attributeName="rx"      values="11;14;11"        dur="2.8s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx={cx} cy={cy} rx={5.5} ry={4.5} fill="#fbbf24" opacity="0.8">
      <animate attributeName="opacity" values="0.65;0.95;0.65" dur="2.3s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx={cx} cy={cy} rx={2.5} ry={2}   fill="#fef9c3" opacity="0.98"/>
    <ellipse cx={cx - 0.8} cy={cy - 0.8} rx={1} ry={0.8} fill="white" opacity="0.85"/>
  </g>
)

// ─── Tiny alien nub on top of head ───────────────────────────────────────────
// One small smooth rounded bump — subtle, cute, never reads as antenna.
const HeadNub = ({ cx, cy, id = '' }) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={2.8} ry={2.2}
      fill="#3decc8" opacity="0.85" filter={`url(#bf${id})`}/>
    <ellipse cx={cx} cy={cy} rx={1.4} ry={1.1}
      fill="#88ffe4" opacity="0.7"/>
  </g>
)

// ─── Tiny nose ridge ──────────────────────────────────────────────────────────
const NoseRidge = ({ cx, cy }) => (
  <path
    d={`M${cx - 2.2},${cy} Q${cx},${cy + 2.8} ${cx + 2.2},${cy}`}
    stroke="#0a6655" strokeWidth="0.95" fill="none"
    strokeLinecap="round" opacity="0.5"/>
)

// ─── Tiny warm smile ──────────────────────────────────────────────────────────
const Smile = ({ cx, cy, w = 6.5 }) => (
  <path
    d={`M${cx - w / 2},${cy} Q${cx},${cy + 2.8} ${cx + w / 2},${cy}`}
    stroke="#3decc8" strokeWidth="1.05" fill="none"
    strokeLinecap="round" opacity="0.72"/>
)

// ─── Subtle cheek blush circles ───────────────────────────────────────────────
const Cheeks = ({ lx, ly, rx, ry, id = '' }) => (
  <g>
    <ellipse cx={lx} cy={ly} rx={4.5} ry={3} fill={`url(#ck${id})`} opacity="0.9"
      filter={`url(#bf${id})`}/>
    <ellipse cx={rx} cy={ry} rx={4.5} ry={3} fill={`url(#ck${id})`} opacity="0.9"
      filter={`url(#bf${id})`}/>
  </g>
)

// ─── FACING SOUTH ─────────────────────────────────────────────────────────────
// Main hero view. Both eyes fully visible. Cutest, most open, brightest face.
function FacingSouth() {
  const id = 'S'
  return (
    <svg width={58} height={70} viewBox="0 0 58 70" fill="none">
      <LUMA_DEFS id={id}/>

      {/* Ground hover glow */}
      <ellipse cx={29} cy={66} rx={19} ry={5} fill={`url(#hg${id})`}/>

      {/* ── BODY — small, round, cute ── */}
      <ellipse cx={29} cy={55} rx={9.5} ry={8.5} fill={`url(#bd${id})`}/>
      <ellipse cx={29} cy={44} rx={5.5} ry={4}   fill={`url(#bd${id})`}/>
      {/* Left arm stub */}
      <ellipse cx={16.5} cy={55} rx={5} ry={3.2} fill={`url(#bd${id})`}
        transform="rotate(-20,16.5,55)"/>
      {/* Right arm stub */}
      <ellipse cx={41.5} cy={55} rx={5} ry={3.2} fill={`url(#bd${id})`}
        transform="rotate(20,41.5,55)"/>

      {/* ── HEAD — oversized smooth round cranium ── */}
      <ellipse cx={29} cy={27} rx={21} ry={23} fill={`url(#hF${id})`}>
        <animate attributeName="ry" values="23;23.6;23" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* Cranium top sheen */}
      <ellipse cx={29} cy={14} rx={17} ry={11} fill={`url(#sh${id})`}/>

      {/* Tiny alien nub on top */}
      <HeadNub cx={29} cy={5} id={id}/>

      {/* ── FACE ── */}
      {/* Cheek blush */}
      <Cheeks lx={12} ly={33} rx={46} ry={33} id={id}/>

      {/* Eyes — both large and round */}
      <LumaEye cx={18} cy={27} rx={7.5} ry={7.2} id={id} blinkDur="3.8s"/>
      <LumaEye cx={40} cy={27} rx={7.5} ry={7.2} id={id} blinkDur="4.6s"/>

      {/* Tiny nose */}
      <NoseRidge cx={29} cy={37}/>
      {/* Smile */}
      <Smile cx={29} cy={40.5} w={6.5}/>

      {/* ── FEET — two rounded pads, both visible from front ── */}
      <ellipse cx={21} cy={63} rx={5.8} ry={2.8}
        fill="#062820" stroke="#2dd4bf" strokeWidth="0.75" opacity="0.92"/>
      <ellipse cx={37} cy={63} rx={5.8} ry={2.8}
        fill="#062820" stroke="#2dd4bf" strokeWidth="0.75" opacity="0.92"/>
      {/* Foot glow */}
      <ellipse cx={21} cy={64.5} rx={5.8} ry={1.6}
        fill="#2dd4bf" opacity="0.3" filter={`url(#bf${id})`}/>
      <ellipse cx={37} cy={64.5} rx={5.8} ry={1.6}
        fill="#2dd4bf" opacity="0.3" filter={`url(#bf${id})`}/>
    </svg>
  )
}

// ─── FACING NORTH ─────────────────────────────────────────────────────────────
// Back of smooth head. Eyes hidden. Organic dorsal warm glow visible.
function FacingNorth() {
  const id = 'N'
  return (
    <svg width={58} height={70} viewBox="0 0 58 70" fill="none">
      <LUMA_DEFS id={id}/>

      {/* Ground hover glow */}
      <ellipse cx={29} cy={66} rx={19} ry={5} fill={`url(#hg${id})`}/>

      {/* ── BODY — seen from behind ── */}
      <ellipse cx={29} cy={55} rx={9.5} ry={8.5} fill={`url(#hB${id})`}/>
      <ellipse cx={29} cy={44} rx={5.5} ry={4}   fill={`url(#hB${id})`}/>
      {/* Arms from behind */}
      <ellipse cx={16.5} cy={54} rx={5} ry={3.2} fill={`url(#hB${id})`}
        transform="rotate(20,16.5,54)"/>
      <ellipse cx={41.5} cy={54} rx={5} ry={3.2} fill={`url(#hB${id})`}
        transform="rotate(-20,41.5,54)"/>

      {/* ── HEAD — back of cranium ── */}
      <ellipse cx={29} cy={27} rx={21} ry={23} fill={`url(#hB${id})`}>
        <animate attributeName="ry" values="23;23.6;23" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* Subtle back-of-head rim — shows the round volume */}
      <ellipse cx={29} cy={13} rx={16} ry={9} fill="#1a5a5a" opacity="0.28"/>

      {/* Very faint bioluminescent skin shimmer on back */}
      <ellipse cx={29} cy={25} rx={10} ry={8} fill="#2dd4bf" opacity="0.06"
        filter={`url(#sg${id})`}/>

      {/* Nub visible from back */}
      <HeadNub cx={29} cy={5} id={id}/>

      {/* ── DORSAL BACK MARKING ── */}
      <DorsalMark cx={29} cy={23} id={id}/>

      {/* Subtle spine crease — very faint */}
      <path d="M29,10 Q28.5,22 29,42"
        stroke="#021818" strokeWidth="1.6" fill="none"
        strokeLinecap="round" opacity="0.18"/>

      {/* ── FEET — from behind, slightly dimmer ── */}
      <ellipse cx={21} cy={63} rx={5.8} ry={2.8}
        fill="#062820" stroke="#1a5a4a" strokeWidth="0.7" opacity="0.72"/>
      <ellipse cx={37} cy={63} rx={5.8} ry={2.8}
        fill="#062820" stroke="#1a5a4a" strokeWidth="0.7" opacity="0.72"/>
      <ellipse cx={21} cy={64.5} rx={5.8} ry={1.6} fill="#2dd4bf" opacity="0.1"/>
      <ellipse cx={37} cy={64.5} rx={5.8} ry={1.6} fill="#2dd4bf" opacity="0.1"/>
    </svg>
  )
}

// ─── FACING EAST ──────────────────────────────────────────────────────────────
// Head points right. ONE eye. Full round body volume. ONE foot pad only.
function FacingEast() {
  const id = 'E'
  return (
    <svg width={58} height={70} viewBox="0 0 58 70" fill="none">
      <LUMA_DEFS id={id}/>

      {/* Ground hover glow — shifted slightly right */}
      <ellipse cx={31} cy={66} rx={17} ry={4.5} fill={`url(#hg${id})`}/>

      {/* ── BODY — full round, side view ── */}
      <ellipse cx={29} cy={55} rx={8.5} ry={8.5} fill={`url(#bd${id})`}/>
      <ellipse cx={31} cy={44} rx={5.5} ry={4}   fill={`url(#bd${id})`}/>
      {/* ONE arm — trailing left side stub */}
      <ellipse cx={21} cy={56} rx={4.5} ry={3}   fill={`url(#bd${id})`}
        transform="rotate(14,21,56)"/>

      {/* ── HEAD — round, large, points right ── */}
      {/* Back half (left, darker) */}
      <ellipse cx={24} cy={27} rx={17} ry={21} fill={`url(#hB${id})`}>
        <animate attributeName="ry" values="21;21.6;21" dur="4s" repeatCount="indefinite"/>
      </ellipse>
      {/* Front half (right, brighter) */}
      <ellipse cx={31} cy={26} rx={17} ry={20} fill={`url(#hF${id})`}>
        <animate attributeName="ry" values="20;20.5;20" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* Cranium sheen */}
      <ellipse cx={29} cy={13} rx={15} ry={9} fill={`url(#sh${id})`}/>

      {/* Head nub */}
      <HeadNub cx={29} cy={5} id={id}/>

      {/* Dorsal mark peeking from back (left) — very dim */}
      <g opacity="0.28">
        <DorsalMark cx={18} cy={24} id={id}/>
      </g>

      {/* ── FACE — right/east side only ── */}
      {/* ONE big round eye */}
      <LumaEye cx={40} cy={26} rx={7} ry={6.8} id={id} blinkDur="3.6s"/>
      {/* Back eye — invisible socket hint */}
      <ellipse cx={19} cy={27} rx={2.8} ry={2.4} fill="#04000c" opacity="0.18"/>

      {/* Cheek blush — right side only */}
      <ellipse cx={47} cy={32} rx={4} ry={2.8} fill={`url(#ck${id})`}
        opacity="0.8" filter={`url(#bf${id})`}/>

      {/* Nose profile bump */}
      <path d="M46,31 Q48,33.5 46,36"
        stroke="#0a6655" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.42"/>
      {/* Mouth profile */}
      <path d="M44,38.5 Q46,41 45,43.5"
        stroke="#3decc8" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.52"/>

      {/* ── ONE FOOT PAD — leading (east/right) ── */}
      <ellipse cx={36} cy={63} rx={6.2} ry={2.8}
        fill="#062820" stroke="#2dd4bf" strokeWidth="0.75" opacity="0.92"/>
      <ellipse cx={36} cy={64.5} rx={6.2} ry={1.6}
        fill="#2dd4bf" opacity="0.3" filter={`url(#bf${id})`}/>
      {/* Trailing foot stays fully hidden behind body */}
    </svg>
  )
}

// ─── FACING WEST ──────────────────────────────────────────────────────────────
// Head points left. ONE eye. Full round body. ONE foot pad only.
function FacingWest() {
  const id = 'W'
  return (
    <svg width={58} height={70} viewBox="0 0 58 70" fill="none">
      <LUMA_DEFS id={id}/>

      {/* Ground hover glow — shifted slightly left */}
      <ellipse cx={27} cy={66} rx={17} ry={4.5} fill={`url(#hg${id})`}/>

      {/* ── BODY ── */}
      <ellipse cx={29} cy={55} rx={8.5} ry={8.5} fill={`url(#bd${id})`}/>
      <ellipse cx={27} cy={44} rx={5.5} ry={4}   fill={`url(#bd${id})`}/>
      {/* ONE arm — trailing right side stub */}
      <ellipse cx={37} cy={56} rx={4.5} ry={3}   fill={`url(#bd${id})`}
        transform="rotate(-14,37,56)"/>

      {/* ── HEAD — round, points left ── */}
      {/* Back half (right, darker) */}
      <ellipse cx={34} cy={27} rx={17} ry={21} fill={`url(#hB${id})`}>
        <animate attributeName="ry" values="21;21.6;21" dur="4s" repeatCount="indefinite"/>
      </ellipse>
      {/* Front half (left, brighter) */}
      <ellipse cx={27} cy={26} rx={17} ry={20} fill={`url(#hF${id})`}>
        <animate attributeName="ry" values="20;20.5;20" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* Cranium sheen */}
      <ellipse cx={29} cy={13} rx={15} ry={9} fill={`url(#sh${id})`}/>

      {/* Head nub */}
      <HeadNub cx={29} cy={5} id={id}/>

      {/* Dorsal mark peeking from back (right) — very dim */}
      <g opacity="0.28">
        <DorsalMark cx={40} cy={24} id={id}/>
      </g>

      {/* ── FACE — left/west side only ── */}
      {/* ONE big round eye */}
      <LumaEye cx={18} cy={26} rx={7} ry={6.8} id={id} blinkDur="3.6s"/>
      {/* Back eye socket hint */}
      <ellipse cx={39} cy={27} rx={2.8} ry={2.4} fill="#04000c" opacity="0.18"/>

      {/* Cheek blush — left side only */}
      <ellipse cx={11} cy={32} rx={4} ry={2.8} fill={`url(#ck${id})`}
        opacity="0.8" filter={`url(#bf${id})`}/>

      {/* Nose profile bump */}
      <path d="M12,31 Q10,33.5 12,36"
        stroke="#0a6655" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.42"/>
      {/* Mouth profile */}
      <path d="M14,38.5 Q12,41 13,43.5"
        stroke="#3decc8" strokeWidth="0.9" fill="none"
        strokeLinecap="round" opacity="0.52"/>

      {/* ── ONE FOOT PAD — leading (west/left) ── */}
      <ellipse cx={22} cy={63} rx={6.2} ry={2.8}
        fill="#062820" stroke="#2dd4bf" strokeWidth="0.75" opacity="0.92"/>
      <ellipse cx={22} cy={64.5} rx={6.2} ry={1.6}
        fill="#2dd4bf" opacity="0.3" filter={`url(#bf${id})`}/>
      {/* Trailing foot stays fully hidden */}
    </svg>
  )
}

// ─── CROUCHED — direction unknown, eyes closed, "?" floats ───────────────────
function LumaCrouched({ size }) {
  return (
    <motion.div
      key="crouched"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1   }}
      exit={{    opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.35 }}
    >
      <svg width={size} height={size * 0.9} viewBox="0 0 58 62" fill="none">
        <defs>
          <radialGradient id="cH" cx="48%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="#3decc8" stopOpacity="0.92"/>
            <stop offset="52%"  stopColor="#0a8070" stopOpacity="0.96"/>
            <stop offset="100%" stopColor="#021e18" stopOpacity="1"/>
          </radialGradient>
          <filter id="cG" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.8" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="cS" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.1" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Hover glow */}
        <ellipse cx={29} cy={58} rx={17} ry={4.5}
          fill="#2dd4bf" opacity="0.13" filter="url(#cG)"/>

        {/* Crouched body blob */}
        <ellipse cx={29} cy={40} rx={15} ry={11} fill="url(#cH)"/>
        {/* Large head hunched forward */}
        <ellipse cx={29} cy={25} rx={18} ry={17} fill="url(#cH)"/>

        {/* Arms curled in */}
        <ellipse cx={14} cy={42} rx={5.5} ry={3.2} fill="url(#cH)" opacity="0.85"
          transform="rotate(-22,14,42)"/>
        <ellipse cx={44} cy={42} rx={5.5} ry={3.2} fill="url(#cH)" opacity="0.85"
          transform="rotate(22,44,42)"/>

        {/* Eyes closed — two gentle curved lines */}
        <path d="M18,27 Q21.5,24.5 25,27"
          stroke="#3decc8" strokeWidth="1.5" fill="none"
          strokeLinecap="round" opacity="0.55"/>
        <path d="M33,27 Q36.5,24.5 40,27"
          stroke="#3decc8" strokeWidth="1.5" fill="none"
          strokeLinecap="round" opacity="0.55"/>

        {/* Faint bioluminescent flickers */}
        <circle cx={25} cy={33} r={1.5} fill="#2dd4bf" opacity="0.2" filter="url(#cS)">
          <animate attributeName="opacity" values="0.1;0.28;0.1" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx={33} cy={31} r={1.2} fill="#2dd4bf" opacity="0.18" filter="url(#cS)">
          <animate attributeName="opacity" values="0.1;0.22;0.1" dur="3.2s" repeatCount="indefinite"/>
        </circle>

        {/* Feet tucked */}
        <ellipse cx={20} cy={53} rx={5.5} ry={2.4}
          fill="#062820" stroke="#1a5a4a" strokeWidth="0.6" opacity="0.55"/>
        <ellipse cx={38} cy={53} rx={5.5} ry={2.4}
          fill="#062820" stroke="#1a5a4a" strokeWidth="0.6" opacity="0.55"/>

        {/* Floating "?" */}
        <text x={49} y={14} textAnchor="middle"
          fill="#2dd4bf" fontSize={14} fontFamily="monospace" fontWeight="bold">
          <animate attributeName="opacity" values="0.3;0.88;0.3" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="y"       values="14;9;14"       dur="1.8s" repeatCount="indefinite"/>
          ?
        </text>
      </svg>
    </motion.div>
  )
}

// ─── Standing LUMA — direction picker with smooth cross-fade ─────────────────
// AnimatePresence mode="wait" with short opacity+scale transition.
// Luma stays visible and continuous — no pop, no vanish.
function LumaStanding({ size, facing }) {
  const sprites = {
    south: FacingSouth,
    north: FacingNorth,
    east:  FacingEast,
    west:  FacingWest,
  }
  const Sprite = sprites[facing] ?? FacingSouth

  return (
    <motion.div
      key={`standing-${facing}`}
      initial={{ opacity: 0.5, scale: 0.93 }}
      animate={{ opacity: 1,   scale: 1    }}
      exit={{    opacity: 0.5, scale: 0.93 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{
        width:          size,
        height:         size,
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
      }}>
        <Sprite/>
      </div>
    </motion.div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────
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
        position:      'absolute',
        width:          tileSize,
        height:         tileSize,
        top:            0,
        left:           0,
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        pointerEvents: 'none',
        zIndex:         10,
      }}
      animate={{ x: x * tileSize, y: y * tileSize }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
    >
      {/* Ground shadow */}
      <motion.div
        animate={{ scaleX: [1, 1.07, 1], opacity: [0.18, 0.32, 0.18] }}
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

      {/* Bioluminescent ambient glow — green-teal, breathing */}
      <motion.div
        animate={{ opacity: [0.12, 0.42, 0.12], scale: [0.88, 1.07, 0.88] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position:     'absolute',
          width:         tileSize * 0.86,
          height:        tileSize * 0.86,
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(52,211,153,0.22) 0%, transparent 68%)',
        }}
      />

      {/* Sprite layer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {showFacing
            ? <LumaStanding key={`s-${facing}`} size={size} facing={facing}/>
            : <LumaCrouched key="crouched"       size={size}/>
          }
        </AnimatePresence>
      </div>
    </motion.div>
  )
}