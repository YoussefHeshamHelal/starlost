import { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LEVELS } from './data/levels'
import { countProgramBlocks, hasEmptyRequiredElse } from './utils/commands'
import {
  getFeatureTutorialSteps,
  getLevelTutorialSteps,
  getTutorialFeatureKeys,
} from './data/tutorials'
import { useGameState } from './hooks/useGameState'
import GameGrid from './components/GameGrid'
import CommandBuilder from './components/CommandBuilder'
import StartPage from './components/StartPage'
import MissionSetup from './components/MissionSetup'
import StarMapLevelSelect from './components/StarMapLevelSelect'
import MenuSoundIcon from './components/MenuSoundIcon'
import TutorialOverlay from './components/TutorialOverlay'
import { logGBI } from './logGBI'
import { ThemeContext, useTheme, THEMES } from './context/theme'
import { isValidParticipantId, touchParticipantSession } from './utils/participants'
import { calculateMedal, fetchSessionProgress, updateSessionProgress } from './utils/progress'

// ── Layout constants ──────────────────────────────────────────────────────────
const HEADER_H = 56
const GRID_PX  = 520   // 5 tiles × 104 px
const PANEL_W  = 810
const GAP      = 24
const EARLY_MAP_SCALE = 1.1
const PLAYABLE_LEVELS = 23
const LEVEL_SCREEN_MAX_W = GRID_PX + GAP + PANEL_W
const SPEED_STORAGE_KEY = 'starlost:anim-speed'
const PARTICIPANT_STORAGE_KEY = 'starlost:participantId'
const MUTED_STORAGE_KEY = 'starlost:muted'
const BG_MUSIC_SRC = '/assets/audio/starlost-bg-music.mp3'
const BG_MUSIC_VOLUME = 0.22
const OUTER_PHASES = new Set(['start', 'mission-setup', 'home'])
const OUTER_PAGE_BG = '#020617'
const OUTER_BG_ASSETS = [
  '/assets/ui/start-page-bg.png',
  '/assets/ui/star-code-station-bg.png',
  '/assets/ui/star-map-bg.png',
]
const PAGE_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
}
const PAGE_VARIANTS = {
  initial: { opacity: 1, y: 8, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 1, y: -6, scale: 0.998 },
}
const LEVEL_PAGE_VARIANTS = {
  initial: { opacity: 0, y: 18, scale: 0.985, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -14, scale: 0.992, filter: 'blur(6px)' },
}
const MAP_LEVEL_TRANSITION = {
  duration: 0,
}
const MAP_LEVEL_VARIANTS = {
  initial: { opacity: 1, y: 0, scale: 1 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 1, y: 0, scale: 1 },
}
const DISPLAY_WORLD_NAMES = {
  'crash-site': 'Crash Site',
  'repair-site': 'Repair Site',
  'launch-site': 'Launch Site',
}
const PAGE_SHELL_STYLE = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  willChange: 'opacity, transform, filter',
}
const ACTIVE_PAGE_SHELL_STYLE = {
  ...PAGE_SHELL_STYLE,
  zIndex: 2,
}
const HEADER_TRANSITION = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
}
const INSTANT_TRANSITION = {
  duration: 0,
}

function getDisplayWorldName(levelConfig) {
  if (!levelConfig) return ''
  if (levelConfig.mapTitle || levelConfig.displayWorldName) {
    return levelConfig.mapTitle ?? levelConfig.displayWorldName
  }
  if (levelConfig.world === 'forest-trail') {
    return levelConfig.id >= 10 ? 'Deep Forest' : 'Forest Entrance'
  }
  return DISPLAY_WORLD_NAMES[levelConfig.world] ?? levelConfig.world ?? ''
}

function readStoredAnimSpeed() {
  if (typeof window === 'undefined') return 50
  try {
    const storedSpeed = window.localStorage?.getItem(SPEED_STORAGE_KEY)
    if (storedSpeed === null || storedSpeed === undefined || storedSpeed === '') return 50
    const value = Number(storedSpeed)
    return Number.isFinite(value) ? Math.max(10, Math.min(100, value)) : 50
  } catch {
    return 50
  }
}

function readStoredParticipantId() {
  if (typeof window === 'undefined') return ''
  try {
    const storedId = window.localStorage?.getItem(PARTICIPANT_STORAGE_KEY) || ''
    if (isValidParticipantId(storedId)) return storedId
    if (storedId) window.localStorage?.removeItem(PARTICIPANT_STORAGE_KEY)
    return ''
  } catch {
    return ''
  }
}

function readStoredMuted() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage?.getItem(MUTED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

// ── CSS keyframe animations ───────────────────────────────────────────────────
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
  @keyframes theme-pulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.12); }
  }
  @keyframes star-drift {
    0%   { opacity: 0; transform: translateY(0) scale(0.8); }
    20%  { opacity: 0.7; }
    80%  { opacity: 0.5; }
    100% { opacity: 0; transform: translateY(-80px) scale(1.1); }
  }
  @keyframes selector-twinkle {
    0%, 100% { opacity: 0.25; transform: scale(0.9); }
    50% { opacity: 0.9; transform: scale(1.15); }
  }
  .level-sound-button .menu-sound-icon {
    width: 22px;
    height: 22px;
    color: currentColor;
    filter: drop-shadow(0 0 5px currentColor);
  }
  .level-sound-button--muted .menu-sound-icon__wave {
    opacity: 0;
  }
  .level-sound-button--muted .menu-sound-icon__mute {
    opacity: 1;
  }
`


// ── Theme Toggle Button ───────────────────────────────────────────────────────
function ThemeToggle({ theme, onToggle }) {
  const t = THEMES[theme]
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.93 }}
      whileHover={{ scale: 1.05 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 16px',
        background: t.toggleBg,
        border: `1.5px solid ${t.toggleBorder}`,
        borderRadius: 24,
        color: t.toggleText,
        fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5,
        cursor: 'pointer',
        transition: 'all 0.3s',
        fontWeight: 700,
        boxShadow: theme === 'light'
          ? '0 10px 22px rgba(54,131,201,0.16), inset 0 1px 0 rgba(255,255,255,0.65)'
          : '0 2px 12px rgba(45,212,191,0.08)',
      }}
    >
      <motion.span
        key={t.toggleIcon}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0,   opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ fontSize: 14, lineHeight: 1 }}
      >
        {t.toggleIcon}
      </motion.span>
      <span>{t.toggleLabel} Mode</span>
    </motion.button>
  )
}

// Level sound button
function LevelSoundButton({ theme, muted, onToggleMuted }) {
  const t = THEMES[theme]
  return (
    <motion.button
      type="button"
      aria-label={muted ? 'Unmute background music' : 'Mute background music'}
      title={muted ? 'Unmute music' : 'Mute music'}
      onClick={onToggleMuted}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.06 }}
      className={`level-sound-button ${muted ? 'level-sound-button--muted menu-icon-button--muted' : ''}`}
      style={{
        width: 40,
        height: 40,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: t.toggleBg,
        border: `1.5px solid ${t.toggleBorder}`,
        borderRadius: 14,
        color: t.toggleText,
        cursor: 'pointer',
        transition: 'background 0.3s, border-color 0.3s, color 0.3s, box-shadow 0.3s',
        boxShadow: theme === 'light'
          ? '0 10px 22px rgba(54,131,201,0.14), inset 0 1px 0 rgba(255,255,255,0.62)'
          : '0 2px 12px rgba(45,212,191,0.08)',
      }}
    >
      <MenuSoundIcon />
    </motion.button>
  )
}

// Helmet Radio
const HelmetRadio = memo(function HelmetRadio({ report, radioIsUncertain }) {
  const theme = useTheme()
  const t = THEMES[theme]
  const panelBg = radioIsUncertain ? t.radioUncBg : t.radioBg
  const panelBorder = radioIsUncertain ? t.radioUncBorder : t.radioBorder
  const titleColor = radioIsUncertain ? '#f59e0b' : (theme === 'light' ? '#1579ac' : '#2dd4bf')
  const textColor = radioIsUncertain ? t.radioUncText : t.radioText
  const signalColor = '#f59e0b'
  return (
    <div data-tutorial-id="radio-panel" style={{
      background: panelBg,
      border: `1.5px solid ${panelBorder}`,
      borderRadius: 10,
      padding: '10px 20px',
      width: '100%',
      flexShrink: 0,
      boxSizing: 'border-box',
      position: 'relative',
      transition: 'border-color 0.4s, background 0.4s, box-shadow 0.4s',
      boxShadow: theme === 'light'
        ? '0 14px 28px rgba(55,117,182,0.10), 0 6px 18px rgba(69,214,226,0.14)'
        : '0 2px 16px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{
          fontSize: 9,
          color: titleColor,
          fontFamily: 'monospace', letterSpacing: 3, margin: 0,
          fontWeight: 800,
        }}>
          LUMA HELMET RADIO
        </p>

        {radioIsUncertain && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 4, height: 4, borderRadius: '50%', background: signalColor,
                  animation: `pulse-dot 1.2s ${i * 0.25}s ease-in-out infinite`,
                }} />
              ))}
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: `${signalColor}26`,
              border: `1.5px solid ${signalColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: signalColor, fontWeight: 900, fontFamily: 'monospace',
              animation: 'pulse-shadow 2s ease-in-out infinite',
            }}>?</div>
          </div>
        )}
      </div>

      <p style={{
        fontSize: 13,
        color: textColor,
        fontFamily: 'monospace', lineHeight: 1.55, fontStyle: 'italic', margin: 0,
        fontWeight: 600,
      }}>
        "{report}"
      </p>

      {radioIsUncertain && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          borderRadius: '0 0 10px 10px',
          background: `linear-gradient(to right, transparent, ${signalColor}88, transparent)`,
          animation: 'pulse-bar 3s linear infinite',
        }} />
      )}
    </div>
  )
})

