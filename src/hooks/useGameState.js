import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  generateLevel1Layout,
  generateLevel2Layout,
  generateLevel3Layout,
  generateLevel4Layout,
  generateLevel5Layout,
  generateLevel6Layout,
  generateLevel7Layout,
  generateLevel8Layout,
  generateLevel9Layout,
  generateLevel10Layout,
  generateLevel12Layout,
  generateLevel13Layout,
  generateLevel15Layout,
  generateLevel16Layout,
  generateLevel18Layout,
  generateLevel19Layout,
  generateLevel20Layout,
  generateLevel21Layout,
} from '../data/levels'
import { clampRepeatTimes, countProgramBlocks, hasEmptyRequiredElse, isIfPathCommand, isRepeatCommand } from '../utils/commands'

const DIRECTIONS = ['north', 'east', 'south', 'west']

const MOVE_DELTAS = {
  north: { x: 0, y: -1 },
  east:  { x: 1,  y: 0  },
  south: { x: 0,  y: 1  },
  west:  { x: -1, y: 0  },
}

const RELATIVE_LABEL = {
  front: 'in front of me',
  right: 'to my right',
  back:  'behind me',
  left:  'to my left',
}

function getRelativeDirection(luma, tile) {
  const dx = tile.x - luma.x
  const dy = tile.y - luma.y
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null

  let absDir
  if (dy === -1) absDir = 'north'
  else if (dy === 1) absDir = 'south'
  else if (dx === 1) absDir = 'east'
  else absDir = 'west'

  const facingIdx = DIRECTIONS.indexOf(luma.facing)
  const tileIdx   = DIRECTIONS.indexOf(absDir)
  const diff = (tileIdx - facingIdx + 4) % 4

  if (diff === 0) return 'front'
  if (diff === 1) return 'right'
  if (diff === 2) return 'back'
  if (diff === 3) return 'left'
  return null
}

// ── Level 2 uncertain radio messages ─────────────────────────────────────────
// These replace the normal clear message for Level 2 only.
// They introduce gentle doubt without being confusing.
const UNCERTAIN_RADIO_MESSAGES = [
  "Umm… I think there's a rock in front of me… or maybe to my side? Hard to tell…",
  "I'm not totally sure… but something feels close on my left? The signal's a bit fuzzy.",
  "Wait… is that a rock? I think I see something, but I can't tell exactly which way I'm facing.",
  "Hmm… I feel like something is blocking my path… I just can't tell from which direction.",
]

// Level 2 reaction messages when the child flips the visor
const VISOR_FLIP_REACTIONS = [
  "Ohhh! Now I can see it clearly! That helps so much!",
  "Yes! That's exactly what's in front of me! Good thinking!",
  "Thanks! This helps! Now I know exactly where I am!",
  "Wow, I can see everything now! You're really smart!",
]

function getRandomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getObstacleNoun(world) {
  if (world === 'forest-trail') return 'tree'
  if (world === 'repair-site' || world === 'launch-site') return 'box'
  return 'rock'
}

function getObstacleArticle(world) {
  if (world === 'forest-trail') return 'a tree'
  if (world === 'repair-site' || world === 'launch-site') return 'a box'
  return 'a rock'
}

function getGoalVisual(level) {
  return level.goalVisual ?? level.goalType ?? 'ship_core'
}

function isLaunchPadGoal(level) {
  return getGoalVisual(level) === 'launch_pad'
}

// ── Regular radio report builder ──────────────────────────────────────────────
function buildRadioReport(lumaPos, facing, walls = [], objects = [], goal, collectedIndices = new Set(), world = 'crash-site', includeOpener = false) {
  const lumaCtx = { x: lumaPos.x, y: lumaPos.y, facing }
  const priority = ['front', 'right', 'left', 'back']
  const opener = includeOpener ? "Can you see where I am? " : ''
  const obstacleNoun = getObstacleNoun(world)

  const adjacentWalls = walls.filter(w => getRelativeDirection(lumaCtx, w) !== null)
  if (adjacentWalls.length > 0) {
    const relDirs = adjacentWalls.map(w => getRelativeDirection(lumaCtx, w)).filter(Boolean)
    const chosen  = priority.find(p => relDirs.includes(p)) ?? relDirs[0]
    return `${opener}There is a ${obstacleNoun} ${RELATIVE_LABEL[chosen]}.`
  }

  const adjacentParts = objects.filter(
    (o, i) => o.type === 'ship_part' && !collectedIndices.has(i) && getRelativeDirection(lumaCtx, o) !== null
  )
  if (adjacentParts.length > 0) {
    const relDirs = adjacentParts.map(o => getRelativeDirection(lumaCtx, o)).filter(Boolean)
    const chosen  = priority.find(p => relDirs.includes(p)) ?? relDirs[0]
    return `${opener}I can sense a ship fragment ${RELATIVE_LABEL[chosen]}.`
  }

  if (goal) {
    const rel = getRelativeDirection(lumaCtx, goal)
    if (rel) return `${opener}I can detect the ship core ${RELATIVE_LABEL[rel]}!`
  }

  return `${opener}The path around me looks clear… but I can't tell which way I'm facing.`
}

