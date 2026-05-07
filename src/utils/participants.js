import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const MISSION_CODE_PATTERN = /^\d{4}$/

export function sanitizeParticipantId(rawId) {
  return String(rawId ?? '').replace(/\D/g, '').slice(0, 4)
}

export function isValidParticipantId(id) {
  return MISSION_CODE_PATTERN.test(String(id ?? ''))
}

export class MissionCodeAlreadyUsedError extends Error {
  constructor(missionCode) {
    super('This mission code is already used. Please ask for a new code.')
    this.name = 'MissionCodeAlreadyUsedError'
    this.code = 'mission-code/already-used'
    this.missionCode = missionCode
  }
}

export async function createOrUpdateParticipant(missionCode) {
  const participantRef = doc(db, 'participants', missionCode)
  const sessionRef = doc(db, 'participants', missionCode, 'sessions', 'session_1')
  const participantSnapshot = await getDoc(participantRef)

  if (participantSnapshot.exists()) {
    throw new MissionCodeAlreadyUsedError(missionCode)
  }

  await setDoc(participantRef, {
    participantId: missionCode,
    missionCode,
    game: 'STARLOST',
    source: 'mission-setup',
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  }, { merge: true })

  await setDoc(sessionRef, {
    participantId: missionCode,
    missionCode,
    sessionId: 'session_1',
    startedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    currentLevel: 1,
    completedLevels: [],
    progress: {
      completedCount: 0,
      unlockedLevel: 1,
    },
  }, { merge: true })
}

export async function touchParticipantSession(missionCode) {
  const participantRef = doc(db, 'participants', missionCode)
  const sessionRef = doc(db, 'participants', missionCode, 'sessions', 'session_1')

  await setDoc(participantRef, {
    participantId: missionCode,
    missionCode,
    game: 'STARLOST',
    lastActiveAt: serverTimestamp(),
  }, { merge: true })

  await setDoc(sessionRef, {
    participantId: missionCode,
    missionCode,
    sessionId: 'session_1',
    lastActiveAt: serverTimestamp(),
  }, { merge: true })
}
