const MIN_REPEAT_TIMES = 1
const MAX_REPEAT_TIMES = 100

export function cloneNestedCommands(commands = []) {
  return commands.map((command) => {
    if (isRepeatCommand(command)) {
      return createRepeatCommand(command.times, cloneNestedCommands(command.commands))
    }

    if (isIfPathCommand(command)) {
      return createIfPathCommand(
        command.condition,
        cloneNestedCommands(command.commands),
        cloneNestedCommands(command.elseCommands ?? [])
      )
    }

    return command
  })
}

export function clampRepeatTimes(times = 2) {
  return Math.max(MIN_REPEAT_TIMES, Math.min(MAX_REPEAT_TIMES, Number(times) || MIN_REPEAT_TIMES))
}

export function createRepeatCommand(times = 2, commands = []) {
  return {
    type: 'REPEAT',
    times: clampRepeatTimes(times),
    commands: cloneNestedCommands(commands),
  }
}

export function createIfPathCommand(condition = 'ahead', commands = [], elseCommands = []) {
  return {
    type: 'IF_PATH',
    condition,
    commands: cloneNestedCommands(commands),
    elseCommands: cloneNestedCommands(elseCommands),
  }
}

export function isRepeatCommand(command) {
  return Boolean(command) && typeof command === 'object' && command.type === 'REPEAT'
}

export function isIfPathCommand(command) {
  return Boolean(command) && typeof command === 'object' && command.type === 'IF_PATH'
}

export function isNestedBlockCommand(command) {
  return isRepeatCommand(command) || isIfPathCommand(command)
}

export function countProgramBlocks(sequence = []) {
  return sequence.reduce((total, command) => {
    if (isNestedBlockCommand(command)) {
      return total +
        1 +
        countProgramBlocks(command.commands ?? []) +
        (isIfPathCommand(command) ? countProgramBlocks(command.elseCommands ?? []) : 0)
    }

    return typeof command === 'string' ? total + 1 : total
  }, 0)
}

export function hasEmptyRequiredElse(sequence = []) {
  return sequence.some((command) => {
    if (isRepeatCommand(command)) {
      return hasEmptyRequiredElse(command.commands ?? [])
    }

    if (isIfPathCommand(command)) {
      return (command.elseCommands?.length ?? 0) === 0 ||
        hasEmptyRequiredElse(command.commands ?? []) ||
        hasEmptyRequiredElse(command.elseCommands ?? [])
    }

    return false
  })
}

export function expandSequence(sequence = []) {
  const expanded = []

  sequence.forEach((command) => {
    if (isRepeatCommand(command)) {
      const times = clampRepeatTimes(command.times)
      const nested = expandSequence(command.commands ?? [])

      for (let count = 0; count < times; count += 1) {
        expanded.push(...nested)
      }

      return
    }

    if (isIfPathCommand(command)) {
      expanded.push(command)
      return
    }

    if (typeof command === 'string') {
      expanded.push(command)
    }
  })

  return expanded
}

const CODE_INDENT = '  '

function getPathCheckName(condition = 'ahead') {
  if (condition === 'left') return 'isPathLeft'
  if (condition === 'right') return 'isPathRight'
  return 'isPathForward'
}

function commandsToJavaScriptLines(commands = [], depth = 0) {
  if (!commands.length) return [`${CODE_INDENT.repeat(depth)}// no blocks`]

  return commands.flatMap((command) => {
    const indent = CODE_INDENT.repeat(depth)

    if (command === 'F') return [`${indent}moveForward();`]
    if (command === 'TR') return [`${indent}turnRight();`]
    if (command === 'TL') return [`${indent}turnLeft();`]
    if (command === 'C') return [`${indent}collect();`]

    if (isRepeatCommand(command)) {
      return [
        `${indent}for (let i = 0; i < ${clampRepeatTimes(command.times)}; i++) {`,
        ...commandsToJavaScriptLines(command.commands ?? [], depth + 1),
        `${indent}}`,
      ]
    }

    if (isIfPathCommand(command)) {
      const condition = `${getPathCheckName(command.condition)}()`
      const ifLines = [
        `${indent}if (${condition}) {`,
        ...commandsToJavaScriptLines(command.commands ?? [], depth + 1),
        `${indent}}`,
      ]

      if ((command.elseCommands?.length ?? 0) === 0) return ifLines

      return [
        ...ifLines.slice(0, -1),
        `${indent}} else {`,
        ...commandsToJavaScriptLines(command.elseCommands ?? [], depth + 1),
        `${indent}}`,
      ]
    }

    return []
  })
}

export function programToJavaScript(sequence = []) {
  if (!sequence.length) return '// Add blocks to the Program box to see JavaScript here.'
  return commandsToJavaScriptLines(sequence).join('\n')
}

export function formatSequenceCommand(command) {
  if (isRepeatCommand(command)) {
    const childCount = command.commands?.length ?? 0
    return {
      kind: 'repeat',
      label: `REPEAT x${command.times}`,
      summary: `${childCount} BLOCK${childCount === 1 ? '' : 'S'} INSIDE`,
      icon: 'repeat',
    }
  }

  if (isIfPathCommand(command)) {
    const childCount = command.commands?.length ?? 0
    const elseCount = command.elseCommands?.length ?? 0
    const conditionLabel = {
      ahead: 'AHEAD',
      left: 'TO THE LEFT',
      right: 'TO THE RIGHT',
    }[command.condition ?? 'ahead'] ?? 'AHEAD'

    return {
      kind: 'if',
      label: elseCount > 0 ? `IF/ELSE PATH ${conditionLabel}` : `IF PATH ${conditionLabel}`,
      summary: elseCount > 0
        ? `${childCount} IF / ${elseCount} ELSE`
        : `${childCount} BLOCK${childCount === 1 ? '' : 'S'} INSIDE`,
      icon: 'if',
    }
  }

  return {
    kind: 'basic',
    label: command,
    summary: null,
    icon: null,
  }
}
