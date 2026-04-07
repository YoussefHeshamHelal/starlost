import { useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LEVELS } from './data/levels'
import { useGameState } from './hooks/useGameState'
import GameGrid from './components/GameGrid'
import CommandBuilder from './components/CommandBuilder'
import { logGBI } from './logGBI'

// ── Layout constants ──────────────────────────────────────────────────────────
const HEADER_H = 48
const GRID_PX  = 520   // 5 tiles × 104 px
const PANEL_W  = 420   // right panel — wider
const GAP      = 32

// ── CSS keyframe animations (injected once, run on compositor thread) ─────────
const ANIM_STYLES = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50%       { opacity: 1;   transform: scale(1.2); }
  }
  @keyframes pulse-shadow {
    0%, 100% { box-shadow: 0 0 6px rgba(245,158,11,0.3); }
    50%       { box-shadow: 0 0 14px rgba(245,158,11,0.7); }
  }
  @keyframes pulse-bar {
    0%   { opacity: 0.3; }
    25%  { opacity: 0.6; }
    50%  { opacity: 0.2; }
    75%  { opacity: 0.5; }
    100% { opacity: 0.3; }
  }
  @keyframes pulse-visor {
    0%, 100% { box-shadow: 0 0 0px rgba(167,139,250,0); }
    50%       { box-shadow: 0 0 20px rgba(167,139,250,0.5); }
  }
  @keyframes fade-in-hint {
    from { opacity: 0; }
    to   { opacity: 0.75; }
  }
  @keyframes blink-try {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }
`

// ── Helmet Radio ─────────────────────────────────────────────────────────────
const HelmetRadio = memo(function HelmetRadio({ report, radioIsUncertain }) {
  return (
    <div style={{
      background: radioIsUncertain ? 'rgba(14,10,4,0.92)' : 'rgba(8,14,24,0.9)',
      border: `1px solid ${radioIsUncertain ? '#f59e0b55' : '#1e2a42'}`,
      borderRadius: 8,
      padding: '8px 20px',
      width: '100%',
      backdropFilter: 'blur(4px)',
      flexShrink: 0,
      boxSizing: 'border-box',
      position: 'relative',
      transition: 'border-color 0.4s, background 0.4s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
        <p style={{
          fontSize: 8,
          color: radioIsUncertain ? '#f59e0b' : '#2dd4bf',
          fontFamily: 'monospace', letterSpacing: 3, margin: 0, opacity: 0.85,
          transition: 'color 0.4s',
        }}>
          📡  LUMA HELMET RADIO
        </p>

        {radioIsUncertain && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: 4, height: 4, borderRadius: '50%', background: '#f59e0b',
                    animation: `pulse-dot 1.2s ${i * 0.25}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: 'rgba(245,158,11,0.15)',
              border: '1.5px solid #f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#f59e0b', fontWeight: 900, fontFamily: 'monospace',
              animation: 'pulse-shadow 2s ease-in-out infinite',
            }}>?</div>
          </div>
        )}
      </div>

      <p style={{
        fontSize: 11,
        color: radioIsUncertain ? '#d4a574' : '#94a3b8',
        fontFamily: 'monospace', lineHeight: 1.5, fontStyle: 'italic', margin: 0,
        transition: 'color 0.4s',
      }}>
        "{report}"
      </p>

      {radioIsUncertain && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          borderRadius: '0 0 8px 8px',
          background: 'linear-gradient(to right, transparent, #f59e0b44, transparent)',
          animation: 'pulse-bar 3s linear infinite',
        }} />
      )}
    </div>
  )
})

