// levels.js — ship_part = collectible waypoint, walls = rock obstacles that block LUMA
// lumaFacing: 'random' means useGameState will pick a random direction each load.
// helmetReport and sptQuestion.correct are computed dynamically in useGameState.
//
// LUMA always starts at (1,3). The goal is always at (4,0).
//
// FACING CONSTRAINT (all levels):
//   The first "adjacent" rock/ship_part is placed only in FRONT, LEFT, or RIGHT of LUMA —
//   never BEHIND, because you can't see what's behind you.
//   Since facing is random and resolved at runtime (useGameState), the level layout
//   generators are exported as *factory functions* that receive the resolved facing.
//   useGameState calls generateLevelLayout(facing) when it first runs.
//
// Level 1: exactly 1 rock adjacent to LUMA (front/left/right only). No ship parts.
// Level 2: exactly 2 rocks + 1 ship_part.
//   - Rock 1: front/left/right of LUMA's start.
//   - Rock 2: randomly placed anywhere non-adjacent.
//   - Ship_part: randomly placed anywhere valid (fully random).
// Level 3: exactly 3 rocks + 2 ship_parts + prediction prompt.
//   - Rock 1: front/left/right of LUMA's start.
//   - Rocks 2-3: randomly placed in non-adjacent pool.
//   - Ship_parts: 2 placed in remaining free tiles.
//   - predictionPrompt: true — child taps where LUMA will end up before running.

export const TILE_SIZE = 80

const LUMA_START = { x: 1, y: 3 }
const GOAL       = { x: 4, y: 0 }
const COLS = 5
const ROWS = 5

const DIRECTIONS = ['north', 'east', 'south', 'west']
const MOVE_DELTAS = {
  north: { x: 0, y: -1 },
  east:  { x: 1,  y: 0  },
  south: { x: 0,  y: 1  },
  west:  { x: -1, y: 0  },
}

// All 4-directional neighbours of LUMA's start (in-bounds, not the goal)
const ALL_ADJACENT_TO_START = [
  { x: 1, y: 2 }, // north
  { x: 2, y: 3 }, // east
  { x: 1, y: 4 }, // south
  { x: 0, y: 3 }, // west
].filter(t =>
  t.x >= 0 && t.x < COLS && t.y >= 0 && t.y < ROWS &&
  !(t.x === GOAL.x && t.y === GOAL.y)
)

// Returns the tile that is BEHIND LUMA given a facing
function getBehindTile(facing) {
  // The tile behind is in the opposite direction of facing
  const opposite = { north: 'south', south: 'north', east: 'west', west: 'east' }
  const delta = MOVE_DELTAS[opposite[facing]]
  return { x: LUMA_START.x + delta.x, y: LUMA_START.y + delta.y }
}