// ── Level 2 uncertain radio builder ──────────────────────────────────────────
// Same info, but delivered with hesitation and slight uncertainty.
function buildUncertainRadioReport(lumaPos, facing, walls = [], objects = [], goal, collectedIndices = new Set(), world = 'crash-site') {
  const lumaCtx = { x: lumaPos.x, y: lumaPos.y, facing }
  const priority = ['front', 'right', 'left', 'back']
  const obstacleNoun = getObstacleNoun(world)

  const adjacentWalls = walls.filter(w => getRelativeDirection(lumaCtx, w) !== null)
  if (adjacentWalls.length > 0) {
    const relDirs = adjacentWalls.map(w => getRelativeDirection(lumaCtx, w)).filter(Boolean)
    const chosen  = priority.find(p => relDirs.includes(p)) ?? relDirs[0]
    const uncertainPhrases = {
      front: `Umm… I think there's a ${obstacleNoun} in front of me? I'm not totally sure…`,
      right: "I'm not totally sure… but I think something is on my right.",
      left:  `Wait… I think I sense a ${obstacleNoun} to my left? Hard to tell with all this dust.`,
      back:  "Something feels close behind me… but my sensors are a bit fuzzy.",
    }
    return uncertainPhrases[chosen] ?? getRandomFrom(UNCERTAIN_RADIO_MESSAGES)
  }

  const adjacentParts = objects.filter(
    (o, i) => o.type === 'ship_part' && !collectedIndices.has(i) && getRelativeDirection(lumaCtx, o) !== null
  )
  if (adjacentParts.length > 0) {
    const relDirs = adjacentParts.map(o => getRelativeDirection(lumaCtx, o)).filter(Boolean)
    const chosen  = priority.find(p => relDirs.includes(p)) ?? relDirs[0]
    const uncertainPartPhrases = {
      front: "I think… I can sense a ship piece in front of me? Maybe? The signal keeps breaking up.",
      right: "Hmm… something's on my right? It might be a ship fragment, I'm not sure.",
      left:  "Wait… is that a ship part to my left? I can barely tell from here.",
      back:  "Something's nearby… behind me? I can't quite figure it out.",
    }
    return uncertainPartPhrases[chosen] ?? getRandomFrom(UNCERTAIN_RADIO_MESSAGES)
  }

  if (goal) {
    const rel = getRelativeDirection(lumaCtx, goal)
    if (rel) return `I think… I can detect the ship core somewhere ${RELATIVE_LABEL[rel]}? The signal is weak though.`
  }

  return "Hmm… I can't tell which way I'm facing. My sensors are acting up. Can you help?"
}

// ── Old Level 9 / new Level 13 radio helpers ──────────────────────────────────
function buildLevel9UncertainRadioReport() {
  return "I sense a tree beside me, but my visor is blurry. It might be on my left or my right."
}

function buildLevel9IdentifyConfirmation(lumaPos, facing, walls = []) {
  const lumaCtx = { x: lumaPos.x, y: lumaPos.y, facing }
  const sideTree = walls
    .map(w => getRelativeDirection(lumaCtx, w))
    .find(rel => rel === 'left' || rel === 'right')

  if (sideTree) {
    return `Yes, that's right! The tree is on my ${sideTree}, the ship core is to my left, and the fragments are straight ahead.`
  }

  return "Yes, that's right! Now I know where the tree line is."
}

// ── Collection report ─────────────────────────────────────────────────────────
function buildCollectionReport(lumaPos, facing, walls = [], objects = [], goal, collectedIndices = new Set(), world = 'crash-site') {
  const opener = "Got it! I found a ship fragment!"
  const lumaCtx = { x: lumaPos.x, y: lumaPos.y, facing }
  const priority = ['front', 'right', 'left', 'back']
  const obstacleNoun = getObstacleNoun(world)

  const adjacentWalls = walls.filter(w => getRelativeDirection(lumaCtx, w) !== null)
  if (adjacentWalls.length > 0) {
    const relDirs = adjacentWalls.map(w => getRelativeDirection(lumaCtx, w)).filter(Boolean)
    const chosen  = priority.find(p => relDirs.includes(p)) ?? relDirs[0]
    return `${opener} There's a ${obstacleNoun} ${RELATIVE_LABEL[chosen]} from here.`
  }

  const remainingParts = objects.filter(
    (o, i) => o.type === 'ship_part' && !collectedIndices.has(i) && getRelativeDirection(lumaCtx, o) !== null
  )
  if (remainingParts.length > 0) {
    return `${opener} I can sense another fragment nearby — keep going!`
  }

  if (goal) {
    const rel = getRelativeDirection(lumaCtx, goal)
    if (rel) return `${opener} I can detect the ship core ${RELATIVE_LABEL[rel]}!`
  }

  return `${opener} The area looks clear. Guide me to the next fragment!`
}

// ── Blocked report ────────────────────────────────────────────────────────────
function buildBlockedReport(lumaPos, facing, blockedType, world = 'crash-site') {
  const blockedText = blockedType === 'rock' ? getObstacleArticle(world) : 'the edge of the map'
  return `I can't move forward! There's ${blockedText} in front of me. My path is blocked.`
}