const VisorFlipButton = memo(function VisorFlipButton({ visorFlipCount, onVisorFlip, highlighted }) {
  const theme = useTheme()
  const t = THEMES[theme]
  const exhausted = visorFlipCount >= 3
  return (
    <button
      data-tutorial-id="visor-flip-button"
      onClick={onVisorFlip}
      disabled={exhausted}
      style={{
        width: '100%',
        padding: '11px 16px',
        background: exhausted ? t.visorExhBg : t.visorBg,
        border: `1.5px solid ${exhausted ? t.visorExhBorder : t.visorBorder}`,
        borderRadius: 10,
        color: exhausted ? t.visorExhText : t.visorText,
        cursor: exhausted ? 'not-allowed' : 'pointer',
        fontFamily: 'monospace', fontSize: 12, letterSpacing: 1.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.2s', boxSizing: 'border-box',
        animation: highlighted && !exhausted ? 'pulse-visor 1.8s ease-in-out infinite' : 'none',
        fontWeight: 700,
      }}
    >
      <span>{'\u{1F441}'} VISOR FLIP</span>
      {highlighted && !exhausted && (
        <span style={{
          fontSize: 10, color: '#f59e0b', fontFamily: 'monospace', marginRight: 4,
          animation: 'blink-try 1.2s ease-in-out infinite', fontWeight: 700,
        }}>
          Try it!
        </span>
      )}
      <span style={{
        background: exhausted ? 'transparent' : 'rgba(167,139,250,0.18)',
        border: `1px solid ${exhausted ? t.visorExhBorder : '#a78bfa66'}`,
        borderRadius: 20, padding: '2px 10px', fontSize: 10,
        fontWeight: 700,
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

function normalizeDirectionOption(option) {
  if (ARROW_META[option]) return option
  if (option?.includes('Up')) return '↑ Up'
  if (option?.includes('Right')) return '→ Right'
  if (option?.includes('Down')) return '↓ Down'
  if (option?.includes('Left')) return '← Left'
  return option
}

const COMPASS_AREAS = `
  ".     top    ."
  "left  center right"
  ".     bottom ."
`

function DiamondButton({ option, isSelected, isCorrect, isWrong, disabled, onClick }) {
  const meta = ARROW_META[option] ?? { symbol: option, label: option, gridArea: 'center' }
  const theme = useTheme()
  const t = THEMES[theme]
  const borderColor = isCorrect ? '#4ade80' : isWrong ? '#fb7185' : isSelected ? '#14b8a6' : t.mcqBorderIdle
  const bgColor     = isCorrect ? 'rgba(74,222,128,0.18)' : isWrong ? 'rgba(251,113,133,0.14)' : isSelected ? 'rgba(20,184,166,0.14)' : t.mcqBg
  const textColor   = isCorrect ? '#4ade80' : isWrong ? '#fb7185' : isSelected ? (theme === 'light' ? '#0a5c55' : '#2dd4bf') : t.mcqTextIdle

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
          <span style={{ fontSize: 22, color: textColor, fontWeight: 700, lineHeight: 1 }}>{meta.symbol}</span>
          <span style={{ fontSize: 9, letterSpacing: 0.8, color: textColor, fontFamily: 'monospace', fontWeight: 700 }}>{meta.label}</span>
          {isCorrect && <span style={{ fontSize: 9, color: '#4ade80', lineHeight: 1 }}>✓</span>}
          {isWrong   && <span style={{ fontSize: 9, color: '#fb7185', lineHeight: 1 }}>✗</span>}
        </div>
      </button>
    </div>
  )
}

// ── SPT Question panel ────────────────────────────────────────────────────────
const SPTQuestion = memo(function SPTQuestion({ question, onAnswer, sptAnswer, sptCorrect, visorFlipCount, onVisorFlip, radioIsUncertain, showVisorFlip }) {
  const theme = useTheme()
  const t = THEMES[theme]
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      data-tutorial-id="spt-panel"
      style={{
        background: t.sptBg,
        border: `1.5px solid ${t.sptBorder}`,
        borderRadius: 14,
        padding: '20px 24px 24px',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: theme === 'light'
          ? '0 18px 34px rgba(71,140,206,0.12), 0 8px 22px rgba(56,201,221,0.14)'
          : '0 4px 28px rgba(0,0,0,0.5)',
      }}
    >
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
          fontSize: 11, fontFamily: 'monospace',
          textAlign: 'center', letterSpacing: 1,
          animation: 'fade-in-hint 0.4s 0.5s ease both',
          fontWeight: 700,
        }}>
          LUMA seems unsure… maybe peek through her helmet?
        </p>
      )}

      <p style={{ fontSize: 14, color: t.textPrimary, lineHeight: 1.55, margin: 0, fontWeight: 600 }}>
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
          border: `1.5px solid ${theme === 'light' ? '#38c9dd66' : '#2dd4bf44'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: theme === 'light' ? '#38c9dd66' : '#2dd4bf44' }}/>
        </div>
        {question.options.map(option => {
          const normalizedOption = normalizeDirectionOption(option)
          const isSelected = normalizeDirectionOption(sptAnswer) === normalizedOption
          const isCorrect  = isSelected && sptCorrect
          const isWrong    = isSelected && !sptCorrect
          return (
            <DiamondButton
              key={normalizedOption} option={normalizedOption}
              isSelected={isSelected} isCorrect={isCorrect} isWrong={isWrong}
              disabled={sptCorrect} onClick={() => onAnswer(normalizedOption)}
            />
          )
        })}
      </div>

      {sptAnswer && !sptCorrect && (
        <p style={{ margin: 0, color: '#fb7185', fontSize: 12, fontFamily: 'monospace', textAlign: 'center', animation: 'fade-in-hint 0.2s ease both', fontWeight: 700 }}>
          Not quite — use the radio clue to find LUMA's facing.
        </p>
      )}
      {sptCorrect && (
        <p style={{ margin: 0, color: '#10b981', fontSize: 12, fontFamily: 'monospace', textAlign: 'center', letterSpacing: 1, animation: 'fade-in-hint 0.2s ease both', fontWeight: 700 }}>
          ✓ Correct! Now guide LUMA home.
        </p>
      )}
    </motion.div>
  )
})

// ── Prediction Prompt ─────────────────────────────────────────────────────────
const PredictionBanner = memo(function PredictionBanner({ predictionTile, predictionResult }) {
  const theme = useTheme()
  const t = THEMES[theme]
  const hasResult = predictionResult !== null
  const hasTile   = predictionTile !== null

  let borderColor = t.predBorder
  let message
  let subMessage

  if (hasResult && predictionResult === 'correct') {
    borderColor = '#10b981'
    message = '✓ Perfect prediction!'
    subMessage = 'You knew exactly where LUMA would end up.'
  } else if (hasResult && predictionResult === 'wrong') {
    borderColor = '#fb7185'
    message = '✗ Not quite…'
    subMessage = `LUMA ended up at a different tile. What changed your plan?`
  } else if (hasTile) {
    message = `Prediction set: [${predictionTile.x}, ${predictionTile.y}]`
    subMessage = 'Now execute your program — let\'s see if you\'re right!'
  } else {
    message = 'Tap a grid tile to predict where LUMA will end up.'
    subMessage = 'You must predict before you can run the program.'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: hasResult
          ? predictionResult === 'correct' ? 'rgba(16,185,129,0.09)' : 'rgba(251,113,133,0.09)'
          : t.predBg,
        border: `1.5px solid ${borderColor}55`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 10,
        padding: '10px 14px',
        boxSizing: 'border-box',
      }}
    >
      <p style={{ fontSize: 10, color: borderColor, fontFamily: 'monospace', letterSpacing: 1, margin: '0 0 3px 0', fontWeight: 800 }}>
        🎯  PREDICTION CHALLENGE
      </p>
      <p style={{ fontSize: 12, color: borderColor, fontFamily: 'monospace', margin: '0 0 2px 0', fontWeight: 700 }}>
        {message}
      </p>
      <p style={{ fontSize: 11, color: t.predSub, fontFamily: 'monospace', margin: 0, fontWeight: 600 }}>
        {subMessage}
      </p>
    </motion.div>
  )
})

// ── Missed Fragments Alert ────────────────────────────────────────────────────
function MissedFragmentsAlert({ onDismiss }) {
  const theme = useTheme()
  const t = THEMES[theme]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 80, background: t.overlayBg, backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{
        background: t.alertCardBg,
        border: `2px solid ${t.alertBorder}`, borderRadius: 20,
        padding: '36px 44px', maxWidth: 440, textAlign: 'center',
        boxShadow: `0 18px 38px rgba(245,158,11,0.18), 0 10px 24px rgba(255,153,51,0.16), 0 0 0 1px ${t.alertBorder}44`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: 48 }}
        >⚠️</motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ fontSize: 19, color: '#f59e0b', fontFamily: 'monospace', letterSpacing: 2, margin: 0, fontWeight: 800 }}>
            MISSING FRAGMENTS
          </h2>
          <p style={{ fontSize: 14, color: t.textPrimary, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            LUMA reached the ship core, but there are still ship fragments scattered on the planet!
          </p>
          <p style={{ fontSize: 13, color: t.textSecondary, margin: 0, fontStyle: 'italic' }}>
            Collect all fragments before returning to the ship core.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDismiss}
          style={{
            padding: '13px 32px',
            background: 'linear-gradient(135deg, rgba(255,196,93,0.18), rgba(255,234,185,0.10))',
            border: '2px solid #f59e0b',
            borderRadius: 10, color: '#f59e0b',
            fontFamily: 'monospace', fontSize: 13, letterSpacing: 2,
            cursor: 'pointer',
            fontWeight: 800,
          }}
        >
          GOT IT — RESET &amp; RETRY
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ levelId, onNext, isFinalLevel = false }) {
  const theme = useTheme()
  const t = THEMES[theme]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 80, background: t.overlayBg, backdropFilter: 'blur(8px)',
      }}
    >
      <div data-tutorial-id="success-card" style={{
        background: t.successCardBg,
        border: `2px solid ${t.successBorder}`, borderRadius: 20,
        padding: '36px 44px', maxWidth: 440, textAlign: 'center',
        boxShadow: `0 18px 38px rgba(32,201,151,0.18), 0 10px 24px rgba(47,201,223,0.14), 0 0 0 1px ${t.successBorder}44`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.8 }}
          style={{ fontSize: 52 }}
        >🚀</motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{
            fontSize: 22,
            color: theme === 'light' ? '#124b73' : '#2dd4bf',
            fontFamily: 'monospace', letterSpacing: 3, margin: 0, fontWeight: 800,
          }}>
            LEVEL {levelId} COMPLETE
          </h2>
          <p style={{ fontSize: 14, color: t.textPrimary, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            {isFinalLevel
              ? 'Launch pad reached! LUMA is ready to fly home.'
              : 'LUMA made it back to the ship core! Great navigating.'}
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          style={{
            padding: '14px 38px',
            background: theme === 'light' ? 'linear-gradient(135deg, rgba(45,201,223,0.18), rgba(139,92,246,0.10))' : 'rgba(45,212,191,0.13)',
            border: `2px solid ${theme === 'light' ? '#2fc9df' : '#2dd4bf'}`,
            borderRadius: 10,
            color: theme === 'light' ? '#124b73' : '#2dd4bf',
            fontFamily: 'monospace', fontSize: 13, letterSpacing: 2,
            cursor: 'pointer',
            fontWeight: 800,
          }}
        >
          {isFinalLevel ? 'HOME' : 'NEXT LEVEL →'}
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
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.09)',
    border: '#8b5cf6',
    glow: 'rgba(139,92,246,0.3)',
    stars: ['⭐','✨','💜'],
  },
  {
    id: 'rotate',
    emoji: '🔄',
    title: 'I Rotated the Map',
    subtitle: 'Rotate',
    description: 'I spun the map around in my head until it matched the way LUMA was looking.',
    quote: '"I turned the map."',
    color: '#0d9488',
    bg: 'rgba(20,184,166,0.09)',
    border: '#14b8a6',
    glow: 'rgba(20,184,166,0.3)',
    stars: ['⭐','✨','💚'],
  },
  {
    id: 'landmarks',
    emoji: '🪨',
    title: 'I Used the Rocks',
    subtitle: 'Landmarks',
    description: 'I found the rocks and ship parts nearby to figure out which direction LUMA was facing.',
    quote: '"I saw the tall rock."',
    color: '#d97706',
    bg: 'rgba(245,158,11,0.09)',
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
  const theme = useTheme()
  const t = THEMES[theme]
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(card.id)}
      style={{
        flex: 1, minWidth: 0, position: 'relative',
        background: isSelected ? card.bg : t.stratCardBg,
        border: `2.5px solid ${isSelected ? card.border : t.stratCardBd}`,
        borderRadius: 20,
        padding: '28px 20px 24px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        boxShadow: isSelected
          ? `0 0 40px ${card.glow}, 0 0 0 1px ${card.border}44`
          : theme === 'light'
            ? '0 16px 32px rgba(74,144,226,0.12), 0 8px 22px rgba(55,201,223,0.14)'
            : '0 4px 24px rgba(0,0,0,0.5)',
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
        background: isSelected ? `${card.border}22` : (theme === 'light' ? 'rgba(219,236,248,0.68)' : 'rgba(255,255,255,0.05)'),
        border: `1px solid ${isSelected ? card.border : t.stratCardBd}`,
        borderRadius: 20, padding: '3px 14px',
        fontSize: 10, fontFamily: 'monospace', letterSpacing: 2,
        color: isSelected ? card.color : t.textMuted,
        fontWeight: 800, position: 'relative', zIndex: 1, transition: 'all 0.2s',
      }}>
        {card.subtitle.toUpperCase()}
      </div>
      <p style={{ fontSize: 16, fontWeight: 800, color: isSelected ? card.color : t.textPrimary, lineHeight: 1.3, margin: 0, position: 'relative', zIndex: 1, transition: 'color 0.2s' }}>
        {card.title}
      </p>
      <p style={{ fontSize: 13, color: isSelected ? (theme === 'light' ? '#1f4266' : '#c8d8e8') : t.textSecondary, lineHeight: 1.55, margin: 0, position: 'relative', zIndex: 1, transition: 'color 0.2s', fontWeight: 500 }}>
        {card.description}
      </p>
      <p style={{ fontSize: 12, color: isSelected ? card.color : t.textMuted, fontFamily: 'monospace', fontStyle: 'italic', margin: 0, position: 'relative', zIndex: 1, transition: 'color 0.2s', fontWeight: isSelected ? 700 : 500 }}>
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
          fontSize: 16, color: theme === 'light' ? '#fff' : '#040810', fontWeight: 900,
          position: 'relative', zIndex: 1,
          boxShadow: `0 0 20px ${card.glow}`,
        }}
      >✓</motion.div>
    </motion.div>
  )
}

function StrategyCardScreen({ levelId, participantId, onDone, topOffset = HEADER_H }) {
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const theme = useTheme()
  const t = THEMES[theme]

  const handleConfirm = () => {
    if (!selected) return
    setConfirmed(true)
    logGBI(participantId, levelId, { strategyCard: selected })
    setTimeout(() => onDone(selected), 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: topOffset,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 90,
        background: t.stratBg,
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
            border: '3px solid #14b8a6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, flexShrink: 0,
            boxShadow: '0 0 24px rgba(20,184,166,0.4)',
          }}
        >🤖</motion.div>

        <div style={{
          background: t.panelBg,
          border: `1.5px solid ${t.panelBorder}66`,
          borderRadius: 14,
          padding: '16px 20px',
          position: 'relative',
            boxShadow: theme === 'light'
              ? '0 14px 28px rgba(73,137,203,0.14), 0 6px 18px rgba(55,201,221,0.12)'
              : '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderRight: `10px solid ${t.panelBorder}66`,
          }}/>
          <p style={{
            fontSize: 10,
            color: theme === 'light' ? '#1579ac' : '#2dd4bf',
            fontFamily: 'monospace', letterSpacing: 2, margin: '0 0 6px 0', fontWeight: 800,
          }}>
            LUMA SAYS
          </p>
          <p style={{ fontSize: 16, color: t.textPrimary, lineHeight: 1.5, margin: 0, fontWeight: 800 }}>
            Awesome work on Level {levelId}! 🎉
          </p>
          <p style={{ fontSize: 14, color: t.textSecondary, lineHeight: 1.5, margin: '6px 0 0 0', fontWeight: 500 }}>
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
                padding: '15px 52px',
                background: selected
                  ? (theme === 'light'
                    ? 'linear-gradient(135deg, rgba(45,201,223,0.20), rgba(139,92,246,0.12))'
                    : 'linear-gradient(135deg, rgba(45,212,191,0.18), rgba(45,212,191,0.08))')
                  : (theme === 'light' ? 'rgba(223,234,245,0.72)' : 'rgba(8,12,22,0.5)'),
                border: `2px solid ${selected ? (theme === 'light' ? '#2fc9df' : '#2dd4bf') : t.panelBorderDim}`,
                borderRadius: 14,
                color: selected ? (theme === 'light' ? '#124b73' : '#2dd4bf') : t.textDim,
                fontFamily: 'monospace', fontSize: 14, letterSpacing: 2.5,
                cursor: selected ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: selected ? `0 14px 28px rgba(47,201,223,0.20)` : 'none',
                fontWeight: 800,
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
              <span style={{ fontSize: 19, color: '#10b981', fontFamily: 'monospace', letterSpacing: 2, fontWeight: 800 }}>GREAT CHOICE!</span>
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
            color: t.textMuted, fontSize: 10, fontFamily: 'monospace',
            cursor: 'pointer', letterSpacing: 1, fontWeight: 600,
          }}
        >
          skip →
        </button>
      )}
    </motion.div>
  )
}

const TUTORIAL_LEVELS_KEY = 'starlost:tutorial:levels'
const TUTORIAL_FEATURES_KEY = 'starlost:tutorial:features'
const LEVEL_1_RESET_TUTORIAL_KEY = 'level-1-reset'
function readTutorialSessionSet(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function writeTutorialSessionSet(key, values) {
  try {
    sessionStorage.setItem(key, JSON.stringify(Array.from(values)))
  } catch {
    // Ignore storage failures and keep the tutorial usable in-memory.
  }
}

function markTutorialPlanSeen(plan, levelId) {
  const levelSteps = plan.filter(step => step.scope === 'level')
  if (levelSteps.length > 0) {
    const seenLevels = readTutorialSessionSet(TUTORIAL_LEVELS_KEY)
    seenLevels.add(String(levelId))
    writeTutorialSessionSet(TUTORIAL_LEVELS_KEY, seenLevels)
  }

  const featureSteps = plan.filter(step => step.scope === 'feature')
  if (featureSteps.length > 0) {
    const seenFeatures = readTutorialSessionSet(TUTORIAL_FEATURES_KEY)
    featureSteps.forEach(step => {
      if (step.featureKey) seenFeatures.add(step.featureKey)
    })
    writeTutorialSessionSet(TUTORIAL_FEATURES_KEY, seenFeatures)
  }
}

function buildCurrentLevelTutorialPlan(levelId, featureKeys) {
  return [
    ...getLevelTutorialSteps(levelId),
    ...getFeatureTutorialSteps(featureKeys),
  ]
}

function getFirstRenderableTutorialStep(plan, tutorialContext) {
  return plan.find(step => !step.showWhen || step.showWhen(tutorialContext)) ?? null
}

function getRenderableTutorialSteps(plan, tutorialContext) {
  return plan.filter(step => !step.showWhen || step.showWhen(tutorialContext))
}

function getTutorialTargetElement(targetId) {
  if (!targetId) return null
  return document.querySelector(`[data-tutorial-id="${targetId}"]`)
}

function isStableRect(currentRect, previousRect) {
  if (!currentRect || currentRect.width <= 0 || currentRect.height <= 0) return false
  if (!previousRect) return true

  return Math.abs(currentRect.top - previousRect.top) < 0.5 &&
    Math.abs(currentRect.left - previousRect.left) < 0.5 &&
    Math.abs(currentRect.width - previousRect.width) < 0.5 &&
    Math.abs(currentRect.height - previousRect.height) < 0.5
}

function waitForTutorialTarget(targetId, { signal, maxFrames = 120, settleFrames = 2 } = {}) {
  if (!targetId || typeof window === 'undefined') return Promise.resolve(false)

  return new Promise(resolve => {
    let frameCount = 0
    let stableFrames = 0
    let previousRect = null
    let rafId = null

    const finish = (isReady) => {
      if (rafId !== null) window.cancelAnimationFrame(rafId)
      resolve(isReady)
    }

    const checkTarget = () => {
      if (signal?.aborted) {
        finish(false)
        return
      }

      frameCount += 1
      const target = getTutorialTargetElement(targetId)
      const rect = target?.getBoundingClientRect() ?? null

      if (isStableRect(rect, previousRect)) {
        stableFrames += 1
      } else {
        stableFrames = 0
      }

      previousRect = rect

      if (target && stableFrames >= settleFrames) {
        finish(true)
        return
      }

      if (frameCount >= maxFrames) {
        finish(false)
        return
      }

      rafId = window.requestAnimationFrame(checkTarget)
    }

    rafId = window.requestAnimationFrame(checkTarget)
  })
}

function hasUnseenTutorialStep(plan, levelId) {
  const seenLevels = readTutorialSessionSet(TUTORIAL_LEVELS_KEY)
  const seenFeatures = readTutorialSessionSet(TUTORIAL_FEATURES_KEY)

  return plan.some(step => {
    if (step.scope === 'level') return !seenLevels.has(String(levelId))
    if (step.scope === 'feature') return step.featureKey && !seenFeatures.has(step.featureKey)
    return false
  })
}

// ── Level Screen ──────────────────────────────────────────────────────────────
function LevelScreen({ levelConfig, participantId, onComplete, onStrategyCard, onGoHome, onHeaderControls, topOffset = HEADER_H, animSpeed, onAnimSpeedChange, fastEntry = false }) {
  const [tutorialSteps, setTutorialSteps] = useState([])
  const [tutorialIndex, setTutorialIndex] = useState(0)
  const theme = useTheme()
  const t = THEMES[theme]

  const {
    luma, phase,
    sptAnswer, sptCorrect, answerSPT,
    helmetReport,
    radioIsUncertain,
    visorActive, visorFlipCount, flipVisor, closeVisor,
    sequence, setSequence, isRunning, isMirrored,
    addCommand, removeLastCommand, clearSequence, runSequence,
    collectedParts, collectionEffects, activeIfPathSignal,
    missedFragments, dismissMissedFragments,
    needsReset, resetLuma,
    predictionTile, setPrediction, predictionResult,
    traceSelection, traceEliminatedTiles, traceGoalRevealed, answerTraceCell,
    effectiveLevel, getGBISnapshot,
  } = useGameState(levelConfig, animSpeed)

  const tutorialContext = useMemo(() => ({
    phase,
    sequence,
    isRunning,
    needsReset,
    visorActive,
    sptAnswer,
    sptCorrect,
    visorFlipCount,
    collectedPartsCount: collectedParts.size,
    predictionTile,
    predictionResult,
    traceSelection,
    traceGoalRevealed,
    levelConfig,
    effectiveLevel,
  }), [
    collectedParts,
    effectiveLevel,
    isRunning,
    levelConfig,
    needsReset,
    phase,
    predictionResult,
    predictionTile,
    traceSelection,
    traceGoalRevealed,
    sequence,
    sptAnswer,
    sptCorrect,
    visorActive,
    visorFlipCount,
  ])
  const tutorialContextRef = useRef(tutorialContext)

  useEffect(() => {
    tutorialContextRef.current = tutorialContext
  }, [tutorialContext])

  const tutorialFeatureKeys = useMemo(
    () => getTutorialFeatureKeys(levelConfig, effectiveLevel),
    [effectiveLevel, levelConfig]
  )

  const currentLevelTutorialPlan = useMemo(
    () => buildCurrentLevelTutorialPlan(levelConfig.id, tutorialFeatureKeys),
    [levelConfig.id, tutorialFeatureKeys]
  )

  const replayableTutorialSteps = useMemo(
    () => getRenderableTutorialSteps(currentLevelTutorialPlan, tutorialContext),
    [currentLevelTutorialPlan, tutorialContext]
  )

  const currentTutorialStep = tutorialSteps[tutorialIndex] ?? null

  const closeTutorial = useCallback(() => {
    setTutorialSteps([])
    setTutorialIndex(0)
  }, [])

  const startTutorial = useCallback((steps, { persist = false } = {}) => {
    if (!steps.length) {
      closeTutorial()
      return
    }
    if (persist) markTutorialPlanSeen(steps, levelConfig.id)
    setTutorialSteps(steps)
    setTutorialIndex(0)
  }, [closeTutorial, levelConfig.id])

  const launchTutorialWhenReady = useCallback(async (plan, { persist = false, signal } = {}) => {
    const renderablePlan = getRenderableTutorialSteps(plan, tutorialContextRef.current)

    if (!renderablePlan.length) {
      closeTutorial()
      return
    }

    const firstRenderableStep = getFirstRenderableTutorialStep(renderablePlan, tutorialContextRef.current)
    if (!firstRenderableStep) {
      closeTutorial()
      return
    }

    const targetReady = await waitForTutorialTarget(firstRenderableStep.targetId, { signal })
    if (signal?.aborted) return

    if (targetReady) {
      startTutorial(renderablePlan, { persist })
    } else {
      closeTutorial()
    }
  }, [closeTutorial, startTutorial])

  useEffect(() => {
    if (tutorialSteps.length > 0) return undefined

    const autoTutorialReady =
      (levelConfig.id !== 5 &&
        levelConfig.id !== 10 &&
        levelConfig.id !== 11 &&
        levelConfig.id !== 15 &&
        levelConfig.id !== 16 &&
        levelConfig.id !== 17 &&
        levelConfig.id !== 18 &&
        levelConfig.id !== 19) ||
      phase === 'develop'

    if (!autoTutorialReady) {
      return undefined
    }

    if (!currentLevelTutorialPlan.length || !hasUnseenTutorialStep(currentLevelTutorialPlan, levelConfig.id)) {
      return undefined
    }

    const controller = new AbortController()
    const launchFrame = window.requestAnimationFrame(() => {
      launchTutorialWhenReady(currentLevelTutorialPlan, {
        persist: true,
        signal: controller.signal,
      })
    })

    return () => {
      window.cancelAnimationFrame(launchFrame)
      controller.abort()
    }
  }, [currentLevelTutorialPlan, launchTutorialWhenReady, levelConfig.id, phase, tutorialSteps.length])

  useEffect(() => {
    if (levelConfig.id !== 1 || !needsReset || tutorialSteps.length > 0) return undefined

    const seenFeatures = readTutorialSessionSet(TUTORIAL_FEATURES_KEY)
    if (seenFeatures.has(LEVEL_1_RESET_TUTORIAL_KEY)) return undefined

    const resetTutorialPlan = getFeatureTutorialSteps([LEVEL_1_RESET_TUTORIAL_KEY])
    if (!resetTutorialPlan.length) return undefined

    const controller = new AbortController()
    const launchFrame = window.requestAnimationFrame(() => {
      launchTutorialWhenReady(resetTutorialPlan, {
        persist: true,
        signal: controller.signal,
      })
    })

    return () => {
      window.cancelAnimationFrame(launchFrame)
      controller.abort()
    }
  }, [launchTutorialWhenReady, levelConfig.id, needsReset, tutorialSteps.length])

  useEffect(() => {
    if (!currentTutorialStep) return

    if (currentTutorialStep.closeWhen?.(tutorialContext)) {
      const timer = window.setTimeout(() => {
        closeTutorial()
      }, 0)

      return () => window.clearTimeout(timer)
    }

    if (currentTutorialStep.completeWhen?.(tutorialContext)) {
      const timer = window.setTimeout(() => {
        setTutorialIndex(index => {
          const nextIndex = index + 1
          if (nextIndex >= tutorialSteps.length) {
            closeTutorial()
            return 0
          }
          return nextIndex
        })
      }, 220)

      return () => window.clearTimeout(timer)
    }
  }, [closeTutorial, currentTutorialStep, tutorialContext, tutorialSteps.length])

  const handleReorder = useCallback((newSeq) => {
    if (setSequence) setSequence(newSeq)
  }, [setSequence])

  const handleVisorClose = useCallback(() => closeVisor(), [closeVisor])
  const handleAnswerSPT = useCallback((answer) => answerSPT(answer), [answerSPT])
  const handleFlipVisor = useCallback(() => flipVisor(), [flipVisor])
  const handleAddCommand = useCallback((cmd) => addCommand(cmd), [addCommand])
  const handleRemoveLastCommand = useCallback(() => {
    removeLastCommand()
  }, [removeLastCommand])
  const handleClearSequence = useCallback(() => {
    clearSequence()
  }, [clearSequence])
  const handleRunSequence = useCallback(() => {
    runSequence()
  }, [runSequence])
  const handleResetLuma = useCallback(() => {
    resetLuma()
  }, [resetLuma])
  const canReplayTutorial =
    replayableTutorialSteps.length > 0 &&
    levelConfig.id !== 14 &&
    levelConfig.id !== 4 &&
    levelConfig.id !== 12 &&
    (levelConfig.id !== 5 || phase === 'develop') &&
    (levelConfig.id !== 10 || phase === 'develop') &&
    (levelConfig.id !== 11 || phase === 'develop') &&
    (levelConfig.id !== 15 || phase === 'develop') &&
    (levelConfig.id !== 16 || phase === 'develop') &&
    (levelConfig.id !== 17 || phase === 'develop') &&
    (levelConfig.id !== 18 || phase === 'develop') &&
    (levelConfig.id !== 19 || phase === 'develop') &&
    (!levelConfig.traceMode || phase === 'develop')
  const handleReplayTutorial = useCallback(() => {
    if (!canReplayTutorial) return

    launchTutorialWhenReady(currentLevelTutorialPlan, { persist: false })
  }, [canReplayTutorial, currentLevelTutorialPlan, launchTutorialWhenReady])

  useEffect(() => {
    if (!onHeaderControls) return undefined

    onHeaderControls({
      canReplayTutorial,
      onGoHome,
      onReplayTutorial: handleReplayTutorial,
    })

    return () => onHeaderControls(null)
  }, [canReplayTutorial, handleReplayTutorial, onGoHome, onHeaderControls])
  const handleTutorialNext = useCallback(() => {
    setTutorialIndex(index => {
      const nextIndex = index + 1
      if (nextIndex >= tutorialSteps.length) {
        closeTutorial()
        return 0
      }
      return nextIndex
    })
  }, [closeTutorial, tutorialSteps.length])
  const handleTutorialBack = useCallback(() => {
    setTutorialIndex(index => Math.max(0, index - 1))
  }, [])

  const predictionModeActive =
    levelConfig.predictionPrompt &&
    phase === 'develop' &&
    !isRunning &&
    predictionResult === null
  const traceModeActive =
    Boolean(levelConfig.traceMode) &&
    phase === 'develop' &&
    !isRunning &&
    !traceGoalRevealed

  const handleTileClick = useCallback((col, row) => {
    if (!predictionModeActive) return
    setPrediction({ x: col, y: row })
  }, [predictionModeActive, setPrediction])

  const ifElseBlocked = Boolean(levelConfig.requireElse) && hasEmptyRequiredElse(sequence)
  const runBlocked =
    (levelConfig.predictionPrompt && predictionTile === null && predictionResult === null) ||
    ifElseBlocked
  const effectiveDefaultIfPathCondition = levelConfig.defaultIfPathCondition ?? 'ahead'

  const panelW = PANEL_W
  const usesEarlyMapOnlyLayout = levelConfig.id === 1 || levelConfig.id === 2
  const mapFootprintW = usesEarlyMapOnlyLayout ? GRID_PX * EARLY_MAP_SCALE : GRID_PX

  const handleSuccessNext = () => {
    const blockCount = countProgramBlocks(sequence)
    const targetBlocks = Number(levelConfig.targetCommands)
    const medal = calculateMedal(blockCount, targetBlocks)
    const achievementInfo = medal
      ? {
          medal,
          blockCount,
          targetBlocks,
          extraBlocks: Math.max(0, blockCount - targetBlocks),
        }
      : null
    const snapshot = getGBISnapshot()
    logGBI(participantId, levelConfig.id, {
      ...snapshot,
      achievementMedal: achievementInfo?.medal,
      achievementBlockCount: achievementInfo?.blockCount,
      achievementTargetBlocks: achievementInfo?.targetBlocks,
      achievementExtraBlocks: achievementInfo?.extraBlocks,
    })
    if (levelConfig.strategyCardAfter) {
      onStrategyCard(levelConfig.id, achievementInfo)
      return
    }
    onComplete(levelConfig.id, achievementInfo)
  }
  const phaseBadgeText =
    phase === 'identify'
      ? 'PHASE 1 - IDENTIFY'
      : phase === 'develop'
        ? (levelConfig.traceMode ? 'PHASE 2 - TRACE' : 'PHASE 2 - DEVELOP')
        : 'COMPLETE'
  const panelInitial = fastEntry ? false : { opacity: 0, x: 20 }
  const sptPanelInitial = fastEntry ? false : { opacity: 0, x: 20, y: 30 }
  const panelTransition = fastEntry ? { duration: 0 } : undefined

  return (
    <div style={{
      position: 'fixed',
      top: topOffset, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '10px 16px 12px',
      boxSizing: 'border-box',
      overflow: phase === 'identify' ? 'visible' : 'hidden',
      background: 'transparent',
    }}>
      {/* ── Title bar ── */}
      <div
        style={{
          width: '100%',
          maxWidth: LEVEL_SCREEN_MAX_W,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: levelConfig.id === 13 ? 14 : 10,
        }}
      >
      <div style={{
        width: '100%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div data-tutorial-id="level-title">
          <p style={{
            fontSize: 10,
            color: t.levelLabel,
            fontFamily: 'monospace', letterSpacing: 3, margin: 0,
            fontWeight: 800,
          }}>
            LEVEL {levelConfig.id} — {getDisplayWorldName(levelConfig).toUpperCase()}
          </p>
        </div>
        {!levelConfig.skipIdentify && (
          <div data-tutorial-id="phase-badge" style={{
            padding: '5px 16px',
            background: phase === 'identify' ? t.identBadgeBg : t.devBadgeBg,
            border: `1.5px solid ${phase === 'identify' ? t.identBadgeBd : t.devBadgeBd}`,
            borderRadius: 20,
            fontSize: 10, fontFamily: 'monospace', letterSpacing: 2,
            color: phase === 'identify' ? t.identBadgeTx : t.devBadgeTx,
            fontWeight: 800,
          }}>
            {phaseBadgeText}
          </div>
        )}
      </div>

      {/* ── Main play area ── */}
      <div style={{
        flex: phase === 'identify' ? '0 0 auto' : 1, width: '100%',
        display: 'flex', gap: GAP, alignItems: phase === 'identify' ? 'flex-start' : 'stretch',
        minHeight: phase === 'identify' ? 'auto' : 0,
        overflow: phase === 'identify' || levelConfig.id === 13 || usesEarlyMapOnlyLayout ? 'visible' : 'hidden',
      }}>
        <div style={{
          flex: '0 0 auto', width: mapFootprintW,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
          gap: 10,
          position: 'relative',
          transform: levelConfig.id === 13 && phase === 'identify' ? 'translateY(-8px)' : 'none',
        }}>
          {!levelConfig.noRadio && (
            <div style={{ width: GRID_PX, flexShrink: 0 }}>
              <HelmetRadio
                report={helmetReport}
                radioIsUncertain={radioIsUncertain}
              />
            </div>
          )}

          <div style={{
            transform: usesEarlyMapOnlyLayout ? `scale(${EARLY_MAP_SCALE})` : 'none',
            transformOrigin: 'top center',
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
              collectionEffects={collectionEffects}
              activeIfPathSignal={activeIfPathSignal}
              traceModeActive={traceModeActive}
              traceSelection={traceSelection}
              traceEliminatedTiles={traceEliminatedTiles}
              traceGoalRevealed={traceGoalRevealed}
              onTraceCellClick={answerTraceCell}
            />
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          flex: '1 1 0', maxWidth: panelW,
          height: phase === 'develop' ? '100%' : GRID_PX,
          display: 'flex', flexDirection: 'column',
          justifyContent: phase === 'identify' ? 'center' : 'flex-start',
          minHeight: 0, overflow: 'hidden',
        }}>
          <AnimatePresence mode="wait">
            {phase === 'identify' && levelConfig.sptQuestion && (
              <motion.div
                key="spt"
                initial={sptPanelInitial}
                animate={{ opacity: 1, x: 0, y: 30 }}
                exit={{ opacity: 0, x: -20, y: 30 }}
                transition={panelTransition}
                style={{ width: '100%' }}
              >
                <SPTQuestion
                  question={levelConfig.sptQuestion}
                  onAnswer={handleAnswerSPT}
                  sptAnswer={sptAnswer}
                  sptCorrect={sptCorrect}
                  visorFlipCount={visorFlipCount}
                  onVisorFlip={handleFlipVisor}
                  radioIsUncertain={radioIsUncertain}
                  showVisorFlip={!levelConfig.noVisorFlip}
                />
              </motion.div>
            )}

            {phase === 'develop' && (
              <motion.div
                key="builder"
                initial={panelInitial}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={panelTransition}
                style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {levelConfig.predictionPrompt && (
                  <div data-tutorial-id="prediction-banner" style={{ flexShrink: 0 }}>
                    <PredictionBanner
                      predictionTile={predictionTile}
                      predictionResult={predictionResult}
                      levelConfig={levelConfig}
                    />
                  </div>
                )}
                <div style={{
                  minHeight: 0,
                  height: '100%',
                }}>
                  <CommandBuilder
                    key={`command-builder-${levelConfig.id}`}
                    sequence={sequence}
                    isRunning={isRunning}
                    isMirrored={isMirrored}
                    onAdd={handleAddCommand}
                    onRemove={handleRemoveLastCommand}
                    onClear={handleClearSequence}
                    onRun={handleRunSequence}
                    visorFlipCount={visorFlipCount}
                    onVisorFlip={handleFlipVisor}
                    phase={phase}
                    onReorder={handleReorder}
                    needsReset={needsReset}
                    onReset={handleResetLuma}
                    panelWidth={panelW}
                    runBlocked={runBlocked}
                    ifElseBlocked={ifElseBlocked}
                    speed={animSpeed}
                    onSpeedChange={onAnimSpeedChange}
                    showVisorFlip={!levelConfig.noVisorFlip}
                    targetCommands={levelConfig.targetCommands ?? null}
                    showRepeat={Boolean(levelConfig.allowRepeat)}
                    showCollect={levelConfig.allowCollect ?? levelConfig.id >= 5}
                    showIfPath={Boolean(levelConfig.allowIfPath)}
                    showIfElse={Boolean(levelConfig.useIfElse) || levelConfig.id >= 18}
                    defaultIfPathCondition={effectiveDefaultIfPathCondition}
                    lockedProgram={Boolean(levelConfig.traceMode)}
                    paletteDisabled={currentTutorialStep?.id === 'level-1-palette'}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>

      <AnimatePresence>
        {phase === 'success' && (
          <SuccessScreen
            levelId={levelConfig.id}
            onNext={handleSuccessNext}
            isFinalLevel={levelConfig.id >= PLAYABLE_LEVELS}
          />
        )}
        {missedFragments && (
          <MissedFragmentsAlert onDismiss={dismissMissedFragments} />
        )}
      </AnimatePresence>
      {currentTutorialStep && (!currentTutorialStep.showWhen || currentTutorialStep.showWhen(tutorialContext)) && (
        <TutorialOverlay
          step={currentTutorialStep}
          stepIndex={tutorialIndex}
          totalSteps={tutorialSteps.length}
          onBack={handleTutorialBack}
          onNext={handleTutorialNext}
          onSkip={closeTutorial}
          canGoBack={tutorialIndex > 0}
        />
      )}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const bgMusicRef = useRef(null)
  const musicUnlockedRef = useRef(false)
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [levelSessionKey, setLevelSessionKey] = useState(0)
  const [appPhaseState, setAppPhaseState] = useState({
    current: 'start',
    previous: 'start',
  })
  const [participantId, setParticipantId] = useState(readStoredParticipantId)
  const [completedLevels, setCompletedLevels] = useState([])
  const [medalsByLevel, setMedalsByLevel] = useState({})
  const [achievementTotals, setAchievementTotals] = useState({ gold: 0, silver: 0, bronze: 0 })
  const [strategyCardLevelId, setStrategyCardLevelId] = useState(null)
  const [theme, setTheme] = useState('light')
  const [levelHeaderControls, setLevelHeaderControls] = useState(null)
  const [animSpeed, setAnimSpeed] = useState(readStoredAnimSpeed)
  const [muted, setMuted] = useState(readStoredMuted)

  const playBgMusic = useCallback((audio = bgMusicRef.current) => {
    if (!audio) return
    const playPromise = audio.play()
    if (playPromise?.catch) playPromise.catch(() => {})
  }, [])

  const unlockAndPlayMusic = useCallback(() => {
    musicUnlockedRef.current = true
    const audio = bgMusicRef.current
    if (!audio || muted) return
    audio.muted = false
    playBgMusic(audio)
  }, [muted, playBgMusic])

  const handleToggleMuted = useCallback(() => {
    musicUnlockedRef.current = true
    setMuted(prevMuted => {
      const nextMuted = !prevMuted
      try {
        window.localStorage?.setItem(MUTED_STORAGE_KEY, String(nextMuted))
      } catch {
        // Keep mute persistence best-effort when storage is unavailable.
      }

      const audio = bgMusicRef.current
      if (audio) {
        audio.muted = nextMuted
        if (!nextMuted) playBgMusic(audio)
      }

      return nextMuted
    })
  }, [playBgMusic])

  useEffect(() => {
    if (typeof Audio === 'undefined') return undefined

    const audio = new Audio(BG_MUSIC_SRC)
    audio.loop = true
    audio.volume = BG_MUSIC_VOLUME
    audio.preload = 'none'
    audio.muted = muted
    bgMusicRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      bgMusicRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = bgMusicRef.current
    if (!audio) return
    audio.muted = muted
    if (!muted && musicUnlockedRef.current) playBgMusic(audio)
  }, [muted, playBgMusic])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const handleAnimSpeedChange = useCallback((nextSpeed) => {
    const clampedSpeed = Math.max(10, Math.min(100, Number(nextSpeed) || 50))
    setAnimSpeed(clampedSpeed)
    try {
      window.localStorage?.setItem(SPEED_STORAGE_KEY, String(clampedSpeed))
    } catch {
      // Keep speed persistence best-effort when storage is unavailable.
    }
  }, [])

  const appPhase = appPhaseState.current
  const previousAppPhase = appPhaseState.previous
  const setAppPhase = useCallback((nextPhaseOrUpdater) => {
    setAppPhaseState(prev => {
      const nextPhase =
        typeof nextPhaseOrUpdater === 'function'
          ? nextPhaseOrUpdater(prev.current)
          : nextPhaseOrUpdater

      if (nextPhase === prev.current) return prev

      return {
        previous: prev.current,
        current: nextPhase,
      }
    })
  }, [])

  const t = THEMES[theme]
  const level = LEVELS[currentLevelIndex]
  const gameTopOffset = HEADER_H
  const isOuterPhase = OUTER_PHASES.has(appPhase)
  const pageTransitionMode = previousAppPhase === 'playing' && appPhase === 'playing' ? 'wait' : 'sync'
  const isMapGameplayTransition =
    (previousAppPhase === 'home' && appPhase === 'playing') ||
    (previousAppPhase === 'playing' && appPhase === 'home')
  const headerTransition = isMapGameplayTransition ? INSTANT_TRANSITION : HEADER_TRANSITION
  const menuPageVariants = isMapGameplayTransition ? MAP_LEVEL_VARIANTS : PAGE_VARIANTS
  const gameplayPageVariants =
    previousAppPhase === 'playing' && appPhase === 'playing'
      ? LEVEL_PAGE_VARIANTS
      : MAP_LEVEL_VARIANTS
  const pageTransition = isMapGameplayTransition ? MAP_LEVEL_TRANSITION : PAGE_TRANSITION

  useEffect(() => {
    OUTER_BG_ASSETS.forEach(src => {
      const image = new Image()
      image.src = src
    })
  }, [])

  useEffect(() => {
    if (!['start', 'home', 'playing', 'strategy-card'].includes(appPhase)) return
    if (!participantId) {
      if (appPhase === 'start') return

      const redirectTimer = window.setTimeout(() => setAppPhase('mission-setup'), 0)
      return () => window.clearTimeout(redirectTimer)
    }

    let cancelled = false
    fetchSessionProgress(participantId)
      .then(progress => {
        if (!cancelled) {
          setCompletedLevels(progress.completedLevels)
          setMedalsByLevel(progress.medalsByLevel)
          setAchievementTotals(progress.achievementTotals)
        }
      })
      .catch(err => {
        console.error('[Progress] Failed to load session progress:', err)
        if (!cancelled) {
          setCompletedLevels([])
          setMedalsByLevel({})
          setAchievementTotals({ gold: 0, silver: 0, bronze: 0 })
        }
      })

    return () => {
      cancelled = true
    }
  }, [appPhase, participantId, setAppPhase])

  const handleMissionComplete = useCallback((nextParticipantId) => {
    setParticipantId(nextParticipantId)
    setCompletedLevels([])
    setMedalsByLevel({})
    setAchievementTotals({ gold: 0, silver: 0, bronze: 0 })
    setAppPhase('home')
  }, [setAppPhase])

  const handleContinueMission = useCallback(async () => {
    const storedParticipantId = readStoredParticipantId()
    if (!storedParticipantId) {
      setParticipantId('')
      setAppPhase('mission-setup')
      return
    }

    setParticipantId(storedParticipantId)
    try {
      await touchParticipantSession(storedParticipantId)
    } catch (err) {
      console.error('[StartPage] Failed to refresh saved mission code:', err)
    }
    setAppPhase('home')
  }, [setAppPhase])

  const handleSelectLevel = useCallback((levelNumber) => {
    if (levelNumber < 1 || levelNumber > PLAYABLE_LEVELS) return
    setCurrentLevelIndex(levelNumber - 1)
    setLevelSessionKey(key => key + 1)
    setStrategyCardLevelId(null)
    setLevelHeaderControls(null)
    setAppPhase('playing')
  }, [setAppPhase])

  const handleGoHome = useCallback(() => {
    setAppPhase('home')
    setStrategyCardLevelId(null)
    setLevelHeaderControls(null)
  }, [setAppPhase])

  const handleLevelHeaderControls = useCallback((controls) => {
    const controlsLevelId = level?.id
    const controlsSessionKey = levelSessionKey

    if (controls) {
      setLevelHeaderControls({
        ...controls,
        levelId: controlsLevelId,
        sessionKey: controlsSessionKey,
      })
      return
    }

    setLevelHeaderControls(previousControls => (
      previousControls?.levelId === controlsLevelId &&
      previousControls?.sessionKey === controlsSessionKey
        ? null
        : previousControls
    ))
  }, [level?.id, levelSessionKey])

  const completeLevelProgress = useCallback(async (completedLevelId, achievementInfo = null) => {
    if (!participantId) return
    try {
      const progress = await updateSessionProgress(participantId, completedLevelId, completedLevels, achievementInfo)
      setCompletedLevels(progress.completedLevels)
      setMedalsByLevel(progress.medalsByLevel)
      setAchievementTotals(progress.achievementTotals)
    } catch (err) {
      console.error('[Progress] Failed to update session progress:', err)
    }
  }, [completedLevels, participantId])

  const handleLevelComplete = useCallback((completedLevelId, achievementInfo = null) => {
    completeLevelProgress(completedLevelId, achievementInfo)
    setLevelHeaderControls(null)
    if (completedLevelId < PLAYABLE_LEVELS) {
      setCurrentLevelIndex(completedLevelId)
      setLevelSessionKey(key => key + 1)
      setStrategyCardLevelId(null)
      setAppPhase('playing')
      return
    }
    setStrategyCardLevelId(null)
    setAppPhase('home')
  }, [completeLevelProgress, setAppPhase])

  const handleShowStrategyCard = useCallback((completedLevelId, achievementInfo = null) => {
    completeLevelProgress(completedLevelId, achievementInfo)
    setStrategyCardLevelId(completedLevelId)
    setLevelHeaderControls(null)
    setAppPhase('strategy-card')
  }, [completeLevelProgress, setAppPhase])

  const handleStrategyCardDone = () => {
    const completedLevelId = strategyCardLevelId
    setLevelHeaderControls(null)
    setStrategyCardLevelId(null)
    if (completedLevelId && completedLevelId < PLAYABLE_LEVELS) {
      setCurrentLevelIndex(completedLevelId)
      setLevelSessionKey(key => key + 1)
      setAppPhase('playing')
      return
    }
    setAppPhase('home')
  }

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{
        width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative',
        background: isOuterPhase ? OUTER_PAGE_BG : t.appBg,
        transition: isMapGameplayTransition ? 'none' : 'background 0.5s ease',
      }}>
        <style>{ANIM_STYLES}</style>

        {/* ── Header ── */}
        <AnimatePresence>
          {(appPhase === 'playing' || appPhase === 'strategy-card') && (
        <motion.header
          key="game-header"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={headerTransition}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            height: HEADER_H, padding: '0 24px',
            background: t.headerBg,
            borderBottom: `1.5px solid ${t.headerBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            zIndex: 50,
            boxSizing: 'border-box',
            transition: 'background 0.5s, border-color 0.5s',
            // No radial glow / bright spot — clean solid shadow only
            boxShadow: theme === 'light'
              ? '0 14px 28px rgba(69,131,199,0.12), inset 0 1px 0 rgba(255,255,255,0.72)'
              : '0 2px 20px rgba(0,0,0,0.6)',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {appPhase === 'playing' ? (
              <img
                src={theme === 'light' ? '/assets/ui/starlost-logo.png' : '/assets/ui/starlost-logo-dark.png'}
                alt="STARLOST"
                style={{
                  display: 'block',
                  width: 'auto',
                  height: 54,
                  maxWidth: 230,
                  objectFit: 'contain',
                }}
              />
            ) : (
              <>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: 22 }}
                >🚀</motion.div>
                <h1 style={{
                  fontSize: 17, fontWeight: 900, color: t.headerTitle,
                  letterSpacing: 6, fontFamily: 'monospace', margin: 0,
                  transition: 'color 0.5s',
                }}>
                  STARLOST
                </h1>
              </>
            )}
            {appPhase === 'playing' && levelHeaderControls && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 10 }}>
                <button
                  onClick={levelHeaderControls.onGoHome}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 999,
                    border: `1.5px solid ${theme === 'light' ? '#f3b372' : '#7a4d1c'}`,
                    background: theme === 'light'
                      ? 'rgba(255,247,235,0.82)'
                      : 'rgba(27,17,8,0.72)',
                    color: theme === 'light' ? '#93510f' : '#ffd59a',
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Home
                </button>
                <button
                  onClick={levelHeaderControls.onReplayTutorial}
                  disabled={!levelHeaderControls.canReplayTutorial}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 999,
                    border: `1.5px solid ${theme === 'light' ? '#85d9eb' : '#1f4d61'}`,
                    background: theme === 'light'
                      ? 'rgba(255,255,255,0.74)'
                      : 'rgba(6,12,22,0.8)',
                    color: levelHeaderControls.canReplayTutorial
                      ? (theme === 'light' ? '#14557f' : '#d8fdfa')
                      : (theme === 'light' ? '#8ba5ba' : '#6c8598'),
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: levelHeaderControls.canReplayTutorial ? 'pointer' : 'not-allowed',
                    opacity: levelHeaderControls.canReplayTutorial ? 1 : 0.6,
                  }}
                >
                  Replay Tutorial
                </button>
              </div>
            )}
          </div>

          {/* Center tagline */}
          <p style={{
            fontSize: 11, color: t.headerSub,
            fontFamily: 'monospace', letterSpacing: 2, margin: 0,
            transition: 'color 0.5s',
            fontWeight: 700,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}>
            {appPhase === 'playing' ? 'Lost in space. Guided by you.' : 'Help LUMA find the way home.'}
          </p>

          {/* Header controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LevelSoundButton
              theme={theme}
              muted={muted}
              onToggleMuted={handleToggleMuted}
            />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </motion.header>
          )}
        </AnimatePresence>

        {/* ── Game screens ── */}
        <AnimatePresence mode={pageTransitionMode}>
          {appPhase === 'start' && (
            <motion.div
              key="start"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              style={ACTIVE_PAGE_SHELL_STYLE}
            >
              <StartPage
                muted={muted}
                onToggleMuted={handleToggleMuted}
                onUnlockAudio={unlockAndPlayMusic}
                onStart={() => {
                  unlockAndPlayMusic()
                  setAppPhase('mission-setup')
                }}
                onContinue={handleContinueMission}
                completedLevels={participantId ? completedLevels : []}
                medalsByLevel={participantId ? medalsByLevel : {}}
                achievementTotals={participantId ? achievementTotals : { gold: 0, silver: 0, bronze: 0 }}
              />
            </motion.div>
          )}

          {appPhase === 'mission-setup' && (
            <motion.div
              key="mission-setup"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              style={ACTIVE_PAGE_SHELL_STYLE}
            >
              <MissionSetup
                muted={muted}
                onToggleMuted={handleToggleMuted}
                onUnlockAudio={unlockAndPlayMusic}
                onBack={() => setAppPhase('start')}
                onComplete={handleMissionComplete}
              />
            </motion.div>
          )}

          {appPhase === 'home' && (
            <motion.div
              key="home"
              variants={menuPageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              style={ACTIVE_PAGE_SHELL_STYLE}
            >
              <StarMapLevelSelect
                muted={muted}
                onToggleMuted={handleToggleMuted}
                onUnlockAudio={unlockAndPlayMusic}
                completedLevels={completedLevels}
                medalsByLevel={medalsByLevel}
                achievementTotals={achievementTotals}
                onSelectLevel={handleSelectLevel}
                onBack={() => setAppPhase('start')}
              />
            </motion.div>
          )}

          {appPhase === 'playing' && (
            <motion.div
              key={`level-${level.id}-${levelSessionKey}`}
              variants={gameplayPageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              style={ACTIVE_PAGE_SHELL_STYLE}
            >
              <LevelScreen
                key={`${level.id}-${levelSessionKey}`}
                levelConfig={level}
                participantId={participantId}
                onComplete={handleLevelComplete}
                onStrategyCard={handleShowStrategyCard}
                onGoHome={handleGoHome}
                onHeaderControls={handleLevelHeaderControls}
                topOffset={gameTopOffset}
                animSpeed={animSpeed}
                onAnimSpeedChange={handleAnimSpeedChange}
                fastEntry={isMapGameplayTransition}
              />
            </motion.div>
          )}

          {appPhase === 'strategy-card' && (
            <motion.div
              key="strategy-card"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              style={ACTIVE_PAGE_SHELL_STYLE}
            >
              <StrategyCardScreen
                levelId={strategyCardLevelId ?? level.id}
                participantId={participantId}
                onDone={handleStrategyCardDone}
                topOffset={gameTopOffset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThemeContext.Provider>
  )
}
