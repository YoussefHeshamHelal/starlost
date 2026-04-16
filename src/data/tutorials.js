function levelStep(id, config) {
  return { id, scope: 'level', ...config }
}

function featureStep(id, featureKey, config) {
  return { id, scope: 'feature', featureKey, ...config }
}

function hasRepeatBlock(sequence = []) {
  return sequence.some(command => command && typeof command === 'object' && command.type === 'REPEAT')
}

export const LEVEL_TUTORIALS = {
  1: [
    levelStep('level-1-welcome', {
      targetId: 'level-title',
      placement: 'bottom',
      title: 'Meet LUMA',
      body: 'This is LUMA. We help her get home.',
      nextLabel: 'Let\'s go',
    }),
    levelStep('level-1-grid', {
      targetId: 'grid-panel',
      placement: 'right',
      title: 'This is the map',
      body: 'The scan shows where LUMA can move.',
    }),
    levelStep('level-1-luma', {
      targetId: 'luma-marker',
      placement: 'right',
      title: 'Here is LUMA',
      body: 'She starts on this tile.',
    }),
    levelStep('level-1-goal', {
      targetId: 'goal-marker',
      placement: 'left',
      title: 'Here is home',
      body: 'Guide LUMA to the glowing ship core.',
    }),
    levelStep('level-1-palette', {
      targetId: 'command-palette',
      placement: 'left',
      title: 'These are commands',
      body: 'Tap a command to build LUMA\'s plan.',
    }),
    levelStep('level-1-forward', {
      targetId: 'command-forward',
      placement: 'bottom',
      title: 'FORWARD means move ahead',
      body: 'Tap FORWARD to add one step.',
      requiresAction: true,
      actionLabel: 'Tap FORWARD',
      completeWhen: ({ sequence }) => sequence.filter(cmd => cmd === 'F').length >= 1,
    }),
    levelStep('level-1-sequence', {
      targetId: 'sequence-area',
      placement: 'left',
      title: 'Your plan goes here',
      body: 'Each block joins LUMA\'s path.',
    }),
    levelStep('level-1-build-three', {
      targetId: 'command-forward',
      placement: 'bottom',
      title: 'Add three FORWARD blocks',
      body: 'This level needs three tiny moves.',
      requiresAction: true,
      actionLabel: 'Add 3 FORWARD blocks',
      completeWhen: ({ sequence }) => sequence.length >= 3,
    }),
    levelStep('level-1-reset', {
      targetId: 'command-builder',
      placement: 'left',
      title: 'Need another try?',
      body: 'If something goes wrong, use Reset and try again.',
      nextLabel: 'Okay',
    }),
    levelStep('level-1-preview', {
      targetId: 'level-title',
      placement: 'bottom',
      title: 'More puzzles are coming',
      body: 'Later you will use turns, radio clues, and ship fragments too.',
      nextLabel: 'I\'m ready',
    }),
    levelStep('level-1-run', {
      targetId: 'run-button',
      placement: 'top',
      title: 'Press Run',
      body: 'Now let LUMA follow your plan.',
      requiresAction: true,
      actionLabel: 'Press Run',
      completeWhen: ({ phase }) => phase === 'success',
      closeWhen: ({ needsReset }) => needsReset,
    }),
    levelStep('level-1-success', {
      targetId: 'success-card',
      placement: 'bottom',
      title: 'You did it!',
      body: 'Nice job helping LUMA reach home.',
      waitForTarget: true,
      nextLabel: 'Yay!',
    }),
  ],
}

