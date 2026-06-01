// levels.js - Crash Site and Forest Trail layouts.
// Ship parts are collectible waypoints; walls are rock obstacles that block LUMA.
//
import { createIfPathCommand, createRepeatCommand } from '../utils/commands'

// Crash Site design targets for this pass:
//   L1: fixed, 3 commands, no rocks, no fragments, no identify
//   L2: fixed, 4 commands, 1 rock, no identify, no fragments
//   L3: fixed, 5 commands, 1 rock, identify starts, no fragments
//   L4: fixed, 7 commands, 2 rocks, identify practice, no fragments
//   L5: fixed, 8 commands, 2 rocks, 1 fragment, strategy card after
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

export function generateLevel2Layout() {
  return {
    walls: [
      { x: 2, y: 2 },
    ],
    objects: [],
    solution: ['F', 'TR', 'F', 'F'],
    lumaStart: { ...L2_START },
    goal: { ...L2_GOAL },
    lumaFacing: 'north',
  }
}

export function generateLevel3Layout() {
  return {
    walls: [
      { x: 2, y: 3 },
    ],
    objects: [],
    solution: ['F', 'TR', 'F', 'F', 'F'],
    lumaStart: { ...L3_START },
    goal: { ...L3_GOAL },
    lumaFacing: 'north',
  }
}

export function generateLevel4Layout() {
  return {
    walls: [
      { x: 1, y: 2 },
      { x: 4, y: 2 },
    ],
    objects: [],
    solution: ['F', 'F', 'TL', 'F', 'F', 'TR', 'F'],
    lumaStart: { ...L4_START },
    goal: { ...L4_GOAL },
    lumaFacing: 'east',
  }
}

export function generateLevel5Layout() {
  return {
    walls: [
      { x: 2, y: 3 },
      { x: 3, y: 1 },
    ],
    objects: [
      { type: 'ship_part', x: 3, y: 2 },
    ],
    solution: ['F', 'TR', 'F', 'F', 'C', 'F', 'TL', 'F'],
    lumaStart: { ...L5_START },
    goal: { ...L5_GOAL },
    lumaFacing: 'north',
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
    lumaFacing: 'north',
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
    lumaFacing: 'north',
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
    lumaFacing: 'east',
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
    lumaFacing: 'north',
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
    noVisorFlip: false,
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
    noVisorFlip: false,
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