function getRelativeFacing(facing, condition = 'ahead') {
  const facingIndex = DIRECTIONS.indexOf(facing)
  if (condition === 'left') return DIRECTIONS[(facingIndex + 3) % 4]
  if (condition === 'right') return DIRECTIONS[(facingIndex + 1) % 4]
  return facing
}

function getIfPathTarget(luma, condition = 'ahead') {
  const pathFacing = getRelativeFacing(luma.facing, condition)
  const delta = MOVE_DELTAS[pathFacing]
  return { x: luma.x + delta.x, y: luma.y + delta.y }
}

function hasPath(luma, walls = [], grid, condition = 'ahead', objects = []) {
  const target = getIfPathTarget(luma, condition)
  if (target.x < 0 || target.x >= grid.cols || target.y < 0 || target.y >= grid.rows) return false
  if (walls.some(wall => wall.x === target.x && wall.y === target.y)) return false
  return !objects.some(objectItem =>
    objectItem.type !== 'ship_part' &&
    objectItem.x === target.x &&
    objectItem.y === target.y
  )
}

const FACING_TO_ANSWER = {
  north: '↑ Up',
  east:  '→ Right',
  south: '↓ Down',
  west:  '← Left',
}

const RADIO_HINT_OPENERS = [
  "Can you see where I am?",
  "Can you tell where I am?",
  "Can you figure out where I am?",
  "Can you spot where I am?",
]

const IDENTIFY_SUCCESS_RADIO_MESSAGES = [
  "Yes! You figured out which way I’m facing!",
  "That’s right! You got my direction correct!",
  "Yes! You guessed my direction correctly!",
  "Great job! You knew which way I was facing!",
]


const FACING_DEG = { north: 0, east: 90, south: 180, west: 270 }

export function nextCumulativeRotation(currentDeg, command) {
  if (command === 'TR') return currentDeg + 90
  if (command === 'TL') return currentDeg - 90
  return currentDeg
}

function findUncollectedShipPartIndex(shipParts, luma, collectedIndices) {
  return shipParts.findIndex((part, index) =>
    part.x === luma.x &&
    part.y === luma.y &&
    !collectedIndices.has(index)
  )
}

let collectionEffectSerial = 0

function createCollectionEffect(luma, partIndex = null) {
  const kind = partIndex === null ? 'empty-collect' : 'real-collect'
  const indexKey = partIndex === null ? 'empty' : partIndex
  collectionEffectSerial += 1

  return {
    id: `${kind}-${indexKey}-${Date.now()}-${collectionEffectSerial}`,
    index: partIndex,
    kind,
    carriesPart: partIndex !== null,
    x: luma.x,
    y: luma.y,
  }
}

// ── Layout generator lookup ───────────────────────────────────────────────────
function generateLayout(generatorKey, facing) {
  switch (generatorKey) {
    case 'level1': return generateLevel1Layout(facing)
    case 'level2': return generateLevel2Layout(facing)
    case 'level3': return generateLevel3Layout(facing)
    case 'level4': return generateLevel4Layout(facing)
    case 'level5': return generateLevel5Layout(facing)
    case 'level6': return generateLevel6Layout(facing)
    case 'level7': return generateLevel7Layout(facing)
    case 'level8': return generateLevel8Layout(facing)
    case 'level9': return generateLevel9Layout(facing)
    case 'level10': return generateLevel10Layout(facing)
    case 'level12': return generateLevel12Layout(facing)
    case 'level13': return generateLevel13Layout(facing)
    case 'level15': return generateLevel15Layout(facing)
    case 'level16': return generateLevel16Layout(facing)
    case 'level18': return generateLevel18Layout(facing)
    case 'level19': return generateLevel19Layout(facing)
    case 'level20': return generateLevel20Layout(facing)
    case 'level21': return generateLevel21Layout(facing)
    default: return { walls: [], objects: [], solution: null }
  }
}

