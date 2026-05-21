import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { isLevelCompleted, isLevelUnlocked, TOTAL_LEVELS } from '../utils/progress'
import MenuSoundIcon from './MenuSoundIcon'
import './menuScreens.css'


function getZones(t) {
  return [
  {
    id: 'crash',
    className: 'star-zone--crash',
    title: t('starMap.crashSite'),
    path: [1, 2, 3, 4, 5],
    positions: {
      1: { left: 14, top: 59 },
      2: { left: 30, top: 47 },
      3: { left: 48, top: 37 },
      4: { left: 65, top: 49 },
      5: { left: 80, top: 61 },
    },
  },
  {
    id: 'forest',
    className: 'star-zone--forest',
    title: t('starMap.forestEntrance'),
    path: [6, 7, 8, 9],
    positions: {
      6: { left: 22, top: 59 },
      7: { left: 43, top: 46 },
      8: { left: 65, top: 46 },
      9: { left: 86, top: 59 },
    },
  },
  {
    id: 'deep-forest',
    className: 'star-zone--deep-forest',
    title: t('starMap.deepForest'),
    path: [10, 11, 12, 13, 14],
    positions: {
      10: { left: 15, top: 67 },
      11: { left: 31, top: 51 },
      12: { left: 50, top: 45 },
      13: { left: 69, top: 51 },
      14: { left: 85, top: 67 },
    },
  },
  {
    id: 'repair',
    className: 'star-zone--repair',
    title: t('starMap.repairSite'),
    path: [15, 16, 17, 18, 19, 20],
    positions: {
      15: { left: 15, top: 77 },
      16: { left: 27, top: 58 },
      17: { left: 40, top: 41 },
      18: { left: 56, top: 41 },
      19: { left: 69, top: 58 },
      20: { left: 81, top: 77 },
    },
  },
  {
    id: 'launch',
    className: 'star-zone--launch',
    title: t('starMap.launchSite'),
    path: [21, 22, 23],
    positions: {
      21: { left: 26, top: 62 },
      22: { left: 49, top: 48 },
      23: { left: 72, top: 62 },
    },
  },
  ]
}

function ProgressStarIcon() {
  return (
    <svg className="star-progress__icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M32 5 39.4 23.2 59 24.8 44 37.6 48.6 56.8 32 46.6 15.4 56.8 20 37.6 5 24.8 24.6 23.2z" />
    </svg>
  )
}

