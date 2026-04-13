// levels.js - Crash Site early-map layouts.
// Ship parts are collectible waypoints; walls are rock obstacles that block LUMA.
// lumaFacing: 'random-NE' means useGameState will pick north OR east randomly.
//
// Crash Site design targets for this pass:
//   L1: fixed, 3 commands, no rocks, no fragments, no identify
//   L2: randomized, 4 commands, 1 rock, no identify, no fragments
//   L3: randomized, 5 commands, 1 rock, identify starts, no fragments
//   L4: randomized, 6 commands, 1 rock, 1 fragment, strategy card after
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

const L4_START = { x: 1, y: 4 }
const L4_GOAL = { x: 4, y: 2 }

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
  const pathCellsByFacing = {
    north: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
    east: [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 1 },
    ],
  }

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

export function generateLevel4Layout(facing = 'north') {
  const pathCellsByFacing = {
    north: [
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ],
    east: [
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 3 },
      { x: 4, y: 2 },
    ],
  }

  const pathCells = pathCellsForFacing(pathCellsByFacing, facing)
  const fragmentCandidates = pathCells.slice(1, -1)

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const chosenFragment = shuffle(fragmentCandidates)[0]
    if (!chosenFragment) break

    const objects = [{
      type: 'ship_part',
      x: chosenFragment.x,
      y: chosenFragment.y,
    }]

    const layout = generateSingleRockLayout({
      lumaStart: L4_START,
      goal: L4_GOAL,
      facing,
      targetLength: 6,
      objects,
      pathCellsByFacing,
    })

    if (
      layout.solution &&
      layout.solution.length === 6 &&
      layout.walls.length === 1 &&
      layout.objects.length === 1
    ) {
      return layout
    }
  }

  const fallbackFragment = fragmentCandidates[0]
  const fallbackObjects = fallbackFragment
    ? [{ type: 'ship_part', x: fallbackFragment.x, y: fallbackFragment.y }]
    : []

  return generateSingleRockLayout({
    lumaStart: L4_START,
    goal: L4_GOAL,
    facing,
    targetLength: 6,
    objects: fallbackObjects,
    pathCellsByFacing,
  })
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
    targetCommands: 5,
    uncertainRadio: false,
  },
  {
    id: 4,
    name: 'Fragment Route',
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
    strategyCardAfter: true,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level4',
    targetCommands: 6,
    uncertainRadio: false,
  },
]
