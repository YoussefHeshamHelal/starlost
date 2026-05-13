import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export const TOTAL_LEVELS = 23
export const MEDAL_RANKS = {
  bronze: 1,
  silver: 2,
  gold: 3,
}

const EMPTY_ACHIEVEMENT_TOTALS = {
  gold: 0,
  silver: 0,
  bronze: 0,
}

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

export function isValidMedal(medal) {
  return Object.prototype.hasOwnProperty.call(MEDAL_RANKS, medal)
}

export function compareMedals(a, b) {
  return (MEDAL_RANKS[a] ?? 0) - (MEDAL_RANKS[b] ?? 0)
}

export function isBetterMedal(candidate, current) {
  return compareMedals(candidate, current) > 0
}

export function calculateMedal(usedBlocks, targetBlocks) {
  const blockCount = Number(usedBlocks)
  const target = Number(targetBlocks)

  if (!Number.isFinite(blockCount) || !Number.isFinite(target)) return null
  if (blockCount <= target) return 'gold'
  if (blockCount <= target + 2) return 'silver'
  return 'bronze'
}

export function normalizeMedalsByLevel(medalsByLevel) {
  if (!medalsByLevel || typeof medalsByLevel !== 'object' || Array.isArray(medalsByLevel)) return {}

  return Object.entries(medalsByLevel).reduce((normalized, [levelId, value]) => {
    const level = Number(levelId)
    if (!Number.isInteger(level) || level < 1 || level > TOTAL_LEVELS) return normalized
    if (!value || typeof value !== 'object' || !isValidMedal(value.medal)) return normalized

    const blockCount = Number(value.blockCount)
    const targetBlocks = Number(value.targetBlocks)
    const extraBlocks = Number(value.extraBlocks)

    normalized[String(level)] = {
      medal: value.medal,
      blockCount: Number.isFinite(blockCount) ? blockCount : null,
      targetBlocks: Number.isFinite(targetBlocks) ? targetBlocks : null,
      extraBlocks: Number.isFinite(extraBlocks) ? extraBlocks : null,
      updatedAt: value.updatedAt ?? null,
    }
    return normalized
  }, {})
}

export function getAchievementTotals(medalsByLevel) {
  return Object.values(normalizeMedalsByLevel(medalsByLevel)).reduce((totals, medalData) => {
    if (isValidMedal(medalData.medal)) totals[medalData.medal] += 1
    return totals
  }, { ...EMPTY_ACHIEVEMENT_TOTALS })
}

export async function fetchSessionProgress(participantId) {
  if (!participantId) {
    return {
      completedLevels: [],
      unlockedLevel: 1,
      medalsByLevel: {},
      achievementTotals: { ...EMPTY_ACHIEVEMENT_TOTALS },
    }
  }

  const sessionRef = doc(db, 'participants', participantId, 'sessions', 'session_1')
  const sessionSnap = await getDoc(sessionRef)
  if (!sessionSnap.exists()) {
    return {
      completedLevels: [],
      unlockedLevel: 1,
      medalsByLevel: {},
      achievementTotals: { ...EMPTY_ACHIEVEMENT_TOTALS },
    }
  }

  const data = sessionSnap.data()
  const completedLevels = normalizeCompletedLevels(data.completedLevels)
  const medalsByLevel = normalizeMedalsByLevel(data.achievements?.medalsByLevel)
  return {
    completedLevels,
    unlockedLevel: data.progress?.unlockedLevel ?? getUnlockedLevel(completedLevels),
    medalsByLevel,
    achievementTotals: getAchievementTotals(medalsByLevel),
  }
}

export async function updateSessionProgress(participantId, completedLevelId, knownCompletedLevels = [], achievementInfo = null) {
  const sessionRef = doc(db, 'participants', participantId, 'sessions', 'session_1')
  let existingLevels = normalizeCompletedLevels(knownCompletedLevels)
  let existingMedalsByLevel = {}
  try {
    const sessionSnap = await getDoc(sessionRef)
    if (sessionSnap.exists()) {
      const sessionData = sessionSnap.data()
      existingLevels = normalizeCompletedLevels(sessionData.completedLevels)
      existingMedalsByLevel = normalizeMedalsByLevel(sessionData.achievements?.medalsByLevel)
    }
  } catch (err) {
    console.warn('[Progress] Could not read existing progress; using local progress state.', err)
  }
  const completedLevels = normalizeCompletedLevels([...existingLevels, completedLevelId])
  const unlockedLevel = getUnlockedLevel(completedLevels)
  const medalsByLevel = { ...existingMedalsByLevel }
  const levelKey = String(Number(completedLevelId))
  const nextMedal = achievementInfo?.medal

  if (isValidMedal(nextMedal) && (!medalsByLevel[levelKey] || isBetterMedal(nextMedal, medalsByLevel[levelKey].medal))) {
    const blockCount = Number(achievementInfo.blockCount)
    const targetBlocks = Number(achievementInfo.targetBlocks)
    const extraBlocks = Number(achievementInfo.extraBlocks)

    medalsByLevel[levelKey] = {
      medal: nextMedal,
      blockCount: Number.isFinite(blockCount) ? blockCount : null,
      targetBlocks: Number.isFinite(targetBlocks) ? targetBlocks : null,
      extraBlocks: Number.isFinite(extraBlocks) ? extraBlocks : null,
      updatedAt: serverTimestamp(),
    }
  }

  const achievementTotals = getAchievementTotals(medalsByLevel)

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
    achievements: {
      medalsByLevel,
      totals: achievementTotals,
    },
  }, { merge: true })

  return {
    completedLevels,
    unlockedLevel,
    medalsByLevel: normalizeMedalsByLevel(medalsByLevel),
    achievementTotals,
  }
}
