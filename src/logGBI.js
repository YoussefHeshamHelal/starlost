// src/logGBI.js
import { db } from './firebase'
import { serverTimestamp, collection, addDoc } from 'firebase/firestore'

/**
 * Logs one GBI snapshot for a participant completing a level.
 *
 * @param {string} participantId  - A unique ID for the child (e.g. "child_01")
 * @param {number} levelId        - The level number (1, 2, 3…)
 * @param {object} gbiData        - The object returned by getGBISnapshot()
 * @param {string} [strategyCard] - Optional: the strategy card chosen ('embody'|'rotate'|'landmarks')
 */
export async function logGBI(participantId, levelId, gbiData, strategyCard = null) {
  const payload = {
    participantId,
    levelId,
    timestamp: serverTimestamp(),
    ...gbiData,
    ...(strategyCard ? { strategyCard } : {}),
  }

  try {
    await addDoc(collection(db, 'gbi_logs'), payload)
    console.log(`[GBI] Logged level ${levelId} for ${participantId}`)
  } catch (err) {
    console.error('[GBI] Failed to log:', err)
  }
}