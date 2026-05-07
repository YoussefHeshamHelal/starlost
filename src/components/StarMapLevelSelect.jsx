import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { isLevelCompleted, TOTAL_LEVELS } from '../utils/progress'
import MenuSoundIcon from './MenuSoundIcon'
import './menuScreens.css'

const COPY = {
  starMap: 'STAR MAP',
  crashSite: 'Crash Site',
  forestTrail: 'Forest Trail',
  repairSite: 'Repair Site',
  launchSite: 'Launch Site',
  back: 'Back',
  progress: 'PROGRESS',
}

const ZONES = [
  {
    id: 'crash',
    className: 'star-zone--crash',
    title: COPY.crashSite,
    path: [1, 2, 3, 4, 5],
    positions: {
      1: { left: 18, top: 66 },
      2: { left: 34, top: 54 },
      3: { left: 52, top: 44 },
      4: { left: 69, top: 56 },
      5: { left: 84, top: 68 },
    },
  },
  {
    id: 'forest',
    className: 'star-zone--forest',
    title: COPY.forestTrail,
    path: [6, 7, 8, 9, 10, 11, 12, 13, 14],
    positions: {
      6: { left: 18, top: 48 },
      7: { left: 34, top: 39 },
      8: { left: 50, top: 38 },
      9: { left: 66, top: 40 },
      10: { left: 82, top: 53 },
      11: { left: 77, top: 72 },
      12: { left: 60, top: 72 },
      13: { left: 42, top: 72 },
      14: { left: 24, top: 70 },
    },
  },
  {
    id: 'repair',
    className: 'star-zone--repair',
    title: COPY.repairSite,
    path: [15, 16, 17, 18, 19, 20, 21],
    positions: {
      15: { left: 22, top: 46 },
      16: { left: 40, top: 36 },
      17: { left: 59, top: 37 },
      18: { left: 77, top: 35 },
      19: { left: 80, top: 71 },
      20: { left: 58, top: 74 },
      21: { left: 36, top: 74 },
    },
  },
  {
    id: 'launch',
    className: 'star-zone--launch',
    title: COPY.launchSite,
    path: [22],
    positions: {
      22: { left: 51, top: 58 },
    },
  },
]

function ProgressStarIcon() {
  return (
    <svg className="star-progress__icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M32 5 39.4 23.2 59 24.8 44 37.6 48.6 56.8 32 46.6 15.4 56.8 20 37.6 5 24.8 24.6 23.2z" />
    </svg>
  )
}

function LevelNode({ level, position, completedLevels, onSelectLevel }) {
  const completed = isLevelCompleted(level, completedLevels)
  const className = [
    'star-node',
    completed ? 'star-node--completed' : '',
    level === 22 ? 'star-node--launch' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={className}
      aria-label={`Level ${level}`}
      style={{ left: `${position.left}%`, top: `${position.top}%` }}
      onClick={() => onSelectLevel(level)}
    >
      {level}
    </button>
  )
}

function ZoneTrail({ zone }) {
  if (zone.path.length < 2) return null

  const points = zone.path
    .map(level => zone.positions[level])
    .filter(Boolean)
    .map(position => `${position.left},${position.top}`)
    .join(' ')

  return (
    <svg
      className="star-zone__trail"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <polyline className="star-zone__trail-glow" points={points} />
      <polyline className="star-zone__trail-core" points={points} />
      <polyline className="star-zone__trail-spark" points={points} />
    </svg>
  )
}

function StarZone({ zone, completedLevels, onSelectLevel }) {
  return (
    <section className={`star-zone ${zone.className}`} aria-label={zone.title}>
      <h2 className="star-zone__title">{zone.title}</h2>
      <ZoneTrail zone={zone} />
      {zone.path.map(level => (
        <LevelNode
          key={level}
          level={level}
          position={zone.positions[level]}
          completedLevels={completedLevels}
          onSelectLevel={onSelectLevel}
        />
      ))}
    </section>
  )
}

export default function StarMapLevelSelect({
  completedLevels = [],
  loading = false,
  onSelectLevel,
  onBack,
}) {
  const [muted, setMuted] = useState(() => window.localStorage?.getItem('starlost:muted') === 'true')
  const normalizedCompletedLevels = useMemo(
    () => [...new Set(completedLevels)].filter(level => level >= 1 && level <= TOTAL_LEVELS),
    [completedLevels]
  )

  const toggleMuted = () => {
    setMuted(prev => {
      const next = !prev
      window.localStorage?.setItem('starlost:muted', String(next))
      return next
    })
  }

  return (
    <motion.main
      className="starlost-menu"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      aria-label="Star map level select"
    >
      <img className="starlost-menu__bg" src="/assets/ui/star-map-bg.png" alt="" />
      <div className="starlost-menu__stage">
        <motion.button
          type="button"
          className="menu-icon-button menu-icon-button--left"
          aria-label="Star map information"
          whileHover={{ y: -3, scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
        >
          <span className="menu-icon-button__info">i</span>
        </motion.button>
        <button
          type="button"
          className={`menu-icon-button menu-icon-button--right ${muted ? 'menu-icon-button--muted' : ''}`}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          onClick={toggleMuted}
        >
          <MenuSoundIcon />
        </button>

        {ZONES.map(zone => (
          <StarZone
            key={zone.id}
            zone={zone}
            completedLevels={normalizedCompletedLevels}
            onSelectLevel={onSelectLevel}
          />
        ))}

        <motion.button
          type="button"
          className="menu-back-button menu-back-button--outer"
          onClick={onBack}
          whileHover={{ x: -2, scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
        >
          {'\u2190'} {COPY.back}
        </motion.button>

        <div className="star-progress" aria-live="polite">
          <ProgressStarIcon />
          <span className="star-progress__label">{COPY.progress}</span>
          <span className="star-progress__count">
            {loading ? '...' : `${normalizedCompletedLevels.length} / ${TOTAL_LEVELS}`}
          </span>
        </div>
      </div>
    </motion.main>
  )
}