export const FEATURE_TUTORIALS = {
  'luma-confused': [
    featureStep('luma-confused-intro', 'luma-confused', {
      targetId: 'luma-marker',
      placement: 'right',
      title: 'LUMA feels turned around',
      body: 'LUMA is confused and does not know which way she is facing. Help her figure it out.',
      nextLabel: 'I can help',
    }),
  ],
  'helmet-radio': [
    featureStep('helmet-radio-intro', 'helmet-radio', {
      targetId: 'radio-panel',
      placement: 'bottom',
      title: 'Helmet Radio',
      body: 'LUMA sends a clue here. Read it first.',
      nextLabel: 'Got it',
    }),
  ],
  'identify-phase': [
    featureStep('identify-phase-intro', 'identify-phase', {
      targetId: 'phase-badge',
      placement: 'bottom',
      title: 'First, identify',
      body: 'Figure out which way LUMA is facing before you plan moves.',
      nextLabel: 'Okay',
    }),
  ],
  'facing-question': [
    featureStep('facing-question-intro', 'facing-question', {
      targetId: 'spt-panel',
      placement: 'right',
      offsetY: -150,
      title: 'Pick LUMA\'s direction',
      body: 'Listen to the clue and tap the arrow that matches LUMA.',
      requiresAction: true,
      actionLabel: 'Pick the correct arrow',
      completeWhen: ({ phase }) => phase === 'develop',
    }),
  ],
  'rock-obstacle': [
    featureStep('rock-obstacle-intro', 'rock-obstacle', {
      targetId: 'rock-tile',
      placement: 'right',
      title: 'Rocks block the path',
      body: 'LUMA cannot walk through rocks.',
      nextLabel: 'Okay',
    }),
  ],
  'turn-commands': [
    featureStep('turn-commands-intro', 'turn-commands', {
      targetId: 'command-palette',
      placement: 'left',
      title: 'Now you may need a turn',
      body: 'FORWARD is not enough anymore. Use left or right turns too.',
      waitForTarget: true,
      nextLabel: 'Show me',
    }),
  ],
  'uncertain-radio': [
    featureStep('uncertain-radio-intro', 'uncertain-radio', {
      targetId: 'radio-panel',
      placement: 'bottom',
      title: 'This clue sounds fuzzy',
      body: 'Sometimes LUMA sounds unsure. The clue may need a closer look.',
      nextLabel: 'Okay',
    }),
  ],
  'visor-flip': [
    featureStep('visor-flip-intro', 'visor-flip', {
      targetId: 'visor-flip-button',
      placement: 'top',
      title: 'Try Visor Flip now!',
      body: 'Tap Visor Flip so you can see what LUMA sees.',
      requiresAction: true,
      actionLabel: 'Turn Visor Flip on',
      completeWhen: ({ visorActive }) => visorActive,
    }),
  ],
  'repeat-intro': [
    featureStep('repeat-intro', 'repeat-intro', {
      targetId: 'command-repeat',
      placement: 'left',
      title: 'Repeat helps with patterns',
      body: 'If the same little path happens again, use REPEAT so LUMA can do those blocks again.',
      nextLabel: 'Show me',
    }),
    featureStep('repeat-add-block', 'repeat-intro', {
      targetId: 'command-repeat',
      placement: 'left',
      title: 'Add one Repeat block',
      body: 'Tap REPEAT first, then put the pattern you want inside the block.',
      requiresAction: true,
      actionLabel: 'Add REPEAT',
      completeWhen: ({ sequence }) => hasRepeatBlock(sequence),
    }),
    featureStep('repeat-settings', 'repeat-intro', {
      targetId: 'repeat-block-counter',
      placement: 'top',
      title: 'Tune the Repeat block',
      body: 'Change the number at the top to choose how many times LUMA repeats the blocks inside.',
      waitForTarget: true,
      nextLabel: 'Got it',
    }),
  ],
  'repeat-builder': [
    featureStep('repeat-builder-intro', 'repeat-builder', {
      targetId: 'sequence-area',
      placement: 'left',
      title: 'Some blocks stay outside Repeat',
      body: 'Use normal blocks before or after REPEAT when the whole path is not the same.',
      nextLabel: 'Okay',
    }),
  ],
  'ship-fragments': [
    featureStep('ship-fragments-intro', 'ship-fragments', {
      targetId: 'ship-fragment-tile',
      placement: 'right',
      title: 'Collect ship fragments',
      body: 'Pick up every glowing ship piece on the map.',
      showWhen: ({ visorActive }) => !visorActive,
      nextLabel: 'Got it',
    }),
  ],
  'collect-all-fragments': [
    featureStep('collect-all-fragments-intro', 'collect-all-fragments', {
      targetId: 'goal-marker',
      placement: 'left',
      title: 'Do not finish too early',
      body: 'Get all ship fragments before you reach the ship core.',
      showWhen: ({ visorActive }) => !visorActive,
      nextLabel: 'Okay',
    }),
  ],
  'fog': [
    featureStep('fog-intro', 'fog', {
      targetId: 'fog-area',
      placement: 'right',
      title: 'Fog hides tiles',
      body: 'Now you cannot see everything. Use clues and careful planning.',
      nextLabel: 'I see',
    }),
  ],
  'prediction': [
    featureStep('prediction-intro', 'prediction', {
      targetId: 'prediction-banner',
      placement: 'left',
      title: 'Prediction Challenge',
      body: 'This box asks you to guess where LUMA will stop before you run.',
      showWhen: ({ phase }) => phase === 'develop',
      waitForTarget: true,
      nextLabel: 'Okay',
    }),
  ],
}

const LEVEL_FEATURE_ORDER = {
  2: ['rock-obstacle', 'turn-commands'],
  3: ['luma-confused', 'helmet-radio', 'identify-phase', 'facing-question'],
  5: ['ship-fragments', 'collect-all-fragments'],
  7: ['repeat-intro'],
  8: ['repeat-builder'],
  9: ['uncertain-radio', 'visor-flip'],
  10: ['ship-fragments', 'collect-all-fragments'],
}

export function getTutorialFeatureKeys(levelConfig, effectiveLevel) {
  const ordered = LEVEL_FEATURE_ORDER[levelConfig.id] ?? []
  return ordered.filter((featureKey) => {
    if (featureKey === 'luma-confused') return levelConfig.id === 3
    if (featureKey === 'helmet-radio') return !levelConfig.noRadio
    if (featureKey === 'identify-phase') return !levelConfig.skipIdentify
    if (featureKey === 'facing-question') return Boolean(levelConfig.sptQuestion)
    if (featureKey === 'rock-obstacle') return (effectiveLevel?.walls?.length ?? 0) > 0
    if (featureKey === 'turn-commands') return levelConfig.id >= 2
    if (featureKey === 'uncertain-radio') return Boolean(levelConfig.uncertainRadio)
    if (featureKey === 'visor-flip') return !levelConfig.noVisorFlip
    if (featureKey === 'repeat-intro') return Boolean(levelConfig.allowRepeat)
    if (featureKey === 'repeat-builder') return Boolean(levelConfig.allowRepeat)
    if (featureKey === 'ship-fragments') {
      return (effectiveLevel?.objects ?? []).some(objectItem => objectItem.type === 'ship_part')
    }
    if (featureKey === 'collect-all-fragments') {
      return (effectiveLevel?.objects ?? []).some(objectItem => objectItem.type === 'ship_part')
    }
    if (featureKey === 'fog') return Boolean(levelConfig.fog)
    if (featureKey === 'prediction') return Boolean(levelConfig.predictionPrompt)
    return false
  })
}

export function getLevelTutorialSteps(levelId) {
  return LEVEL_TUTORIALS[levelId] ?? []
}

export function getFeatureTutorialSteps(featureKeys) {
  return featureKeys.flatMap(featureKey => FEATURE_TUTORIALS[featureKey] ?? [])
}
