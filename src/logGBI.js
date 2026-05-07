// src/logGBI.js
import { db } from './firebase'
import { serverTimestamp, doc, setDoc } from 'firebase/firestore'

/**
 * Logs one GBI snapshot for a participant at the correct Firestore path:
 *   participants/{participantId}/sessions/{sessionId}/levels/{levelId}
 *
 * Called TWICE per level that has a strategy card:
 *   1. On level completion (from LevelScreen)           — logs all numeric GBIs.
 *   2. On strategy card confirm (from StrategyCardScreen) — logs { strategyCard }.
 *
 * For levels without a strategy card, called once with the full snapshot.
 *
 * @param {string} participantId  - Unique 4-digit mission code, e.g. "4827"
 * @param {number} levelId        - Level number (1, 2, 3…)
 * @param {object} gbiData        - Either getGBISnapshot() result OR { strategyCard: '...' }
 * @param {string} [sessionId]    - Optional session label; defaults to "session_1"
 */
export async function logGBI(participantId, levelId, gbiData, sessionId = 'session_1') {
  if (!participantId || !levelId || !gbiData) {
    console.warn('[GBI] logGBI called with missing arguments — skipping.')
    return
  }

  // Path matches your Firestore rules exactly:
  // participants/{participantId}/sessions/{sessionId}/levels/{levelId}
  const levelDocRef = doc(
    db,
    'participants', String(participantId),
    'sessions',     String(sessionId),
    'levels',       String(levelId)
  )

  // Firestore rejects undefined values — strip them all out before writing.
  const rawPayload = {
    participantId,
    levelId,
    sessionId,
    timestamp: serverTimestamp(),
    ...gbiData,
  }
  const payload = Object.fromEntries(
    Object.entries(rawPayload).filter(([, v]) => v !== undefined)
  )

  try {
    // setDoc with merge:true so a second call (strategyCard log) adds to the
    // same document rather than overwriting the numeric GBIs already logged.
    await setDoc(levelDocRef, payload, { merge: true })
    console.log(
      `[GBI] ✅ Logged — participants/${participantId}/sessions/${sessionId}/levels/${levelId}`,
      payload
    )
  } catch (err) {
    console.error('[GBI] ❌ Failed to write to Firestore:', err)
  }
}