// ── Visor Flip button ─────────────────────────────────────────────────────────
const VisorFlipButton = memo(function VisorFlipButton({ visorFlipCount, onVisorFlip, highlighted }) {
  const exhausted = visorFlipCount >= 3
  return (
    <button
      onClick={onVisorFlip}
      disabled={exhausted}
      style={{
        width: '100%',
        padding: '10px 16px',
        background: exhausted ? 'rgba(10,15,25,0.5)' : highlighted ? 'rgba(167,139,250,0.18)' : 'rgba(167,139,250,0.1)',
        border: `1.5px solid ${exhausted ? '#1e2a3a' : '#a78bfa'}`,
        borderRadius: 10,
        color: exhausted ? '#1e2a3a' : '#a78bfa',
        cursor: exhausted ? 'not-allowed' : 'pointer',
        fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.2s', boxSizing: 'border-box',
        animation: highlighted && !exhausted ? 'pulse-visor 1.8s ease-in-out infinite' : 'none',
      }}
    >
      <span>👁  VISOR FLIP</span>
      {highlighted && !exhausted && (
        <span style={{
          fontSize: 9, color: '#f59e0b', fontFamily: 'monospace', marginRight: 4,
          animation: 'blink-try 1.2s ease-in-out infinite',
        }}>
          try it!
        </span>
      )}
      <span style={{
        background: exhausted ? 'transparent' : 'rgba(167,139,250,0.15)',
        border: `1px solid ${exhausted ? '#1e2a3a' : '#a78bfa55'}`,
        borderRadius: 20, padding: '2px 10px', fontSize: 10,
      }}>
        {3 - visorFlipCount} left
      </span>
    </button>
  )
})

// ── Diamond MCQ ───────────────────────────────────────────────────────────────
const ARROW_META = {
  "↑ Up":    { symbol: '↑', label: 'Up',    gridArea: 'top'    },
  "→ Right": { symbol: '→', label: 'Right', gridArea: 'right'  },
  "↓ Down":  { symbol: '↓', label: 'Down',  gridArea: 'bottom' },
  "← Left":  { symbol: '←', label: 'Left',  gridArea: 'left'   },
}

const COMPASS_AREAS = `
  ".     top    ."
  "left  center right"
  ".     bottom ."
`

function DiamondButton({ option, isSelected, isCorrect, isWrong, disabled, onClick }) {
  const meta = ARROW_META[option] ?? { symbol: option, label: option, gridArea: 'center' }
  const borderColor = isCorrect ? '#4ade80' : isWrong ? '#fb7185' : isSelected ? '#2dd4bf' : '#1e3a54'
  const bgColor     = isCorrect ? 'rgba(74,222,128,0.18)' : isWrong ? 'rgba(251,113,133,0.14)' : isSelected ? 'rgba(45,212,191,0.12)' : 'rgba(10,22,38,0.9)'
  const textColor   = isCorrect ? '#4ade80' : isWrong ? '#fb7185' : isSelected ? '#2dd4bf' : '#7094b0'

  return (
    <div style={{ gridArea: meta.gridArea, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 90, height: 90 }}>
      <button
        onClick={() => !disabled && onClick(option)}
        style={{
          width: 62, height: 62,
          transform: 'rotate(45deg)',
          background: bgColor, border: `2px solid ${borderColor}`,
          borderRadius: 8,
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
          boxShadow: isSelected ? `0 0 16px ${borderColor}66` : 'none',
          outline: 'none', padding: 0, flexShrink: 0,
        }}
      >
        <div style={{
          transform: 'rotate(-45deg)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 2, pointerEvents: 'none', lineHeight: 1,
        }}>
          <span style={{ fontSize: 20, color: textColor, fontWeight: 700, lineHeight: 1 }}>{meta.symbol}</span>
          <span style={{ fontSize: 8, letterSpacing: 0.8, color: textColor, fontFamily: 'monospace', opacity: 0.85 }}>{meta.label}</span>
          {isCorrect && <span style={{ fontSize: 9, color: '#4ade80', lineHeight: 1 }}>✓</span>}
          {isWrong   && <span style={{ fontSize: 9, color: '#fb7185', lineHeight: 1 }}>✗</span>}
        </div>
      </button>
    </div>
  )
}

