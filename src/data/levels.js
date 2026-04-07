// levels.js — ship_part = collectible waypoint, walls = rock obstacles that block LUMA
// lumaFacing: 'random-NE' means useGameState will pick north OR east randomly.
//
// LEVEL GEOMETRY (verified via BFS):
//   L1: start=(0,2) east  → goal=(3,2)  → F F F            (3 cmds, 0 turns)
//   L2: start=(2,2) N/E   → goal=(4,0)  → F F T F F        (5 cmds, 1 turn) ✓ both facings
//   L3: start=(1,3) N/E   → goal=(3,0)  → 7 cmds           ✓ both facings, 1 part at (2,2)
//   L4: start=(0,4) N/E   → goal=(4,0)  → F F F F T F F F F (9 cmds, 1 turn) ✓ both facings
//       Parts placed ALONG the facing-specific optimal path so they're collected on the way.
//
// RANDOMIZATION:
//   Rocks are still randomly placed (adjacent & non-adjacent pools).
//   Ship parts in L3 are fixed at (2,2) — on the optimal path for both north and east.
//   Ship parts in L4 are chosen based on facing so they sit on the optimal path.
//   All rock placement uses BFS to verify the target command count is preserved.
//
// NO COMMAND LIMIT: Children can type as many commands as they want.
//   targetCommands shows the "best solution" hint only.

export const TILE_SIZE = 80

// Level-specific constants
const L1_START = { x: 0, y: 2 }
const L1_GOAL  = { x: 3, y: 2 }

const L2_START = { x: 2, y: 2 }
const L2_GOAL  = { x: 4, y: 0 }

const L3_START = { x: 1, y: 3 }
const L3_GOAL  = { x: 3, y: 0 }

const L4_START = { x: 0, y: 4 }
const L4_GOAL  = { x: 4, y: 0 }

const COLS = 5
const ROWS = 5

const DIRECTIONS = ['north', 'east', 'south', 'west']
const MOVE_DELTAS = {
  north: { x: 0, y: -1 },
  east:  { x: 1,  y: 0  },
  south: { x: 0,  y: 1  },
  west:  { x: -1, y: 0  },
}

const MAX_RETRIES = 300

function tileKey(x, y) { return `${x},${y}` }

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Returns the tile one step in `facing` direction from pos
function stepTile(pos, facing) {
  const d = MOVE_DELTAS[facing]
  return { x: pos.x + d.x, y: pos.y + d.y }
}

// Returns tiles adjacent to pos that are in-bounds, not blocked, and not a special tile
function adjacentTiles(pos, blocked = new Set()) {
  return ['north', 'east', 'south', 'west'].map(f => stepTile(pos, f)).filter(t =>
    t.x >= 0 && t.x < COLS && t.y >= 0 && t.y < ROWS &&
    !blocked.has(tileKey(t.x, t.y))
  )
}

// Visible adjacent tiles: front, left, right (not behind)
function visibleAdjacentTiles(pos, facing, blocked = new Set()) {
  const oppFacing = { north: 'south', south: 'north', east: 'west', west: 'east' }[facing]
  const behind = stepTile(pos, oppFacing)
  return adjacentTiles(pos, blocked).filter(
    t => !(t.x === behind.x && t.y === behind.y)
  )
}

// ── BFS: compute optimal command sequence ────────────────────────────────────
function computeOptimalSolution(lumaStart, goal, walls, objects, initialFacing = 'north') {
  const shipParts  = objects.filter(o => o.type === 'ship_part')
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

// ── Level 1 ───────────────────────────────────────────────────────────────────
// Exactly 3 FORWARD commands, no rocks, no ship parts, no identify phase.
// LUMA starts at (0,2) facing east. Goal at (3,2).
// Solution: F F F
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

// ── Level 2 ───────────────────────────────────────────────────────────────────
// Exactly 5 commands, exactly 1 turn.
// start=(2,2), goal=(4,0). Facing: north or east (random).
//   north: F F TR F F  (goes (2,1)(2,0) TR (3,0)(4,0)) ✓
//   east:  F F TL F F  (goes (3,2)(4,2) TL (4,1)(4,0)) ✓
// 1 rock placed adjacent/visible — for SPT challenge, doesn't block optimal path.
export function generateLevel2Layout(facing = 'north') {
  const lumaStart = L2_START
  const goal      = L2_GOAL

  // Optimal paths for each facing — rocks must NOT sit on these tiles
  const NORTH_PATH = [{x:2,y:1},{x:2,y:0},{x:3,y:0},{x:4,y:0}]
  const EAST_PATH  = [{x:3,y:2},{x:4,y:2},{x:4,y:1},{x:4,y:0}]
  const optimalPath = facing === 'east' ? EAST_PATH : NORTH_PATH
  const pathKeys = new Set(optimalPath.map(t => tileKey(t.x, t.y)))

  const reserved = new Set([
    tileKey(lumaStart.x, lumaStart.y),
    tileKey(goal.x, goal.y),
  ])

  // Visible adjacent tiles that are NOT on the optimal path
  const candidates = visibleAdjacentTiles(lumaStart, facing, reserved).filter(
    t => !pathKeys.has(tileKey(t.x, t.y))
  )

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const pool = shuffle(candidates)
    if (!pool.length) break

    const rock = pool[0]
    const walls = [{ x: rock.x, y: rock.y }]
    const solution = computeOptimalSolution(lumaStart, goal, walls, [], facing)

    if (solution && solution.length === 5) {
      return { walls, objects: [], solution }
    }
  }

  // Fallback: no rock (open field), guaranteed 5-step solution
  const fallbackSolution = computeOptimalSolution(lumaStart, goal, [], [], facing)
  return { walls: [], objects: [], solution: fallbackSolution || ['F', 'F', 'TR', 'F', 'F'] }
}

