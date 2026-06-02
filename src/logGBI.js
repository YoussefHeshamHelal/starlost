import { db } from './firebase'
import { serverTimestamp, doc, setDoc } from 'firebase/firestore'

const ALLOWED_GBI_FIELDS = new Set([
  'participantId',
  'sessionId',
  'levelId',
  'levelName',
  'world',
  'levelType',
  'completed',
  'startedAtMs',
  'completedAtMs',
  'timeSpentMs',
  'runAttempts',
  'failedRunAttempts',
  'successOnFirstRun',
  'resetCount',
  'finalBlockCount',
  'targetBlockCount',
  'extraBlocks',
  'medal',
  'commandCounts',
  'usedRepeat',
  'usedIf',
  'usedIfElse',
  'usedNestedIfElse',
  'maxNestingDepth',
  'blockedPathErrors',
  'missingFragmentErrors',
  'wrongCollectAttempts',
  'outOfBoundsErrors',
  'identifyRequired',
  'identifyAttempts',
  'identifyWrongAttempts',
  'identifyCorrectOnFirstTry',
  'identifyTimeMs',
  'selectedFacingAnswers',
  'correctFacing',
  'visorFlipCount',
  'usedVisorBeforeCorrectIdentify',
  'radioReplayCount',
  'uncertainRadioLevel',
  'predictionAttempts',
  'predictionCorrect',
  'predictedTile',
  'actualEndTile',
  'traceTimeMs',
  'strategyCard',
  'timestamp',
])

function stripUndefinedDeep(value) {
  if (value === undefined) return undefined

  if (Array.isArray(value)) {
    return value
      .map(stripUndefinedDeep)
      .filter(item => item !== undefined)
  }

  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entryValue]) => [key, stripUndefinedDeep(entryValue)])
        .filter(([, entryValue]) => entryValue !== undefined)
    )
  }

  return value
}

function keepAllowedGBIFields(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => ALLOWED_GBI_FIELDS.has(key))
  )
}

export async function logGBI(participantId, levelId, gbiData, sessionId = 'session_1') {
  if (!participantId || !levelId || !gbiData) {
    console.warn('[GBI] Skipped write: missing participantId, levelId, or gbiData.', {
      participantId,
      levelId,
      hasGbiData: Boolean(gbiData),
    })
    return
  }

  const levelDocRef = doc(
    db,
    'participants', String(participantId),
    'sessions', String(sessionId),
    'levels', String(levelId)
  )

  const rawPayload = {
    participantId,
    levelId: Number(levelId),
    sessionId,
    timestamp: serverTimestamp(),
    ...gbiData,
  }
  const payload = stripUndefinedDeep(keepAllowedGBIFields(rawPayload))

  try {
    await setDoc(levelDocRef, payload, { merge: true })
    console.log(
      `[GBI] Wrote participants/${participantId}/sessions/${sessionId}/levels/${levelId}`,
      payload
    )
  } catch (err) {
    console.error(
      `[GBI] Failed to write participants/${participantId}/sessions/${sessionId}/levels/${levelId}`,
      err
    )
  }
}
