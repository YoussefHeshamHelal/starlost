import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  MissionCodeAlreadyUsedError,
  createOrUpdateParticipant,
  isValidParticipantId,
  sanitizeParticipantId,
} from '../utils/participants'
import MenuSoundIcon from './MenuSoundIcon'
import './menuScreens.css'


const LETTER_FIELDS = [
  { id: 'firstInitial', badge: '1', icon: 'person', labelKey: 'mission.fields.firstInitial' },
  { id: 'secondInitial', badge: '2', icon: 'person', labelKey: 'mission.fields.secondInitial' },
  { id: 'colorInitial', badge: '3', icon: 'palette', labelKey: 'mission.fields.colorInitial' },
  { id: 'animalInitial', badge: '4', icon: 'paw', labelKey: 'mission.fields.animalInitial' },
]

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

function normalizeLetter(value) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1)
}

function RowIcon({ type }) {
  if (type === 'palette') {
    return (
      <svg className="star-code-row__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.4c-5 0-8.7 3.1-8.7 7.6 0 4.1 3.1 7.6 7 7.6h1.5c.8 0 1.3-.5 1.3-1.2 0-.4-.1-.7-.3-1-.2-.3-.3-.6-.3-1 0-.9.7-1.5 1.6-1.5h1.5c3 0 5.1-2.1 5.1-5 0-3.1-3.1-5.5-8.7-5.5Z" />
        <circle cx="7.9" cy="10.2" r="1.2" />
        <circle cx="10.2" cy="7.3" r="1.1" />
        <circle cx="14.1" cy="7.6" r="1.1" />
        <circle cx="16.4" cy="10.4" r="1.1" />
        <circle cx="10" cy="13.3" r="1" />
      </svg>
    )
  }

  if (type === 'paw') {
    return (
      <svg className="star-code-row__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="7.2" cy="8.7" r="2.1" />
        <circle cx="11.8" cy="6.8" r="2.1" />
        <circle cx="16.4" cy="8.7" r="2.1" />
        <circle cx="18.6" cy="13.1" r="1.9" />
        <path d="M7 16.3c0-2.6 2.2-5 4.9-5s4.9 2.4 4.9 5c0 2.3-1.3 3.6-3 3.6-.8 0-1.3-.3-1.9-.3s-1.1.3-1.9.3c-1.7 0-3-1.3-3-3.6Z" />
      </svg>
    )
  }

  if (type === 'hash') {
    return <span className="star-code-row__icon star-code-row__icon--text" aria-hidden="true">#</span>
  }

  return (
    <svg className="star-code-row__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="7.4" r="3.6" />
      <path d="M5.3 20.2c.7-4 3.1-6.2 6.7-6.2s6 2.2 6.7 6.2H5.3Z" />
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

export default function MissionSetup({ muted = false, onToggleMuted, onUnlockAudio, onBack, onComplete }) {
  const { t } = useTranslation()
  const [letters, setLetters] = useState(['', '', '', ''])
  const [selectedDigit, setSelectedDigit] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const inputRefs = useRef([])

  const starCode = useMemo(
    () => sanitizeParticipantId(`${letters.join('')}${selectedDigit}`),
    [letters, selectedDigit]
  )
  const codePreview = useMemo(
    () => [...letters, selectedDigit].map(value => value || '_'),
    [letters, selectedDigit]
  )

  const focusNextEmpty = useCallback(() => {
    const nextIndex = letters.findIndex(letter => !letter)
    if (nextIndex >= 0) {
      inputRefs.current[nextIndex]?.focus()
      return true
    }
    return false
  }, [letters])

  const submitStarCode = useCallback(async () => {
    onUnlockAudio?.()

    if (!isValidParticipantId(starCode)) {
      setError(t('mission.invalid'))
      focusNextEmpty()
      return
    }

    setLoading(true)
    setError('')
    try {
      await createOrUpdateParticipant(starCode)
      window.localStorage?.setItem('starlost:participantId', starCode)
      onComplete(starCode)
    } catch (err) {
      console.error('[MissionSetup] Failed to create STARLOST code:', {
        code: err?.code,
        message: err?.message,
        stack: err?.stack,
        error: err,
      })
      setError(err instanceof MissionCodeAlreadyUsedError ? t('mission.duplicate') : t('mission.saveError'))
    } finally {
      setLoading(false)
    }
  }, [focusNextEmpty, onComplete, onUnlockAudio, starCode, t])

  const updateLetter = useCallback((index, value) => {
    const nextLetter = normalizeLetter(value)
    setLetters(prev => {
      const next = [...prev]
      next[index] = nextLetter
      return next
    })
    setError('')
    if (nextLetter && index < LETTER_FIELDS.length - 1) {
      window.requestAnimationFrame(() => inputRefs.current[index + 1]?.focus())
    }
  }, [])

  const handleLetterKeyDown = useCallback((event, index) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    if (isValidParticipantId(starCode)) {
      submitStarCode()
      return
    }
    if (index < LETTER_FIELDS.length - 1) inputRefs.current[index + 1]?.focus()
  }, [starCode, submitStarCode])

  const handleLetterPaste = useCallback((event, index) => {
    event.preventDefault()
    updateLetter(index, event.clipboardData.getData('text'))
  }, [updateLetter])

  const handleDigitSelect = useCallback((digit) => {
    setSelectedDigit(digit)
    setError('')
  }, [])

  return (
    <motion.main
      className="starlost-menu"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      aria-label={t('mission.ariaLabel')}
    >
      <img className="starlost-menu__bg" src="/assets/ui/star-code-station-bg.png" alt="" />
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

        <p className="star-code-bubble">
          {t('mission.speechStart')}
          <br />
          <span className="star-code-bubble__accent">{t('mission.speechAccent')}</span> {t('mission.speechEnd')}
        </p>

        <form
          className="star-code-form"
          onSubmit={(event) => {
            event.preventDefault()
            submitStarCode()
          }}
        >
          {LETTER_FIELDS.map((field, index) => (
            <div className="star-code-row" key={field.id}>
              <span className="star-code-row__badge" aria-hidden="true">{field.badge}</span>
              <RowIcon type={field.icon} />
              <label className="star-code-row__label" htmlFor={`${field.id}-input`}>
                {t(field.labelKey)}
              </label>
              <input
                ref={(node) => {
                  inputRefs.current[index] = node
                }}
                id={`${field.id}-input`}
                className="star-code-letter-input"
                type="text"
                inputMode="text"
                maxLength={1}
                value={letters[index]}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
                disabled={loading}
                onChange={(event) => updateLetter(index, event.target.value)}
                onPaste={(event) => handleLetterPaste(event, index)}
                onKeyDown={(event) => handleLetterKeyDown(event, index)}
                aria-label={t(field.labelKey)}
                aria-invalid={Boolean(error)}
                aria-describedby="star-code-feedback"
              />
            </div>
          ))}

          <div className="star-code-row star-code-number-row">
            <span className="star-code-row__badge" aria-hidden="true">5</span>
            <RowIcon type="hash" />
            <span className="star-code-row__label" id="star-code-digit-label">
              {t('mission.pickDigit')}
            </span>
            <div className="star-code-digit-buttons" role="group" aria-labelledby="star-code-digit-label">
              {DIGITS.map(digit => (
                <button
                  key={digit}
                  type="button"
                  className={`star-code-digit-button ${selectedDigit === digit ? 'star-code-digit-button--selected' : ''}`}
                  onClick={() => handleDigitSelect(digit)}
                  disabled={loading}
                  aria-pressed={selectedDigit === digit}
                  aria-label={t('mission.pickNumber', { digit })}
                >
                  {digit}
                </button>
              ))}
            </div>
          </div>
        </form>

        <section className="star-code-preview" aria-live="polite">
          <div className="star-code-preview__label">
            <span aria-hidden="true">✦</span>
            {t('mission.preview')}
            <span aria-hidden="true">✦</span>
          </div>
          <div className="star-code-preview__box" aria-label={t('mission.currentCode', { code: codePreview.join(' ') })}>
            {codePreview.map((value, index) => (
              <span
                key={`${value}-${index}`}
                className={`star-code-preview__char ${value === '_' ? 'star-code-preview__char--empty' : ''}`}
                aria-hidden="true"
              >
                {value === '_' ? '' : value}
              </span>
            ))}
          </div>
        </section>

        <p id="star-code-feedback" className={error ? 'star-code-error' : 'star-code-note'}>
          {error || t('mission.helper')}
        </p>

        <motion.button
          type="button"
          className="star-code-primary-button"
          onClick={submitStarCode}
          disabled={loading}
          whileHover={loading ? undefined : { y: -4, scale: 1.015 }}
          whileTap={loading ? undefined : { scale: 0.96 }}
        >
          <span className="star-code-primary-button__icon" aria-hidden="true">{'\u2726'}</span>
          <span className="star-code-primary-button__text">{loading ? t('mission.saving') : t('mission.create')}</span>
        </motion.button>

        <motion.button
          type="button"
          className="menu-back-button menu-back-button--outer"
          onClick={onBack}
          whileHover={{ x: -2, scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
        >
          {'\u2190'} {t('common.back')}
        </motion.button>

        <AnimatePresence>
          {modal === 'about' && <MenuModal onClose={() => setModal(null)} />}
        </AnimatePresence>
      </div>
    </motion.main>
  )
}
