// levels.js - Crash Site and Forest Trail layouts.
// Ship parts are collectible waypoints; walls are rock obstacles that block LUMA.
// lumaFacing: 'random-NE' means useGameState will pick north OR east randomly.
//
import { createRepeatCommand } from '../utils/commands'

// Crash Site design targets for this pass:
//   L1: fixed, 3 commands, no rocks, no fragments, no identify
//   L2: randomized, 4 commands, 1 rock, no identify, no fragments
//   L3: randomized, 5 commands, 1 rock, identify starts, no fragments
//   L4: randomized, 7 commands, 2 rocks, identify practice, no fragments
//   L5: randomized, 7 commands, 2 rocks, 1 fragment, strategy card after
// Forest Trail design targets:
//   L6: pattern pressure, 2 rocks, no repeat yet
//   L7: first repeat level
//   L8: repeat plus extra commands outside the loop
//   L9: uncertain radio + first visor flip
//   L10: repeat + visor + one fragment mastery
//
// There is no hard command limit. targetCommands is a best-path hint only.

export const TILE_SIZE = 80

const COLS = 5
const ROWS = 5
const MAX_RETRIES = 300

const L1_START = { x: 0, y: 2 }
const L1_GOAL = { x: 3, y: 2 }

const L2_START = { x: 1, y: 2 }
const L2_GOAL = { x: 3, y: 1 }

const L3_START = { x: 1, y: 3 }
const L3_GOAL = { x: 4, y: 2 }

const L4_START = { x: 1, y: 3 }
const L4_GOAL = { x: 4, y: 1 }

const L5_START = { x: 1, y: 3 }
const L5_GOAL = { x: 4, y: 1 }

const L6_START = { x: 1, y: 4 }
const L6_GOAL = { x: 3, y: 1 }

const L7_START = { x: 0, y: 4 }
const L7_GOAL = { x: 4, y: 0 }

const L8_START = { x: 0, y: 4 }
const L8_GOAL = { x: 2, y: 0 }

const L9_START = { x: 0, y: 4 }
const L9_GOAL = { x: 3, y: 1 }

const L10_START = { x: 0, y: 4 }
const L10_GOAL = { x: 4, y: 0 }

const DIRECTIONS = ['north', 'east', 'south', 'west']
const MOVE_DELTAS = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
}

function tileKey(x, y) {
  return `${x},${y}`
}

