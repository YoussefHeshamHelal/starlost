// levels.js - Crash Site and Forest Trail layouts.
// Ship parts are collectible waypoints; walls are rock obstacles that block LUMA.
// lumaFacing: 'random-NE' means useGameState will pick north OR east randomly.
//
import { createIfPathCommand, createRepeatCommand } from '../utils/commands'

// Crash Site design targets for this pass:
//   L1: fixed, 3 commands, no rocks, no fragments, no identify
//   L2: randomized, 4 commands, 1 rock, no identify, no fragments
//   L3: randomized, 5 commands, 1 rock, identify starts, no fragments
//   L4: randomized, 7 commands, 2 rocks, identify practice, no fragments
//   L5: randomized, 8 commands, 2 rocks, 1 fragment, strategy card after
// Forest Trail design targets:
//   L6: pattern pressure, 2 rocks, no repeat yet
//   L7-L10: gradual Repeat bridge levels
//   L11: old first repeat level
//   L12: old repeat plus extra commands outside the loop
//   L13: old uncertain radio + first visor flip
//   L14: old repeat + visor + fragment mastery
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

const L8_START = { x: 0, y: 0 }
const L8_GOAL = { x: 0, y: 4 }

const L9_START = { x: 3, y: 4 }
const L9_GOAL = { x: 2, y: 4 }

const L10_START = { x: 0, y: 1 }
const L10_GOAL = { x: 3, y: 3 }

const L12_START = { x: 0, y: 3 }
const L12_GOAL = { x: 0, y: 1 }

const L13_START = { x: 0, y: 4 }
const L13_GOAL = { x: 4, y: 3 }

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

    for (const command of ['F', 'TL', 'TR', 'C']) {
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
      } else if (command === 'F') {
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
      } else if (command === 'C') {
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

    if (command === 'F') {
      currentPos = stepTile(currentPos, currentFacing)
      tiles.push({ ...currentPos })
    }
  })

  return tiles
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

  const layout = generateSingleRockLayout({
    lumaStart: L3_START,
    goal: L3_GOAL,
    facing,
    targetLength: 5,
    objects: [],
    pathCellsByFacing,
  })

  if (layout.solution?.length === 5) {
    return layout
  }

  const fallbackWallsByFacing = {
    north: [{ x: 0, y: 3 }],
    east: [{ x: 1, y: 2 }],
  }
  const fallbackWalls = fallbackWallsByFacing[facing] ?? fallbackWallsByFacing.north
  const fallbackSolution = computeOptimalSolution(L3_START, L3_GOAL, fallbackWalls, [], facing)

  return {
    walls: fallbackWalls,
    objects: [],
    solution: fallbackSolution,
  }
}

export function generateLevel4Layout() {
  const allowedFacings = ['north', 'east', 'west']
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

      for (const candidateFacing of allowedFacings) {
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

          if (solution && solution.length === 8) {
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
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 3 },
      { x: 2, y: 4 },
    ],
    objects: [
      { type: 'ship_part', x: 1, y: 3 },
      { type: 'ship_part', x: 3, y: 2 },
    ],
    solution: ['F', 'C', 'TR', 'F', 'TL', 'F', 'TR', 'F', 'C', 'TL', 'F'],
    lumaStart: { ...L6_START },
    goal: { ...L6_GOAL },
    lumaFacing: 'north',
  }
}

export function generateLevel7Layout() {
  return {
    walls: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ],
    objects: [
      { type: 'ship_part', x: 4, y: 4 },
    ],
    solution: [
      createRepeatCommand(4, ['F']),
      'C',
      'TL',
      createRepeatCommand(4, ['F']),
    ],
    lumaStart: { ...L7_START },
    goal: { ...L7_GOAL },
    lumaFacing: 'east',
  }
}

export function generateLevel8Layout() {
  return {
    walls: [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 3 },
      { x: 3, y: 3 },
    ],
    objects: [
      { type: 'ship_part', x: 4, y: 0 },
      { type: 'ship_part', x: 4, y: 4 },
    ],
    solution: [
      createRepeatCommand(4, ['F']),
      'C',
      'TR',
      createRepeatCommand(4, ['F']),
      'C',
      'TR',
      createRepeatCommand(4, ['F']),
    ],
    lumaStart: { ...L8_START },
    goal: { ...L8_GOAL },
    lumaFacing: 'east',
  }
}

