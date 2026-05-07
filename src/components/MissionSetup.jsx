import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  MissionCodeAlreadyUsedError,
  createOrUpdateParticipant,
  isValidParticipantId,
  sanitizeParticipantId,
} from '../utils/participants'
import MenuSoundIcon from './MenuSoundIcon'
import './menuScreens.css'

const COPY = {
  heading: 'MISSION CONTROL',
  speech: 'What’s your mission code, commander?',
  missionCode: 'Mission Code',
  beginMission: 'Begin Mission',
  saving: 'Saving...',
  helper: 'Enter a 4 digit mission code',
  back: 'Back',
  status: 'MISSION READY',
  invalid: 'Enter exactly 4 digits.',
  duplicate: 'This mission code is already used. Please ask for a new code.',
  saveError: 'Mission Control could not save this code. Please try again.',
}

export default function MissionSetup({ onBack, onComplete }) {
  const [missionCode, setMissionCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [muted, setMuted] = useState(() => window.localStorage?.getItem('starlost:muted') === 'true')

  const toggleMuted = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      window.localStorage?.setItem('starlost:muted', String(next))
      return next
    })
  }, [])

  const submitMissionCode = useCallback(async () => {
    const cleanedMissionCode = sanitizeParticipantId(missionCode)
    if (!isValidParticipantId(cleanedMissionCode)) {
      setError(COPY.invalid)
      return
    }

    setLoading(true)
    setError('')
    try {
      await createOrUpdateParticipant(cleanedMissionCode)
      window.localStorage?.setItem('starlost:participantId', cleanedMissionCode)
      onComplete(cleanedMissionCode)
    } catch (err) {
      console.error('[MissionSetup] Failed to create mission code:', {
        code: err?.code,
        message: err?.message,
        stack: err?.stack,
        error: err,
      })
      setError(err instanceof MissionCodeAlreadyUsedError ? COPY.duplicate : COPY.saveError)
    } finally {
      setLoading(false)
    }
  }, [missionCode, onComplete])

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') submitMissionCode()
  }, [submitMissionCode])

  const handleBeforeInput = useCallback((event) => {
    if (!event.data) return
    if (!/^\d+$/.test(event.data) || missionCode.length >= 4) {
      event.preventDefault()
    }
  }, [missionCode])

  const handlePaste = useCallback((event) => {
    event.preventDefault()
    setMissionCode(sanitizeParticipantId(event.clipboardData.getData('text')))
  }, [])

  return (
    <motion.main
      className="starlost-menu"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      aria-label="Mission setup"
    >
      <img className="starlost-menu__bg" src="/assets/ui/mission-control-bg.png" alt="" />
      <div className="starlost-menu__stage">
        <motion.button
          type="button"
          className="menu-icon-button menu-icon-button--left"
          aria-label="About STARLOST"
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

        <p className="mission-bubble">{COPY.speech}</p>
        <div className="mission-status">{COPY.status}</div>

        <div className="mission-form">
          <label className="mission-label" htmlFor="mission-code-input">{COPY.missionCode}</label>
          <input
            id="mission-code-input"
            className="mission-input"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={missionCode}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            onChange={(event) => setMissionCode(sanitizeParticipantId(event.target.value))}
            onBeforeInput={handleBeforeInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-invalid={Boolean(error)}
            aria-describedby="mission-code-feedback"
          />
          <motion.button
            type="button"
            className="mission-primary-button"
            onClick={submitMissionCode}
            disabled={loading}
            whileHover={loading ? undefined : { y: -4, scale: 1.015 }}
            whileTap={loading ? undefined : { scale: 0.96 }}
          >
            <span className="button-symbol" aria-hidden="true">🚀</span>
            <span className="mission-primary-button__text">{loading ? COPY.saving : COPY.beginMission}</span>
          </motion.button>
          <p id="mission-code-feedback" className={error ? 'mission-error' : 'mission-note'}>
            {error || COPY.helper}
          </p>
        </div>

        <motion.button
          type="button"
          className="menu-back-button menu-back-button--outer"
          onClick={onBack}
          whileHover={{ x: -4, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          ← {COPY.back}
        </motion.button>
      </div>
    </motion.main>
  )
}