// ── Level 3 ───────────────────────────────────────────────────────────────────
// Exactly 7 commands.
// start=(1,3), goal=(3,0). Facing: north or east (random).
// 1 ship_part at (2,2) — on the optimal path for BOTH facings.
//   north + part(2,2): F TR F F TL F F = 7 ✓
//   east  + part(2,2): F TL F F F TR F = 7 ✓
// 2 rocks placed: 1 visible-adjacent, 1 elsewhere (not on optimal path).
export function generateLevel3Layout(facing = 'north') {
  const lumaStart = L3_START
  const goal      = L3_GOAL

  // Ship part is fixed at (2,2) — verified to give 7 for both north and east
  const FIXED_PART = { type: 'ship_part', x: 2, y: 2 }
  const objects    = [FIXED_PART]

  // Optimal paths (with part collected)
  const NORTH_PATH = [{x:1,y:2},{x:2,y:2},{x:3,y:2},{x:2,y:1},{x:2,y:0},{x:3,y:0}]
  const EAST_PATH  = [{x:2,y:3},{x:2,y:2},{x:2,y:1},{x:2,y:0},{x:3,y:0}]
  const optimalPath = facing === 'east' ? EAST_PATH : NORTH_PATH
  const pathKeys = new Set(optimalPath.map(t => tileKey(t.x, t.y)))
  pathKeys.add(tileKey(FIXED_PART.x, FIXED_PART.y))

  const reserved = new Set([
    tileKey(lumaStart.x, lumaStart.y),
    tileKey(goal.x, goal.y),
    tileKey(FIXED_PART.x, FIXED_PART.y),
  ])

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Rock 1: visible adjacent, not on optimal path
    const adjCandidates = visibleAdjacentTiles(lumaStart, facing, reserved).filter(
      t => !pathKeys.has(tileKey(t.x, t.y))
    )
    const rock1 = shuffle(adjCandidates)[0]
    if (!rock1) continue

    const reserved2 = new Set([...reserved, tileKey(rock1.x, rock1.y)])

    // Rock 2: any free tile not on optimal path, not adjacent to start
    const allCandidates = shuffle(
      Array.from({ length: ROWS }, (_, y) =>
        Array.from({ length: COLS }, (_, x) => ({ x, y }))
      ).flat().filter(t =>
        !reserved2.has(tileKey(t.x, t.y)) &&
        !pathKeys.has(tileKey(t.x, t.y))
      )
    )
    const rock2 = allCandidates[0]
    if (!rock2) continue

    const walls = [
      { x: rock1.x, y: rock1.y },
      { x: rock2.x, y: rock2.y },
    ]
    const solution = computeOptimalSolution(lumaStart, goal, walls, objects, facing)

    if (solution && solution.length === 7) {
      return { walls, objects, solution }
    }
  }

  // Fallback: no walls, guaranteed 7-step solution
  const fallbackSolution = computeOptimalSolution(lumaStart, goal, [], objects, facing)
  return {
    walls: [],
    objects,
    solution: fallbackSolution || ['F', 'TR', 'F', 'F', 'TL', 'F', 'F'],
  }
}