export function generateLevel9Layout() {
  return {
    walls: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 0, y: 4 },
      { x: 4, y: 0 },
      { x: 4, y: 1 },
      { x: 4, y: 2 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
    ],
    objects: [
      { type: 'ship_part', x: 2, y: 0 },
      { type: 'ship_part', x: 2, y: 1 },
      { type: 'ship_part', x: 2, y: 2 },
      { type: 'ship_part', x: 2, y: 3 },
      { type: 'ship_part', x: 3, y: 0 },
      { type: 'ship_part', x: 3, y: 1 },
      { type: 'ship_part', x: 3, y: 2 },
      { type: 'ship_part', x: 3, y: 3 },
    ],
    solution: [
      createRepeatCommand(4, ['F', 'C']),
      'TL',
      'F',
      'TL',
      createRepeatCommand(4, ['C', 'F']),
    ],
    lumaStart: { ...L9_START },
    goal: { ...L9_GOAL },
    lumaFacing: 'north',
  }
}

export function generateLevel10Layout() {
  return {
    walls: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
    objects: [
      { type: 'ship_part', x: 1, y: 1 },
      { type: 'ship_part', x: 2, y: 1 },
      { type: 'ship_part', x: 3, y: 1 },
      { type: 'ship_part', x: 1, y: 2 },
      { type: 'ship_part', x: 2, y: 2 },
      { type: 'ship_part', x: 3, y: 2 },
      { type: 'ship_part', x: 2, y: 3 },
      { type: 'ship_part', x: 1, y: 3 },
    ],
    solution: [
      createRepeatCommand(3, ['F', 'C']),
      createRepeatCommand(2, ['TR', 'F', 'C']),
      'F',
      'C',
      createRepeatCommand(2, ['TL', 'F', 'C']),
      'F',
    ],
    lumaStart: { ...L10_START },
    goal: { ...L10_GOAL },
    lumaFacing: 'east',
  }
}

export function generateLevel12Layout() {
  return {
    walls: [
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 3 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    objects: [
      { type: 'ship_part', x: 1, y: 3 },
      { type: 'ship_part', x: 2, y: 3 },
      { type: 'ship_part', x: 3, y: 3 },
      { type: 'ship_part', x: 3, y: 2 },
      { type: 'ship_part', x: 3, y: 1 },
      { type: 'ship_part', x: 1, y: 1 },
      { type: 'ship_part', x: 2, y: 1 },
    ],
    solution: [
      createRepeatCommand(8, [
        'F',
        'C',
        createIfPathCommand('left', ['TL']),
      ]),
    ],
    lumaStart: { ...L12_START },
    goal: { ...L12_GOAL },
    lumaFacing: 'east',
  }
}

export function generateLevel13Layout() {
  return {
    walls: [
      { x: 0, y: 0 },
      { x: 1, y: 4 },
      { x: 2, y: 1 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
    ],
    objects: [
      { type: 'ship_part', x: 1, y: 1 },
      { type: 'ship_part', x: 3, y: 3 },
    ],
    solution: [
      createRepeatCommand(3, ['F']),
      'TR',
      'F',
      'C',
      'TR',
      createRepeatCommand(2, ['F']),
      'TL',
      createRepeatCommand(2, ['F']),
      'C',
      'F',
    ],
    lumaStart: { ...L13_START },
    goal: { ...L13_GOAL },
    lumaFacing: 'north',
  }
}

export function generateLevel15Layout() {
  return {
    walls: [
      { x: 0, y: 4 },
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ],
    objects: [],
    solution: [
      createRepeatCommand(6, [
        'F',
        createIfPathCommand('right', ['TR']),
      ]),
    ],
    lumaStart: { x: 0, y: 3 },
    goal: { x: 4, y: 1 },
    lumaFacing: 'north',
  }
}

export function generateLevel16Layout() {
  return {
    walls: [
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ],
    objects: [],
    solution: [
      createRepeatCommand(8, [
        'F',
        createIfPathCommand('right', ['TR']),
      ]),
    ],
    lumaStart: { x: 4, y: 4 },
    goal: { x: 4, y: 2 },
    lumaFacing: 'west',
  }
}

export function generateLevel18Layout() {
  return {
    walls: [
      { x: 4, y: 0 },

      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 4, y: 1 },

      { x: 0, y: 2 },
      { x: 2, y: 2 },

      { x: 1, y: 3 },

      { x: 1, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    objects: [],
    solution: [
      createRepeatCommand(9, [
        createIfPathCommand('ahead', ['F'], ['TR']),
      ]),
    ],
    lumaStart: { x: 0, y: 0 },
    goal: { x: 2, y: 3 },
    lumaFacing: 'east',
  }
}

export function generateLevel19Layout() {
  return {
    walls: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 1, y: 2 },
      { x: 3, y: 2 },
      { x: 1, y: 4 },
      { x: 3, y: 4 },
    ],
    objects: [
      { type: 'ship_part', x: 0, y: 1 },
      { type: 'ship_part', x: 1, y: 1 },
      { type: 'ship_part', x: 2, y: 1 },
      { type: 'ship_part', x: 3, y: 1 },
      { type: 'ship_part', x: 4, y: 1 },
      { type: 'ship_part', x: 0, y: 2 },
      { type: 'ship_part', x: 4, y: 2 },
      { type: 'ship_part', x: 0, y: 3 },
      { type: 'ship_part', x: 4, y: 3 },
    ],
    solution: [
      createRepeatCommand(12, [
        createIfPathCommand('ahead', ['F', 'C'], ['TR']),
      ]),
    ],
    lumaStart: { x: 0, y: 4 },
    goal: { x: 4, y: 4 },
    lumaFacing: 'north',
  }
}

export function generateLevel20Layout() {
  return {
    walls: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },

      { x: 1, y: 1 },

      { x: 1, y: 2 },
      { x: 3, y: 2 },

      { x: 3, y: 3 },

      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    objects: [
      { type: 'ship_part', x: 0, y: 1 },
      { type: 'ship_part', x: 0, y: 2 },
      { type: 'ship_part', x: 0, y: 3 },

      { type: 'ship_part', x: 1, y: 3 },
      { type: 'ship_part', x: 2, y: 3 },

      { type: 'ship_part', x: 2, y: 2 },
      { type: 'ship_part', x: 2, y: 1 },

      { type: 'ship_part', x: 3, y: 1 },
      { type: 'ship_part', x: 4, y: 1 },
      { type: 'ship_part', x: 4, y: 2 },
    ],
    solution: [
      createRepeatCommand(15, [
        createIfPathCommand('ahead', [
          'F',
          'C',
        ], [
          createIfPathCommand('right', [
            'TR',
          ], [
            'TL',
          ]),
        ]),
      ]),
    ],
    lumaStart: { x: 0, y: 0 },
    goal: { x: 4, y: 3 },
    lumaFacing: 'south',
  }
}