function shuffle(arr) {
  const copy = [...arr]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function stepTile(pos, facing) {
  const delta = MOVE_DELTAS[facing]
  return { x: pos.x + delta.x, y: pos.y + delta.y }
}

function inBounds(tile) {
  return tile.x >= 0 && tile.x < COLS && tile.y >= 0 && tile.y < ROWS
}

function adjacentTiles(pos, blocked = new Set()) {
  return DIRECTIONS
    .map((facing) => stepTile(pos, facing))
    .filter((tile) => inBounds(tile) && !blocked.has(tileKey(tile.x, tile.y)))
}

function visibleAdjacentTiles(pos, facing, blocked = new Set()) {
  const oppositeFacing = {
    north: 'south',
    east: 'west',
    south: 'north',
    west: 'east',
  }[facing]

  const behind = stepTile(pos, oppositeFacing)
  return adjacentTiles(pos, blocked).filter(
    (tile) => !(tile.x === behind.x && tile.y === behind.y)
  )
}

function computeOptimalSolution(lumaStart, goal, walls, objects, initialFacing = 'north') {
  const shipParts = objects.filter((objectItem) => objectItem.type === 'ship_part')
  const allCollectedMask = (1 << shipParts.length) - 1

  const encodeState = (x, y, facing, collectedMask) =>
    `${x},${y},${facing},${collectedMask}`

  const queue = [{
    x: lumaStart.x,
    y: lumaStart.y,
    facing: initialFacing,
    collectedMask: 0,
    path: [],
  }]

  const visited = new Set([
    encodeState(lumaStart.x, lumaStart.y, initialFacing, 0),
  ])

  while (queue.length > 0) {
    const current = queue.shift()

    if (
      current.x === goal.x &&
      current.y === goal.y &&
      current.collectedMask === allCollectedMask
    ) {
      return current.path
    }

    for (const command of ['F', 'TL', 'TR']) {
      let nextX = current.x
      let nextY = current.y
      let nextFacing = current.facing
      let nextCollectedMask = current.collectedMask

      if (command === 'TL') {
        const facingIndex = DIRECTIONS.indexOf(nextFacing)
        nextFacing = DIRECTIONS[(facingIndex + 3) % 4]
      } else if (command === 'TR') {
        const facingIndex = DIRECTIONS.indexOf(nextFacing)
        nextFacing = DIRECTIONS[(facingIndex + 1) % 4]
      } else {
        const delta = MOVE_DELTAS[nextFacing]
        const candidateX = nextX + delta.x
        const candidateY = nextY + delta.y

        if (candidateX < 0 || candidateX >= COLS || candidateY < 0 || candidateY >= ROWS) {
          continue
        }

        if (walls.some((wall) => wall.x === candidateX && wall.y === candidateY)) {
          continue
        }

        nextX = candidateX
        nextY = candidateY

        shipParts.forEach((part, index) => {
          if (part.x === nextX && part.y === nextY) {
            nextCollectedMask |= (1 << index)
          }
        })
      }

      const encoded = encodeState(nextX, nextY, nextFacing, nextCollectedMask)
      if (visited.has(encoded)) {
        continue
      }

      visited.add(encoded)
      queue.push({
        x: nextX,
        y: nextY,
        facing: nextFacing,
        collectedMask: nextCollectedMask,
        path: [...current.path, command],
      })
    }
  }

  return null
}

function buildReservedSet(...tilesOrLists) {
  const reserved = new Set()

  tilesOrLists.flat().forEach((tile) => {
    if (!tile) return
    reserved.add(tileKey(tile.x, tile.y))
  })

  return reserved
}

function pathCellsForFacing(pathCellsByFacing, facing) {
  return pathCellsByFacing[facing] ?? []
}

function generateSingleRockLayout({
  lumaStart,
  goal,
  facing,
  targetLength,
  objects = [],
  pathCellsByFacing,
}) {
  const pathCells = pathCellsForFacing(pathCellsByFacing, facing)
  const pathKeys = new Set(pathCells.map((tile) => tileKey(tile.x, tile.y)))
  const reserved = buildReservedSet(lumaStart, goal, objects)

  const candidateRocks = visibleAdjacentTiles(lumaStart, facing, reserved).filter(
    (tile) => !pathKeys.has(tileKey(tile.x, tile.y))
  )

  for (const rock of shuffle(candidateRocks)) {
    const walls = [{ x: rock.x, y: rock.y }]
    const solution = computeOptimalSolution(lumaStart, goal, walls, objects, facing)

    if (solution && solution.length === targetLength) {
      return { walls, objects, solution }
    }
  }

  const fallbackRock = candidateRocks[0]
  if (fallbackRock) {
    const walls = [{ x: fallbackRock.x, y: fallbackRock.y }]
    const solution = computeOptimalSolution(lumaStart, goal, walls, objects, facing)
    if (solution && solution.length === targetLength) {
      return { walls, objects, solution }
    }
  }

  const fallbackSolution = computeOptimalSolution(lumaStart, goal, [], objects, facing)
  return {
    walls: [],
    objects,
    solution: fallbackSolution,
  }
}

function buildPathTilesFromSolution(start, facing, solution) {
  const tiles = []
  let currentPos = { ...start }
  let currentFacing = facing

  solution.forEach((command) => {
    if (command === 'TL') {
      const facingIndex = DIRECTIONS.indexOf(currentFacing)
      currentFacing = DIRECTIONS[(facingIndex + 3) % 4]
      return
    }

    if (command === 'TR') {
      const facingIndex = DIRECTIONS.indexOf(currentFacing)
      currentFacing = DIRECTIONS[(facingIndex + 1) % 4]
      return
    }

    currentPos = stepTile(currentPos, currentFacing)
    tiles.push({ ...currentPos })
  })

  return tiles
}

function chooseVariant(variants) {
  return shuffle(variants)[0]
}

export function generateLevel1Layout() {
  return {
    walls: [],
    objects: [],
    solution: ['F', 'F', 'F'],
    lumaStart: L1_START,
    goal: L1_GOAL,
    lumaFacing: 'east',
  }
}

export function generateLevel2Layout(facing = 'north') {
  const allowedRockPool = [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
  ]

  for (const rock of shuffle(allowedRockPool)) {
    const walls = [{ x: rock.x, y: rock.y }]
    const solution = computeOptimalSolution(L2_START, L2_GOAL, walls, [], facing)

    if (solution && solution.length === 4) {
      return { walls, objects: [], solution }
    }
  }

  const fallbackSolution = computeOptimalSolution(L2_START, L2_GOAL, [], [], facing)
  return {
    walls: [],
    objects: [],
    solution: fallbackSolution,
  }
}

export function generateLevel3Layout(facing = 'north') {
  const pathCellsByFacing = {
    north: [
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ],
    east: [
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 2 },
    ],
  }

  return generateSingleRockLayout({
    lumaStart: L3_START,
    goal: L3_GOAL,
    facing,
    targetLength: 5,
    objects: [],
    pathCellsByFacing,
  })
}

