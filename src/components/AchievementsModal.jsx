import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { MEDAL_RANKS, TOTAL_LEVELS } from '../utils/progress'

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

export default function AchievementsModal({
  completedLevels = [],
  medalsByLevel = {},
  achievementTotals = { gold: 0, silver: 0, bronze: 0 },
  onClose,
}) {
  const { t } = useTranslation()
  const completedCount = Array.isArray(completedLevels) ? completedLevels.length : 0
  const medalValues = Object.values(medalsByLevel ?? {})
    .map(value => value?.medal)
    .filter(medal => MEDAL_RANKS[medal])
  const achievementContext = { completedCount, medalValues }

  return (
    <motion.div
      className="menu-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="menu-modal achievements-modal"
        initial={{ y: 18, scale: 0.94 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 12, scale: 0.96 }}
      >
        <h2>{t('start.achievementsTitle')}</h2>
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