function MenuModal({ onClose }) {
  const { t } = useTranslation()
  return (
    <motion.div
      className="menu-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="menu-modal"
        initial={{ y: 18, scale: 0.94 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 12, scale: 0.96 }}
      >
        <h2>{t('common.aboutStarlost')}</h2>
        <p>{t('start.aboutBody')}</p>
        <p>{t('start.aboutThesis')}</p>
        <p>{t('start.aboutCredit')}</p>
        <motion.button
          type="button"
          className="menu-pill-button menu-pill-button--secondary"
          onClick={onClose}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          style={{ minHeight: 48, fontSize: 18, width: 'min(220px, 100%)', margin: '8px auto 0' }}
        >
          {t('common.close')}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

function LevelNode({ level, position, completedLevels, medalsByLevel, onSelectLevel }) {
  const { t } = useTranslation()
  const completed = isLevelCompleted(level, completedLevels)
  const unlocked = isLevelUnlocked(level, completedLevels)
  const locked = !unlocked
  const medal = completed ? medalsByLevel?.[String(level)]?.medal : null
  const className = [
    'star-node',
    completed ? 'star-node--completed' : '',
    locked ? 'star-node--locked' : '',
    level >= 21 && level <= 23 ? 'star-node--launch' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={className}
      aria-label={locked ? `Locked level ${level}` : medal ? t('starMap.levelWithMedal', { level, medal }) : t('starMap.level', { level })}
      aria-disabled={locked}
      style={{ left: `${position.left}%`, top: `${position.top}%` }}
      onClick={() => {
        if (locked) return
        onSelectLevel(level)
      }}
    >
      <span className="star-node__number">{level}</span>
      {locked && <span className="star-node__lock" aria-hidden="true" />}
      {medal && (
        <span className={`star-node__medal star-node__medal--${medal}`} aria-hidden="true">
          <span className="star-node__medal-ribbon" />
          <span className="star-node__medal-disc" />
        </span>
      )}
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

function StarZone({ zone, completedLevels, medalsByLevel, onSelectLevel }) {
  const zoneUnlocked = zone.path.some(level => isLevelUnlocked(level, completedLevels))
  return (
    <section className={`star-zone ${zone.className} ${zoneUnlocked ? '' : 'star-zone--locked'}`} aria-label={zone.title}>
      <h2 className="star-zone__title">{zone.title}</h2>
      <div className="star-zone__node-layer">
        <ZoneTrail zone={zone} />
        {zone.path.map(level => (
          <LevelNode
            key={level}
            level={level}
            position={zone.positions[level]}
            completedLevels={completedLevels}
            medalsByLevel={medalsByLevel}
            onSelectLevel={onSelectLevel}
          />
        ))}
        {!zoneUnlocked && <span className="star-zone__lock-emblem" aria-hidden="true" />}
      </div>
    </section>
  )
}

export default function StarMapLevelSelect({
  muted = false,
  onToggleMuted,
  onUnlockAudio,
  completedLevels = [],
  medalsByLevel = {},
  loading = false,
  onSelectLevel,
  onBack,
}) {
  const { t } = useTranslation()
  const [modal, setModal] = useState(null)
  const zones = useMemo(() => getZones(t), [t])
  const normalizedCompletedLevels = useMemo(
    () => [...new Set(completedLevels)].filter(level => level >= 1 && level <= TOTAL_LEVELS),
    [completedLevels]
  )
  const progressPercent = TOTAL_LEVELS > 0
    ? Math.min(100, Math.max(0, (normalizedCompletedLevels.length / TOTAL_LEVELS) * 100))
    : 0

  const handleSelectLevel = useCallback((level) => {
    onUnlockAudio?.()
    onSelectLevel?.(level)
  }, [onSelectLevel, onUnlockAudio])

  return (
    <motion.main
      className="starlost-menu"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      aria-label={t('starMap.ariaLabel')}
    >
      <img className="starlost-menu__bg" src="/assets/ui/star-map-bg.png" alt="" />
      <div className="star-map-art-layer">
        {zones.map(zone => (
          <StarZone
            key={zone.id}
            zone={zone}
            completedLevels={normalizedCompletedLevels}
            medalsByLevel={medalsByLevel}
            onSelectLevel={handleSelectLevel}
          />
        ))}
      </div>
      <div className="starlost-menu__stage star-map-ui-layer">
        <motion.button
          type="button"
          className="menu-icon-button menu-icon-button--left"
          aria-label={t('common.aboutStarlost')}
          onClick={() => setModal('about')}
          whileHover={{ y: -3, scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
        >
          <span className="menu-icon-button__info">i</span>
        </motion.button>
        <button
          type="button"
          className={`menu-icon-button menu-icon-button--right ${muted ? 'menu-icon-button--muted' : ''}`}
          aria-label={muted ? t('common.unmuteMusic') : t('common.muteMusic')}
          title={muted ? t('common.unmuteMusic') : t('common.muteMusic')}
          onClick={onToggleMuted}
        >
          <MenuSoundIcon />
        </button>

        <motion.button
          type="button"
          className="menu-back-button menu-back-button--outer"
          onClick={onBack}
          whileHover={{ x: -2, scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
        >
          {'\u2190'} {t('common.back')}
        </motion.button>

        <div className="star-progress" aria-live="polite">
          <div className="star-progress__readout">
            <ProgressStarIcon />
            <span className="star-progress__label">{t('starMap.progress')}</span>
            <span className="star-progress__count">
              {loading ? '...' : `${normalizedCompletedLevels.length} / ${TOTAL_LEVELS}`}
            </span>
          </div>
          <div className="star-progress__bar" aria-hidden="true">
            <span className="star-progress__bar-fill" style={{ width: `${progressPercent}%` }} />
            <span className="star-progress__bar-segments" />
          </div>
        </div>

        <AnimatePresence>
          {modal === 'about' && <MenuModal onClose={() => setModal(null)} />}
        </AnimatePresence>
      </div>
    </motion.main>
  )
}