// Returns adjacent tiles that are VISIBLE (front, left, right — not behind)
function getVisibleAdjacentTiles(facing) {
  const behind = getBehindTile(facing)
  return ALL_ADJACENT_TO_START.filter(
    t => !(t.x === behind.x && t.y === behind.y)
  )
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function tileKey(x, y) { return `${x},${y}` }

// ── BFS to compute the optimal command sequence ──────────────────────────────
function computeOptimalSolution(lumaStart, goal, walls, objects, initialFacing = 'north') {
  const shipParts = objects.filter(o => o.type === 'ship_part')
  const allCollected = (1 << shipParts.length) - 1

  const encodeState = (x, y, facing, collected) =>
    `${x},${y},${facing},${collected}`

  const startState = {
    x: lumaStart.x, y: lumaStart.y,
    facing: initialFacing, collected: 0, path: [],
  }

  const visited = new Set()
  visited.add(encodeState(startState.x, startState.y, startState.facing, startState.collected))
  const queue = [startState]

  while (queue.length > 0) {
    const cur = queue.shift()

    if (cur.x === goal.x && cur.y === goal.y && cur.collected === allCollected) {
      return cur.path
    }

    for (const cmd of ['F', 'TL', 'TR']) {
      let nx = cur.x, ny = cur.y, nf = cur.facing, nc = cur.collected

      if (cmd === 'TL') {
        const idx = DIRECTIONS.indexOf(nf)
        nf = DIRECTIONS[(idx + 3) % 4]
      } else if (cmd === 'TR') {
        const idx = DIRECTIONS.indexOf(nf)
        nf = DIRECTIONS[(idx + 1) % 4]
      } else {
        const delta = MOVE_DELTAS[nf]
        const px = nx + delta.x
        const py = ny + delta.y
        if (px < 0 || px >= COLS || py < 0 || py >= ROWS) continue
        if (walls.some(w => w.x === px && w.y === py)) continue
        nx = px; ny = py
        shipParts.forEach((part, i) => {
          if (part.x === nx && part.y === ny) nc = nc | (1 << i)
        })
      }

      const key = encodeState(nx, ny, nf, nc)
      if (!visited.has(key)) {
        visited.add(key)
        queue.push({ x: nx, y: ny, facing: nf, collected: nc, path: [...cur.path, cmd] })
      }
    }
  }

  return null
}

// ── Layout generators (facing-aware) ─────────────────────────────────────────

// Level 1: 1 rock in front/left/right of LUMA (never behind), no ship parts
export function generateLevel1Layout(facing = 'north') {
  const visibleAdjacent = getVisibleAdjacentTiles(facing)
  const rock = shuffle(visibleAdjacent)[0]
  const walls = [{ x: rock.x, y: rock.y }]
  const objects = []
  const solution = computeOptimalSolution(LUMA_START, GOAL, walls, objects, facing)
  return { walls, objects, solution }
}

// Level 2: 1 visible-adjacent rock + 1 non-adjacent rock + 1 ship_part
export function generateLevel2Layout(facing = 'north') {
  const occupied = new Set([
    tileKey(LUMA_START.x, LUMA_START.y),
    tileKey(GOAL.x, GOAL.y),
  ])

  // Rock 1 — front/left/right of LUMA
  const visibleAdjacent = getVisibleAdjacentTiles(facing)
  const rock1 = shuffle(visibleAdjacent)[0]
  occupied.add(tileKey(rock1.x, rock1.y))

  // All adjacent keys (for exclusion of Rock 2)
  const adjacentKeys = new Set(ALL_ADJACENT_TO_START.map(t => tileKey(t.x, t.y)))

  const nonAdjacentPool = shuffle(
    Array.from({ length: ROWS }, (_, y) =>
      Array.from({ length: COLS }, (_, x) => ({ x, y }))
    ).flat().filter(t =>
      !occupied.has(tileKey(t.x, t.y)) &&
      !adjacentKeys.has(tileKey(t.x, t.y))
    )
  )

  // Rock 2 — non-adjacent
  const rock2 = nonAdjacentPool[0]
  occupied.add(tileKey(rock2.x, rock2.y))

  // Ship part — anywhere remaining
  const anyFreePool = shuffle(
    Array.from({ length: ROWS }, (_, y) =>
      Array.from({ length: COLS }, (_, x) => ({ x, y }))
    ).flat().filter(t => !occupied.has(tileKey(t.x, t.y)))
  )
  const part = anyFreePool[0]

  const walls = [{ x: rock1.x, y: rock1.y }, { x: rock2.x, y: rock2.y }]
  const objects = [{ type: 'ship_part', x: part.x, y: part.y }]
  const solution = computeOptimalSolution(LUMA_START, GOAL, walls, objects, facing)
  return { walls, objects, solution }
}

// Level 3: 1 visible-adjacent rock + 2 non-adjacent rocks + 2 ship_parts
export function generateLevel3Layout(facing = 'north') {
  const occupied = new Set([
    tileKey(LUMA_START.x, LUMA_START.y),
    tileKey(GOAL.x, GOAL.y),
  ])

  // Rock 1 — front/left/right of LUMA
  const visibleAdjacent = getVisibleAdjacentTiles(facing)
  const rock1 = shuffle(visibleAdjacent)[0]
  occupied.add(tileKey(rock1.x, rock1.y))

  const adjacentKeys = new Set(ALL_ADJACENT_TO_START.map(t => tileKey(t.x, t.y)))
  const nonAdjacentPool = shuffle(
    Array.from({ length: ROWS }, (_, y) =>
      Array.from({ length: COLS }, (_, x) => ({ x, y }))
    ).flat().filter(t =>
      !occupied.has(tileKey(t.x, t.y)) &&
      !adjacentKeys.has(tileKey(t.x, t.y))
    )
  )

  const rock2 = nonAdjacentPool[0]
  occupied.add(tileKey(rock2.x, rock2.y))
  const rock3 = nonAdjacentPool[1]
  occupied.add(tileKey(rock3.x, rock3.y))

  const anyFreePool = shuffle(
    Array.from({ length: ROWS }, (_, y) =>
      Array.from({ length: COLS }, (_, x) => ({ x, y }))
    ).flat().filter(t => !occupied.has(tileKey(t.x, t.y)))
  )
  const part1 = anyFreePool[0]
  occupied.add(tileKey(part1.x, part1.y))
  const part2 = anyFreePool[1]

  const walls = [
    { x: rock1.x, y: rock1.y },
    { x: rock2.x, y: rock2.y },
    { x: rock3.x, y: rock3.y },
  ]
  const objects = [
    { type: 'ship_part', x: part1.x, y: part1.y },
    { type: 'ship_part', x: part2.x, y: part2.y },
  ]
  const solution = computeOptimalSolution(LUMA_START, GOAL, walls, objects, facing)
  return { walls, objects, solution }
}

// ── Level templates (layout generated at runtime in useGameState) ─────────────
// walls/objects/solution are placeholders — useGameState calls generateLevelXLayout(facing)
// and replaces them after the facing is resolved.

export const LEVELS = [
  {
    id: 1,
    name: 'Level 1',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...LUMA_START },
    lumaFacing: 'random',
    goal: { ...GOAL },
    walls:   [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: "Which direction is LUMA facing?",
      options: ["↑ Up", "→ Right", "↓ Down", "← Left"],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: false,
    // Flag: useGameState will call generateLevel1Layout(facing) on mount
    layoutGenerator: 'level1',
  },
  {
    id: 2,
    name: 'Level 2',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...LUMA_START },
    lumaFacing: 'random',
    goal: { ...GOAL },
    walls:   [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: "Which direction is LUMA facing?",
      options: ["↑ Up", "→ Right", "↓ Down", "← Left"],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: false,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: false,
    layoutGenerator: 'level2',
    // Level 2: uncertain radio message + visor flip reinforcement
    uncertainRadio: true,
  },
  {
    id: 3,
    name: 'Level 3',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...LUMA_START },
    lumaFacing: 'random',
    goal: { ...GOAL },
    walls:   [],
    objects: [],
    fog: false,
    sptQuestion: {
      prompt: "Which direction is LUMA facing?",
      options: ["↑ Up", "→ Right", "↓ Down", "← Left"],
      correct: null,
    },
    solution: null,
    decompositionPrompt: false,
    predictionPrompt: true,
    mirrorControls: false,
    echoPosition: null,
    strategyCardAfter: true,
    layoutGenerator: 'level3',
  },
]