// ── SPT Question panel ────────────────────────────────────────────────────────
const SPTQuestion = memo(function SPTQuestion({ question, onAnswer, sptAnswer, sptCorrect, visorFlipCount, onVisorFlip, radioIsUncertain, showVisorFlip }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: 'rgba(8,14,24,0.95)',
        border: '1.5px solid #2dd4bf',
        borderRadius: 12,
        padding: '20px 24px 24px',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}
    >
      <p style={{ fontSize: 9, color: '#2dd4bf', fontFamily: 'monospace', letterSpacing: 3, margin: 0 }}>
        PHASE 1 — IDENTIFY
      </p>

      {showVisorFlip && (
        <VisorFlipButton
          visorFlipCount={visorFlipCount}
          onVisorFlip={onVisorFlip}
          highlighted={radioIsUncertain && visorFlipCount === 0}
        />
      )}

      {showVisorFlip && radioIsUncertain && visorFlipCount === 0 && (
        <p style={{
          margin: '-8px 0 0 0',
          color: '#f59e0b',
          fontSize: 10, fontFamily: 'monospace',
          textAlign: 'center', letterSpacing: 1,
          animation: 'fade-in-hint 0.4s 0.5s ease both',
        }}>
          LUMA seems unsure… maybe peek through her helmet?
        </p>
      )}

      <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
        {question.prompt}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '90px 90px 90px',
        gridTemplateRows: '90px 90px 90px',
        gridTemplateAreas: COMPASS_AREAS,
        placeItems: 'center',
        width: 270, height: 270,
        alignSelf: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          gridArea: 'center',
          width: 22, height: 22, borderRadius: '50%',
          border: '1.5px solid #2dd4bf33',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2dd4bf33' }}/>
        </div>
        {question.options.map(option => {
          const isSelected = sptAnswer === option
          const isCorrect  = isSelected && sptCorrect
          const isWrong    = isSelected && !sptCorrect
          return (
            <DiamondButton
              key={option} option={option}
              isSelected={isSelected} isCorrect={isCorrect} isWrong={isWrong}
              disabled={sptCorrect} onClick={onAnswer}
            />
          )
        })}
      </div>

      {sptAnswer && !sptCorrect && (
        <p style={{ margin: 0, color: '#fb7185', fontSize: 11, fontFamily: 'monospace', textAlign: 'center', animation: 'fade-in-hint 0.2s ease both' }}>
          Not quite — use the radio clue to find LUMA's facing.
        </p>
      )}
      {sptCorrect && (
        <p style={{ margin: 0, color: '#4ade80', fontSize: 11, fontFamily: 'monospace', textAlign: 'center', letterSpacing: 1, animation: 'fade-in-hint 0.2s ease both' }}>
          ✓ Correct! Now guide LUMA home.
        </p>
      )}
    </motion.div>
  )
})

// ── Prediction Prompt ─────────────────────────────────────────────────────────
const PredictionBanner = memo(function PredictionBanner({ predictionTile, predictionResult }) {
  const hasResult = predictionResult !== null
  const hasTile   = predictionTile !== null

  let borderColor = '#38bdf8'
  let message
  let subMessage

  if (hasResult && predictionResult === 'correct') {
    borderColor = '#4ade80'
    message = '✓ Perfect prediction!'
    subMessage = 'You knew exactly where LUMA would end up.'
  } else if (hasResult && predictionResult === 'wrong') {
    borderColor = '#fb7185'
    message = '✗ Not quite…'
    subMessage = `LUMA ended up at a different tile. What changed your plan?`
  } else if (hasTile) {
    borderColor = '#38bdf8'
    message = `Prediction set: [${predictionTile.x}, ${predictionTile.y}]`
    subMessage = 'Now execute your program — let\'s see if you\'re right!'
  } else {
    borderColor = '#38bdf8'
    message = 'Tap a grid tile to predict where LUMA will end up.'
    subMessage = 'You must predict before you can run the program.'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: hasResult
          ? predictionResult === 'correct' ? 'rgba(74,222,128,0.06)' : 'rgba(251,113,133,0.06)'
          : 'rgba(56,189,248,0.06)',
        border: `1.5px solid ${borderColor}44`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 8,
        padding: '10px 14px',
        boxSizing: 'border-box',
      }}
    >
      <p style={{ fontSize: 10, color: borderColor, fontFamily: 'monospace', letterSpacing: 1, margin: '0 0 3px 0', fontWeight: 600 }}>
        🎯  PREDICTION CHALLENGE
      </p>
      <p style={{ fontSize: 11, color: borderColor, fontFamily: 'monospace', margin: '0 0 2px 0' }}>
        {message}
      </p>
      <p style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', margin: 0 }}>
        {subMessage}
      </p>
    </motion.div>
  )
})

