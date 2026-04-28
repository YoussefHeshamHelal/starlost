const MIN_REPEAT_TIMES = 1
const MAX_REPEAT_TIMES = 100

export function cloneNestedCommands(commands = []) {
  return commands.map((command) => {
    if (isRepeatCommand(command)) {
      return createRepeatCommand(command.times, cloneNestedCommands(command.commands))
    }

    if (isIfPathCommand(command)) {
      return createIfPathCommand(command.condition, cloneNestedCommands(command.commands))
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

export function createIfPathCommand(condition = 'ahead', commands = []) {
  return {
    type: 'IF_PATH',
    condition,
    commands: cloneNestedCommands(commands),
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
      return total + 1 + countProgramBlocks(command.commands ?? [])
    }

    return typeof command === 'string' ? total + 1 : total
  }, 0)
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
    const conditionLabel = {
      ahead: 'AHEAD',
      left: 'TO THE LEFT',
      right: 'TO THE RIGHT',
    }[command.condition ?? 'ahead'] ?? 'AHEAD'

    return {
      kind: 'if',
      label: `IF PATH ${conditionLabel}`,
      summary: `${childCount} BLOCK${childCount === 1 ? '' : 'S'} INSIDE`,
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
