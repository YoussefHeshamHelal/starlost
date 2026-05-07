import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { isValidParticipantId } from '../utils/participants'
import MenuSoundIcon from './MenuSoundIcon'
import './menuScreens.css'

const COPY = {
  tagline: 'Lost in space. Guided by you.',
  startGame: 'Start Game',
  continue: 'Continue',
  achievements: 'Achievements',
  language: 'Language',
  aboutTitle: 'About STARLOST',
  aboutBody: 'STARLOST is a child-friendly space adventure where you help LUMA collect missing ship fragments, repair her ship, and get home.',
  aboutThesis: 'Made for a bachelor thesis project about spatial perspective-taking and computational thinking.',
  achievementsTitle: 'Achievements',
  achievementsBody: 'Badges are coming soon.',
  languageTitle: 'Language',
  close: 'Close',
  english: 'English',
  arabic: 'Arabic',
}

function readMuted() {
  if (typeof window === 'undefined') return false
  return window.localStorage?.getItem('starlost:muted') === 'true'
}

function readSavedMissionCode() {
  if (typeof window === 'undefined') return ''
  const savedCode = window.localStorage?.getItem('starlost:participantId') || ''
  if (isValidParticipantId(savedCode)) return savedCode
  if (savedCode) window.localStorage?.removeItem('starlost:participantId')
  return ''
}

function MenuModal({ title, children, onClose }) {
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

export default function StartPage({ onStart, onContinue }) {
  const [modal, setModal] = useState(null)
  const [muted, setMuted] = useState(readMuted)
  const [savedMissionCode] = useState(readSavedMissionCode)
  const canContinue = Boolean(savedMissionCode)

  const toggleMuted = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      window.localStorage?.setItem('starlost:muted', String(next))
      return next
    })
  }, [])

  return (
    <motion.main
      className="starlost-menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
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
          onClick={toggleMuted}
          whileHover={{ y: -3, scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
        >
          <MenuSoundIcon />
        </motion.button>

        <div className={`start-actions ${canContinue ? 'start-actions--returning' : ''}`}>
          <motion.button
            type="button"
            className="menu-pill-button"
            onClick={onStart}
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
              onClick={onContinue}
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
            </MenuModal>
          )}
          {modal === 'achievements' && (
            <MenuModal title={COPY.achievementsTitle} onClose={() => setModal(null)}>
              <p>{COPY.achievementsBody}</p>
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
