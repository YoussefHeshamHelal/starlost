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
} from '../data/levels'
import { expandSequence } from '../utils/commands'

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

// ── Regular radio report builder ──────────────────────────────────────────────
function buildRadioReport(lumaPos, facing, walls = [], objects = [], goal, collectedIndices = new Set()) {
  const lumaCtx = { x: lumaPos.x, y: lumaPos.y, facing }
  const priority = ['front', 'right', 'left', 'back']
  const opener = "I'm okay… I think. Can you see where I am?"

  const adjacentWalls = walls.filter(w => getRelativeDirection(lumaCtx, w) !== null)
  if (adjacentWalls.length > 0) {
    const relDirs = adjacentWalls.map(w => getRelativeDirection(lumaCtx, w)).filter(Boolean)
    const chosen  = priority.find(p => relDirs.includes(p)) ?? relDirs[0]
    return `${opener} There is a rock ${RELATIVE_LABEL[chosen]}.`
  }

  const adjacentParts = objects.filter(
    (o, i) => o.type === 'ship_part' && !collectedIndices.has(i) && getRelativeDirection(lumaCtx, o) !== null
  )
  if (adjacentParts.length > 0) {
    const relDirs = adjacentParts.map(o => getRelativeDirection(lumaCtx, o)).filter(Boolean)
    const chosen  = priority.find(p => relDirs.includes(p)) ?? relDirs[0]
    return `${opener} I can sense a ship fragment ${RELATIVE_LABEL[chosen]}.`
  }

  if (goal) {
    const rel = getRelativeDirection(lumaCtx, goal)
    if (rel) return `${opener} I can detect the ship core ${RELATIVE_LABEL[rel]}!`
  }

  return `${opener} The path around me looks clear… but I can't tell which way I'm facing.`
}

