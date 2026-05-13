import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { isValidParticipantId } from '../utils/participants'
import { MEDAL_RANKS, TOTAL_LEVELS } from '../utils/progress'
import MenuSoundIcon from './MenuSoundIcon'
import './menuScreens.css'

const COPY = {
  tagline: 'Lost in space. Guided by you.',
  startGame: 'Start Game',
  continue: 'Continue',
  achievements: 'Achievements',
  language: 'Language',
  aboutTitle: 'About STARLOST',
  aboutBody: 'STARLOST is a child-friendly educational space adventure where players help LUMA find her way home by solving grid-world puzzle levels.',
  aboutThesis: 'The game is designed to support and assess children’s spatial perspective-taking and computational thinking through movement blocks, path planning, perspective clues, and problem-solving challenges.',
  aboutCredit: 'STARLOST was created as part of a bachelor thesis project by Youssef Hesham Helal.',
  achievementsTitle: 'ACHIEVEMENTS',
  languageTitle: 'Language',
  close: 'Close',
  english: 'English',
  arabic: 'Arabic',
}

const ACHIEVEMENT_ROWS = [
  {
    id: 'first-mission',
    icon: '\u{1f680}',
    title: 'First Mission',
    description: 'Complete a level.',
    isUnlocked: ({ completedCount }) => completedCount >= 1,
  },
  {
    id: 'gold-explorer',
    icon: '\u{1f947}',
    title: 'Gold Explorer',
    description: 'Earn a gold medal.',
    isUnlocked: ({ medalValues }) => medalValues.some(medal => medal === 'gold'),
  },
  {
    id: 'rising-star',
    icon: '\u2728',
    title: 'Rising Star',
    description: 'Complete 5 levels.',
    isUnlocked: ({ completedCount }) => completedCount >= 5,
  },
  {
    id: 'space-navigator',
    icon: '\u{1f9ed}',
    title: 'Space Navigator',
    description: 'Complete 10 levels.',
    isUnlocked: ({ completedCount }) => completedCount >= 10,
  },
  {
    id: 'deep-explorer',
    icon: '\u{1fa90}',
    title: 'Deep Explorer',
    description: 'Complete 15 levels.',
    isUnlocked: ({ completedCount }) => completedCount >= 15,
  },
  {
    id: 'bronze-master',
    icon: '',
    medal: 'bronze',
    title: 'Bronze Master',
    description: 'Earn bronze medals on all levels.',
    isUnlocked: ({ medalValues }) => medalValues.length >= TOTAL_LEVELS,
  },
  {
    id: 'silver-master',
    icon: '',
    medal: 'silver',
    title: 'Silver Master',
    description: 'Earn silver medals on all levels.',
    isUnlocked: ({ medalValues }) => medalValues.length >= TOTAL_LEVELS && medalValues.every(medal => (MEDAL_RANKS[medal] ?? 0) >= MEDAL_RANKS.silver),
  },
  {
    id: 'gold-master',
    icon: '',
    medal: 'gold',
    title: 'Gold Master',
    description: 'Earn gold medals on all levels.',
    isUnlocked: ({ medalValues }) => medalValues.length >= TOTAL_LEVELS && medalValues.every(medal => medal === 'gold'),
  },
]

function readSavedMissionCode() {
  if (typeof window === 'undefined') return ''
  const savedCode = window.localStorage?.getItem('starlost:participantId') || ''
  if (isValidParticipantId(savedCode)) return savedCode
  if (savedCode) window.localStorage?.removeItem('starlost:participantId')
  return ''
}