export function generateLevel4Layout() {
  const adjacentRockPool = shuffle([
    { x: 1, y: 2 },
    { x: 2, y: 3 },
    { x: 1, y: 4 },
    { x: 0, y: 3 },
  ])
  const routeRockPool = shuffle([
    { x: 3, y: 1 },
    { x: 3, y: 2 },
    { x: 4, y: 2 },
  ])

  for (const adjacentRock of adjacentRockPool) {
    for (const routeRock of routeRockPool) {
      const walls = [
        { x: adjacentRock.x, y: adjacentRock.y },
        { x: routeRock.x, y: routeRock.y },
      ]

      for (const candidateFacing of DIRECTIONS) {
        const solution = computeOptimalSolution(
          L4_START,
          L4_GOAL,
          walls,
          [],
          candidateFacing
        )

        if (solution && solution.length === 7) {
          return { walls, objects: [], solution, lumaFacing: candidateFacing }
        }
      }
    }
  }

  const fallbackWalls = [
    { x: 1, y: 2 },
    { x: 3, y: 1 },
  ]
  const fallbackFacing = 'north'
  const fallbackSolution = computeOptimalSolution(
    L4_START,
    L4_GOAL,
    fallbackWalls,
    [],
    fallbackFacing
  )

  return {
    walls: fallbackWalls,
    objects: [],
    solution: fallbackSolution,
    lumaFacing: fallbackFacing,
  }
}