// animSpeed: number 10–100 (percentage). Controls step delay.
export function useGameState(levelConfig, animSpeed = 50) {
  // 1. Resolve facing first
  const [initialFacing] = useState(() => {
    if (levelConfig.lumaFacing === 'random') {
      return DIRECTIONS[Math.floor(Math.random() * 4)]
    }
    if (levelConfig.lumaFacing === 'random-NE') {
      // Only north or east — both guaranteed to give the correct target command count
      return Math.random() < 0.5 ? 'north' : 'east'
    }
    return levelConfig.lumaFacing
  })

  // 2. Generate layout using the resolved facing (so adjacent rocks are never behind LUMA)
  const [layout] = useState(() => {
    if (levelConfig.layoutGenerator) {
      return generateLayout(levelConfig.layoutGenerator, initialFacing)
    }
    // Fallback: use walls/objects already in levelConfig
    return {
      walls: levelConfig.walls ?? [],
      objects: levelConfig.objects ?? [],
      solution: levelConfig.solution ?? null,
    }
  })

  // Merge layout into effective level config (walls, objects, solution from generated layout)
  // Level 1's generator also returns lumaStart, goal, and lumaFacing overrides.
  const effectiveLevel = useMemo(() => ({
    ...levelConfig,
    walls:    layout.walls,
    objects:  layout.objects,
    solution: layout.solution,
    // Apply start/goal/facing overrides if the generator provided them (Level 1)
    ...(layout.lumaStart  != null && { lumaStart:   layout.lumaStart  }),
    ...(layout.goal       != null && { goal:         layout.goal       }),
  }), [levelConfig, layout])

  // Use layout's lumaStart override if provided (Level 1), otherwise use levelConfig
  const resolvedStart   = layout.lumaStart  ?? levelConfig.lumaStart
  const resolvedFacing  = layout.lumaFacing ?? initialFacing

  const [luma, setLuma] = useState(() => ({
    x: resolvedStart.x,
    y: resolvedStart.y,
    facing: resolvedFacing,
    rotateDeg: FACING_DEG[resolvedFacing] ?? 0,
  }))

  const initialFacingRef = useRef(resolvedFacing)

  const [sptCorrectAnswer] = useState(() => FACING_TO_ANSWER[resolvedFacing])

  const shipPartObjects = useMemo(
    () => (effectiveLevel.objects ?? []).filter(o => o.type === 'ship_part'),
    [effectiveLevel.objects]
  )

  const [collectedParts, setCollectedParts] = useState(() => new Set())
  const [collectionEffects, setCollectionEffects] = useState([])
  const [activeIfPathSignal, setActiveIfPathSignal] = useState(null)

  const [phase, setPhase] = useState(() => levelConfig.skipIdentify ? 'develop' : 'identify')
  const [sptAnswer, setSptAnswer]         = useState(null)
  const [sptCorrect, setSptCorrect]       = useState(false)

  // ── Level 2/3/4 uncertain radio ───────────────────────────────────────────
  // Pick a fixed uncertain message for this session (so it doesn't change on re-renders)
  const [initialRadioHint] = useState(() => {
    const opener = getRandomFrom(RADIO_HINT_OPENERS)
    const withOpener = (hint) => `${opener} ${hint}`

    if (levelConfig.noRadio) {
      return null
    }

    if (levelConfig.id === 13 && levelConfig.uncertainRadio) {
      return withOpener(buildLevel9UncertainRadioReport())
    }

    if (levelConfig.uncertainRadio) {
      return withOpener(buildUncertainRadioReport(
        { x: resolvedStart.x, y: resolvedStart.y },
        resolvedFacing,
        layout.walls,
        layout.objects,
        effectiveLevel.goal ?? levelConfig.goal,
        new Set(),
        effectiveLevel.world ?? levelConfig.world,
      ))
    }

    if (levelConfig.id === 12) {
      return withOpener("There’s open path in front of me and on my right, but there’s no path behind me or to my left.")
    }

    if (levelConfig.id === 14) {
      return withOpener("There is a tree on my left.")
    }

    if (levelConfig.id === 15) {
      return "Can you tell where I am? There is a box behind me and a box on my right."
    }

    if (levelConfig.id === 17) {
      return "Can you see where I am? There is a box on my right and a box on my left, and a ship fragment in front of me."
    }

    if (levelConfig.id === 21 || levelConfig.id === 22) {
      return "Can you see where I am? There’s open path in front of me and on my right, but there’s no path behind me or to my left."
    }

    if (levelConfig.id === 23) {
      return "Can you see where I am? There is no path behind me."
    }

    if (levelConfig.id === 6) {
      return withOpener("There is a tree to my right and a ship fragment in front of me.")
    }

    return withOpener(buildRadioReport(
      { x: resolvedStart.x, y: resolvedStart.y },
      resolvedFacing,
      layout.walls,
      layout.objects,
      effectiveLevel.goal ?? levelConfig.goal,
      new Set(),
      effectiveLevel.world ?? levelConfig.world,
    ))
  })

  // Whether the player has flipped the visor at least once (for Level 2 reinforcement)
  const [visorFlippedThisLevel, setVisorFlippedThisLevel] = useState(false)
  const [visorFlipReaction, setVisorFlipReaction] = useState(null)

  // ── Reactive helmet report ────────────────────────────────────────────────
  const [reportOverride, setReportOverride] = useState(null)
  const [successRadioMessage] = useState(() => getRandomFrom(IDENTIFY_SUCCESS_RADIO_MESSAGES))
  const uncertainMessage = initialRadioHint

  const liveReport = useMemo(() => {
    if (initialRadioHint !== undefined) {
      return initialRadioHint
    }

    if (levelConfig.id === 13 && levelConfig.uncertainRadio && !sptCorrect) {
      return uncertainMessage
    }

    // Level 2/3: show uncertain message until the player flips the visor
    // After flipping, switch to the clear normal message
    if (levelConfig.id !== 13 && levelConfig.uncertainRadio && !visorFlippedThisLevel) {
      return uncertainMessage
    }
    if (
      levelConfig.id === 12 &&
      luma.x === resolvedStart.x &&
      luma.y === resolvedStart.y &&
      luma.facing === resolvedFacing &&
      collectedParts.size === 0
    ) {
      return "There’s open path in front of me and on my right, but there’s no path behind me or to my left."
    }
    if (
      levelConfig.id === 14 &&
      luma.x === resolvedStart.x &&
      luma.y === resolvedStart.y &&
      luma.facing === resolvedFacing &&
      collectedParts.size === 0
    ) {
      return "There is a tree on my left."
    }
    if (
      levelConfig.id === 6 &&
      luma.x === resolvedStart.x &&
      luma.y === resolvedStart.y &&
      luma.facing === resolvedFacing &&
      collectedParts.size === 0
    ) {
      return "There is a tree to my right and a ship fragment in front of me."
    }
    return buildRadioReport(
      luma,
      luma.facing,
      effectiveLevel.walls,
      effectiveLevel.objects,
      effectiveLevel.goal ?? levelConfig.goal,
      collectedParts,
      effectiveLevel.world ?? levelConfig.world,
    )
  }, [
    luma, effectiveLevel.walls, effectiveLevel.objects,
    effectiveLevel.goal, effectiveLevel.world, levelConfig.goal, levelConfig.world,
    collectedParts, levelConfig.id, levelConfig.uncertainRadio,
    resolvedStart.x, resolvedStart.y, resolvedFacing,
    visorFlippedThisLevel, initialRadioHint, sptCorrect, uncertainMessage
  ])

  const helmetReport = levelConfig.noRadio
    ? reportOverride ?? liveReport
    : levelConfig.traceMode && reportOverride
      ? reportOverride
      : sptCorrect
      ? successRadioMessage
      : liveReport

  const [predictionTile, setPredictionTile] = useState(null)
  const [predictionResult, setPredictionResult] = useState(null)

  // ── CT tracking ───────────────────────────────────────────────────────────
  const [sequence, setSequence]           = useState(() => levelConfig.givenProgram ?? [])
  const [isRunning, setIsRunning]         = useState(false)
  const [attemptCount, setAttemptCount]   = useState(0)
  const [editCount, setEditCount]         = useState(0)
  const [selfCorrected, setSelfCorrected] = useState(false)

  const [missedFragments, setMissedFragments] = useState(false)
  const [missedFragmentsShown, setMissedFragmentsShown] = useState(false)

  const [needsReset, setNeedsReset] = useState(false)
  const [visorActive, setVisorActive]         = useState(false)
  const [visorFlipCount, setVisorFlipCount]   = useState(0)
  const [visorFlipTiming, setVisorFlipTiming] = useState(null)
  const [hadErrorBefore, setHadErrorBefore]   = useState(false)
  const [startTime]       = useState(() => Date.now())
  const [firstFailTime, setFirstFailTime] = useState(null)
  const [traceSelection, setTraceSelection] = useState(null)
  const [traceEliminatedTiles, setTraceEliminatedTiles] = useState([])
  const [traceGoalRevealed, setTraceGoalRevealed] = useState(() => !levelConfig.hideGoalUntilTraceCorrect)
  const traceRunStartedRef = useRef(false)

  const isMirrored = levelConfig.mirrorControls && luma.facing === 'south'

  const animSpeedRef = useRef(animSpeed)
  useEffect(() => {
    animSpeedRef.current = animSpeed
  }, [animSpeed])

  // ── SPT ──────────────────────────────────────────────────────────────────
  const ifPathSignalTimeoutRef = useRef(null)
  const ifPathSignalSerialRef = useRef(0)

  const clearIfPathSignal = useCallback(() => {
    if (ifPathSignalTimeoutRef.current) {
      clearTimeout(ifPathSignalTimeoutRef.current)
      ifPathSignalTimeoutRef.current = null
    }
    setActiveIfPathSignal(null)
  }, [])

  useEffect(() => () => {
    if (ifPathSignalTimeoutRef.current) {
      clearTimeout(ifPathSignalTimeoutRef.current)
    }
  }, [])

  const answerSPT = useCallback((answer) => {
    setSptAnswer(answer)
    const correct = answer === sptCorrectAnswer
    setSptCorrect(correct)
    if (correct) {
      if (levelConfig.id === 13) {
        setReportOverride(buildLevel9IdentifyConfirmation(
          { x: resolvedStart.x, y: resolvedStart.y },
          resolvedFacing,
          effectiveLevel.walls,
        ))
      }
      if (levelConfig.traceMode) {
        setReportOverride("Yes! Now I know which way I'm facing. Let's trace the code.")
      }
      setPhase('develop')
    }
    return correct
  }, [effectiveLevel.walls, levelConfig.id, levelConfig.traceMode, resolvedFacing, resolvedStart.x, resolvedStart.y, sptCorrectAnswer])

  // ── VISOR FLIP ───────────────────────────────────────────────────────────
  const openVisor = useCallback(() => {
    if (visorActive) return
    setVisorActive(true)
    setVisorFlipCount(c => c + 1)
    if (visorFlipTiming === null) {
      setVisorFlipTiming(hadErrorBefore ? 'reactive' : 'proactive')
    }

    // Mark that the visor was flipped and pick a reaction message where used.
    if (levelConfig.uncertainRadio && !visorFlippedThisLevel) {
      setVisorFlippedThisLevel(true)
      setVisorFlipReaction(levelConfig.id === 13 ? null : getRandomFrom(VISOR_FLIP_REACTIONS))
    }
  }, [visorActive, visorFlipTiming, hadErrorBefore, levelConfig.id, levelConfig.uncertainRadio, visorFlippedThisLevel])

  const closeVisor = useCallback(() => {
    setVisorActive(false)
    // After closing visor on Level 2, the reaction replaces the radio briefly
    if (visorFlipReaction && levelConfig.uncertainRadio) {
      setReportOverride(visorFlipReaction)
      // Clear after 3 seconds, letting the normal clear report take over
      setTimeout(() => setReportOverride(null), 3000)
    }
  }, [visorFlipReaction, levelConfig.uncertainRadio])

  const flipVisor = useCallback(() => {
    if (visorActive) closeVisor()
    else openVisor()
  }, [visorActive, openVisor, closeVisor])

  // ── COMMAND BUILDER ──────────────────────────────────────────────────────

  const updateSequence = useCallback((nextSequence) => {
    setSequence(nextSequence)
  }, [])

  const addCommand = useCallback((cmd) => {
    if (isRunning) return
    setSequence(s => [...s, cmd])
  }, [isRunning])

  const removeLastCommand = useCallback(() => {
    if (isRunning) return
    setSequence(s => s.slice(0, -1))
    setEditCount(c => c + 1)
  }, [isRunning])

  const clearSequence = useCallback(() => {
    if (levelConfig.givenProgram) return
    if (isRunning) return
    setSequence([])
    setEditCount(c => c + 1)
  }, [isRunning, levelConfig.givenProgram])

  // ── RESET LUMA ───────────────────────────────────────────────────────────
  const resetLuma = useCallback(() => {
    if (isRunning) return
    setLuma({
      x: resolvedStart.x,
      y: resolvedStart.y,
      facing: initialFacingRef.current,
      rotateDeg: FACING_DEG[initialFacingRef.current] ?? 0,
    })
    setCollectedParts(new Set())
    setCollectionEffects([])
    setNeedsReset(false)
    setPredictionResult(null)
    clearIfPathSignal()
  }, [isRunning, resolvedStart, clearIfPathSignal])




  // ── PREDICTION PROMPT ────────────────────────────────────────────────────
  const setPrediction = useCallback((tile) => {
    if (!levelConfig.predictionPrompt) return
    if (isRunning) return
    setPredictionTile(tile)
  }, [levelConfig.predictionPrompt, isRunning])

  // ── SEQUENCE RUNNER ──────────────────────────────────────────────────────
  const runSequence = useCallback(({ startIndex = 0, onIncomplete = null } = {}) => {
    if (isRunning) return
    const continueStartIndex = startIndex
    const commandsToRun = continueStartIndex > 0 ? sequence.slice(continueStartIndex) : sequence
    if (commandsToRun.length === 0) return
    if (levelConfig.predictionPrompt && !predictionTile) return
    if (levelConfig.requireElse && hasEmptyRequiredElse(sequence)) return
    setIsRunning(true)
    setAttemptCount(c => c + 1)
    setNeedsReset(false)
    setReportOverride(null)
    setCollectionEffects([])
    clearIfPathSignal()

    let currentLuma = { ...luma }
    let localCollected = new Set(collectedParts)
    const walls = effectiveLevel.walls ?? []
    const goal  = effectiveLevel.goal ?? levelConfig.goal
    const gridCols = levelConfig.grid.cols
    const gridRows = levelConfig.grid.rows
    const grid = { cols: gridCols, rows: gridRows }
    const world = effectiveLevel.world ?? levelConfig.world
    const shouldShowIfPathSignal =
      (world === 'repair-site' || world === 'launch-site') &&
      levelConfig.allowIfPath
    const programStack = [{
      commands: commandsToRun,
      index: 0,
      type: 'root',
      sequenceOffset: continueStartIndex,
    }]

    let stoppedEarly = false
    let blockedType = null

    const triggerIfPathSignal = (command, result, target) => {
      if (!shouldShowIfPathSignal) return

      if (ifPathSignalTimeoutRef.current) {
        clearTimeout(ifPathSignalTimeoutRef.current)
      }

      ifPathSignalSerialRef.current += 1
      const id = `if-path-${Date.now()}-${ifPathSignalSerialRef.current}`
      setActiveIfPathSignal({
        id,
        condition: command.condition ?? 'ahead',
        result,
        from: {
          x: currentLuma.x,
          y: currentLuma.y,
          facing: currentLuma.facing,
        },
        to: target,
      })

      ifPathSignalTimeoutRef.current = setTimeout(() => {
        setActiveIfPathSignal((signal) => signal?.id === id ? null : signal)
        ifPathSignalTimeoutRef.current = null
      }, 420)
    }

    const nextRuntimeCommand = () => {
      while (programStack.length > 0) {
        const frame = programStack[programStack.length - 1]

        if (frame.index >= frame.commands.length) {
          if (frame.type === 'repeat' && frame.remaining > 1) {
            frame.remaining -= 1
            frame.index = 0
            continue
          }

          programStack.pop()
          continue
        }

        const command = frame.commands[frame.index]
        frame.index += 1

        if (isRepeatCommand(command)) {
          const times = clampRepeatTimes(command.times)
          if (times > 0 && (command.commands?.length ?? 0) > 0) {
            programStack.push({
              commands: command.commands,
              index: 0,
              remaining: times,
              type: 'repeat',
            })
          }
          continue
        }

        if (isIfPathCommand(command)) {
          const condition = command.condition ?? 'ahead'
          const target = getIfPathTarget(currentLuma, condition)
          const pathOpen = hasPath(currentLuma, walls, grid, condition, effectiveLevel.objects ?? [])

          const branchCommands = pathOpen ? command.commands : command.elseCommands

          if ((branchCommands?.length ?? 0) > 0) {
            programStack.push({
              commands: branchCommands,
              index: 0,
              type: pathOpen ? 'if' : 'else',
            })
          }

          if (shouldShowIfPathSignal) {
            triggerIfPathSignal(command, pathOpen, target)
            return { type: 'IF_PATH_SIGNAL' }
          }

          continue
        }

        if (typeof command === 'string') return command
      }

      return null
    }

    const executeStep = () => {
      if (stoppedEarly) {
        setIsRunning(false)
        setHadErrorBefore(true)
        if (!firstFailTime) setFirstFailTime(Date.now())
        setSelfCorrected(true)
        setNeedsReset(true)
        return
      }

      const cmd = nextRuntimeCommand()

      if (cmd?.type === 'IF_PATH_SIGNAL') {
        setTimeout(() => executeStep(), 430)
        return
      }

      if (cmd === null) {
        setCollectedParts(new Set(localCollected))
        setIsRunning(false)
        clearIfPathSignal()

        const allPartsCollected = shipPartObjects.every((_, i) => localCollected.has(i))
        const atGoal = goal && currentLuma.x === goal.x && currentLuma.y === goal.y

        if (levelConfig.predictionPrompt && predictionTile) {
          const correct = predictionTile.x === currentLuma.x && predictionTile.y === currentLuma.y
          setPredictionResult(correct ? 'correct' : 'wrong')
        }

        if (atGoal && allPartsCollected) {
          setPhase('success')
          setNeedsReset(false)
          setReportOverride(isLaunchPadGoal(levelConfig)
              ? "Launch pad reached! LUMA is ready to fly home."
              : "I made it! The ship core is right here — we did it!")
        } else if (onIncomplete?.({
          luma: currentLuma,
          collectedParts: localCollected,
          sequenceLength: sequence.length,
        })) {
          setNeedsReset(false)
        } else if (atGoal && !allPartsCollected && shipPartObjects.length > 0) {
          if (!missedFragmentsShown) {
            setMissedFragments(true)
            setMissedFragmentsShown(true)
          }
          setHadErrorBefore(true)
          if (!firstFailTime) setFirstFailTime(Date.now())
          setNeedsReset(true)
          setReportOverride(
              `I'm at the ship core, but I'm missing ${shipPartObjects.length - localCollected.size} fragment${shipPartObjects.length - localCollected.size > 1 ? 's' : ''}… Reset and try a different path!`
            )
        } else {
          setHadErrorBefore(true)
          if (!firstFailTime) setFirstFailTime(Date.now())
          setSelfCorrected(true)
          setNeedsReset(true)
        }
        return
      }

      const effectiveCmd = isMirrored
        ? cmd === 'TL' ? 'TR' : cmd === 'TR' ? 'TL' : cmd
        : cmd

      let justCollectedIndex = null
      let collectEffect = null
      let blocked = false

      if (effectiveCmd === 'F') {
        const delta = MOVE_DELTAS[currentLuma.facing]
        const newX = currentLuma.x + delta.x
        const newY = currentLuma.y + delta.y
        const hitWall = walls.some(w => w.x === newX && w.y === newY)
        const outOfBounds = newX < 0 || newX >= gridCols || newY < 0 || newY >= gridRows

        if (hitWall || outOfBounds) {
          blocked = true
          blockedType = hitWall ? 'rock' : 'boundary'
          stoppedEarly = true

          const blockedMsg = buildBlockedReport(currentLuma, currentLuma.facing, blockedType, world)
          setReportOverride(blockedMsg)
          setLuma({ ...currentLuma })

          setIsRunning(false)
          setHadErrorBefore(true)
          if (!firstFailTime) setFirstFailTime(Date.now())
          setSelfCorrected(true)
          setNeedsReset(true)
          return
        } else {
          currentLuma = { ...currentLuma, x: newX, y: newY }
        }
      } else if (effectiveCmd === 'C') {
        const partIndex = findUncollectedShipPartIndex(shipPartObjects, currentLuma, localCollected)
        if (partIndex !== -1) {
          localCollected = new Set(localCollected)
          localCollected.add(partIndex)
          justCollectedIndex = partIndex
        }
        collectEffect = createCollectionEffect(currentLuma, justCollectedIndex)
      } else if (effectiveCmd === 'TL') {
        const idx = DIRECTIONS.indexOf(currentLuma.facing)
        const newFacing = DIRECTIONS[(idx + 3) % 4]
        const newRotDeg = nextCumulativeRotation(currentLuma.rotateDeg, 'TL')
        currentLuma = { ...currentLuma, facing: newFacing, rotateDeg: newRotDeg }
      } else if (effectiveCmd === 'TR') {
        const idx = DIRECTIONS.indexOf(currentLuma.facing)
        const newFacing = DIRECTIONS[(idx + 1) % 4]
        const newRotDeg = nextCumulativeRotation(currentLuma.rotateDeg, 'TR')
        currentLuma = { ...currentLuma, facing: newFacing, rotateDeg: newRotDeg }
      }

      setLuma({ ...currentLuma })


      if (collectEffect) {
        setCollectionEffects((effects) => [...effects, collectEffect])
        setTimeout(() => {
          setCollectionEffects((effects) => effects.filter((effect) => effect.id !== collectEffect.id))
        }, 900)
      }

      if (justCollectedIndex !== null) {
        setCollectedParts(new Set(localCollected))
        const collectionMsg = buildCollectionReport(
          currentLuma,
          currentLuma.facing,
          walls,
          effectiveLevel.objects ?? [],
          goal,
          localCollected,
          world,
        )
        setReportOverride(collectionMsg)
      }

      if (!blocked) {
        const currentDelay = Math.round(25000 / Math.max(10, Math.min(100, animSpeedRef.current)))
        setTimeout(() => executeStep(), currentDelay)
      }
    }

    executeStep()
  }, [
    isRunning, sequence, luma, levelConfig, effectiveLevel, isMirrored,
    firstFailTime, collectedParts, shipPartObjects,
    predictionTile, missedFragmentsShown, clearIfPathSignal,
  ])

  // ── DISMISS MISSED-FRAGMENTS HINT ─────────────────────────────────────────
  const answerTraceCell = useCallback((tile) => {
    if (!levelConfig.traceMode || phase !== 'develop' || isRunning || traceRunStartedRef.current) return false
    if ((effectiveLevel.walls ?? []).some(wall => wall.x === tile?.x && wall.y === tile?.y)) return false

    const traceKey = `${tile?.x},${tile?.y}`
    if (traceEliminatedTiles.includes(traceKey)) return false

    const correctCell = levelConfig.tracingCorrectCell
    const correct = Boolean(correctCell && tile?.x === correctCell.x && tile?.y === correctCell.y)
    const selectionId = `trace-${Date.now()}-${tile?.x}-${tile?.y}`

    setTraceSelection({
      x: tile?.x,
      y: tile?.y,
      result: correct ? 'success' : 'retry',
      id: selectionId,
    })

    if (!correct) {
      setHadErrorBefore(true)
      if (!firstFailTime) setFirstFailTime(Date.now())
      setSelfCorrected(true)
      setReportOverride("Not quite. Trace the code again and try another ending tile.")
      window.setTimeout(() => {
        setTraceEliminatedTiles((previousTiles) => (
          previousTiles.includes(traceKey) ? previousTiles : [...previousTiles, traceKey]
        ))
        setTraceSelection((currentSelection) => (
          currentSelection?.id === selectionId ? null : currentSelection
        ))
      }, 880)
      return false
    }

        traceRunStartedRef.current = true
    setTraceGoalRevealed(true)
    setReportOverride(isLaunchPadGoal(levelConfig)
      ? "Correct! The launch pad is appearing. Watch LUMA run the launch code!"
      : "Correct! The ship core is appearing. Watch LUMA run the program!")

    window.setTimeout(() => {
      setTraceSelection((currentSelection) => (
        currentSelection?.id === selectionId ? null : currentSelection
      ))
    }, 920)

    window.setTimeout(() => {
      runSequence()
    }, 1050)

    return true
  }, [effectiveLevel.walls, firstFailTime, isRunning, levelConfig, phase, runSequence, traceEliminatedTiles])

  const dismissMissedFragments = useCallback(() => {
    setMissedFragments(false)
  }, [])

  // ── GBI SNAPSHOT ──────────────────────────────────────────────────────────
  const getGBISnapshot = useCallback(() => ({
    radioAccuracy: sptCorrect,
    flipCount:     visorFlipCount,
    flipTiming:    visorFlipTiming,
    flipUsedOnLevel2: levelConfig.uncertainRadio ? visorFlippedThisLevel : undefined,
    attemptCount,
    editCount,
    selfCorrected,
    predictionAccuracy: levelConfig.predictionPrompt ? predictionResult : null,
    sequenceEfficiency: effectiveLevel.solution
      ? countProgramBlocks(effectiveLevel.solution) / Math.max(countProgramBlocks(sequence), 1)
      : null,
    persistenceScore: firstFailTime ? (Date.now() - firstFailTime) / 1000 : null,
    timeSpent: (Date.now() - startTime) / 1000,
  }), [
    sptCorrect, visorFlipCount, visorFlipTiming, visorFlippedThisLevel,
    attemptCount, editCount, selfCorrected,
    predictionResult, levelConfig, effectiveLevel,
    sequence, firstFailTime, startTime,
  ])

  return {
    luma, phase, setPhase,
    sptAnswer, sptCorrect, answerSPT,
    helmetReport,
    // Level 2 specific: whether the radio is currently uncertain
    radioIsUncertain: levelConfig.uncertainRadio && !sptCorrect,
    visorActive, visorFlipCount, flipVisor, closeVisor,
    sequence, setSequence: updateSequence, isRunning, isMirrored,
    addCommand, removeLastCommand, clearSequence, runSequence,
    attemptCount, editCount,
    collectedParts, collectionEffects, activeIfPathSignal,
    missedFragments, dismissMissedFragments,
    needsReset, resetLuma,
    predictionTile, setPrediction, predictionResult,
    traceSelection, traceEliminatedTiles, traceGoalRevealed, answerTraceCell,
    getGBISnapshot,
    // Expose effective layout for GameGrid
    effectiveLevel,
  }
}