function MenuModal({ title, children, onClose, className = '' }) {
  return (
    <motion.div
      className="menu-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`menu-modal ${className}`.trim()}
        initial={{ y: 18, scale: 0.94 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 12, scale: 0.96 }}
      >
        <h2>{title}</h2>
        {children}
        <motion.button
          type="button"
          className="menu-pill-button menu-pill-button--secondary"
          onClick={onClose}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          style={{ minHeight: 48, fontSize: 18, width: 'min(220px, 100%)', margin: '8px auto 0' }}
        >
          {COPY.close}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default function StartPage({
  muted = false,
  onToggleMuted,
  onUnlockAudio,
  onStart,
  onContinue,
  completedLevels = [],
  medalsByLevel = {},
  achievementTotals = { gold: 0, silver: 0, bronze: 0 },
}) {
  const [modal, setModal] = useState(null)
  const [savedMissionCode] = useState(readSavedMissionCode)
  const canContinue = Boolean(savedMissionCode)
  const completedCount = Array.isArray(completedLevels) ? completedLevels.length : 0
  const medalValues = Object.values(medalsByLevel ?? {})
    .map(value => value?.medal)
    .filter(medal => MEDAL_RANKS[medal])
  const achievementContext = { completedCount, medalValues }

  return (
    <motion.main
      className="starlost-menu"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      aria-label="STARLOST start page"
    >
      <img className="starlost-menu__bg" src="/assets/ui/start-page-bg.png" alt="" />
      <div className="starlost-menu__stage">
        <motion.button
          type="button"
          className="menu-icon-button menu-icon-button--left"
          aria-label="About STARLOST"
          onClick={() => setModal('about')}
          whileHover={{ y: -3, scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
        >
          <span className="menu-icon-button__info">i</span>
        </motion.button>

        <motion.button
          type="button"
          className={`menu-icon-button menu-icon-button--right ${muted ? 'menu-icon-button--muted' : ''}`}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          onClick={onToggleMuted}
          whileHover={{ y: -3, scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
        >
          <MenuSoundIcon />
        </motion.button>

        <div className={`start-actions ${canContinue ? 'start-actions--returning' : ''}`}>
          <motion.button
            type="button"
            className="menu-pill-button"
            onClick={() => {
              onUnlockAudio?.()
              onStart?.()
            }}
            whileHover={{ y: -4, scale: 1.012 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="button-symbol" aria-hidden="true">{'\u{1f680}'}</span>
            {COPY.startGame}
          </motion.button>
          {canContinue && (
            <motion.button
              type="button"
              className="menu-pill-button menu-pill-button--continue"
              onClick={() => {
                onUnlockAudio?.()
                onContinue?.()
              }}
              whileHover={{ y: -4, scale: 1.012 }}
              whileTap={{ scale: 0.96 }}
            >
              <span className="button-symbol" aria-hidden="true">{'\u25b6'}</span>
              {COPY.continue}
            </motion.button>
          )}
          <motion.button
            type="button"
            className="menu-pill-button menu-pill-button--secondary"
            onClick={() => setModal('achievements')}
            whileHover={{ y: -4, scale: 1.012 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="button-symbol" aria-hidden="true">{'\u{1f3c6}'}</span>
            {COPY.achievements}
          </motion.button>
          <motion.button
            type="button"
            className="menu-pill-button menu-pill-button--secondary"
            onClick={() => setModal('language')}
            whileHover={{ y: -4, scale: 1.012 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="button-symbol" aria-hidden="true">{'\u{1f30d}'}</span>
            {COPY.language}
          </motion.button>
        </div>

        <AnimatePresence>
          {modal === 'about' && (
            <MenuModal title={COPY.aboutTitle} onClose={() => setModal(null)}>
              <p>{COPY.aboutBody}</p>
              <p>{COPY.aboutThesis}</p>
              <p>{COPY.aboutCredit}</p>
            </MenuModal>
          )}
          {modal === 'achievements' && (
            <MenuModal title={COPY.achievementsTitle} onClose={() => setModal(null)} className="achievements-modal">
              <div className="achievements-summary" aria-label="Achievement totals">
                <span>Gold: {achievementTotals.gold ?? 0}</span>
                <span>Silver: {achievementTotals.silver ?? 0}</span>
                <span>Bronze: {achievementTotals.bronze ?? 0}</span>
                <span>Completed: {completedCount} / {TOTAL_LEVELS}</span>
              </div>
              <div className="achievements-list">
                {ACHIEVEMENT_ROWS.map(row => {
                  const unlocked = row.isUnlocked(achievementContext)
                  return (
                    <div
                      key={row.id}
                      className={`achievement-row achievement-row--${row.id} ${unlocked ? 'achievement-row--unlocked' : 'achievement-row--locked'}`}
                    >
                      <span className={`achievement-row__icon ${row.medal ? `achievement-row__icon--medal achievement-row__icon--${row.medal}` : ''}`} aria-hidden="true">
                        {row.medal ? (
                          <span className={`achievement-medal achievement-medal--${row.medal}`}>
                            <span className="achievement-medal__ribbon" />
                            <span className="achievement-medal__disc" />
                          </span>
                        ) : row.icon}
                      </span>
                      <span className="achievement-row__copy">
                        <strong>{row.title}</strong>
                        <span>{row.description}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </MenuModal>
          )}
          {modal === 'language' && (
            <MenuModal title={COPY.languageTitle} onClose={() => setModal(null)}>
              <div className="language-options" role="listbox" aria-label={COPY.languageTitle}>
                <div className="language-option language-option--selected" role="option" aria-selected="true">{COPY.english}</div>
                <div className="language-option" role="option" aria-selected="false">{COPY.arabic}</div>
              </div>
            </MenuModal>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  )
}