// ── Level 2 uncertain radio builder ──────────────────────────────────────────
// Same info, but delivered with hesitation and slight uncertainty.
function buildUncertainRadioReport(lumaPos, facing, walls = [], objects = [], goal, collectedIndices = new Set()) {
  const lumaCtx = { x: lumaPos.x, y: lumaPos.y, facing }
  const priority = ['front', 'right', 'left', 'back']

  const adjacentWalls = walls.filter(w => getRelativeDirection(lumaCtx, w) !== null)
  if (adjacentWalls.length > 0) {
    const relDirs = adjacentWalls.map(w => getRelativeDirection(lumaCtx, w)).filter(Boolean)
    const chosen  = priority.find(p => relDirs.includes(p)) ?? relDirs[0]
    const uncertainPhrases = {
      front: "Umm… I think there's a rock in front of me? I'm not totally sure…",
      right: "I'm not totally sure… but I think something is on my right.",
      left:  "Wait… I think I sense a rock to my left? Hard to tell with all this dust.",
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

// ── Level 9 radio helpers ─────────────────────────────────────────────────────
function buildLevel9UncertainRadioReport() {
  return "I feel like there's a rock beside me, but I'm not sure if it's on my left or my right."
}

function buildLevel9IdentifyConfirmation(lumaPos, facing, walls = []) {
  const lumaCtx = { x: lumaPos.x, y: lumaPos.y, facing }
  const sideRock = walls
    .map(w => getRelativeDirection(lumaCtx, w))
    .find(rel => rel === 'left' || rel === 'right')

  if (sideRock) {
    return `Yes, that's right! The rock is on my ${sideRock}.`
  }

  return "Yes, that's right! Now I know where the rock is."
}

// ── Collection report ─────────────────────────────────────────────────────────
function buildCollectionReport(lumaPos, facing, walls = [], objects = [], goal, collectedIndices = new Set()) {
  const opener = "Got it! I found a ship fragment!"
  const lumaCtx = { x: lumaPos.x, y: lumaPos.y, facing }
  const priority = ['front', 'right', 'left', 'back']

  const adjacentWalls = walls.filter(w => getRelativeDirection(lumaCtx, w) !== null)
  if (adjacentWalls.length > 0) {
    const relDirs = adjacentWalls.map(w => getRelativeDirection(lumaCtx, w)).filter(Boolean)
    const chosen  = priority.find(p => relDirs.includes(p)) ?? relDirs[0]
    return `${opener} There's a rock ${RELATIVE_LABEL[chosen]} from here.`
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
function buildBlockedReport(lumaPos, facing, blockedType) {
  const blockedText = blockedType === 'rock' ? 'a rock' : 'the edge of the map'
  return `I can't move forward! There's ${blockedText} in front of me. My path is blocked.`
}

const FACING_TO_ANSWER = {
  north: '↑ Up',
  east:  '→ Right',
  south: '↓ Down',
  west:  '← Left',
}

const FACING_DEG = { north: 0, east: 90, south: 180, west: 270 }

export function nextCumulativeRotation(currentDeg, command) {
  if (command === 'TR') return currentDeg + 90
  if (command === 'TL') return currentDeg - 90
  return currentDeg
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

  // ── Level 2/3/4 uncertain radio ───────────────────────────────────────────
  // Pick a fixed uncertain message for this session (so it doesn't change on re-renders)
  const [uncertainMessage] = useState(() => {
    if (levelConfig.uncertainRadio) {
      if (levelConfig.id === 9) {
        return buildLevel9UncertainRadioReport()
      }

      return buildUncertainRadioReport(
        { x: resolvedStart.x, y: resolvedStart.y },
        resolvedFacing,
        layout.walls,
        layout.objects,
        effectiveLevel.goal ?? levelConfig.goal,
        new Set()
      )
    }
    return null
  })

  // Whether the player has flipped the visor at least once (for Level 2 reinforcement)
  const [visorFlippedThisLevel, setVisorFlippedThisLevel] = useState(false)
  const [visorFlipReaction, setVisorFlipReaction] = useState(null)

  // ── Reactive helmet report ────────────────────────────────────────────────
  const [reportOverride, setReportOverride] = useState(null)

  const liveReport = useMemo(() => {
    if (levelConfig.id === 9 && levelConfig.uncertainRadio) {
      return uncertainMessage
    }

    // Level 2/3: show uncertain message until the player flips the visor
    // After flipping, switch to the clear normal message
    if (levelConfig.uncertainRadio && !visorFlippedThisLevel) {
      return uncertainMessage
    }
    if (
      levelConfig.id === 10 &&
      luma.x === resolvedStart.x &&
      luma.y === resolvedStart.y &&
      luma.facing === resolvedFacing &&
      collectedParts.size === 0
    ) {
      return "I’m near the edge of the forest. I think there’s a wall on my right… and another wall behind me."
    }
    if (
      levelConfig.id === 6 &&
      luma.x === resolvedStart.x &&
      luma.y === resolvedStart.y &&
      luma.facing === resolvedFacing &&
      collectedParts.size === 0
    ) {
      return "I'm okay... I think. Can you see where I am? There is a rock to my right and a ship fragment in front of me."
    }
    return buildRadioReport(
      luma,
      luma.facing,
      effectiveLevel.walls,
      effectiveLevel.objects,
      effectiveLevel.goal ?? levelConfig.goal,
      collectedParts,
    )
  }, [
    luma, effectiveLevel.walls, effectiveLevel.objects,
    effectiveLevel.goal, levelConfig.goal,
    collectedParts, levelConfig.id, levelConfig.uncertainRadio,
    resolvedStart.x, resolvedStart.y, resolvedFacing,
    visorFlippedThisLevel, uncertainMessage
  ])

  const helmetReport = reportOverride ?? liveReport

  // ── Phases & answers ──────────────────────────────────────────────────────
  const [phase, setPhase] = useState(() => levelConfig.skipIdentify ? 'develop' : 'identify')
  const [sptAnswer, setSptAnswer]         = useState(null)
  const [sptCorrect, setSptCorrect]       = useState(false)

  // ── Prediction prompt (Level 3+) ──────────────────────────────────────────
  const [predictionTile, setPredictionTile] = useState(null)
  const [predictionResult, setPredictionResult] = useState(null)

  // ── CT tracking ───────────────────────────────────────────────────────────
  const [sequence, setSequence]           = useState([])
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

  const isMirrored = levelConfig.mirrorControls && luma.facing === 'south'

  const animSpeedRef = useRef(animSpeed)
  useEffect(() => {
    animSpeedRef.current = animSpeed
  }, [animSpeed])

  // ── SPT ──────────────────────────────────────────────────────────────────
  const answerSPT = useCallback((answer) => {
    setSptAnswer(answer)
    const correct = answer === sptCorrectAnswer
    setSptCorrect(correct)
    if (correct) {
      if (levelConfig.id === 9) {
        setReportOverride(buildLevel9IdentifyConfirmation(
          { x: resolvedStart.x, y: resolvedStart.y },
          resolvedFacing,
          effectiveLevel.walls,
        ))
      }
      setPhase('develop')
    }
    return correct
  }, [effectiveLevel.walls, levelConfig.id, resolvedFacing, resolvedStart.x, resolvedStart.y, sptCorrectAnswer])

  // ── VISOR FLIP ───────────────────────────────────────────────────────────
  const openVisor = useCallback(() => {
    if (visorActive || visorFlipCount >= 3) return
    setVisorActive(true)
    setVisorFlipCount(c => c + 1)
    if (visorFlipTiming === null) {
      setVisorFlipTiming(hadErrorBefore ? 'reactive' : 'proactive')
    }

    // Mark that the visor was flipped and pick a reaction message where used.
    if (levelConfig.uncertainRadio && !visorFlippedThisLevel) {
      setVisorFlippedThisLevel(true)
      setVisorFlipReaction(levelConfig.id === 9 ? null : getRandomFrom(VISOR_FLIP_REACTIONS))
    }
  }, [visorActive, visorFlipCount, visorFlipTiming, hadErrorBefore, levelConfig.id, levelConfig.uncertainRadio, visorFlippedThisLevel])

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
    if (isRunning) return
    setSequence([])
    setEditCount(c => c + 1)
  }, [isRunning])

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
    setNeedsReset(false)
    setReportOverride(null)
    setPredictionResult(null)
  }, [isRunning, resolvedStart])

  // ── PREDICTION PROMPT ────────────────────────────────────────────────────
  const setPrediction = useCallback((tile) => {
    if (!levelConfig.predictionPrompt) return
    if (isRunning) return
    setPredictionTile(tile)
  }, [levelConfig.predictionPrompt, isRunning])

  // ── SEQUENCE RUNNER ──────────────────────────────────────────────────────
  const runSequence = useCallback(() => {
    if (isRunning || sequence.length === 0) return
    if (levelConfig.predictionPrompt && !predictionTile) return
    setIsRunning(true)
    setAttemptCount(c => c + 1)
    setNeedsReset(false)
    setReportOverride(null)

    let currentLuma = { ...luma }
    let localCollected = new Set(collectedParts)
    const steps = expandSequence(sequence)
    const walls = effectiveLevel.walls ?? []
    const goal  = effectiveLevel.goal ?? levelConfig.goal
    const gridCols = levelConfig.grid.cols
    const gridRows = levelConfig.grid.rows

    let stoppedEarly = false
    let blockedType = null

    const executeStep = (index) => {
      if (stoppedEarly) {
        setIsRunning(false)
        setHadErrorBefore(true)
        if (!firstFailTime) setFirstFailTime(Date.now())
        setSelfCorrected(true)
        setNeedsReset(true)
        return
      }

      if (index >= steps.length) {
        setCollectedParts(new Set(localCollected))
        setIsRunning(false)

        const allPartsCollected = shipPartObjects.every((_, i) => localCollected.has(i))
        const atGoal = goal && currentLuma.x === goal.x && currentLuma.y === goal.y

        if (levelConfig.predictionPrompt && predictionTile) {
          const correct = predictionTile.x === currentLuma.x && predictionTile.y === currentLuma.y
          setPredictionResult(correct ? 'correct' : 'wrong')
        }

        if (atGoal && allPartsCollected) {
          setPhase('success')
          setNeedsReset(false)
          setReportOverride("I made it! The ship core is right here — we did it!")
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

      const cmd = steps[index]
      const effectiveCmd = isMirrored
        ? cmd === 'TL' ? 'TR' : cmd === 'TR' ? 'TL' : cmd
        : cmd

      let justCollectedIndex = null
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

          const blockedMsg = buildBlockedReport(currentLuma, currentLuma.facing, blockedType)
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
          shipPartObjects.forEach((part, i) => {
            if (part.x === currentLuma.x && part.y === currentLuma.y && !localCollected.has(i)) {
              localCollected = new Set(localCollected)
              localCollected.add(i)
              justCollectedIndex = i
            }
          })
        }
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

      if (justCollectedIndex !== null) {
        setCollectedParts(new Set(localCollected))
        const collectionMsg = buildCollectionReport(
          currentLuma,
          currentLuma.facing,
          walls,
          effectiveLevel.objects ?? [],
          goal,
          localCollected,
        )
        setReportOverride(collectionMsg)
      }

      if (!blocked) {
        const currentDelay = Math.round(25000 / Math.max(10, Math.min(100, animSpeedRef.current)))
        setTimeout(() => executeStep(index + 1), currentDelay)
      }
    }

    executeStep(0)
  }, [
    isRunning, sequence, luma, levelConfig, effectiveLevel, isMirrored,
    firstFailTime, collectedParts, shipPartObjects,
    predictionTile, missedFragmentsShown,
  ])

  // ── DISMISS MISSED-FRAGMENTS HINT ─────────────────────────────────────────
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
      ? effectiveLevel.solution.length / Math.max(sequence.length, 1)
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
    radioIsUncertain: levelConfig.uncertainRadio && !reportOverride && (levelConfig.id === 9 ? !sptCorrect : !visorFlippedThisLevel),
    visorActive, visorFlipCount, flipVisor, closeVisor,
    sequence, setSequence, isRunning, isMirrored,
    addCommand, removeLastCommand, clearSequence, runSequence,
    attemptCount, editCount,
    collectedParts,
    missedFragments, dismissMissedFragments,
    needsReset, resetLuma,
    predictionTile, setPrediction, predictionResult,
    getGBISnapshot,
    // Expose effective layout for GameGrid
    effectiveLevel,
  }
}