export function generateLevel5Layout() {
  const adjacentRockPool = shuffle([
    { x: 1, y: 2 },
    { x: 2, y: 3 },
    { x: 1, y: 4 },
    { x: 0, y: 3 },
  ])
  const routeRockPool = shuffle([
    { x: 3, y: 1 },
    { x: 3, y: 2 },
    { x: 4, y: 2 },
  ])

  for (const adjacentRock of adjacentRockPool) {
    for (const routeRock of routeRockPool) {
      const walls = [
        { x: adjacentRock.x, y: adjacentRock.y },
        { x: routeRock.x, y: routeRock.y },
      ]

      for (const candidateFacing of DIRECTIONS) {
        const baseSolution = computeOptimalSolution(
          L5_START,
          L5_GOAL,
          walls,
          [],
          candidateFacing
        )

        if (!baseSolution || baseSolution.length !== 7) {
          continue
        }

        const fragmentCandidates = shuffle(
          buildPathTilesFromSolution(L5_START, candidateFacing, baseSolution).filter(
            (tile) =>
              !(tile.x === L5_GOAL.x && tile.y === L5_GOAL.y) &&
              Math.abs(tile.x - L5_START.x) + Math.abs(tile.y - L5_START.y) > 1
          )
        )

        for (const chosenFragment of fragmentCandidates) {
          const objects = [{
            type: 'ship_part',
            x: chosenFragment.x,
            y: chosenFragment.y,
          }]
          const solution = computeOptimalSolution(
            L5_START,
            L5_GOAL,
            walls,
            objects,
            candidateFacing
          )

          if (solution && solution.length === 7) {
            return { walls, objects, solution, lumaFacing: candidateFacing }
          }
        }
      }
    }
  }

  const fallbackWalls = [
    { x: 1, y: 2 },
    { x: 3, y: 1 },
  ]
  const fallbackObjects = [{ type: 'ship_part', x: 2, y: 3 }]
  const fallbackFacing = 'north'
  const fallbackSolution = computeOptimalSolution(
    L5_START,
    L5_GOAL,
    fallbackWalls,
    fallbackObjects,
    fallbackFacing
  )

  return {
    walls: fallbackWalls,
    objects: fallbackObjects,
    solution: fallbackSolution,
    lumaFacing: fallbackFacing,
  }
}

export function generateLevel6Layout() {
  return {
    walls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 4, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 4, y: 2 },
      { x: 0, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 0, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    objects: [
      { type: 'ship_part', x: 1, y: 3 },
      { type: 'ship_part', x: 3, y: 2 },
    ],
    solution: ['F', 'TR', 'F', 'TL', 'F', 'TR', 'F', 'TL', 'F'],
    lumaStart: { ...L6_START },
    goal: { ...L6_GOAL },
    lumaFacing: 'north',
  }
}

export function generateLevel7Layout() {
  return {
    walls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ],
    objects: [
      { type: 'ship_part', x: 2, y: 4 },
      { type: 'ship_part', x: 4, y: 4 },
      { type: 'ship_part', x: 4, y: 2 },
    ],
    solution: [createRepeatCommand(4, ['F']), 'TL', createRepeatCommand(4, ['F'])],
    lumaStart: { ...L7_START },
    goal: { ...L7_GOAL },
    lumaFacing: 'east',
  }
}

export function generateLevel8Layout() {
  return chooseVariant([
    {
      walls: [
        { x: 0, y: 1 },
        { x: 2, y: 2 },
      ],
      objects: [],
      solution: ['F', createRepeatCommand(2, ['F', 'TR', 'F', 'TL']), 'F'],
      lumaStart: { ...L8_START },
      goal: { ...L8_GOAL },
      lumaFacing: 'north',
    },
    {
      walls: [
        { x: 1, y: 2 },
        { x: 3, y: 3 },
      ],
      objects: [],
      solution: ['F', createRepeatCommand(2, ['F', 'TR', 'F', 'TL']), 'F'],
      lumaStart: { x: 1, y: 4 },
      goal: { x: 3, y: 0 },
      lumaFacing: 'north',
    },
  ])
}

export function generateLevel9Layout() {
  return chooseVariant([
    {
      walls: [
        { x: 1, y: 4 },
        { x: 2, y: 3 },
      ],
      objects: [],
      solution: [createRepeatCommand(2, ['F', 'TR', 'F', 'TL']), 'TR', 'F'],
      lumaStart: { ...L9_START },
      goal: { ...L9_GOAL },
      lumaFacing: 'north',
    },
    {
      walls: [
        { x: 2, y: 4 },
        { x: 3, y: 3 },
      ],
      objects: [],
      solution: [createRepeatCommand(2, ['F', 'TR', 'F', 'TL']), 'TR', 'F'],
      lumaStart: { x: 1, y: 4 },
      goal: { x: 4, y: 1 },
      lumaFacing: 'north',
    },
  ])
}

