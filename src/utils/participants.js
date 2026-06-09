import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const STAR_CODE_PATTERN = /^[A-Z]{4}\d$/

export function sanitizeParticipantId(rawId) {
  return String(rawId ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

export function isValidParticipantId(id) {
  return STAR_CODE_PATTERN.test(String(id ?? ''))
}

export class MissionCodeAlreadyUsedError extends Error {
  constructor(starCode) {
    super('This STARLOST code is already used. Please try another code.')
    this.name = 'MissionCodeAlreadyUsedError'
    this.code = 'mission-code/already-used'
    this.missionCode = starCode
    this.starCode = starCode
  }
}

export class MissionCodeNotFoundError extends Error {
  constructor(starCode) {
    super('This STARLOST code was not found. Please enter a code you already used before.')
    this.name = 'MissionCodeNotFoundError'
    this.code = 'mission-code/not-found'
    this.missionCode = starCode
    this.starCode = starCode
  }
}

export async function createOrUpdateParticipant(starCode) {
  const participantRef = doc(db, 'participants', starCode)
  const sessionRef = doc(db, 'participants', starCode, 'sessions', 'session_1')
  const participantSnapshot = await getDoc(participantRef)

  if (participantSnapshot.exists()) {
    throw new MissionCodeAlreadyUsedError(starCode)
  }

  await setDoc(participantRef, {
    participantId: starCode,
    game: 'STARLOST',
    source: 'star-code-station',
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  }, { merge: true })

  await setDoc(sessionRef, {
    participantId: starCode,
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

export async function loginExistingParticipant(rawStarCode) {
  const starCode = sanitizeParticipantId(rawStarCode)
  if (!isValidParticipantId(starCode)) {
    throw new MissionCodeNotFoundError(starCode)
  }

  const participantRef = doc(db, 'participants', starCode)
  const sessionRef = doc(db, 'participants', starCode, 'sessions', 'session_1')
  const [participantSnapshot, sessionSnapshot] = await Promise.all([
    getDoc(participantRef),
    getDoc(sessionRef),
  ])

  if (!participantSnapshot.exists() || !sessionSnapshot.exists()) {
    throw new MissionCodeNotFoundError(starCode)
  }

  await touchParticipantSession(starCode)
  return starCode
}

export async function touchParticipantSession(starCode) {
  const participantRef = doc(db, 'participants', starCode)
  const sessionRef = doc(db, 'participants', starCode, 'sessions', 'session_1')

  await setDoc(participantRef, {
    participantId: starCode,
    starCode: deleteField(),
    pseudonymCode: deleteField(),
    missionCode: deleteField(),
    game: 'STARLOST',
    source: 'star-code-station',
    lastActiveAt: serverTimestamp(),
  }, { merge: true })

  await setDoc(sessionRef, {
    participantId: starCode,
    starCode: deleteField(),
    pseudonymCode: deleteField(),
    missionCode: deleteField(),
    sessionId: 'session_1',
    lastActiveAt: serverTimestamp(),
  }, { merge: true })
}
