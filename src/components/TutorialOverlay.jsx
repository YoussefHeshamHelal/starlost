import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { THEMES, useTheme } from '../context/theme'

const VIEWPORT_MARGIN = 18
const FOCUS_PADDING = 10

function getTargetElement(targetId) {
  if (!targetId) return null
  return document.querySelector(`[data-tutorial-id="${targetId}"]`)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getBubblePosition(rect, placement, bubbleRect, offsetX = 0, offsetY = 0) {
  const bubbleWidth = bubbleRect?.width ?? 320
  const bubbleHeight = bubbleRect?.height ?? 220
  const gap = 22

  if (!rect || placement === 'center') {
    return {
      top: window.innerHeight / 2 - bubbleHeight / 2,
      left: window.innerWidth / 2 - bubbleWidth / 2,
      arrowPlacement: 'center',
    }
  }

  let top = rect.top + rect.height / 2 - bubbleHeight / 2
  let left = rect.left + rect.width / 2 - bubbleWidth / 2
  let arrowPlacement = placement

  if (placement === 'top') {
    top = rect.top - bubbleHeight - gap
  } else if (placement === 'bottom') {
    top = rect.bottom + gap
  } else if (placement === 'left') {
    left = rect.left - bubbleWidth - gap
  } else if (placement === 'right') {
    left = rect.right + gap
  }

  top += offsetY
  left += offsetX

  top = clamp(top, VIEWPORT_MARGIN, window.innerHeight - bubbleHeight - VIEWPORT_MARGIN)
  left = clamp(left, VIEWPORT_MARGIN, window.innerWidth - bubbleWidth - VIEWPORT_MARGIN)

  return { top, left, arrowPlacement }
}

function BubbleArrow({ placement, color, style }) {
  if (placement === 'center') return null
  const rotation = {
    top: 'rotate(45deg)',
    bottom: 'rotate(45deg)',
    left: 'rotate(45deg)',
    right: 'rotate(45deg)',
  }[placement]

  return (
    <div
      style={{
        position: 'absolute',
        width: 16,
        height: 16,
        background: color,
        borderRadius: 4,
        transform: rotation,
        ...style,
      }}
    />
  )
}

export default function TutorialOverlay({
  step,
  stepIndex,
  totalSteps,
  onBack,
  onNext,
  onSkip,
  canGoBack,
}) {
  const theme = useTheme()
  const t = THEMES[theme]
  const bubbleRef = useRef(null)
  const [targetRect, setTargetRect] = useState(null)
  const [bubbleRect, setBubbleRect] = useState(null)

  useLayoutEffect(() => {
    if (!step) return undefined

    const updateRects = () => {
      const target = getTargetElement(step.targetId)
      const nextTargetRect = target ? target.getBoundingClientRect() : null
      const nextBubbleRect = bubbleRef.current?.getBoundingClientRect() ?? null
      setTargetRect(nextTargetRect)
      setBubbleRect(nextBubbleRect)
    }

    updateRects()
    window.addEventListener('resize', updateRects)
    window.addEventListener('scroll', updateRects, true)

    const target = getTargetElement(step.targetId)
    const observer = target ? new ResizeObserver(updateRects) : null
    if (target && observer) observer.observe(target)

    return () => {
      window.removeEventListener('resize', updateRects)
      window.removeEventListener('scroll', updateRects, true)
      observer?.disconnect()
    }
  }, [step])

  useLayoutEffect(() => {
    if (!bubbleRef.current) return
    setBubbleRect(bubbleRef.current.getBoundingClientRect())
  }, [step, targetRect])

  const bubblePosition = useMemo(
    () => getBubblePosition(
      targetRect,
      step?.placement ?? 'center',
      bubbleRect,
      step?.offsetX ?? 0,
      step?.offsetY ?? 0
    ),
    [bubbleRect, step, targetRect]
  )

  if (!step) return null

  const spotlight = targetRect
    ? {
        top: targetRect.top - FOCUS_PADDING,
        left: targetRect.left - FOCUS_PADDING,
        width: targetRect.width + FOCUS_PADDING * 2,
        height: targetRect.height + FOCUS_PADDING * 2,
      }
    : null

  if (step.waitForTarget && !targetRect) return null

  return (
    <AnimatePresence>
      <motion.div
        key={step.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        style={{ position: 'fixed', inset: 0, zIndex: 120, pointerEvents: 'none' }}
      >
        {spotlight && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            style={{
              position: 'fixed',
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              borderRadius: 18,
              border: `2px solid ${t.tutorialFocus}`,
              background: t.tutorialFocusGlow,
              boxShadow: `0 0 0 9999px ${t.tutorialScrim}, 0 0 0 8px ${t.tutorialHalo}, 0 0 28px ${t.tutorialHalo}`,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.035, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: -6,
                borderRadius: 24,
                border: `2px solid ${t.tutorialPulse}`,
              }}
            />
          </motion.div>
        )}

        <motion.div
          ref={bubbleRef}
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          style={{
            position: 'fixed',
            top: bubblePosition.top,
            left: bubblePosition.left,
            width: 'min(360px, calc(100vw - 32px))',
            background: t.tutorialBubbleBg,
            border: `2px solid ${t.tutorialBubbleBorder}`,
            borderRadius: 22,
            boxShadow: t.tutorialBubbleShadow,
            padding: '18px 18px 16px',
            color: t.tutorialText,
            pointerEvents: 'auto',
          }}
        >
          <BubbleArrow
            placement={bubblePosition.arrowPlacement}
            color={t.tutorialBubbleBg}
            style={{
              top: bubblePosition.arrowPlacement === 'bottom' ? -8 : bubblePosition.arrowPlacement === 'top' ? 'auto' : '50%',
              bottom: bubblePosition.arrowPlacement === 'top' ? -8 : 'auto',
              left: bubblePosition.arrowPlacement === 'right' ? -8 : bubblePosition.arrowPlacement === 'left' ? 'auto' : 28,
              right: bubblePosition.arrowPlacement === 'left' ? -8 : 'auto',
              marginTop: bubblePosition.arrowPlacement === 'left' || bubblePosition.arrowPlacement === 'right' ? -8 : 0,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                flexShrink: 0,
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: t.tutorialMascotBg,
                border: `2px solid ${t.tutorialMascotBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                boxShadow: `0 10px 24px ${t.tutorialHalo}`,
              }}
            >
              🤖
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {!step.hideProgress && totalSteps > 1 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: t.tutorialStepPillBg,
                    border: `1px solid ${t.tutorialStepPillBorder}`,
                    fontSize: 10,
                    fontFamily: 'monospace',
                    letterSpacing: 1.5,
                    fontWeight: 800,
                    marginBottom: 10,
                  }}
                >
                  STEP {stepIndex + 1} / {totalSteps}
                </div>
              )}
              <h3
                style={{
                  fontSize: 20,
                  lineHeight: 1.1,
                  margin: '0 0 8px 0',
                  fontWeight: 900,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.5,
                  margin: 0,
                  color: t.tutorialTextSoft,
                  fontWeight: 600,
                }}
              >
                {step.body}
              </p>
            </div>
          </div>

          {step.requiresAction && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 14,
                background: t.tutorialActionBg,
                border: `1px solid ${t.tutorialActionBorder}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>👉</span>
              <span
                style={{
                  fontSize: 13,
                  lineHeight: 1.35,
                  color: t.tutorialActionText,
                  fontWeight: 800,
                }}
              >
                Do this now: {step.actionLabel}
              </span>
            </div>
          )}

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <button
              onClick={onSkip}
              style={{
                border: 'none',
                background: 'transparent',
                color: t.tutorialSkip,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              Skip Tutorial
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={onBack}
                disabled={!canGoBack}
                style={{
                  minWidth: 88,
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: `1.5px solid ${canGoBack ? t.tutorialSecondaryBorder : t.tutorialSecondaryDisabled}`,
                  background: t.tutorialSecondaryBg,
                  color: canGoBack ? t.tutorialSecondaryText : t.tutorialSecondaryDisabled,
                  cursor: canGoBack ? 'pointer' : 'not-allowed',
                  fontWeight: 800,
                }}
              >
                Back
              </button>

              {!step.requiresAction && (
                <button
                  onClick={onNext}
                  style={{
                    minWidth: 96,
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: `1.5px solid ${t.tutorialPrimaryBorder}`,
                    background: t.tutorialPrimaryBg,
                    color: t.tutorialPrimaryText,
                    cursor: 'pointer',
                    fontWeight: 900,
                  }}
                >
                  {step.nextLabel ?? (stepIndex === totalSteps - 1 ? 'Done' : 'Next')}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