export function generateLevel10Layout() {
  return chooseVariant([
    {
      walls: [
        { x: 1, y: 4 },
        { x: 2, y: 3 },
        { x: 3, y: 1 },
      ],
      objects: [{ type: 'ship_part', x: 2, y: 1 }],
      solution: [createRepeatCommand(2, ['F', 'TR', 'F', 'TL']), 'F', 'TR', 'F', 'F'],
      lumaStart: { ...L10_START },
      goal: { ...L10_GOAL },
      lumaFacing: 'north',
    },
    {
      walls: [
        { x: 2, y: 4 },
        { x: 3, y: 2 },
        { x: 4, y: 1 },
      ],
      objects: [{ type: 'ship_part', x: 3, y: 1 }],
      solution: [createRepeatCommand(2, ['F', 'TR', 'F', 'TL']), 'F', 'TR', 'F', 'F'],
      lumaStart: { x: 1, y: 4 },
      goal: { x: 4, y: 0 },
      lumaFacing: 'north',
    },
  ])
}

export const LEVELS = [
  {
    id: 1,
    name: 'Guided Start',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L1_START },
    lumaFacing: 'east',
    goal: { ...L1_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: null,
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: true,
    noRadio: true,
    layoutGenerator: 'level1',
    targetCommands: 3,
  },
  {
    id: 2,
    name: 'First Turn',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L2_START },
    lumaFacing: 'random-NE',
    goal: { ...L2_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: null,
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: true,
    noRadio: true,
    layoutGenerator: 'level2',
    targetCommands: 4,
  },
  {
    id: 3,
    name: 'First Identify',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L3_START },
    lumaFacing: 'random-NE',
    goal: { ...L3_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level3',
    targetCommands: 6,
    uncertainRadio: false,
  },
  {
    id: 4,
    name: 'Identify Practice',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L4_START },
    lumaFacing: 'random-NE',
    goal: { ...L4_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level4',
    targetCommands: 7,
    uncertainRadio: false,
  },
  {
    id: 5,
    name: 'Fragment Route',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L5_START },
    lumaFacing: 'random-NE',
    goal: { ...L5_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: true,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level5',
    targetCommands: 7,
    uncertainRadio: false,
  },
  {
    id: 6,
    name: 'Pattern Pressure',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L6_START },
    lumaFacing: 'north',
    goal: { ...L6_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level6',
    targetCommands: 9,
    uncertainRadio: false,
    allowRepeat: false,
  },
  {
    id: 7,
    name: 'Repeat Intro',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L7_START },
    lumaFacing: 'east',
    goal: { ...L7_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level7',
    targetCommands: 3,
    uncertainRadio: false,
    allowRepeat: true,
    repeatDefaults: { times: 2 },
  },
  {
    id: 8,
    name: 'Repeat Builder',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L8_START },
    lumaFacing: 'north',
    goal: { ...L8_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level8',
    targetCommands: 7,
    uncertainRadio: false,
    allowRepeat: true,
    repeatDefaults: { times: 2 },
  },
  {
    id: 9,
    name: 'Uncertain Radio + First Visor Flip',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L9_START },
    lumaFacing: 'north',
    goal: { ...L9_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: false,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level9',
    targetCommands: 7,
    uncertainRadio: true,
    allowRepeat: true,
    repeatDefaults: { times: 2 },
  },
  {
    id: 10,
    name: 'Loop + Fragment Mastery',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L10_START },
    lumaFacing: 'north',
    goal: { ...L10_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: true,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level10',
    targetCommands: 8,
    uncertainRadio: false,
    allowRepeat: true,
    repeatDefaults: { times: 2 },
  },
]
