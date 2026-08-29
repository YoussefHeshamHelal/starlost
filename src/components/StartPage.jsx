import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import MenuSoundIcon from './MenuSoundIcon'
import './menuScreens.css'

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
}) {
  const { t, i18n } = useTranslation()
  const [modal, setModal] = useState(null)
  const currentLanguage = i18n.resolvedLanguage || i18n.language || 'en'

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
        {/* TEMP: About button hidden temporarily. Uncomment this block to restore it later. */}
        {/* <motion.button
          type="button"
          className="menu-icon-button menu-icon-button--left"
          aria-label={t('common.aboutStarlost')}
          onClick={() => setModal('about')}
          whileHover={{ y: -3, scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
        >
          <span className="menu-icon-button__info">i</span>
        </motion.button> */}

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

        <div className="start-actions">
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
