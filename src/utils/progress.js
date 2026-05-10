import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export const TOTAL_LEVELS = 21

export function normalizeCompletedLevels(completedLevels) {
  if (!Array.isArray(completedLevels)) return []
  return [...new Set(
    completedLevels
      .map(level => Number(level))
      .filter(level => Number.isInteger(level) && level >= 1 && level <= TOTAL_LEVELS)
  )].sort((a, b) => a - b)
}

export function getUnlockedLevel(completedLevels) {
  const completedSet = new Set(normalizeCompletedLevels(completedLevels))
  let level = 1
  while (level <= TOTAL_LEVELS && completedSet.has(level)) level += 1
  return Math.min(level, TOTAL_LEVELS)
}

export function isLevelCompleted(levelId, completedLevels) {
  return normalizeCompletedLevels(completedLevels).includes(Number(levelId))
}

export function isLevelUnlocked(levelId, completedLevels) {
  const level = Number(levelId)
  return isLevelCompleted(level, completedLevels) || level <= getUnlockedLevel(completedLevels)
}

export async function fetchSessionProgress(participantId) {
  if (!participantId) {
    return {
      completedLevels: [],
      unlockedLevel: 1,
    }
  }

  const sessionRef = doc(db, 'participants', participantId, 'sessions', 'session_1')
  const sessionSnap = await getDoc(sessionRef)
  if (!sessionSnap.exists()) {
    return {
      completedLevels: [],
      unlockedLevel: 1,
    }
  }

  const data = sessionSnap.data()
  const completedLevels = normalizeCompletedLevels(data.completedLevels)
  return {
    completedLevels,
    unlockedLevel: data.progress?.unlockedLevel ?? getUnlockedLevel(completedLevels),
  }
}

export async function updateSessionProgress(participantId, completedLevelId, knownCompletedLevels = []) {
  const sessionRef = doc(db, 'participants', participantId, 'sessions', 'session_1')
  let existingLevels = normalizeCompletedLevels(knownCompletedLevels)
  try {
    const sessionSnap = await getDoc(sessionRef)
    if (sessionSnap.exists()) {
      existingLevels = normalizeCompletedLevels(sessionSnap.data().completedLevels)
    }
  } catch (err) {
    console.warn('[Progress] Could not read existing progress; using local progress state.', err)
  }
  const completedLevels = normalizeCompletedLevels([...existingLevels, completedLevelId])
  const unlockedLevel = getUnlockedLevel(completedLevels)

  await setDoc(sessionRef, {
    participantId,
    sessionId: 'session_1',
    lastActiveAt: serverTimestamp(),
    completedLevels,
    currentLevel: unlockedLevel,
    progress: {
      completedCount: completedLevels.length,
      unlockedLevel,
    },
  }, { merge: true })

  return {
    completedLevels,
    unlockedLevel,
  }
}