// ── Missed Fragments Alert ────────────────────────────────────────────────────
function MissedFragmentsAlert({ onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 80, background: 'rgba(4,8,16,0.82)', backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{
        background: 'rgba(10,18,32,0.98)',
        border: '2px solid #f59e0b', borderRadius: 20,
        padding: '36px 44px', maxWidth: 420, textAlign: 'center',
        boxShadow: '0 0 60px rgba(245,158,11,0.25), 0 0 0 1px #f59e0b33',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: 48 }}
        >⚠️</motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ fontSize: 18, color: '#f59e0b', fontFamily: 'monospace', letterSpacing: 2, margin: 0 }}>
            MISSING FRAGMENTS
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            LUMA reached the ship core, but there are still ship fragments scattered on the planet!
          </p>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontStyle: 'italic' }}>
            Collect all fragments before returning to the ship core.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDismiss}
          style={{
            padding: '12px 32px',
            background: 'rgba(245,158,11,0.12)',
            border: '1.5px solid #f59e0b',
            borderRadius: 10, color: '#f59e0b',
            fontFamily: 'monospace', fontSize: 12, letterSpacing: 2,
            cursor: 'pointer',
          }}
        >
          GOT IT — RESET &amp; RETRY
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ levelId, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 80, background: 'rgba(4,8,16,0.82)', backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{
        background: 'rgba(10,18,32,0.98)',
        border: '2px solid #2dd4bf', borderRadius: 20,
        padding: '36px 44px', maxWidth: 420, textAlign: 'center',
        boxShadow: '0 0 60px rgba(45,212,191,0.2), 0 0 0 1px #2dd4bf33',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.8 }}
          style={{ fontSize: 52 }}
        >🚀</motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ fontSize: 20, color: '#2dd4bf', fontFamily: 'monospace', letterSpacing: 3, margin: 0 }}>
            LEVEL {levelId} COMPLETE
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            LUMA made it back to the ship core! Great navigating.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          style={{
            padding: '14px 36px',
            background: 'rgba(45,212,191,0.12)',
            border: '1.5px solid #2dd4bf',
            borderRadius: 10, color: '#2dd4bf',
            fontFamily: 'monospace', fontSize: 12, letterSpacing: 2,
            cursor: 'pointer',
          }}
        >
          NEXT LEVEL →
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Strategy Card Screen ──────────────────────────────────────────────────────
const STRATEGY_CARDS = [
  {
    id: 'embody',
    emoji: '🧍',
    title: 'I Imagined Being LUMA',
    subtitle: 'Embody',
    description: 'I pictured myself standing right where LUMA was, and felt which way I was facing.',
    quote: '"I thought about your view."',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: '#a78bfa',
    glow: 'rgba(167,139,250,0.3)',
    stars: ['⭐','✨','💜'],
  },
  {
    id: 'rotate',
    emoji: '🔄',
    title: 'I Rotated the Map',
    subtitle: 'Rotate',
    description: 'I spun the map around in my head until it matched the way LUMA was looking.',
    quote: '"I turned the map."',
    color: '#2dd4bf',
    bg: 'rgba(45,212,191,0.08)',
    border: '#2dd4bf',
    glow: 'rgba(45,212,191,0.3)',
    stars: ['⭐','✨','💚'],
  },
  {
    id: 'landmarks',
    emoji: '🪨',
    title: 'I Used the Rocks',
    subtitle: 'Landmarks',
    description: 'I found the rocks and ship parts nearby to figure out which direction LUMA was facing.',
    quote: '"I saw the tall rock."',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    stars: ['⭐','✨','🧡'],
  },
]