export function generateLevel21Layout() {
  return {
    walls: [
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    objects: [],
    solution: [
      createRepeatCommand(16, [
        createIfPathCommand('right', [
          'TR',
          'F',
        ], [
          createIfPathCommand('ahead', [
            'F',
          ], [
            'TL',
          ]),
        ]),
      ]),
    ],
    lumaStart: { x: 2, y: 4 },
    goal: { x: 1, y: 0 },
    lumaFacing: 'north',
  }
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
    predictionPrompt: false,
    mirrorControls: false,
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
    predictionPrompt: false,
    mirrorControls: false,
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
    predictionPrompt: false,
    mirrorControls: false,
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
    predictionPrompt: false,
    mirrorControls: false,
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
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: true,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level5',
    targetCommands: 8,
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
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level6',
    targetCommands: 11,
    uncertainRadio: false,
    allowRepeat: false,
  },
  {
    id: 7,
    name: 'Repeat Forward',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 0, y: 2 },
    lumaFacing: 'east',
    goal: { x: 4, y: 2 },
    walls: [
      { x: 0, y: 3 },
      { x: 0, y: 4 },
      { x: 4, y: 0 },
      { x: 4, y: 1 },
    ],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['â†‘ Up', 'â†’ Right', 'â†“ Down', 'â† Left'],
      correct: null,
    },
    solution: [
      createRepeatCommand(4, ['F']),
    ],
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    targetCommands: 2,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: false,
    allowCollect: false,
    repeatDefaults: { times: 4 },
  },
  {
    id: 8,
    name: 'Repeat Then Turn',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 0, y: 4 },
    lumaFacing: 'east',
    goal: { x: 4, y: 0 },
    walls: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['â†‘ Up', 'â†’ Right', 'â†“ Down', 'â† Left'],
      correct: null,
    },
    solution: [
      createRepeatCommand(4, ['F']),
      'TL',
      createRepeatCommand(4, ['F']),
    ],
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    targetCommands: 5,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: false,
    allowCollect: false,
    repeatDefaults: { times: 4 },
  },
  {
    id: 9,
    name: 'Pattern Inside Repeat',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 0, y: 4 },
    lumaFacing: 'east',
    goal: { x: 4, y: 0 },
    walls: [
      { x: 2, y: 4 },
      { x: 0, y: 3 },
      { x: 1, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 2 },
      { x: 2, y: 1 },
      { x: 3, y: 0 },
    ],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['â†‘ Up', 'â†’ Right', 'â†“ Down', 'â† Left'],
      correct: null,
    },
    solution: [
      createRepeatCommand(4, ['F', 'TL', 'F', 'TR']),
    ],
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    targetCommands: 5,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: false,
    allowCollect: false,
    repeatDefaults: { times: 4 },
  },
  {
    id: 10,
    name: 'Repeat to a Fragment',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 0, y: 2 },
    lumaFacing: 'east',
    goal: { x: 4, y: 2 },
    walls: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
    ],
    objects: [
      { type: 'ship_part', x: 3, y: 2 },
    ],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['â†‘ Up', 'â†’ Right', 'â†“ Down', 'â† Left'],
      correct: null,
    },
    solution: [
      createRepeatCommand(3, ['F']),
      'C',
      'F',
    ],
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    targetCommands: 4,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: false,
    allowCollect: true,
    repeatDefaults: { times: 3 },
  },
  {
    id: 11,
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
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level7',
    targetCommands: 6,
    uncertainRadio: false,
    allowRepeat: true,
    repeatDefaults: { times: 2 },
  },
  {
    id: 12,
    name: 'Repeat Builder',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L8_START },
    lumaFacing: 'east',
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
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level8',
    targetCommands: 10,
    uncertainRadio: false,
    allowRepeat: true,
    repeatDefaults: { times: 2 },
  },
  {
    id: 13,
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
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level9',
    targetCommands: 9,
    uncertainRadio: true,
    allowRepeat: true,
    repeatDefaults: { times: 2 },
  },
  {
    id: 14,
    name: 'Loop + Fragment Mastery',
    world: 'forest-trail',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L10_START },
    lumaFacing: 'east',
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
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: true,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level10',
    targetCommands: 14,
    uncertainRadio: false,
    allowRepeat: true,
    repeatDefaults: { times: 2 },
  },
  {
    id: 15,
    name: 'IF Turn Helper',
    world: 'repair-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 0, y: 3 },
    lumaFacing: 'north',
    goal: { x: 4, y: 1 },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['â†‘ Up', 'â†’ Right', 'â†“ Down', 'â† Left'],
      correct: null,
    },
    solution: null,
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level15',
    targetCommands: 4,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: true,
    allowCollect: false,
    defaultIfPathCondition: 'right',
    repeatDefaults: { times: 6 },
  },
  {
    id: 16,
    name: 'IF U-Turn Path',
    world: 'repair-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 4, y: 4 },
    lumaFacing: 'west',
    goal: { x: 4, y: 2 },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['â†‘ Up', 'â†’ Right', 'â†“ Down', 'â† Left'],
      correct: null,
    },
    solution: null,
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level16',
    targetCommands: 4,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: true,
    allowCollect: false,
    defaultIfPathCondition: 'right',
    repeatDefaults: { times: 8 },
  },
  {
    id: 17,
    name: 'Repair Site Logic',
    world: 'repair-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L12_START },
    lumaFacing: 'east',
    goal: { ...L12_GOAL },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: null,
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level12',
    targetCommands: 5,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: true,
    allowCollect: true,
    repeatDefaults: { times: 2 },
  },
  {
    id: 18,
    name: 'IF/ELSE Turn Choice',
    world: 'repair-site',
    tutorial: true,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 0, y: 0 },
    lumaFacing: 'east',
    goal: { x: 2, y: 3 },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: null,
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level18',
    targetCommands: 4,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: true,
    allowCollect: false,
    defaultIfPathCondition: 'ahead',
    repeatDefaults: { times: 2 },
    useIfElse: true,
    requireElse: true,
  },
  {
    id: 19,
    name: 'IF/ELSE Fragment Corridor',
    world: 'repair-site',
    tutorial: true,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 0, y: 4 },
    lumaFacing: 'north',
    goal: { x: 4, y: 4 },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['â†‘ Up', 'â†’ Right', 'â†“ Down', 'â† Left'],
      correct: null,
    },
    solution: null,
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level19',
    targetCommands: 5,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: true,
    allowCollect: true,
    defaultIfPathCondition: 'ahead',
    repeatDefaults: { times: 2 },
    useIfElse: true,
    requireElse: true,
  },
  {
    id: 20,
    name: 'Nested IF/ELSE Trail',
    world: 'repair-site',
    tutorial: true,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 0, y: 0 },
    lumaFacing: 'south',
    goal: { x: 4, y: 3 },
    walls: [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['â†‘ Up', 'â†’ Right', 'â†“ Down', 'â† Left'],
      correct: null,
    },
    solution: null,
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level20',
    targetCommands: 7,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: true,
    allowCollect: true,
    defaultIfPathCondition: 'ahead',
    repeatDefaults: { times: 2 },
    useIfElse: true,
    requireElse: true,
  },
  {
    id: 21,
    name: 'Launch Trace Intro',
    world: 'launch-site',
    tutorial: true,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 0, y: 4 },
    lumaFacing: 'north',
    goal: { x: 3, y: 1 },
    goalVisual: 'ship_core',
    walls: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
    ],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['↑ Up', '→ Right', '↓ Down', '← Left'],
      correct: null,
    },
    solution: [
      createRepeatCommand(7, [
        createIfPathCommand('ahead', ['F'], ['TR']),
      ]),
    ],
    givenProgram: [
      createRepeatCommand(7, [
        createIfPathCommand('ahead', ['F'], ['TR']),
      ]),
    ],
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    targetCommands: 4,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: true,
    allowCollect: false,
    defaultIfPathCondition: 'ahead',
    useIfElse: true,
    requireElse: true,
    traceMode: true,
    hideGoalUntilTraceCorrect: true,
    tracingCorrectCell: { x: 3, y: 1 },
  },
  {
    id: 22,
    name: 'Nested Launch Trace',
    world: 'launch-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 4, y: 0 },
    lumaFacing: 'south',
    goal: { x: 1, y: 2 },
    goalVisual: 'ship_core',
    walls: [
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 4, y: 2 },
      { x: 2, y: 3 },
    ],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['\u2191 Up', '\u2192 Right', '\u2193 Down', '\u2190 Left'],
      correct: null,
    },
    solution: [
      createRepeatCommand(8, [
        createIfPathCommand('ahead', [
          'F',
        ], [
          createIfPathCommand('right', [
            'TR',
          ], [
            'TL',
          ]),
        ]),
      ]),
    ],
    givenProgram: [
      createRepeatCommand(8, [
        createIfPathCommand('ahead', [
          'F',
        ], [
          createIfPathCommand('right', [
            'TR',
          ], [
            'TL',
          ]),
        ]),
      ]),
    ],
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    targetCommands: 6,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: true,
    allowCollect: false,
    defaultIfPathCondition: 'ahead',
    useIfElse: true,
    requireElse: true,
    traceMode: true,
    hideGoalUntilTraceCorrect: true,
    tracingCorrectCell: { x: 1, y: 2 },
  },
  {
    id: 23,
    name: 'Final Launch Trace',
    world: 'launch-site',
    tutorial: true,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { x: 2, y: 0 },
    lumaFacing: 'south',
    goal: { x: 3, y: 4 },
    goalVisual: 'launch_pad',
    walls: [
      { x: 4, y: 1 },
      { x: 0, y: 2 },
      { x: 2, y: 3 },
    ],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: 'Which direction is LUMA facing?',
      options: ['\u2191 Up', '\u2192 Right', '\u2193 Down', '\u2190 Left'],
      correct: null,
    },
    solution: [
      createRepeatCommand(10, [
        createIfPathCommand('ahead', [
          'F',
        ], [
          createIfPathCommand('left', [
            'TL',
          ], [
            'TR',
          ]),
        ]),
      ]),
    ],
    givenProgram: [
      createRepeatCommand(10, [
        createIfPathCommand('ahead', [
          'F',
        ], [
          createIfPathCommand('left', [
            'TL',
          ], [
            'TR',
          ]),
        ]),
      ]),
    ],
    predictionPrompt: false,
    mirrorControls: false,
    strategyCardAfter: false,
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    targetCommands: 6,
    uncertainRadio: false,
    allowRepeat: true,
    allowIfPath: true,
    allowCollect: false,
    defaultIfPathCondition: 'ahead',
    useIfElse: true,
    requireElse: true,
    traceMode: true,
    hideGoalUntilTraceCorrect: true,
    tracingCorrectCell: { x: 3, y: 4 },
  },
]
