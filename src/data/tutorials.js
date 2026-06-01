function levelStep(id, config) {
  return { id, scope: 'level', ...config }
}

function featureStep(id, featureKey, config) {
  return { id, scope: 'feature', featureKey, ...config }
}

function hasRepeatBlock(sequence = []) {
  return sequence.some(command => command && typeof command === 'object' && command.type === 'REPEAT')
}

function hasIfPathBlock(sequence = []) {
  return sequence.some(command => command && typeof command === 'object' && command.type === 'IF_PATH')
}

export const LEVEL_TUTORIALS = {
  1: [
    levelStep('level-1-welcome', {
      targetId: 'luma-marker',
      placement: 'right',
      title: 'Meet LUMA',
      body: 'This is LUMA. We help her get home.',
      nextLabel: 'Let\'s go',
    }),
    levelStep('level-1-grid', {
      targetId: 'grid-panel',
      placement: 'right',
      title: 'This is the map',
      body: 'The map shows where LUMA can move.',
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
      title: 'These are blocks',
      body: 'Blocks build LUMA\'s plan.',
    }),
    levelStep('level-1-forward', {
      targetId: 'command-forward',
      placement: 'bottom',
      title: 'MOVE FORWARD',
      body: 'This block makes LUMA move forward one step in the direction she is facing.',
      requiresAction: true,
      actionLabel: 'Tap MOVE FORWARD',
      completeWhen: ({ sequence }) => sequence.filter(cmd => cmd === 'F').length >= 1,
    }),
    levelStep('level-1-sequence', {
      targetId: 'sequence-area',
      placement: 'left',
      title: 'Your plan goes here',
      body: 'Each block joins LUMA\'s path.',
    }),
    levelStep('level-1-delete-clear', {
      targetId: 'program-edit-buttons',
      placement: 'bottom',
      title: 'Fix your program',
      body: 'Use Delete to remove the last block. Use Clear to remove all blocks and start again.',
      waitForTarget: true,
      nextLabel: 'Got it',
    }),
    levelStep('level-1-shortest-path', {
      targetId: 'program-block-count',
      placement: 'bottom',
      title: 'Use fewer blocks',
      body: 'This shows your blocks compared with the shortest path. Try to match the number on the right for the best medal.',
      waitForTarget: true,
      nextLabel: 'Got it',
    }),
    levelStep('level-1-luma-speed', {
      targetId: 'luma-speed-control',
      placement: 'bottom',
      title: 'Choose LUMA\'s speed',
      body: 'Use this slider to make LUMA move slower or faster when the program runs.',
      waitForTarget: true,
      nextLabel: 'Got it',
    }),
    levelStep('level-1-build-three', {
      targetId: 'command-forward',
      placement: 'bottom',
      title: 'Add three MOVE FORWARD blocks',
      body: 'This level needs three tiny moves.',
      requiresAction: true,
      actionLabel: 'Add 3 MOVE FORWARD blocks',
      completeWhen: ({ sequence }) => sequence.length >= 3,
    }),
    levelStep('level-1-run', {
      targetId: 'run-button',
      placement: 'top',
      title: 'Press Execute Program',
      body: 'Now let LUMA follow your plan.',
      requiresAction: true,
      actionLabel: 'Press Execute Program',
      completeWhen: ({ phase }) => phase === 'success',
      closeWhen: ({ needsReset }) => needsReset,
    }),
    levelStep('level-1-success', {
      targetId: 'success-card',
      placement: 'bottom',
      title: 'You did it!',
      body: 'Nice job helping LUMA.',
      waitForTarget: true,
      hideBackButton: true,
      hidePrimaryButton: true,
    }),
  ],
  6: [
    levelStep('level-6-trees-block-path', {
      targetId: 'tree-tile',
      placement: 'right',
      title: 'Trees block the path',
      body: 'Trees now replace rocks. They block LUMA\'s path too.',
      waitForTarget: true,
      nextLabel: 'Got it',
    }),
  ],
  7: [
    levelStep('level-7-repeat-forward', {
      targetId: 'command-repeat',
      placement: 'top',
      title: 'Use Repeat for long repeated paths',
      body: 'Instead of adding 4 MOVE FORWARD blocks, use REPEAT 4 (in this level) with MOVE FORWARD inside to move forward 4 steps. This makes the program more efficient.',
      waitForTarget: true,
      nextLabel: 'Got it',
    }),
    levelStep('level-7-blocks-inside-repeat', {
      targetId: 'command-repeat',
      placement: 'top',
      title: 'Blocks go inside Repeat',
      body: 'The blocks you want to repeat are added inside the Repeat block.',
      waitForTarget: true,
      nextLabel: 'Got it',
    }),
  ],
  8: [
    levelStep('level-8-repeat-then-turn', {
      targetId: 'sequence-area',
      placement: 'left',
      title: 'Turns can stay outside',
      body: 'Some blocks stay outside Repeat when the path changes.',
      waitForTarget: true,
      nextLabel: 'Okay',
    }),
  ],
  9: [
    levelStep('level-9-repeat-pattern', {
      targetId: 'command-repeat',
      placement: 'top',
      title: 'Repeat a pattern',
      body: 'Repeat can hold more than one block. Everything inside repeats in order.',
      waitForTarget: true,
      nextLabel: 'I see',
    }),
  ],
  10: [
    levelStep('level-10-repeat-fragment', {
      targetId: 'command-repeat',
      placement: 'top',
      title: 'Repeat to the fragment',
      body: 'Use Repeat to reach the fragment, then Collect.',
      waitForTarget: true,
      nextLabel: 'Ready',
    }),
  ],
  11: [
    levelStep('level-11-repeat-collect-turn', {
      targetId: 'sequence-area',
      placement: 'left',
      title: 'Two small Repeat blocks',
      body: 'Now use two small Repeat blocks: one before collecting and one after turning.',
      waitForTarget: true,
      nextLabel: 'Ready',
    }),
  ],
  15: [
    levelStep('level-15-boxes-block-path', {
      targetId: 'box-tile',
      placement: 'right',
      title: 'Boxes block the path',
      body: 'Boxes now replace trees. They block LUMA\'s path too.',
      waitForTarget: true,
      nextLabel: 'Got it',
    }),
    levelStep('level-15-meet-if-path', {
      targetId: 'command-if-path',
      placement: 'top',
      title: 'Meet IF PATH',
      body: 'IF PATH checks whether LUMA can move in a chosen direction. You can choose ahead, to the left, or to the right.',
      waitForTarget: true,
      nextLabel: 'Got it',
    }),
    levelStep('level-15-if-repeat', {
      targetId: 'sequence-area',
      placement: 'left',
      title: 'Use Repeat with IF PATH',
      body: 'Put IF PATH inside Repeat so LUMA can check a direction again and again. The dropdown helps you choose which direction LUMA checks.',
      waitForTarget: true,
      nextLabel: 'Ready',
    }),
  ],
  16: [
    levelStep('level-16-same-rule-two-turns', {
      targetId: 'sequence-area',
      placement: 'left',
      title: 'Same rule, two turns',
      body: 'This path bends twice. Use Repeat with IF PATH to the right so LUMA turns when a side path opens.',
      waitForTarget: true,
      hideProgress: true,
      nextLabel: 'Got it',
    }),
  ],
  17: [
    levelStep('level-17-collect-after-moving', {
      targetId: 'command-collect',
      placement: 'left',
      title: 'Collect after moving',
      body: 'This path has ship fragments. Put COLLECT after MOVE FORWARD inside the Repeat block so LUMA collects each fragment she lands on.',
      waitForTarget: true,
      hideProgress: true,
      nextLabel: 'Got it',
    }),
  ],
  18: [
    levelStep('level-18-if-else-command', {
      targetId: 'command-if-else-path',
      placement: 'top',
      title: 'New block: IF/ELSE',
      body: 'IF/ELSE helps LUMA choose between two actions. IF means "do this when the path is open." ELSE means "otherwise, do this instead."',
      waitForTarget: true,
      nextLabel: 'Got it',
    }),
    levelStep('level-18-two-places', {
      targetId: 'command-if-else-path',
      placement: 'left',
      title: 'Two parts in one block',
      body: 'This block has two spaces. Use the top part for what LUMA should do when the path is open. Use ELSE for what LUMA should do otherwise.',
      waitForTarget: true,
      nextLabel: 'I see',
    }),
    levelStep('level-18-else-needed', {
      targetId: 'command-if-else-path',
      placement: 'left',
      title: 'ELSE needs a block',
      body: 'ELSE cannot stay empty in this level. Add a block there so LUMA knows what to do when the path is blocked.',
      waitForTarget: true,
      hideProgress: true,
      nextLabel: 'Ready',
    }),
  ],
  19: [
    levelStep('level-19-two-blocks-inside-if', {
      targetId: 'command-if-else-path',
      placement: 'left',
      title: 'More blocks inside IF or ELSE',
      body: 'The IF and ELSE parts can hold more than one block. This lets LUMA do more than one action depending on whether the path check is true or false.',
      waitForTarget: true,
      hideProgress: true,
      nextLabel: 'Got it',
      showWhen: ({ phase }) => phase === 'develop',
    }),
  ],
  20: [
    levelStep('level-20-nested-if-else', {
      targetId: 'command-if-else-path',
      placement: 'top',
      title: 'Nested IF/ELSE blocks',
      body: 'You can put an IF/ELSE block inside another IF/ELSE block. This makes LUMA check the path in 3 directions instead of 2.',
      waitForTarget: true,
      hideProgress: true,
      showWhen: ({ phase }) => phase === 'develop',
      nextLabel: 'Got it',
    }),
  ],
  21: [
    levelStep('level-21-trace-code', {
      targetId: 'trace-program-box',
      placement: 'left',
      title: 'Trace the code',
      body: 'This time, the program is already written for LUMA.',
      waitForTarget: true,
      showWhen: ({ phase }) => phase === 'develop',
      nextLabel: 'Okay',
    }),
    levelStep('level-21-read-carefully', {
      targetId: 'trace-program-box',
      placement: 'left',
      title: 'Read carefully',
      body: 'Look at the blocks and trace where LUMA will go.',
      waitForTarget: true,
      showWhen: ({ phase }) => phase === 'develop',
      nextLabel: 'I see',
    }),
    levelStep('level-21-choose-ending', {
      targetId: 'grid-panel',
      placement: 'right',
      title: 'Choose the ending tile',
      body: 'Tap the tile where you think LUMA will finish.',
      waitForTarget: true,
      showWhen: ({ phase }) => phase === 'develop',
      nextLabel: 'Ready',
    }),
    levelStep('level-21-launch-pad', {
      targetId: 'grid-panel',
      placement: 'right',
      title: 'Find the correct tile',
      body: 'If you choose the correct tile, the ship core will appear and LUMA will run the program.',
      waitForTarget: true,
      showWhen: ({ phase }) => phase === 'develop',
      nextLabel: 'Run it',
    }),
  ],
  23: [
    levelStep('level-23-final-level-intro', {
      targetId: 'grid-panel',
      placement: 'right',
      title: 'Final level',
      body: 'This is the final level. Solve it so LUMA can launch her fixed ship and go home.',
      waitForTarget: true,
      showWhen: ({ phase }) => phase === 'develop',
      nextLabel: "Let's finish",
    }),
    levelStep('level-23-launch-pad', {
      targetId: 'grid-panel',
      placement: 'right',
      title: 'Find the correct tile',
      body: 'If you choose the correct tile, the launch pad will appear and LUMA will go home.',
      waitForTarget: true,
      showWhen: ({ phase }) => phase === 'develop',
      nextLabel: 'Launch time',
    }),
  ],
}