// ── Level 4 ───────────────────────────────────────────────────────────────────
// Exactly 9 commands.
// start=(0,4), goal=(4,0). Facing: north or east (random).
//   north: F F F F TR F F F F = 9 ✓ (path: up col 0, then right row 0)
//   east:  F F F F TL F F F F = 9 ✓ (path: right row 4, then up col 4)
// 2 ship_parts placed ALONG the facing-specific optimal path (collected on the way → still 9).
// 3 rocks placed off the optimal path.
export function generateLevel4Layout(facing = 'north') {
  const lumaStart = L4_START
  const goal      = L4_GOAL

  // Optimal paths per facing (cells traversed in order)
  // north: (0,4)→(0,3)→(0,2)→(0,1)→(0,0) TR→(1,0)→(2,0)→(3,0)→(4,0)
  // east:  (0,4)→(1,4)→(2,4)→(3,4)→(4,4) TL→(4,3)→(4,2)→(4,1)→(4,0)
  const NORTH_PATH_CELLS = [
    {x:0,y:3},{x:0,y:2},{x:0,y:1},{x:0,y:0},
    {x:1,y:0},{x:2,y:0},{x:3,y:0},
  ]
  const EAST_PATH_CELLS = [
    {x:1,y:4},{x:2,y:4},{x:3,y:4},{x:4,y:4},
    {x:4,y:3},{x:4,y:2},{x:4,y:1},
  ]

  const pathCells = facing === 'east' ? EAST_PATH_CELLS : NORTH_PATH_CELLS
  const pathKeys  = new Set(pathCells.map(t => tileKey(t.x, t.y)))

  // Pick 2 ship parts from path cells (randomly shuffled each time)
  function pickParts() {
    const available = shuffle([...pathCells])
    return [
      { type: 'ship_part', x: available[0].x, y: available[0].y },
      { type: 'ship_part', x: available[1].x, y: available[1].y },
    ]
  }

  const reserved = new Set([
    tileKey(lumaStart.x, lumaStart.y),
    tileKey(goal.x, goal.y),
  ])

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const objects = pickParts()
    const partKeys = new Set(objects.map(o => tileKey(o.x, o.y)))
    const fullReserved = new Set([...reserved, ...partKeys])

    // Rock 1: visible adjacent, NOT on path
    const adjCandidates = visibleAdjacentTiles(lumaStart, facing, fullReserved).filter(
      t => !pathKeys.has(tileKey(t.x, t.y))
    )
    const rock1 = shuffle(adjCandidates)[0]
    if (!rock1) continue

    const res2 = new Set([...fullReserved, tileKey(rock1.x, rock1.y)])

    // Rocks 2 & 3: anywhere not on path and not reserved
    const offPathPool = shuffle(
      Array.from({ length: ROWS }, (_, y) =>
        Array.from({ length: COLS }, (_, x) => ({ x, y }))
      ).flat().filter(t =>
        !res2.has(tileKey(t.x, t.y)) &&
        !pathKeys.has(tileKey(t.x, t.y))
      )
    )
    if (offPathPool.length < 2) continue
    const rock2 = offPathPool[0]
    const rock3 = offPathPool[1]

    const walls = [
      { x: rock1.x, y: rock1.y },
      { x: rock2.x, y: rock2.y },
      { x: rock3.x, y: rock3.y },
    ]
    const solution = computeOptimalSolution(lumaStart, goal, walls, objects, facing)

    if (solution && solution.length === 9) {
      return { walls, objects, solution }
    }
  }

  // Fallback: no rocks, fixed parts on path
  const objects = facing === 'east'
    ? [{ type: 'ship_part', x: 2, y: 4 }, { type: 'ship_part', x: 4, y: 2 }]
    : [{ type: 'ship_part', x: 0, y: 2 }, { type: 'ship_part', x: 2, y: 0 }]
  const fallbackSolution = computeOptimalSolution(lumaStart, goal, [], objects, facing)
  return {
    walls: [],
    objects,
    solution: fallbackSolution || ['F','F','F','F','TR','F','F','F','F'],
  }
}

// ── Level templates (layout generated at runtime in useGameState) ─────────────
export const LEVELS = [
  // ── LEVEL 1 ── 3 forward commands, no rocks, no visor flip, no identify phase
  {
    id: 1,
    name: 'Level 1',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L1_START },
    lumaFacing: 'east',
    goal: { ...L1_GOAL },
    walls:   [],
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
    skipIdentify: true,          // skip Phase 1, go straight to Phase 2
    noRadio: true,               // hide helmet radio on Level 1
    layoutGenerator: 'level1',
    targetCommands: 3,           // "best solution" hint only — not a hard cap
  },

  // ── LEVEL 2 ── 5 commands, 1 turn, 1 adjacent rock, no visor flip
  {
    id: 2,
    name: 'Level 2',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L2_START },
    lumaFacing: 'random-NE',     // north or east only (both give 5-cmd solution)
    goal: { ...L2_GOAL },
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
    noVisorFlip: true,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level2',
    targetCommands: 5,
  },

  // ── LEVEL 3 ── 7 commands, visor flip enabled, 2 rocks + 1 ship_part
  {
    id: 3,
    name: 'Level 3',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L3_START },
    lumaFacing: 'random-NE',
    goal: { ...L3_GOAL },
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
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level3',
    targetCommands: 7,
    uncertainRadio: true,
  },

  // ── LEVEL 4 ── 9 commands, visor flip, 3 rocks + 2 ship_parts + prediction prompt
  {
    id: 4,
    name: 'Level 4',
    world: 'crash-site',
    tutorial: false,
    grid: { cols: COLS, rows: ROWS },
    lumaStart: { ...L4_START },
    lumaFacing: 'random-NE',
    goal: { ...L4_GOAL },
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
    noVisorFlip: false,
    skipIdentify: false,
    noRadio: false,
    layoutGenerator: 'level4',
    targetCommands: 9,
  },
]