function FloatingStar({ emoji, delay, x, duration }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, x: 0 }}
      animate={{ opacity: [0, 1, 1, 0], y: -60, x: [0, x, 0] }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: duration * 0.4, ease: 'easeInOut' }}
      style={{ position: 'absolute', bottom: 0, left: '50%', fontSize: 18, pointerEvents: 'none', zIndex: 0 }}
    >
      {emoji}
    </motion.div>
  )
}

function StrategyCard({ card, selected, onSelect }) {
  const isSelected = selected === card.id
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(card.id)}
      style={{
        flex: 1, minWidth: 0, position: 'relative',
        background: isSelected ? card.bg : 'rgba(8,14,24,0.92)',
        border: `2.5px solid ${isSelected ? card.border : '#1e2a42'}`,
        borderRadius: 20,
        padding: '28px 20px 24px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        boxShadow: isSelected ? `0 0 40px ${card.glow}, 0 0 0 1px ${card.border}44` : '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        overflow: 'hidden', textAlign: 'center', userSelect: 'none',
      }}
    >
      {isSelected && card.stars.map((s, i) => (
        <FloatingStar key={i} emoji={s} delay={i * 0.6} x={(i - 1) * 18} duration={2.2 + i * 0.3} />
      ))}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute', inset: -1, borderRadius: 20,
            border: `3px solid ${card.border}`,
            pointerEvents: 'none',
            boxShadow: `inset 0 0 30px ${card.glow}`,
          }}
        />
      )}
      <motion.div
        animate={isSelected ? { rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.18, 1] } : {}}
        transition={{ duration: 0.5 }}
        style={{ fontSize: 52, lineHeight: 1, position: 'relative', zIndex: 1 }}
      >
        {card.emoji}
      </motion.div>
      <div style={{
        background: isSelected ? `${card.border}22` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isSelected ? card.border : '#1e2a42'}`,
        borderRadius: 20, padding: '3px 14px',
        fontSize: 9, fontFamily: 'monospace', letterSpacing: 2,
        color: isSelected ? card.color : '#334155',
        fontWeight: 700, position: 'relative', zIndex: 1, transition: 'all 0.2s',
      }}>
        {card.subtitle.toUpperCase()}
      </div>
      <p style={{ fontSize: 15, fontWeight: 800, color: isSelected ? card.color : '#94a3b8', lineHeight: 1.3, margin: 0, position: 'relative', zIndex: 1, transition: 'color 0.2s' }}>
        {card.title}
      </p>
      <p style={{ fontSize: 12, color: isSelected ? '#cbd5e1' : '#475569', lineHeight: 1.55, margin: 0, position: 'relative', zIndex: 1, transition: 'color 0.2s' }}>
        {card.description}
      </p>
      <p style={{ fontSize: 11, color: isSelected ? card.color : '#1e3a54', fontFamily: 'monospace', fontStyle: 'italic', margin: 0, position: 'relative', zIndex: 1, transition: 'color 0.2s' }}>
        {card.quote}
      </p>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={isSelected ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: card.border,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: '#040810', fontWeight: 900,
          position: 'relative', zIndex: 1,
          boxShadow: `0 0 20px ${card.glow}`,
        }}
      >✓</motion.div>
    </motion.div>
  )
}

// ── FIX: StrategyCardScreen now accepts levelId and participantId so it can
//         log the strategyCard GBI itself when the child confirms their choice.
function StrategyCardScreen({ levelId, participantId, onDone }) {
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    if (!selected) return
    setConfirmed(true)

    // ── Log the strategy card choice as a GBI ────────────────────────────────
    // We log it here rather than in App because this is the exact moment the
    // child commits to a choice.  The snapshot only contains the card choice;
    // the rest of the level GBIs were already logged on the SuccessScreen.
    logGBI(participantId, levelId, { strategyCard: selected })

    setTimeout(() => onDone(selected), 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 90,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.07) 0%, rgba(4,8,16,0.97) 60%)',
        backdropFilter: 'blur(8px)',
        padding: '24px 32px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {['✨','⭐','💫','🌟','✨','⭐'].map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0], y: ['100vh', '-10vh'], x: [0, (i % 2 === 0 ? 30 : -30)] }}
          transition={{ duration: 6 + i * 1.2, delay: i * 1.1, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: `${10 + i * 16}%`, bottom: 0, fontSize: 22 + (i % 3) * 8, pointerEvents: 'none', zIndex: 0 }}
        >
          {s}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28, zIndex: 1, maxWidth: 760 }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #2dd4bf, #0f7a6e)',
            border: '3px solid #2dd4bf',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, flexShrink: 0,
            boxShadow: '0 0 24px rgba(45,212,191,0.4)',
          }}
        >🤖</motion.div>

        <div style={{
          background: 'rgba(8,14,24,0.95)',
          border: '1.5px solid #2dd4bf44',
          borderRadius: '0 16px 16px 16px',
          padding: '14px 20px', position: 'relative',
          boxShadow: '0 4px 20px rgba(45,212,191,0.1)',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: -10,
            width: 0, height: 0,
            borderTop: '10px solid #2dd4bf44',
            borderLeft: '10px solid transparent',
          }}/>
          <p style={{ fontSize: 9, color: '#2dd4bf', fontFamily: 'monospace', letterSpacing: 2, margin: '0 0 6px 0', opacity: 0.8 }}>
            LUMA SAYS
          </p>
          <p style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
            Awesome work on Level {levelId}! 🎉
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: '6px 0 0 0' }}>
            How did you figure out which way I was facing? Pick the card that matches how <em>you</em> thought about it!
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ display: 'flex', gap: 18, width: '100%', maxWidth: 860, zIndex: 1, alignItems: 'stretch' }}
      >
        {STRATEGY_CARDS.map(card => (
          <StrategyCard key={card.id} card={card} selected={selected} onSelect={setSelected} />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ marginTop: 24, zIndex: 1 }}
      >
        <AnimatePresence mode="wait">
          {!confirmed ? (
            <motion.button
              key="confirm"
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              disabled={!selected}
              style={{
                padding: '14px 48px',
                background: selected ? `linear-gradient(135deg, rgba(45,212,191,0.18), rgba(45,212,191,0.08))` : 'rgba(10,15,25,0.5)',
                border: `2px solid ${selected ? '#2dd4bf' : '#1e2a3a'}`,
                borderRadius: 14,
                color: selected ? '#2dd4bf' : '#1e2a3a',
                fontFamily: 'monospace', fontSize: 13, letterSpacing: 2.5,
                cursor: selected ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: selected ? '0 0 30px rgba(45,212,191,0.15)' : 'none',
                fontWeight: 700,
              }}
            >
              {selected ? '✓  THAT\'S MY STRATEGY!' : 'PICK A CARD TO CONTINUE'}
            </motion.button>
          ) : (
            <motion.div
              key="confirmed"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              style={{ fontSize: 40, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <span>🎊</span>
              <span style={{ fontSize: 18, color: '#4ade80', fontFamily: 'monospace', letterSpacing: 2 }}>GREAT CHOICE!</span>
              <span>🎊</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {!confirmed && (
        <button
          onClick={() => onDone(null)}
          style={{
            position: 'absolute', bottom: 16, right: 20,
            background: 'transparent', border: 'none',
            color: '#1e2a42', fontSize: 9, fontFamily: 'monospace',
            cursor: 'pointer', letterSpacing: 1,
          }}
        >
          skip →
        </button>
      )}
    </motion.div>
  )
}

// ── Level Screen ──────────────────────────────────────────────────────────────
function LevelScreen({ levelConfig, participantId, onComplete, onStrategyCard }) {
  const [animSpeed, setAnimSpeed] = useState(50)

  const {
    luma, phase,
    sptAnswer, sptCorrect, answerSPT,
    helmetReport,
    radioIsUncertain,
    visorActive, visorFlipCount, flipVisor, closeVisor,
    sequence, setSequence, isRunning, isMirrored,
    addCommand, removeLastCommand, clearSequence, runSequence,
    collectedParts,
    missedFragments, dismissMissedFragments,
    needsReset, resetLuma,
    predictionTile, setPrediction, predictionResult,
    effectiveLevel, getGBISnapshot,
  } = useGameState(levelConfig, animSpeed)

  const handleReorder = useCallback((newSeq) => {
    if (setSequence) setSequence(newSeq)
  }, [setSequence])

  const handleVisorClose = useCallback(() => closeVisor(), [closeVisor])

  const predictionModeActive =
    levelConfig.predictionPrompt &&
    phase === 'develop' &&
    !isRunning &&
    predictionResult === null

  const handleTileClick = useCallback((col, row) => {
    if (!predictionModeActive) return
    setPrediction({ x: col, y: row })
  }, [predictionModeActive, setPrediction])

  const runBlocked = levelConfig.predictionPrompt && predictionTile === null && predictionResult === null

  const panelW = levelConfig.skipIdentify ? GRID_PX : PANEL_W
  const totalW = GRID_PX + GAP + panelW

  // ── FIX: Log all GBIs (except strategyCard) here on level completion.
  //         strategyCard is logged inside StrategyCardScreen.
  const handleSuccessNext = () => {
    const snapshot = getGBISnapshot()
    logGBI(participantId, levelConfig.id, snapshot)
    onComplete()
    if (levelConfig.strategyCardAfter) onStrategyCard()
  }

  return (
    <div style={{
      position: 'fixed',
      top: HEADER_H, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: '14px 24px 14px',
      gap: 12,
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* ── Title bar ── */}
      <div style={{
        width: totalW,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 8, color: '#2dd4bf', fontFamily: 'monospace', letterSpacing: 3, marginBottom: 2, opacity: 0.7 }}>
            LEVEL {levelConfig.id} — {levelConfig.world?.toUpperCase()}
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#e2e8f0', letterSpacing: 1, margin: 0 }}>
            {levelConfig.name}
          </h2>
        </div>
        {!levelConfig.skipIdentify && (
          <div style={{
            padding: '4px 14px',
            background: phase === 'identify' ? 'rgba(45,212,191,0.07)' : 'rgba(245,158,11,0.07)',
            border: `1px solid ${phase === 'identify' ? '#2dd4bf44' : '#f59e0b44'}`,
            borderRadius: 20,
            fontSize: 9, fontFamily: 'monospace', letterSpacing: 2,
            color: phase === 'identify' ? '#2dd4bf' : '#f59e0b',
          }}>
            {phase === 'identify' ? 'PHASE 1 — IDENTIFY'
             : phase === 'develop' ? 'PHASE 2 — DEVELOP'
             : 'COMPLETE'}
          </div>
        )}
      </div>

      {/* ── Helmet radio — hidden when noRadio flag is set (Level 1) ── */}
      {!levelConfig.noRadio && (
        <div style={{ width: totalW, flexShrink: 0 }}>
          <HelmetRadio report={helmetReport} radioIsUncertain={radioIsUncertain} />
        </div>
      )}

      {/* ── Main play area ── */}
      <div style={{
        flex: 1, width: totalW,
        display: 'flex', gap: GAP, alignItems: levelConfig.id === 1 || phase === 'identify' ? 'center' : 'flex-start',
        minHeight: 0, overflow: 'hidden',
      }}>
        <div style={{
          flex: '0 0 auto', width: GRID_PX,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <GameGrid
            levelConfig={levelConfig}
            effectiveLevel={effectiveLevel}
            luma={luma}
            visorActive={visorActive}
            onVisorClose={handleVisorClose}
            sptCorrect={sptCorrect}
            collectedParts={collectedParts}
            gridPx={GRID_PX}
            predictionModeActive={predictionModeActive}
            predictionTile={predictionTile}
            predictionResult={predictionResult}
            onTileClick={handleTileClick}
          />
        </div>

        {/* Right panel */}
        <div style={{
          flex: '0 0 auto', width: levelConfig.skipIdentify ? GRID_PX : PANEL_W,
          height: levelConfig.id >= 2 && phase === 'develop' ? '100%' : GRID_PX,
          display: 'flex', flexDirection: 'column',
          justifyContent: phase === 'identify' ? 'center' : 'flex-start',
          minHeight: 0, overflow: 'hidden',
        }}>
          <AnimatePresence mode="wait">
            {phase === 'identify' && levelConfig.sptQuestion && (
              <motion.div
                key="spt"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ width: '100%' }}
              >
                <SPTQuestion
                  question={levelConfig.sptQuestion}
                  onAnswer={answerSPT}
                  sptAnswer={sptAnswer}
                  sptCorrect={sptCorrect}
                  visorFlipCount={visorFlipCount}
                  onVisorFlip={flipVisor}
                  radioIsUncertain={radioIsUncertain}
                  showVisorFlip={!levelConfig.noVisorFlip}
                />
              </motion.div>
            )}

            {phase === 'develop' && (
              <motion.div
                key="builder"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {levelConfig.predictionPrompt && (
                  <PredictionBanner
                    predictionTile={predictionTile}
                    predictionResult={predictionResult}
                    levelConfig={levelConfig}
                  />
                )}
                <CommandBuilder
                  sequence={sequence}
                  isRunning={isRunning}
                  isMirrored={isMirrored}
                  onAdd={addCommand}
                  onRemove={removeLastCommand}
                  onClear={clearSequence}
                  onRun={runSequence}
                  visorFlipCount={visorFlipCount}
                  onVisorFlip={flipVisor}
                  phase={phase}
                  onReorder={handleReorder}
                  needsReset={needsReset}
                  onReset={resetLuma}
                  panelWidth={panelW}
                  runBlocked={runBlocked}
                  speed={animSpeed}
                  onSpeedChange={setAnimSpeed}
                  showVisorFlip={!levelConfig.noVisorFlip}
                  targetCommands={levelConfig.targetCommands ?? null}
                  showPhaseLabel={!levelConfig.skipIdentify}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {phase === 'success' && (
          <SuccessScreen levelId={levelConfig.id} onNext={handleSuccessNext} />
        )}
        {missedFragments && (
          <MissedFragmentsAlert onDismiss={dismissMissedFragments} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
// PARTICIPANT_ID: replace this constant with your actual participant ID system
// before the real study. For now, every session uses 'child_01' as a placeholder.
const PARTICIPANT_ID = 'child_01'

export default function App() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [appPhase, setAppPhase] = useState('playing')

  const level = LEVELS[currentLevelIndex]
  //         because logging is now done inside StrategyCardScreen.
  const handleLevelComplete = () => {
    if (currentLevelIndex < LEVELS.length - 1)
      setCurrentLevelIndex(i => i + 1)
  }

  const handleShowStrategyCard = () => {
    setAppPhase('strategy-card')
  }

  const handleStrategyCardDone = () => {
    setAppPhase('playing')
    if (currentLevelIndex < LEVELS.length - 1)
      setCurrentLevelIndex(i => i + 1)
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% -10%, rgba(45,212,191,0.05) 0%, #040810 55%)',
    }}>
      <style>{ANIM_STYLES}</style>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: HEADER_H, padding: '0 28px',
          background: 'rgba(4,8,16,0.97)',
          borderBottom: '1px solid #0f1c2e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 50, backdropFilter: 'blur(10px)', boxSizing: 'border-box',
        }}
      >
        <h1 style={{ fontSize: 15, fontWeight: 900, color: '#2dd4bf', letterSpacing: 6, fontFamily: 'monospace', margin: 0 }}>
          STARLOST
        </h1>
        <p style={{ fontSize: 9, color: '#1e2a42', fontFamily: 'monospace', letterSpacing: 2, margin: 0 }}>
          Help LUMA find the way home.
        </p>
      </motion.header>

      <AnimatePresence mode="wait">
        {appPhase === 'playing' && (
          <motion.div
            key={`level-${level.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            style={{ width: '100%', height: '100%' }}
          >
            <LevelScreen
              key={level.id}
              levelConfig={level}
              participantId={PARTICIPANT_ID}
              onComplete={handleLevelComplete}
              onStrategyCard={handleShowStrategyCard}
            />
          </motion.div>
        )}

        {appPhase === 'strategy-card' && (
          <motion.div
            key="strategy-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', height: '100%' }}
          >
            <StrategyCardScreen
              levelId={level.id}
              participantId={PARTICIPANT_ID}
              onDone={handleStrategyCardDone}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}