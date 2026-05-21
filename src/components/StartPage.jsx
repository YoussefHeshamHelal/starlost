import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { isValidParticipantId } from '../utils/participants'
import { MEDAL_RANKS, TOTAL_LEVELS } from '../utils/progress'
import MenuSoundIcon from './MenuSoundIcon'
import './menuScreens.css'

const ACHIEVEMENT_ROWS = [
  {
    id: 'first-mission',
    key: 'firstMission',
    icon: '\u{1f680}',
    isUnlocked: ({ completedCount }) => completedCount >= 1,
  },
  {
    id: 'gold-explorer',
    key: 'goldExplorer',
    icon: '\u{1f947}',
    isUnlocked: ({ medalValues }) => medalValues.some(medal => medal === 'gold'),
  },
  {
    id: 'rising-star',
    key: 'risingStar',
    icon: '\u2728',
    isUnlocked: ({ completedCount }) => completedCount >= 5,
  },
  {
    id: 'space-navigator',
    key: 'spaceNavigator',
    icon: '\u{1f9ed}',
    isUnlocked: ({ completedCount }) => completedCount >= 10,
  },
  {
    id: 'deep-explorer',
    key: 'deepExplorer',
    icon: '\u{1fa90}',
    isUnlocked: ({ completedCount }) => completedCount >= TOTAL_LEVELS,
  },
  {
    id: 'bronze-master',
    key: 'bronzeMaster',
    icon: '',
    medal: 'bronze',
    isUnlocked: ({ medalValues }) => medalValues.length >= TOTAL_LEVELS,
  },
  {
    id: 'silver-master',
    key: 'silverMaster',
    icon: '',
    medal: 'silver',
    isUnlocked: ({ medalValues }) => medalValues.length >= TOTAL_LEVELS && medalValues.every(medal => (MEDAL_RANKS[medal] ?? 0) >= MEDAL_RANKS.silver),
  },
  {
    id: 'gold-master',
    key: 'goldMaster',
    icon: '',
    medal: 'gold',
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

function MenuModal({ title, children, onClose, closeLabel, className = '' }) {
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
          {closeLabel}
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
  const { t, i18n } = useTranslation()
  const [modal, setModal] = useState(null)
  const [savedMissionCode] = useState(readSavedMissionCode)
  const currentLanguage = i18n.resolvedLanguage || i18n.language || 'en'
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
      aria-label={t('start.ariaLabel')}
    >
      <img className="starlost-menu__bg" src="/assets/ui/start-page-bg.png" alt="" />
      <div className="starlost-menu__stage">
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

        <motion.button
          type="button"
          className={`menu-icon-button menu-icon-button--right ${muted ? 'menu-icon-button--muted' : ''}`}
          aria-label={muted ? t('common.unmuteMusic') : t('common.muteMusic')}
          title={muted ? t('common.unmuteMusic') : t('common.muteMusic')}
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
            {t('start.startGame')}
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
              {t('start.continue')}
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
            {t('start.achievements')}
          </motion.button>
          <motion.button
            type="button"
            className="menu-pill-button menu-pill-button--secondary"
            onClick={() => setModal('language')}
            whileHover={{ y: -4, scale: 1.012 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="button-symbol" aria-hidden="true">{'\u{1f30d}'}</span>
            {t('start.language')}
          </motion.button>
        </div>

        <AnimatePresence>
          {modal === 'about' && (
            <MenuModal title={t('common.aboutStarlost')} closeLabel={t('common.close')} onClose={() => setModal(null)}>
              <p>{t('start.aboutBody')}</p>
              <p>{t('start.aboutThesis')}</p>
              <p>{t('start.aboutCredit')}</p>
            </MenuModal>
          )}
          {modal === 'achievements' && (
            <MenuModal title={t('start.achievementsTitle')} closeLabel={t('common.close')} onClose={() => setModal(null)} className="achievements-modal">
              <div className="achievements-summary" aria-label={t('start.achievementTotals')}>
                <span>{t('common.gold')}: {achievementTotals.gold ?? 0}</span>
                <span>{t('common.silver')}: {achievementTotals.silver ?? 0}</span>
                <span>{t('common.bronze')}: {achievementTotals.bronze ?? 0}</span>
                <span>{t('common.completed', { completedCount, totalLevels: TOTAL_LEVELS })}</span>
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
                        <strong>{t(`start.achievementsList.${row.key}.title`)}</strong>
                        <span>{t(`start.achievementsList.${row.key}.description`)}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </MenuModal>
          )}
          {modal === 'language' && (
            <MenuModal title={t('start.language')} closeLabel={t('common.close')} onClose={() => setModal(null)}>
              <div className="language-options" role="listbox" aria-label={t('start.language')}>
                <button
                  type="button"
                  className={`language-option ${currentLanguage === 'en' ? 'language-option--selected' : ''}`}
                  role="option"
                  aria-selected={currentLanguage === 'en'}
                  onClick={() => i18n.changeLanguage('en')}
                >
                  {t('common.languageEnglish')}
                </button>
                <button
                  type="button"
                  className={`language-option ${currentLanguage === 'de' ? 'language-option--selected' : ''}`}
                  role="option"
                  aria-selected={currentLanguage === 'de'}
                  onClick={() => i18n.changeLanguage('de')}
                >
                  {t('common.languageGerman')}
                </button>
              </div>
            </MenuModal>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  )
}