export const FEATURE_TUTORIALS = {
  'level-1-reset': [
    featureStep('level-1-reset', 'level-1-reset', {
      targetId: 'reset-button',
      placement: 'top',
      title: 'Need another try?',
      body: 'If something goes wrong, use Reset and try again.',
      waitForTarget: true,
      hideProgress: true,
      nextLabel: 'Okay',
    }),
  ],
  'luma-confused': [
    featureStep('luma-confused-intro', 'luma-confused', {
      targetId: 'luma-marker',
      placement: 'right',
      title: 'LUMA is confused',
      body: 'She does not know which way she is facing. Help her figure it out.',
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
      placement: 'top',
      offsetY: -14,
      safeTop: 60,
      title: 'Pick LUMA\'s direction',
      body: 'Listen to the clue and tap the LUMA picture that matches the way she is facing.',
      nextLabel: 'Got it',
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
      body: 'MOVE FORWARD is not enough anymore. Use left or right turns too.',
      waitForTarget: true,
      nextLabel: 'Try yourself',
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
  'visor-flip-level-9': [
    featureStep('visor-flip-level-9-intro', 'visor-flip-level-9', {
      targetId: 'visor-flip-button',
      placement: 'bottom',
      title: 'Try Visor Flip now!',
      body: 'Tap Visor Flip so you can see what LUMA sees.',
      requiresAction: true,
      actionLabel: 'Turn Visor Flip on',
      waitForTarget: true,
      completeWhen: ({ visorActive }) => visorActive,
    }),
  ],
  'repeat-intro': [
    featureStep('repeat-intro', 'repeat-intro', {
      targetId: 'command-repeat',
      placement: 'top',
      title: 'Repeat helps with patterns',
      body: 'If you notice a path repeating, use REPEAT so LUMA can do those blocks again.',
      nextLabel: 'Show me',
    }),
    featureStep('repeat-add-block', 'repeat-intro', {
      targetId: 'command-repeat',
      placement: 'top',
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
  'if-path': [
    featureStep('if-path-intro', 'if-path', {
      targetId: 'command-if-path',
      placement: 'top',
      title: 'New block: IF PATH',
      body: 'IF PATH checks whether LUMA can move in one direction.',
      waitForTarget: true,
      nextLabel: 'What happens?',
    }),
    featureStep('if-path-true-false', 'if-path', {
      targetId: 'command-if-path',
      placement: 'top',
      title: 'Only runs when true',
      body: 'If that path is open, LUMA runs the blocks inside. If that path is blocked, she skips the inside blocks.',
      nextLabel: 'Add one',
    }),
    featureStep('if-path-add', 'if-path', {
      targetId: 'command-if-path',
      placement: 'top',
      title: 'Add an IF block',
      body: 'Tap IF PATH to add the conditional block to your program.',
      requiresAction: true,
      actionLabel: 'Add IF PATH',
      completeWhen: ({ sequence }) => hasIfPathBlock(sequence),
    }),
    featureStep('if-path-block', 'if-path', {
      targetId: 'if-block',
      placement: 'left',
      title: 'Blocks go inside',
      body: 'Drag blocks into the IF block just like you do with REPEAT.',
      waitForTarget: true,
      nextLabel: 'I see',
    }),
    featureStep('if-path-inside', 'if-path', {
      targetId: 'if-block-dropzone',
      placement: 'left',
      title: 'The inside can be a pattern',
      body: 'The inside can hold many blocks, and you can move them up or down.',
      waitForTarget: true,
      nextLabel: 'Nice',
    }),
    featureStep('if-path-nesting', 'if-path', {
      targetId: 'command-repeat',
      placement: 'top',
      title: 'IF and REPEAT can nest',
      body: 'REPEAT can go inside IF, and IF can go inside REPEAT. That helps solve Repair Site paths.',
      waitForTarget: true,
      nextLabel: 'Ready',
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
  'collect-command': [
    featureStep('collect-command-intro', 'collect-command', {
      targetId: 'command-collect',
      placement: 'left',
      title: 'Use COLLECT on a fragment',
      body: 'When LUMA stands on a ship fragment, add COLLECT to pick it up.',
      waitForTarget: true,
      nextLabel: 'I will collect it',
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
  5: ['ship-fragments', 'collect-command', 'collect-all-fragments'],
  13: ['uncertain-radio', 'visor-flip-level-9'],
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
    if (featureKey === 'visor-flip-level-9') return levelConfig.id === 13 && !levelConfig.noVisorFlip
    if (featureKey === 'repeat-intro') return Boolean(levelConfig.allowRepeat)
    if (featureKey === 'repeat-builder') return Boolean(levelConfig.allowRepeat)
    if (featureKey === 'if-path') return Boolean(levelConfig.allowIfPath)
    if (featureKey === 'ship-fragments') {
      return (effectiveLevel?.objects ?? []).some(objectItem => objectItem.type === 'ship_part')
    }
    if (featureKey === 'collect-command') {
      return levelConfig.id >= 5 && (effectiveLevel?.objects ?? []).some(objectItem => objectItem.type === 'ship_part')
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
