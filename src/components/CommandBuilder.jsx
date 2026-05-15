import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeContext } from '../context/theme'
import {
  clampRepeatTimes,
  countProgramBlocks,
  createIfPathCommand,
  createRepeatCommand,
  isIfPathCommand,
  isNestedBlockCommand,
  isRepeatCommand,
  programToPython,
} from '../utils/commands'

const THUMB_R = 8
const CHIP_HEIGHT = 34
const ITEM_GAP = 4

function getDropPreviewHeight(depth = 0) {
  return Math.max(26, getDepthLayout(depth).chipHeight)
}

function isSameDropPath(activeDropPath, pathKey) {
  return activeDropPath?.pathKey === pathKey
}

function isDescendantDropPath(activeDropPath, path = []) {
  if (!activeDropPath?.path || activeDropPath.path.length <= path.length) return false
  return path.every((step, index) => JSON.stringify(step) === JSON.stringify(activeDropPath.path[index]))
}

function areNumberListsEqual(a = [], b = []) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function getDepthLayout(depth) {
  const level = Math.min(depth, 3)
  return {
    indent: depth === 0 ? 0 : 2,
    chipHeight: CHIP_HEIGHT - level * 2,
    chipPaddingY: Math.max(3, 5 - level),
    chipPaddingX: Math.max(6, 8 - level),
    labelSize: Math.max(8, 10 - level * 0.5),
    numberSize: Math.max(7, 8 - level * 0.3),
    numberWidth: Math.max(11, 14 - level),
    rowGap: Math.max(5, 8 - level),
    cardPadding: Math.max(5, 8 - level),
    dropPadding: Math.max(6, 8 - level),
    dropMinHeight: Math.max(42, 54 - level * 4),
    deleteSize: Math.max(15, 18 - level),
    controlFontSize: Math.max(7, 8 - level * 0.25),
  }
}

const THEMES = {
  light: {
    panelBg: 'linear-gradient(180deg, rgba(255,255,255,0.99), rgba(235,248,255,0.98) 55%, rgba(243,237,255,0.96))',
    panelBorder: '#2fc9df',
    phaseLabel: '#1377aa',
    subLabel: '#4b6d8a',
    scrollBg: 'linear-gradient(180deg, rgba(228,250,255,0.98), rgba(244,245,255,0.96))',
    scrollBorder: '#bddff2',
    emptyText: '#7190a9',
    btnBorder: '#b7dbef',
    btnColor: '#355978',
    btnDisabled: '#b7c8d8',
    railBg: '#dbe7f4',
    railBorder: '#b8cfe6',
    tickColor: '#64809a',
    speedLabelClr: '#355978',
    visorBg: 'linear-gradient(135deg, rgba(244,238,255,0.98), rgba(232,246,255,0.96))',
    visorBorder: '#8b5cf6',
    visorText: '#5b31b7',
    visorExhBg: 'linear-gradient(135deg, rgba(240,236,255,0.76), rgba(236,242,255,0.64))',
    visorExhBd: '#d2c2ff',
    visorExhTx: '#9987c2',
    mirrorBg: 'linear-gradient(135deg, rgba(255,214,224,0.42), rgba(255,240,243,0.22))',
    mirrorBorder: '#fb718577',
    mirrorText: '#be123c',
    programLabel: '#173f66',
    programCount: '#60809d',
    resetBg: 'linear-gradient(135deg, rgba(255,178,195,0.22), rgba(255,237,242,0.12))',
    runBgActive: 'linear-gradient(135deg, rgba(45,201,223,0.20), rgba(139,92,246,0.12))',
    runBgDisabled: 'rgba(222,233,244,0.82)',
    runBorderActive: '#2fc9df',
    runBorderDisabled: '#bfd1e4',
    runColorActive: '#124b73',
    runColorDisabled: '#a2b3c5',
    targetCmdColor: '#1377aa',
  },
  dark: {
    panelBg: 'rgba(6,11,20,0.98)',
    panelBorder: '#f59e0b',
    phaseLabel: '#fbbf24',
    subLabel: '#a0b0c8',
    scrollBg: 'rgba(3,7,14,0.95)',
    scrollBorder: '#0c1828',
    emptyText: '#3a5060',
    btnBorder: '#182838',
    btnColor: '#7a9aaa',
    btnDisabled: '#1a2838',
    railBg: '#0a1828',
    railBorder: '#182838',
    tickColor: '#5a7888',
    speedLabelClr: '#7a9aaa',
    visorBg: 'rgba(139,92,246,0.14)',
    visorBorder: '#a78bfa',
    visorText: '#c4b5fd',
    visorExhBg: 'rgba(6,10,18,0.7)',
    visorExhBd: '#182838',
    visorExhTx: '#2a3848',
    mirrorBg: 'rgba(251,113,133,0.07)',
    mirrorBorder: '#fb718555',
    mirrorText: '#fb7185',
    programLabel: '#a0b0c8',
    programCount: '#5a7888',
    resetBg: 'linear-gradient(135deg, rgba(251,113,133,0.14), rgba(251,113,133,0.07))',
    runBgActive: 'linear-gradient(135deg, rgba(45,212,191,0.16), rgba(45,212,191,0.08))',
    runBgDisabled: 'rgba(6,10,18,0.6)',
    runBorderActive: '#2dd4bf',
    runBorderDisabled: '#182838',
    runColorActive: '#2dd4bf',
    runColorDisabled: '#1a2838',
    targetCmdColor: '#2dd4bf99',
  },
}

const META = {
  F: { buttonLabel: 'MOVE FORWARD', rowLabel: 'MOVE FORWARD', icon: '↑', color: '#14b8d4', darkColor: '#2dd4bf', bg: 'rgba(20,184,212,0.12)', darkBg: 'rgba(45,212,191,0.20)' },
  TR: { buttonLabel: 'TURN RIGHT', rowLabel: 'TURN RIGHT', icon: '→', color: '#f59e0b', darkColor: '#f59e0b', bg: 'rgba(245,158,11,0.12)', darkBg: 'rgba(245,158,11,0.20)' },
  TL: { buttonLabel: 'TURN LEFT', rowLabel: 'TURN LEFT', icon: '←', color: '#8b5cf6', darkColor: '#a78bfa', bg: 'rgba(139,92,246,0.11)', darkBg: 'rgba(167,139,250,0.22)' },
  C: { buttonLabel: 'COLLECT', rowLabel: 'COLLECT', icon: 'collect', color: '#38bdf8', darkColor: '#67e8f9', bg: 'rgba(56,189,248,0.12)', darkBg: 'rgba(103,232,249,0.16)' },
  REPEAT: { buttonLabel: 'REPEAT', rowLabel: 'REPEAT', icon: '↺', color: '#22c55e', darkColor: '#4ade80', bg: 'rgba(34,197,94,0.12)', darkBg: 'rgba(74,222,128,0.18)' },
  IF_PATH: { buttonLabel: 'IF PATH', rowLabel: 'IF PATH', icon: '?', color: '#0ea5e9', darkColor: '#7dd3fc', bg: 'rgba(14,165,233,0.13)', darkBg: 'rgba(125,211,252,0.17)' },
}

const PALETTE_ORDER = ['F', 'TR', 'TL', 'C', 'REPEAT', 'IF_PATH']

const IF_PATH_OPTIONS = [
  { value: 'ahead', label: 'ahead' },
  { value: 'left', label: 'to the left' },
  { value: 'right', label: 'to the right' },
]

function createCommandFromCode(code, ifPathCondition = 'ahead', repeatTimes = 2) {
  if (code === 'REPEAT') return createRepeatCommand(repeatTimes)
  if (code === 'IF_PATH') return createIfPathCommand(ifPathCondition)
  return code
}

function getIfPathSelectStyle({ color, fontSize, letterSpacing = 1, theme }) {
  return {
    padding: '2px 6px',
    background: theme === 'light' ? 'rgba(255,255,255,0.82)' : 'rgba(3,7,14,0.78)',
    border: `1px solid ${color}55`,
    borderRadius: 6,
    color,
    fontSize,
    fontFamily: 'monospace',
    fontWeight: 800,
    letterSpacing,
    cursor: 'pointer',
  }
}

function getPathStepIndex(step) {
  return typeof step === 'object' ? step.index : step
}

function getPathStepBranch(step) {
  return typeof step === 'object' ? (step.branch ?? 'commands') : 'commands'
}

function withPathBranch(path, branch) {
  if (path.length === 0) return path
  const lastStep = path[path.length - 1]
  return [
    ...path.slice(0, -1),
    {
      index: getPathStepIndex(lastStep),
      branch,
    },
  ]
}

function areSamePathStep(a, b) {
  return getPathStepIndex(a) === getPathStepIndex(b) && getPathStepBranch(a) === getPathStepBranch(b)
}

function areSameListPaths(a = [], b = []) {
  return a.length === b.length && a.every((step, index) => areSamePathStep(step, b[index]))
}

function isTargetInsideCommand(targetPath = [], commandPath = []) {
  if (targetPath.length < commandPath.length) return false
  return commandPath.every((step, index) => getPathStepIndex(step) === getPathStepIndex(targetPath[index]))
}

function getCommandsAtPath(sequence, path) {
  if (path.length === 0) return sequence
  const [step, ...rest] = path
  const command = sequence[getPathStepIndex(step)]
  if (!isNestedBlockCommand(command)) return []
  return getCommandsAtPath(command[getPathStepBranch(step)] ?? [], rest)
}

function adjustListPathAfterRemoval(targetPath, sourceParentPath, sourceIndex) {
  if (targetPath.length <= sourceParentPath.length) return targetPath
  const sharesSourceList = sourceParentPath.every((step, index) => areSamePathStep(step, targetPath[index]))
  if (!sharesSourceList) return targetPath

  const affectedStep = targetPath[sourceParentPath.length]
  if (getPathStepIndex(affectedStep) <= sourceIndex) return targetPath

  const adjustedStep = typeof affectedStep === 'object'
    ? { ...affectedStep, index: affectedStep.index - 1 }
    : affectedStep - 1
  return [
    ...targetPath.slice(0, sourceParentPath.length),
    adjustedStep,
    ...targetPath.slice(sourceParentPath.length + 1),
  ]
}

function canMoveCommandToPath(command, sourceCommandPath, targetPath) {
  if (!isNestedBlockCommand(command)) return true
  return !isTargetInsideCommand(targetPath, sourceCommandPath)
}

function moveCommandBetweenPaths(sequence, sourceParentPath, sourceIndex, targetPath, targetIndex) {
  const sourceCommands = getCommandsAtPath(sequence, sourceParentPath)
  const moved = sourceCommands[sourceIndex]
  if (moved === undefined) return sequence

  if (!canMoveCommandToPath(moved, [...sourceParentPath, sourceIndex], targetPath)) return sequence

  if (areSameListPaths(sourceParentPath, targetPath)) {
    return updateCommandsAtPath(sequence, sourceParentPath, (commands) => reorderCommands(commands, sourceIndex, targetIndex))
  }

  const withoutMoved = removeCommandAtPath(sequence, [...sourceParentPath, sourceIndex])
  const adjustedTargetPath = adjustListPathAfterRemoval(targetPath, sourceParentPath, sourceIndex)
  return insertCommandAtPath(withoutMoved, adjustedTargetPath, targetIndex, moved)
}

function updateCommandsAtPath(sequence, path, updater) {
  if (path.length === 0) return updater(sequence)
  const [step, ...rest] = path
  const index = getPathStepIndex(step)
  const branch = getPathStepBranch(step)
  return sequence.map((command, commandIndex) => {
    if (commandIndex !== index || !isNestedBlockCommand(command)) return command
    return {
      ...command,
      [branch]: updateCommandsAtPath(command[branch] ?? [], rest, updater),
    }
  })
}

function updateBlockAtPath(sequence, path, updater) {
  const [step, ...rest] = path
  const index = getPathStepIndex(step)
  const branch = getPathStepBranch(step)
  return sequence.map((command, commandIndex) => {
    if (commandIndex !== index || !isNestedBlockCommand(command)) return command
    if (rest.length === 0) return updater(command)
    return {
      ...command,
      [branch]: updateBlockAtPath(command[branch] ?? [], rest, updater),
    }
  })
}

function removeCommandAtPath(sequence, path) {
  const parentPath = path.slice(0, -1)
  const targetIndex = path[path.length - 1]
  return updateCommandsAtPath(sequence, parentPath, (commands) => commands.filter((_, commandIndex) => commandIndex !== targetIndex))
}

function insertCommandAtPath(sequence, parentPath, index, command) {
  return updateCommandsAtPath(sequence, parentPath, (commands) => {
    const next = [...commands]
    next.splice(index, 0, command)
    return next
  })
}

function reorderCommands(commands, fromIndex, toIndex) {
  const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
  if (adjustedIndex === fromIndex) return commands

  const next = [...commands]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(adjustedIndex, 0, moved)
  return next
}

function getDropInsertIndex(dropTarget, clientY) {
  const commandNodes = Array.from(dropTarget.children).filter((child) => child.hasAttribute('data-block-command-index'))

  for (let index = 0; index < commandNodes.length; index += 1) {
    const rect = commandNodes[index].getBoundingClientRect()
    if (clientY < rect.top + rect.height / 2) return index
  }

  return commandNodes.length
}

function getNestedDropInfoFromPoint(clientX, clientY) {
  const dropTarget = document
    .elementFromPoint(clientX, clientY)
    ?.closest('[data-nested-drop-path]')

  if (!dropTarget) return null

  const pathKey = dropTarget.getAttribute('data-nested-drop-path')
  return {
    pathKey,
    path: JSON.parse(pathKey ?? '[]'),
    insertAt: getDropInsertIndex(dropTarget, clientY),
  }
}

function getMeta(command, theme) {
  const base = isRepeatCommand(command)
    ? META.REPEAT
    : isIfPathCommand(command)
      ? META.IF_PATH
      : META[command]
  const color = theme === 'light' ? base.color : base.darkColor
  const bg = theme === 'light' ? base.bg : base.darkBg
  return { ...base, color, bg }
}

function getRowEstimate(command) {
  if (!isNestedBlockCommand(command)) return CHIP_HEIGHT
  const childCount = command.commands?.length ?? 0
  const elseCount = isIfPathCommand(command) ? (command.elseCommands?.length ?? 0) : 0
  const branchCount = childCount + elseCount
  const nestedHeight = branchCount === 0 ? 46 : branchCount * (CHIP_HEIGHT + ITEM_GAP) + (elseCount > 0 ? 44 : 14)
  return 58 + nestedHeight
}

function SpeedBar({ speed, onSpeedChange, theme }) {
  const t = THEMES[theme]
  const safeSpeed = Math.max(10, Math.min(100, Number(speed) || 50))
  const fillPct = ((safeSpeed - 10) / 90) * 100
  const trackColor = safeSpeed < 40 ? '#f59e0b' : safeSpeed < 75 ? (theme === 'light' ? '#14b8d4' : '#2dd4bf') : '#10b981'

  const handleSpeedChange = useCallback((eventOrValue) => {
    const rawValue = typeof eventOrValue === 'number'
      ? eventOrValue
      : Number(eventOrValue?.target?.value)
    const nextSpeed = Math.max(10, Math.min(100, Number(rawValue) || 50))
    onSpeedChange?.(nextSpeed)
  }, [onSpeedChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 10, color: t.speedLabelClr, fontFamily: 'monospace', letterSpacing: 1, margin: 0, fontWeight: 800 }}>LUMA SPEED</p>
        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: trackColor }}>{safeSpeed}%</span>
      </div>

      <div style={{ position: 'relative', height: THUMB_R * 2, cursor: 'pointer', touchAction: 'none' }}>
        <div style={{ position: 'absolute', left: THUMB_R, right: THUMB_R, top: '50%', transform: 'translateY(-50%)', height: 4, background: t.railBg, borderRadius: 2, border: `1px solid ${t.railBorder}`, overflow: 'hidden' }}>
          <div style={{ width: `${fillPct}%`, height: '100%', background: `linear-gradient(90deg, #f59e0b, ${trackColor})` }} />
        </div>
        <div style={{ position: 'absolute', left: `calc(${fillPct / 100} * (100% - ${THUMB_R * 2}px))`, top: '50%', transform: 'translateY(-50%)', width: THUMB_R * 2, height: THUMB_R * 2, borderRadius: '50%', background: trackColor, boxShadow: `0 0 12px ${trackColor}66`, pointerEvents: 'none' }} />
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={safeSpeed}
          onChange={handleSpeedChange}
          aria-label="LUMA speed"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
            padding: 0,
          }}
        />
      </div>

      <div style={{ position: 'relative', height: 10, fontSize: 8, color: t.tickColor, fontFamily: 'monospace', letterSpacing: 0.5, fontWeight: 700 }}>
        <span style={{ position: 'absolute', left: 0 }}>SLOW</span>
        <span style={{ position: 'absolute', left: `calc(${THUMB_R}px + (100% - ${THUMB_R * 2}px) * ${(50 - 10) / 90})`, transform: 'translateX(-50%)' }}>MED</span>
        <span style={{ position: 'absolute', right: 0 }}>FAST</span>
      </div>
    </div>
  )
}

function PaletteButton({ code, disabled, onAdd, theme, tutorialId, ifPathCondition, onIfPathConditionChange, repeatTimes = 2, onRepeatTimesChange, showIfElse = false }) {
  const meta = getMeta(createCommandFromCode(code, ifPathCondition, repeatTimes), theme)
  const isIfPath = code === 'IF_PATH'
  const isRepeatPalette = code === 'REPEAT'
  const labelStyle = { fontSize: 10, letterSpacing: 0.8, fontWeight: 800, fontFamily: 'monospace', color: meta.color }
  const ifElsePreviewColor = meta.color
  const ifElsePreviewBg = meta.bg
  const ifElseSelectStyle = {
    padding: '2px 6px',
    background: theme === 'light' ? 'rgba(255,255,255,0.86)' : 'rgba(3,7,14,0.72)',
    border: `1px solid ${ifElsePreviewColor}55`,
    borderRadius: 6,
    color: ifElsePreviewColor,
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 800,
    letterSpacing: 0.8,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
  const ifElseSocketStyle = {
    flex: 1,
    minWidth: 0,
    height: 18,
    background: theme === 'light' ? 'rgba(255,255,255,0.80)' : 'rgba(232,248,255,0.08)',
    border: `1.5px solid ${ifElsePreviewColor}33`,
    borderRadius: 6,
    boxShadow: theme === 'light' ? 'inset 0 1px 2px rgba(70,142,204,0.08)' : 'inset 0 1px 2px rgba(0,0,0,0.22)',
  }
  const stopSelectDrag = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }
  const addPaletteCommand = () => {
    if (!disabled) onAdd(createCommandFromCode(code, ifPathCondition, repeatTimes))
  }
  const handlePaletteKeyDown = (event) => {
    if (disabled || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    addPaletteCommand()
  }

  return (
    <motion.div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      whileTap={{ scale: 0.985 }}
      onClick={addPaletteCommand}
      onKeyDown={handlePaletteKeyDown}
      draggable={!disabled}
      onDragStart={(event) => {
        if (disabled) {
          event.preventDefault()
          return
        }
        event.dataTransfer.setData('cmd', code)
        if (isIfPath) event.dataTransfer.setData('ifPathCondition', ifPathCondition)
        if (isRepeatPalette) event.dataTransfer.setData('repeatTimes', String(repeatTimes))
        event.dataTransfer.effectAllowed = 'copy'
      }}
      data-tutorial-id={tutorialId}
      style={isIfPath
        ? { width: '100%', padding: '8px 10px', background: ifElsePreviewBg, border: `1.5px solid ${ifElsePreviewColor}`, borderRadius: 10, color: ifElsePreviewColor, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 5, fontFamily: 'monospace', opacity: disabled ? 0.35 : 1, overflow: 'hidden' }
        : { width: '100%', padding: '10px 12px', background: meta.bg, border: `1.5px solid ${meta.color}`, borderRadius: 10, color: meta.color, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'monospace', opacity: disabled ? 0.35 : 1 }}
    >
      {isIfPath ? (
        <>
          <div
            data-tutorial-id={showIfElse ? 'command-if-path' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
          >
            <span style={{ color: ifElsePreviewColor, fontSize: 10, lineHeight: 1, fontWeight: 800, letterSpacing: 0.8, whiteSpace: 'nowrap' }}>IF PATH</span>
            <select
              value={ifPathCondition}
              disabled={disabled}
              onPointerDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onDragStart={stopSelectDrag}
              onChange={(event) => {
                event.stopPropagation()
                onIfPathConditionChange(event.target.value)
              }}
              style={ifElseSelectStyle}
            >
              {IF_PATH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ width: 28, color: ifElsePreviewColor, fontSize: 10, lineHeight: 1, fontWeight: 800, letterSpacing: 0.8, textAlign: 'left' }}>DO</span>
            <span aria-hidden="true" style={ifElseSocketStyle} />
          </div>
          {showIfElse && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ width: 28, color: ifElsePreviewColor, fontSize: 10, lineHeight: 1, fontWeight: 800, letterSpacing: 0.8, textAlign: 'left' }}>ELSE</span>
              <span aria-hidden="true" style={ifElseSocketStyle} />
            </div>
          )}
        </>
      ) : isRepeatPalette ? (
        <>
          <span style={labelStyle}>{meta.buttonLabel}</span>
          <RepeatCounter
            command={createRepeatCommand(repeatTimes)}
            color={meta.color}
            onChange={(next) => onRepeatTimesChange?.(next.times)}
            depth={0}
            compact
            showLabel={false}
            disabled={disabled}
            tutorialId={null}
          />
        </>
      ) : (
        <span style={labelStyle}>{meta.buttonLabel}</span>
      )}
    </motion.div>
  )
}

function RepeatCounter({ command, color, onChange, depth = 0, compact = false, showLabel = !compact, disabled = false, tutorialId = 'repeat-block-counter' }) {
  const [inputValue, setInputValue] = useState(String(command.times))
  const layout = getDepthLayout(depth)
  const buttonSize = compact ? Math.max(14, 16 - Math.min(depth, 3)) : Math.max(16, 18 - Math.min(depth, 3))
  const labelStyle = { fontSize: compact ? Math.max(8, layout.labelSize - 1) : layout.labelSize, fontFamily: 'monospace', letterSpacing: compact ? 0.7 : 1, fontWeight: 800, color, whiteSpace: 'nowrap' }
  const buttonStyle = { width: buttonSize, height: buttonSize, borderRadius: 5, border: `1px solid ${color}55`, background: 'rgba(255,255,255,0.72)', color, cursor: disabled ? 'not-allowed' : 'pointer', padding: 0, fontWeight: 900, fontFamily: 'monospace', fontSize: compact ? Math.max(7, 9 - Math.min(depth, 2)) : Math.max(8, 10 - Math.min(depth, 2)), lineHeight: 1, flexShrink: 0 }

  const updateTimes = (times) => {
    if (disabled) return
    const nextTimes = clampRepeatTimes(times)
    setInputValue(String(nextTimes))
    onChange({ ...command, times: nextTimes })
  }

  const handleInputChange = (event) => {
    if (disabled) return
    const rawValue = event.target.value.replace(/\D/g, '')
    if (rawValue === '') {
      setInputValue('')
      return
    }

    const nextTimes = clampRepeatTimes(rawValue)
    setInputValue(String(nextTimes))
    onChange({ ...command, times: nextTimes })
  }

  const stopControlClick = (event) => {
    event.stopPropagation()
  }

  return (
    <div data-tutorial-id={tutorialId} onPointerDown={(event) => event.stopPropagation()} onClick={stopControlClick} style={{ display: 'flex', alignItems: 'center', gap: compact ? 3 : Math.max(3, 5 - Math.min(depth, 2)), padding: 0, background: 'transparent', border: 'none', borderRadius: 0, flex: compact ? '1 1 auto' : '0 0 auto', minWidth: 0, maxWidth: '100%' }}>
      {showLabel && <span style={labelStyle}>REPEAT</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 1 : 2, padding: compact ? '1px' : '2px', border: `1px solid ${color}33`, borderRadius: 7, background: `${color}10`, flexShrink: 0 }}>
        <button type="button" disabled={disabled} style={buttonStyle} onClick={() => updateTimes(command.times - 1)}>-</button>
        <input type="text" inputMode="numeric" disabled={disabled} value={inputValue} onChange={handleInputChange} onBlur={() => inputValue === '' && setInputValue(String(command.times))} style={{ width: compact ? Math.max(20, 24 - Math.min(depth, 3) * 2) : Math.max(28, 34 - Math.min(depth, 3) * 2), padding: compact ? '1px 3px' : '2px 4px', borderRadius: 6, border: `1px solid ${color}55`, background: 'rgba(255,255,255,0.82)', color, fontFamily: 'monospace', fontSize: compact ? Math.max(8, 10 - Math.min(depth, 2)) : Math.max(9, 11 - Math.min(depth, 2)), fontWeight: 800, textAlign: 'center', boxSizing: 'border-box' }} />
        <button type="button" disabled={disabled} style={buttonStyle} onClick={() => updateTimes(command.times + 1)}>+</button>
      </div>
      <span style={labelStyle}>TIMES</span>
    </div>
  )
}

function RowDelete({ isRunning, onDelete, theme, depth = 0, positioned = true }) {
  const layout = getDepthLayout(depth)
  const deleteColor = theme === 'light' ? '#dc2626' : '#fb7185'
  const deleteBorder = theme === 'light' ? 'rgba(220,38,38,0.45)' : 'rgba(251,113,133,0.55)'
  const deleteBg = theme === 'light' ? 'rgba(254,242,242,0.9)' : 'rgba(127,29,29,0.32)'
  const positionStyle = positioned === 'corner'
    ? { position: 'absolute', top: 7, right: 7 }
    : positioned
      ? { position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)' }
      : { position: 'relative', flexShrink: 0 }
  return (
    <button
      type="button"
      title="Delete"
      aria-label="Delete"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onDelete}
      disabled={isRunning}
      style={{ ...positionStyle, width: layout.deleteSize, height: layout.deleteSize, borderRadius: '50%', border: `1px solid ${deleteBorder}`, background: deleteBg, color: deleteColor, cursor: isRunning ? 'not-allowed' : 'pointer', fontSize: Math.max(8, 10 - Math.min(depth, 2)), lineHeight: 1, zIndex: 5, padding: 0 }}
    >
      ×
    </button>
  )
}
function CommandChip({ command, index, depth, path, theme, isRunning, onDelete }) {
  const meta = getMeta(command, theme)
  const layout = getDepthLayout(depth)
  const rowWidth = layout.indent ? `calc(100% - ${layout.indent}px)` : '100%'
  return (
    <div style={{ position: 'relative', width: rowWidth, minHeight: layout.chipHeight, marginLeft: layout.indent, display: 'flex', alignItems: 'center', gap: layout.rowGap, padding: `${layout.chipPaddingY}px ${layout.deleteSize + 14}px ${layout.chipPaddingY}px ${layout.chipPaddingX}px`, background: meta.bg, borderLeft: `3px solid ${meta.color}`, borderBottom: `1px solid ${meta.color}22`, borderRadius: 8, boxSizing: 'border-box' }}>
      <span style={{ fontSize: layout.numberSize, color: meta.color, fontFamily: 'monospace', width: layout.numberWidth, textAlign: 'right', fontWeight: 700, flexShrink: 0 }}>{String(index + 1).padStart(2, '0')}</span>
      <span style={{ fontSize: layout.labelSize, color: meta.color, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 700, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{meta.rowLabel}</span>
      <RowDelete color={meta.color} isRunning={isRunning} onDelete={() => onDelete(path)} theme={theme} depth={depth} />
    </div>
  )
}

function NestedBlockCard({ command, index, depth, path, theme, isRunning, onDelete, onUpdateBlock, onDropIntoBlock, onNestedPaletteHoverChange, activeNestedDropPath, showIfElse = false, elseChildren, children }) {
  const meta = getMeta(command, theme)
  const childCount = command.commands?.length ?? 0
  const elseCount = command.elseCommands?.length ?? 0
  const pathKey = JSON.stringify(path)
  const elsePath = withPathBranch(path, 'elseCommands')
  const elsePathKey = JSON.stringify(elsePath)
  const isRepeat = isRepeatCommand(command)
  const isIfElse = !isRepeat && showIfElse
  const isNestedRepeat = isRepeat && depth > 0
  const isTightConditional = !isRepeat && depth >= 2
  const blockTutorialId = isRepeat ? 'repeat-block' : isIfElse ? 'if-else-block' : 'if-block'
  const dropTutorialId = isRepeat ? undefined : isIfElse ? 'if-else-true-dropzone' : 'if-block-dropzone'
  const layout = getDepthLayout(depth)
  const labelFontSize = layout.labelSize
  const labelStyle = { fontSize: labelFontSize, color: meta.color, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 800 }
  const branchLabelStyle = { width: 'fit-content', padding: `${Math.max(2, 3 - Math.min(depth, 2))}px ${Math.max(6, 8 - Math.min(depth, 2))}px`, background: `${meta.color}12`, border: `1px solid ${meta.color}33`, borderRadius: 7, color: meta.color, fontSize: Math.max(8, layout.controlFontSize - 2), fontFamily: 'monospace', letterSpacing: 1, fontWeight: 800, flexShrink: 0, textAlign: 'center', boxSizing: 'border-box' }
  const branchGap = 5
  const branchLabelColumnWidth = isTightConditional ? 'auto' : Math.max(38, 44 - Math.min(depth, 2) * 3)
  const branchPreviewHeight = getDropPreviewHeight(depth + 1)
  const branchDropMinHeight = branchPreviewHeight + 2
  const commandsIsActive = isSameDropPath(activeNestedDropPath, pathKey)
  const elseIsActive = isSameDropPath(activeNestedDropPath, elsePathKey)
  const hasActiveDescendant = isDescendantDropPath(activeNestedDropPath, path)
  const branchBaseBackground = theme === 'light' ? 'rgba(255,255,255,0.68)' : 'rgba(3,7,14,0.72)'
  const branchElseBackground = theme === 'light' ? 'rgba(255,255,255,0.58)' : 'rgba(3,7,14,0.62)'
  const activeBranchBackground = theme === 'light' ? 'rgba(216,247,255,0.96)' : 'rgba(45,212,191,0.07)'
  const activeElseBackground = theme === 'light' ? 'rgba(225,248,255,0.98)' : 'rgba(125,211,252,0.08)'
  const branchDropStyle = (active, baseBackground, activeBackground) => ({
    flex: 1,
    minWidth: 0,
    minHeight: active ? branchDropMinHeight + 2 : branchDropMinHeight,
    padding: active ? layout.dropPadding + 1 : layout.dropPadding,
    borderRadius: 8,
    background: active ? activeBackground : baseBackground,
    border: `1.5px ${active ? `dashed ${meta.color}88` : `solid ${meta.color}33`}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxSizing: 'border-box',
    overflow: 'visible',
    transition: 'min-height 0.12s ease, padding 0.12s ease, border-color 0.12s ease, background 0.12s ease',
  })
  const selectStyle = getIfPathSelectStyle({ color: meta.color, fontSize: labelFontSize, theme })
  const cardPadding = isNestedRepeat ? Math.max(4, layout.cardPadding - 2) : layout.cardPadding
  const cardRightPadding = layout.deleteSize + cardPadding + 12
  const branchMarginLeft = 0
  const branchMarginRight = 0
  const cardWidth = layout.indent ? `calc(100% - ${layout.indent}px)` : '100%'
  const stopControlDrag = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      data-tutorial-id={blockTutorialId}
      style={{ position: 'relative', width: cardWidth, minWidth: 0, marginLeft: layout.indent, padding: cardPadding, paddingTop: isRepeat ? Math.max(6, cardPadding) : cardPadding, paddingRight: cardRightPadding, background: meta.bg, border: `1.5px solid ${hasActiveDescendant ? `${meta.color}88` : `${meta.color}66`}`, borderRadius: 10, boxSizing: 'border-box', overflow: 'visible', transition: 'border-color 0.12s ease, background 0.12s ease' }}
    >
      <div style={{ display: 'flex', gap: isNestedRepeat ? 3 : layout.rowGap, alignItems: 'flex-start', minWidth: 0 }}>
        <span style={{ fontSize: isNestedRepeat ? Math.max(7, layout.numberSize - 1) : layout.numberSize, color: meta.color, fontFamily: 'monospace', width: isNestedRepeat ? Math.max(9, layout.numberWidth - 3) : layout.numberWidth, textAlign: 'right', fontWeight: 700, paddingTop: isRepeat ? (isNestedRepeat ? 4 : 5) : 5, flexShrink: 0 }}>{String(index + 1).padStart(2, '0')}</span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: isNestedRepeat ? 5 : 6 }}>
          <div style={{ display: 'flex', alignItems: isRepeat ? 'center' : 'flex-start', justifyContent: isRepeat ? 'flex-start' : 'space-between', gap: isNestedRepeat ? 4 : 6, flexWrap: isNestedRepeat ? 'nowrap' : 'wrap', minWidth: 0, transform: 'none' }}>
            <div style={{ display: isRepeat ? 'none' : 'flex', alignItems: 'center', gap: layout.rowGap, minWidth: 0, flex: '1 1 110px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, minWidth: 0, maxWidth: '100%' }}>
                {!isRepeat && (
                  <div style={{ display: 'flex', flexDirection: isTightConditional ? 'column' : 'row', alignItems: isTightConditional ? 'stretch' : 'center', gap: isTightConditional ? 4 : 6, flexWrap: isTightConditional ? 'nowrap' : 'wrap', minWidth: 0, maxWidth: '100%' }}>
                    <span style={labelStyle}>IF PATH</span>
                    <select
                      value={command.condition ?? 'ahead'}
                      onPointerDown={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      onDragStart={stopControlDrag}
                      onChange={(event) => {
                        event.stopPropagation()
                        onUpdateBlock(path, { ...command, condition: event.target.value })
                      }}
                      disabled={isRunning}
                      style={{ ...selectStyle, width: isTightConditional ? '100%' : undefined, minWidth: 0, maxWidth: '100%', cursor: isRunning ? 'not-allowed' : 'pointer' }}
                    >
                      {IF_PATH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} style={selectStyle}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: isNestedRepeat ? 3 : Math.max(4, 6 - Math.min(depth, 2)), flex: isNestedRepeat ? '1 1 auto' : '0 1 auto', minWidth: 0, maxWidth: '100%', flexWrap: isNestedRepeat ? 'nowrap' : 'wrap', justifyContent: isNestedRepeat ? 'flex-start' : 'flex-end' }}>
              {isRepeat ? (
                <RepeatCounter command={command} color={meta.color} onChange={(next) => onUpdateBlock(path, next)} depth={depth} compact={isNestedRepeat} showLabel />
              ) : null}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: isTightConditional ? 'column' : 'row', alignItems: 'stretch', gap: branchGap, minWidth: 0, marginLeft: branchMarginLeft, marginRight: branchMarginRight }}>
            {!isRepeat && (
              <div style={{ width: branchLabelColumnWidth, display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: 1, flexShrink: 0 }}>
                <span onPointerDown={(event) => event.stopPropagation()} style={branchLabelStyle}>DO</span>
              </div>
            )}
            <div
              onDragOver={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onNestedPaletteHoverChange?.({ pathKey, path, insertAt: childCount })
                event.dataTransfer.dropEffect = 'copy'
              }}
              onDragLeave={(event) => {
                event.stopPropagation()
                const rect = event.currentTarget.getBoundingClientRect()
                if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
                  onNestedPaletteHoverChange?.(null)
                }
              }}
              onDrop={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onNestedPaletteHoverChange?.(null)
                const raw = event.dataTransfer.getData('cmd')
                if (!raw) return
                onDropIntoBlock(path, raw, childCount, event.dataTransfer.getData('ifPathCondition') || 'ahead', event.dataTransfer.getData('repeatTimes') || 2)
              }}
              data-tutorial-id={dropTutorialId}
              data-nested-drop-path={pathKey}
              style={branchDropStyle(commandsIsActive, branchBaseBackground, activeBranchBackground)}
            >
              {childCount === 0 ? (
                <div style={{ minHeight: commandsIsActive ? branchPreviewHeight - 6 : Math.max(16, branchPreviewHeight - 12), transition: 'min-height 0.12s ease' }} />
              ) : children}
            </div>
          </div>
          {isIfElse && (
            <>
              <div style={{ display: 'flex', flexDirection: isTightConditional ? 'column' : 'row', alignItems: 'stretch', gap: branchGap, minWidth: 0, margin: '6px 0 0 0' }}>
                <div style={{ width: branchLabelColumnWidth, display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: 1, flexShrink: 0 }}>
                  <span onPointerDown={(event) => event.stopPropagation()} style={{ ...branchLabelStyle, fontWeight: 900, letterSpacing: 1.1 }}>ELSE</span>
                </div>
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onNestedPaletteHoverChange?.({ pathKey: elsePathKey, path: elsePath, insertAt: elseCount })
                    event.dataTransfer.dropEffect = 'copy'
                  }}
                  onDragLeave={(event) => {
                    event.stopPropagation()
                    const rect = event.currentTarget.getBoundingClientRect()
                    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
                      onNestedPaletteHoverChange?.(null)
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onNestedPaletteHoverChange?.(null)
                    const raw = event.dataTransfer.getData('cmd')
                    if (!raw) return
                    onDropIntoBlock(elsePath, raw, elseCount, event.dataTransfer.getData('ifPathCondition') || 'ahead', event.dataTransfer.getData('repeatTimes') || 2)
                  }}
                  data-tutorial-id="if-else-false-dropzone"
                  data-nested-drop-path={elsePathKey}
                  style={branchDropStyle(elseIsActive, branchElseBackground, activeElseBackground)}
                >
                  {elseCount === 0 ? (
                    <div style={{ minHeight: elseIsActive ? branchPreviewHeight - 6 : Math.max(16, branchPreviewHeight - 12), transition: 'min-height 0.12s ease' }} />
                  ) : elseChildren}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <RowDelete color={meta.color} isRunning={isRunning} onDelete={() => onDelete(path)} theme={theme} depth={depth} positioned="corner" />
    </div>
  )
}

function DraggableNestedSequence({ sequence, parentPath, depth, theme, isRunning, onReorderCommands, onMoveCommand, onDelete, onUpdateBlock, onDropIntoBlock, onNestedPaletteHoverChange, activeNestedDropPath, showIfElse = false }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [ghostY, setGhostY] = useState(0)
  const [insertAt, setInsertAt] = useState(null)
  const [layout, setLayout] = useState({ heights: [], tops: [], totalHeight: CHIP_HEIGHT })
  const stripRef = useRef(null)
  const itemRefs = useRef([])
  const heightsRef = useRef([])
  const startYRef = useRef(0)
  const startTopRef = useRef(0)
  const pathKey = JSON.stringify(parentPath)
  const previewHeight = getDropPreviewHeight(depth)
  const previewGap = Math.min(ITEM_GAP, 2)

  const measureHeights = useCallback(() => {
    heightsRef.current = sequence.map((command, index) => itemRefs.current[index]?.offsetHeight ?? getRowEstimate(command))
    let cursor = 0
    const tops = sequence.map((_, index) => {
      const top = cursor
      cursor += (heightsRef.current[index] ?? CHIP_HEIGHT) + ITEM_GAP
      return top
    })
    const totalHeight = sequence.length === 0
      ? previewHeight
      : heightsRef.current.reduce((sum, value) => sum + (value ?? CHIP_HEIGHT), 0) + ITEM_GAP * Math.max(0, sequence.length - 1)
    setLayout((prev) => (
      prev.totalHeight === totalHeight &&
      areNumberListsEqual(prev.heights, heightsRef.current) &&
      areNumberListsEqual(prev.tops, tops)
        ? prev
        : { heights: [...heightsRef.current], tops, totalHeight }
    ))
  }, [previewHeight, sequence])

  useLayoutEffect(() => {
    measureHeights()
    window.addEventListener('resize', measureHeights)
    return () => window.removeEventListener('resize', measureHeights)
  }, [measureHeights])

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined
    let frame = null
    const observer = new ResizeObserver(() => {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measureHeights)
    })
    if (stripRef.current) observer.observe(stripRef.current)
    itemRefs.current.forEach((node) => {
      if (node) observer.observe(node)
    })
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [measureHeights, sequence.length])

  const computeInsert = useCallback((pointerY) => {
    let cursor = 0
    for (let index = 0; index < sequence.length; index += 1) {
      const itemTop = cursor
      const height = heightsRef.current[index] ?? CHIP_HEIGHT
      if (pointerY < itemTop + height / 2) return index
      cursor += height + ITEM_GAP
    }
    return sequence.length
  }, [sequence.length])

  const endDrag = useCallback(() => {
    setDragIndex(null)
    setInsertAt(null)
  }, [])

  const handleStripDragOver = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!stripRef.current) return
    const rect = stripRef.current.getBoundingClientRect()
    const nextInsertAt = computeInsert(event.clientY - rect.top)
    onNestedPaletteHoverChange?.({ pathKey, path: parentPath, insertAt: nextInsertAt })
    event.dataTransfer.dropEffect = 'copy'
  }, [computeInsert, onNestedPaletteHoverChange, parentPath, pathKey])

  const handleStripDragLeave = useCallback((event) => {
    event.stopPropagation()
    if (!stripRef.current) return
    const rect = stripRef.current.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      onNestedPaletteHoverChange?.(null)
    }
  }, [onNestedPaletteHoverChange])

  const handleStripDrop = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    const raw = event.dataTransfer.getData('cmd')
    if (raw && stripRef.current) {
      const rect = stripRef.current.getBoundingClientRect()
      onDropIntoBlock(parentPath, raw, computeInsert(event.clientY - rect.top), event.dataTransfer.getData('ifPathCondition') || 'ahead', event.dataTransfer.getData('repeatTimes') || 2)
    }
    onNestedPaletteHoverChange?.(null)
  }, [computeInsert, onDropIntoBlock, onNestedPaletteHoverChange, parentPath])

  const handlePointerDown = useCallback((event, index) => {
    if (isRunning) return
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    measureHeights()
    startYRef.current = event.clientY
    startTopRef.current = layout.tops[index] ?? 0
    setDragIndex(index)
    setGhostY(layout.tops[index] ?? 0)
    setInsertAt(index)
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [isRunning, layout.tops, measureHeights])

  const handlePointerMove = useCallback((event, index) => {
    if (dragIndex !== index || !stripRef.current) return
    event.preventDefault()
    event.stopPropagation()
    const rect = stripRef.current.getBoundingClientRect()
    const pointerYInStrip = event.clientY - rect.top
    const draggedHeight = heightsRef.current[index] ?? CHIP_HEIGHT
    const maxTop = Math.max(0, layout.totalHeight - draggedHeight)
    const delta = event.clientY - startYRef.current
    setGhostY(Math.max(0, Math.min(maxTop, startTopRef.current + delta)))
    const dropInfo = getNestedDropInfoFromPoint(event.clientX, event.clientY)
    const moved = sequence[index]
    const canMoveToNestedTarget = dropInfo &&
      !areSameListPaths(dropInfo.path, parentPath) &&
      canMoveCommandToPath(moved, [...parentPath, index], dropInfo.path)

    if (canMoveToNestedTarget) {
      setInsertAt(null)
      onNestedPaletteHoverChange?.(dropInfo)
      return
    }

    if (dropInfo && !areSameListPaths(dropInfo.path, parentPath)) {
      onNestedPaletteHoverChange?.(null)
    }
    setInsertAt(computeInsert(pointerYInStrip))
  }, [computeInsert, dragIndex, layout.totalHeight, onNestedPaletteHoverChange, parentPath, sequence])

  const handlePointerUp = useCallback((event, index) => {
    if (dragIndex !== index) return
    event.preventDefault()
    event.stopPropagation()
    const dropInfo = getNestedDropInfoFromPoint(event.clientX, event.clientY) ?? activeNestedDropPath
    const moved = sequence[dragIndex]

    if (dropInfo &&
      !areSameListPaths(dropInfo.path, parentPath) &&
      canMoveCommandToPath(moved, [...parentPath, dragIndex], dropInfo.path)
    ) {
      onMoveCommand(parentPath, dragIndex, dropInfo.path, dropInfo.insertAt)
      onNestedPaletteHoverChange?.(null)
      endDrag()
      return
    }

    if (insertAt !== null) {
      const next = reorderCommands(sequence, dragIndex, insertAt)
      if (next !== sequence) onReorderCommands(parentPath, next)
    }
    onNestedPaletteHoverChange?.(null)
    endDrag()
  }, [activeNestedDropPath, dragIndex, endDrag, insertAt, onMoveCommand, onNestedPaletteHoverChange, onReorderCommands, parentPath, sequence])

  const tops = layout.tops
  const totalHeight = layout.totalHeight
  const externalInsertAt = activeNestedDropPath?.pathKey === pathKey ? activeNestedDropPath.insertAt : null
  const externalPreviewAt = dragIndex === null ? externalInsertAt : null
  const hasExternalPreview = externalPreviewAt !== null && externalPreviewAt !== undefined
  const previewSlotTop = (() => {
    if (!hasExternalPreview) return null
    if (sequence.length === 0) return 0
    if (externalPreviewAt >= sequence.length) return totalHeight + previewGap
    return Math.max(0, tops[externalPreviewAt] ?? 0)
  })()
  const displayHeight = hasExternalPreview
    ? (sequence.length === 0 ? previewHeight : totalHeight + previewHeight + previewGap)
    : totalHeight
  const insertLineTop = (() => {
    if (hasExternalPreview) return null
    const slotIndex = dragIndex === null ? externalInsertAt : insertAt
    if (slotIndex === null || slotIndex === undefined) return null
    if (sequence.length === 0) return 2
    if (slotIndex >= sequence.length) return totalHeight + 1
    return Math.max(0, (tops[slotIndex] ?? 0) - 2)
  })()

  return (
    <div
      ref={stripRef}
      data-nested-drop-path={pathKey}
      onDragOver={handleStripDragOver}
      onDragLeave={handleStripDragLeave}
      onDrop={handleStripDrop}
      style={{ position: 'relative', height: Math.max(displayHeight, CHIP_HEIGHT), minHeight: CHIP_HEIGHT, transition: 'height 0.12s ease' }}
    >
      {previewSlotTop !== null && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: previewSlotTop,
            height: previewHeight,
            borderRadius: 8,
            background: theme === 'light' ? 'rgba(20,184,212,0.08)' : 'rgba(45,212,191,0.07)',
            border: `1.5px dashed ${theme === 'light' ? '#14b8d466' : '#2dd4bf66'}`,
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      {sequence.map((command, index) => {
        const path = [...parentPath, index]
        const isDragging = dragIndex === index
        const draggedHeight = dragIndex === null ? 0 : (layout.heights[dragIndex] ?? CHIP_HEIGHT)
        let slotTop = tops[index] ?? 0

        if (dragIndex !== null && dragIndex !== index && insertAt !== null) {
          if (dragIndex < insertAt) {
            if (index > dragIndex && index < insertAt) slotTop -= draggedHeight + ITEM_GAP
          } else if (dragIndex > insertAt) {
            if (index >= insertAt && index < dragIndex) slotTop += draggedHeight + ITEM_GAP
          }
        } else if (hasExternalPreview && index >= externalPreviewAt) {
          slotTop += previewHeight + previewGap
        }

        return (
          <div
            key={`${isNestedBlockCommand(command) ? command.type : command}-${path.join('-')}`}
            ref={(node) => { itemRefs.current[index] = node }}
            data-block-command-index={index}
            style={{ position: 'absolute', left: 0, right: 0, top: isDragging ? ghostY : slotTop, zIndex: isDragging ? 50 : 1, transition: isDragging ? 'none' : 'top 0.15s cubic-bezier(0.25,0.46,0.45,0.94)', boxShadow: isDragging ? `0 6px 24px ${getMeta(command, theme).color}40` : 'none', transform: isDragging ? 'scale(1.018)' : 'scale(1)', opacity: isDragging ? 0.96 : 1, pointerEvents: isDragging ? 'none' : 'auto', cursor: isRunning ? 'default' : 'grab', touchAction: 'none' }}
            onPointerDown={(event) => handlePointerDown(event, index)}
            onPointerMove={(event) => handlePointerMove(event, index)}
            onPointerUp={(event) => handlePointerUp(event, index)}
            onPointerCancel={endDrag}
          >
            {isNestedBlockCommand(command) ? (
              <NestedBlockCard
                command={command}
                index={index}
                depth={depth}
                path={path}
                theme={theme}
                isRunning={isRunning}
                onDelete={onDelete}
                onUpdateBlock={onUpdateBlock}
                onDropIntoBlock={onDropIntoBlock}
                onNestedPaletteHoverChange={onNestedPaletteHoverChange}
                activeNestedDropPath={activeNestedDropPath}
                showIfElse={showIfElse}
                elseChildren={isIfPathCommand(command) && showIfElse ? (
                  <DraggableNestedSequence
                    sequence={command.elseCommands ?? []}
                    parentPath={withPathBranch(path, 'elseCommands')}
                    depth={depth + 1}
                    theme={theme}
                    isRunning={isRunning}
                    onReorderCommands={onReorderCommands}
                    onMoveCommand={onMoveCommand}
                    onDelete={onDelete}
                    onUpdateBlock={onUpdateBlock}
                    onDropIntoBlock={onDropIntoBlock}
                    onNestedPaletteHoverChange={onNestedPaletteHoverChange}
                    activeNestedDropPath={activeNestedDropPath}
                    showIfElse={showIfElse}
                  />
                ) : null}
              >
                <DraggableNestedSequence
                  sequence={command.commands ?? []}
                  parentPath={path}
                  depth={depth + 1}
                  theme={theme}
                  isRunning={isRunning}
                  onReorderCommands={onReorderCommands}
                  onMoveCommand={onMoveCommand}
                  onDelete={onDelete}
                  onUpdateBlock={onUpdateBlock}
                  onDropIntoBlock={onDropIntoBlock}
                  onNestedPaletteHoverChange={onNestedPaletteHoverChange}
                  activeNestedDropPath={activeNestedDropPath}
                  showIfElse={showIfElse}
                />
              </NestedBlockCard>
            ) : (
              <CommandChip command={command} index={index} depth={depth} path={path} theme={theme} isRunning={isRunning} onDelete={onDelete} />
            )}
          </div>
        )
      })}

      {insertLineTop !== null && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: insertLineTop, height: 3, background: theme === 'light' ? '#14b8d4' : '#2dd4bf', opacity: 0.9, borderRadius: 2, zIndex: 60, boxShadow: `0 0 8px ${theme === 'light' ? '#14b8d4' : '#2dd4bf'}` }} />
      )}
    </div>
  )
}

function DraggableProgram({ sequence, isRunning, onReorder, onInsertAt, onDelete, onUpdateBlock, onDropIntoBlock, theme, setDragOver, showIfElse = false }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [ghostY, setGhostY] = useState(0)
  const [insertAt, setInsertAt] = useState(null)
  const [paletteInsertAt, setPaletteInsertAt] = useState(null)
  const [activeNestedDropPath, setActiveNestedDropPath] = useState(null)
  const [layout, setLayout] = useState({ heights: [], tops: [], totalHeight: CHIP_HEIGHT })
  const stripRef = useRef(null)
  const itemRefs = useRef([])
  const heightsRef = useRef([])
  const startYRef = useRef(0)
  const startTopRef = useRef(0)

  const measureHeights = useCallback(() => {
    heightsRef.current = sequence.map((command, index) => itemRefs.current[index]?.offsetHeight ?? getRowEstimate(command))
    let cursor = 0
    const tops = sequence.map((_, index) => {
      const top = cursor
      cursor += (heightsRef.current[index] ?? CHIP_HEIGHT) + ITEM_GAP
      return top
    })
    const totalHeight = sequence.length === 0
      ? CHIP_HEIGHT
      : heightsRef.current.reduce((sum, value) => sum + (value ?? CHIP_HEIGHT), 0) + ITEM_GAP * Math.max(0, sequence.length - 1)
    setLayout((prev) => (
      prev.totalHeight === totalHeight &&
      areNumberListsEqual(prev.heights, heightsRef.current) &&
      areNumberListsEqual(prev.tops, tops)
        ? prev
        : { heights: [...heightsRef.current], tops, totalHeight }
    ))
  }, [sequence])

  useLayoutEffect(() => {
    measureHeights()
    window.addEventListener('resize', measureHeights)
    return () => window.removeEventListener('resize', measureHeights)
  }, [measureHeights])

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined
    let frame = null
    const observer = new ResizeObserver(() => {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measureHeights)
    })
    if (stripRef.current) observer.observe(stripRef.current)
    itemRefs.current.forEach((node) => {
      if (node) observer.observe(node)
    })
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [measureHeights, sequence.length])

  const computeInsert = useCallback((pointerY) => {
    let cursor = 0
    for (let index = 0; index < sequence.length; index += 1) {
      const itemTop = cursor
      const height = heightsRef.current[index] ?? CHIP_HEIGHT
      if (pointerY < itemTop + height / 2) return index
      cursor += height + ITEM_GAP
    }
    return sequence.length
  }, [sequence.length])

  const handlePointerDown = useCallback((event, index) => {
    if (isRunning) return
    if (event.button !== 0) return
    event.preventDefault()
    measureHeights()
    startYRef.current = event.clientY
    startTopRef.current = layout.tops[index] ?? 0
    setDragIndex(index)
    setGhostY(layout.tops[index] ?? 0)
    setInsertAt(index)
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [isRunning, layout.tops, measureHeights])

  const handlePointerMove = useCallback((event, index) => {
    if (dragIndex !== index || !stripRef.current) return
    const rect = stripRef.current.getBoundingClientRect()
    const pointerYInStrip = event.clientY - rect.top
    const draggedHeight = heightsRef.current[index] ?? CHIP_HEIGHT
    const maxTop = Math.max(0, layout.totalHeight - draggedHeight)
    const delta = event.clientY - startYRef.current
    setGhostY(Math.max(0, Math.min(maxTop, startTopRef.current + delta)))
    const dropInfo = getNestedDropInfoFromPoint(event.clientX, event.clientY)
    const moved = sequence[index]
    if (dropInfo && canMoveCommandToPath(moved, [index], dropInfo.path)) {
      setInsertAt(null)
      setActiveNestedDropPath(dropInfo)
      return
    }
    if (dropInfo) {
      setActiveNestedDropPath(null)
    }
    setInsertAt(computeInsert(pointerYInStrip))
  }, [computeInsert, dragIndex, layout.totalHeight, sequence])

  const handlePointerUp = useCallback((event, index) => {
    if (dragIndex !== index) return
    const dropInfo = getNestedDropInfoFromPoint(event.clientX, event.clientY) ?? activeNestedDropPath

    if (dropInfo && canMoveCommandToPath(sequence[dragIndex], [dragIndex], dropInfo.path)) {
      onReorder(moveCommandBetweenPaths(sequence, [], dragIndex, dropInfo.path, dropInfo.insertAt))
      setDragIndex(null)
      setInsertAt(null)
      setActiveNestedDropPath(null)
      return
    }

    if (insertAt !== null) {
      const adjustedIndex = dragIndex < insertAt ? insertAt - 1 : insertAt
      if (adjustedIndex !== dragIndex) {
        onReorder(reorderCommands(sequence, dragIndex, insertAt))
      }
    }
    setDragIndex(null)
    setInsertAt(null)
    setActiveNestedDropPath(null)
  }, [activeNestedDropPath, dragIndex, insertAt, onReorder, sequence])

  const handleStripDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDragOver(true)
    const nestedDropInfo = getNestedDropInfoFromPoint(event.clientX, event.clientY)
    if (nestedDropInfo) {
      setActiveNestedDropPath(nestedDropInfo)
      setPaletteInsertAt(null)
      return
    }
    if (!stripRef.current) return
    const rect = stripRef.current.getBoundingClientRect()
    setActiveNestedDropPath(null)
    setPaletteInsertAt(computeInsert(event.clientY - rect.top))
  }, [computeInsert, setDragOver])

  const handleStripDragLeave = useCallback((event) => {
    if (!stripRef.current) return
    const rect = stripRef.current.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      setPaletteInsertAt(null)
      setActiveNestedDropPath(null)
      setDragOver(false)
    }
  }, [setDragOver])

  const handleStripDrop = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    const cmd = event.dataTransfer.getData('cmd')
    if (cmd && stripRef.current) {
      const rect = stripRef.current.getBoundingClientRect()
      onInsertAt(cmd, computeInsert(event.clientY - rect.top), event.dataTransfer.getData('ifPathCondition') || 'ahead', event.dataTransfer.getData('repeatTimes') || 2)
    }
    setPaletteInsertAt(null)
    setActiveNestedDropPath(null)
    setDragOver(false)
  }, [computeInsert, onInsertAt, setDragOver])

  const handleNestedPaletteHoverChange = useCallback((dropInfo) => {
    setActiveNestedDropPath(dropInfo)
    if (dropInfo) {
      setPaletteInsertAt(null)
      return
    }
  }, [])

  const handleNestedReorder = useCallback((parentPath, nextCommands) => {
    onReorder(updateCommandsAtPath(sequence, parentPath, () => nextCommands))
  }, [onReorder, sequence])

  const handleNestedMove = useCallback((sourceParentPath, sourceIndex, targetPath, targetIndex) => {
    onReorder(moveCommandBetweenPaths(sequence, sourceParentPath, sourceIndex, targetPath, targetIndex))
  }, [onReorder, sequence])

  const tops = layout.tops
  const totalHeight = layout.totalHeight
  const insertLineTop = (() => {
    if (activeNestedDropPath) return null
    const slotIndex = dragIndex === null ? paletteInsertAt : insertAt
    if (slotIndex === null) return null
    if (slotIndex >= sequence.length) return totalHeight - 2
    return Math.max(0, (tops[slotIndex] ?? 0) - 2)
  })()

  return (
    <div ref={stripRef} onDragOver={handleStripDragOver} onDragLeave={handleStripDragLeave} onDrop={handleStripDrop} style={{ position: 'relative', height: Math.max(totalHeight, CHIP_HEIGHT), minHeight: '100%' }}>
      {sequence.map((command, index) => {
        const isDragging = dragIndex === index
        const draggedHeight = dragIndex === null ? 0 : (layout.heights[dragIndex] ?? CHIP_HEIGHT)
        let slotTop = tops[index] ?? 0

        if (dragIndex !== null && dragIndex !== index && insertAt !== null) {
          if (dragIndex < insertAt) {
            if (index > dragIndex && index < insertAt) slotTop -= draggedHeight + ITEM_GAP
          } else if (dragIndex > insertAt) {
            if (index >= insertAt && index < dragIndex) slotTop += draggedHeight + ITEM_GAP
          }
        }

        return (
          <div
            key={`${isNestedBlockCommand(command) ? command.type : command}-${index}`}
            ref={(node) => { itemRefs.current[index] = node }}
            style={{ position: 'absolute', left: 0, right: 0, top: isDragging ? ghostY : slotTop, zIndex: isDragging ? 50 : 1, transition: isDragging ? 'none' : 'top 0.15s cubic-bezier(0.25,0.46,0.45,0.94)', boxShadow: isDragging ? `0 6px 28px ${getMeta(command, theme).color}44` : 'none', transform: isDragging ? 'scale(1.02)' : 'scale(1)', opacity: isDragging ? 0.95 : 1, pointerEvents: isDragging ? 'none' : 'auto' }}
            onPointerDown={(event) => handlePointerDown(event, index)}
            onPointerMove={(event) => handlePointerMove(event, index)}
            onPointerUp={(event) => handlePointerUp(event, index)}
          >
            {isNestedBlockCommand(command) ? (
              <NestedBlockCard
                command={command}
                index={index}
                depth={0}
                path={[index]}
                theme={theme}
                isRunning={isRunning}
                onDelete={onDelete}
                onUpdateBlock={onUpdateBlock}
                onDropIntoBlock={onDropIntoBlock}
                onNestedPaletteHoverChange={handleNestedPaletteHoverChange}
                activeNestedDropPath={activeNestedDropPath}
                showIfElse={showIfElse}
                elseChildren={isIfPathCommand(command) && showIfElse ? (
                  <DraggableNestedSequence
                    sequence={command.elseCommands ?? []}
                    parentPath={withPathBranch([index], 'elseCommands')}
                    depth={1}
                    theme={theme}
                    isRunning={isRunning}
                    onReorderCommands={handleNestedReorder}
                    onMoveCommand={handleNestedMove}
                    onDelete={onDelete}
                    onUpdateBlock={onUpdateBlock}
                    onDropIntoBlock={onDropIntoBlock}
                    onNestedPaletteHoverChange={handleNestedPaletteHoverChange}
                    activeNestedDropPath={activeNestedDropPath}
                    showIfElse={showIfElse}
                  />
                ) : null}
              >
                <DraggableNestedSequence
                  sequence={command.commands ?? []}
                  parentPath={[index]}
                  depth={1}
                  theme={theme}
                  isRunning={isRunning}
                  onReorderCommands={handleNestedReorder}
                  onMoveCommand={handleNestedMove}
                  onDelete={onDelete}
                  onUpdateBlock={onUpdateBlock}
                  onDropIntoBlock={onDropIntoBlock}
                  onNestedPaletteHoverChange={handleNestedPaletteHoverChange}
                  activeNestedDropPath={activeNestedDropPath}
                  showIfElse={showIfElse}
                />
              </NestedBlockCard>
            ) : (
              <CommandChip command={command} index={index} depth={0} path={[index]} theme={theme} isRunning={isRunning} onDelete={onDelete} />
            )}
          </div>
        )
      })}

      {insertLineTop !== null && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: insertLineTop, height: 3, background: theme === 'light' ? '#14b8d4' : '#2dd4bf', opacity: 0.9, borderRadius: 2, zIndex: 60, boxShadow: `0 0 8px ${theme === 'light' ? '#14b8d4' : '#2dd4bf'}` }} />
      )}
    </div>
  )
}

function ShowCodeModal({ code, theme, onClose }) {
  const isLight = theme === 'light'
  const panelBg = isLight
    ? 'linear-gradient(180deg, rgba(255,255,255,0.99), rgba(235,248,255,0.98))'
    : 'linear-gradient(180deg, rgba(7,14,26,0.99), rgba(11,18,34,0.98))'
  const border = isLight ? '#2fc9df' : '#f59e0b'
  const text = isLight ? '#173f66' : '#e5f4ff'
  const softText = isLight ? '#446982' : '#a9bed2'
  const codeBg = isLight ? 'rgba(231,235,241,0.96)' : 'rgba(2,6,14,0.96)'
  const codeBorder = isLight ? '#c8d3df' : '#24364a'
  const codeText = isLight ? '#7e57c2' : '#c4b5fd'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        background: isLight ? 'rgba(17,31,51,0.34)' : 'rgba(0,0,0,0.68)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        style={{
          width: 'min(980px, calc(100vw - 36px))',
          maxHeight: 'min(780px, calc(100vh - 36px))',
          background: panelBg,
          border: `2px solid ${border}`,
          borderRadius: 16,
          boxShadow: isLight
            ? '0 28px 60px rgba(55,117,182,0.24), 0 12px 28px rgba(45,201,223,0.16)'
            : '0 28px 70px rgba(0,0,0,0.62), 0 0 28px rgba(245,158,11,0.12)',
          padding: '26px 28px 22px',
          color: text,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          position: 'relative',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close Show Code"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1.5px solid ${isLight ? '#bddff2' : '#33465e'}`,
            background: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(5,10,18,0.92)',
            color: softText,
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          ×
        </button>

        <p style={{ margin: '4px 42px 0 0', fontSize: 18, lineHeight: 1.48, color: text, fontWeight: 650 }}>
          Even top universities teach block-based coding (e.g.,{' '}
          <a
            href="https://www.edx.org/cs50"
            target="_blank"
            rel="noreferrer"
            style={{ color: isLight ? '#7c3aed' : '#c4b5fd', textDecoration: 'underline', fontWeight: 800 }}
          >
            Harvard
          </a>
          {', '}
          <a
            href="https://bjc.berkeley.edu"
            target="_blank"
            rel="noreferrer"
            style={{ color: isLight ? '#7c3aed' : '#c4b5fd', textDecoration: 'underline', fontWeight: 800 }}
          >
            Berkeley
          </a>
          {'). But behind the scenes, the blocks you have assembled can also be shown in Python, one of the world\'s most widely used programming languages:'}
        </p>

        <pre
          style={{
            margin: 0,
            minHeight: 280,
            maxHeight: 'min(460px, calc(100vh - 260px))',
            overflow: 'auto',
            padding: '22px 24px',
            borderRadius: 12,
            background: codeBg,
            border: `1.5px solid ${codeBorder}`,
            color: codeText,
            fontSize: 18,
            lineHeight: 1.55,
            fontFamily: 'Consolas, "Courier New", monospace',
            whiteSpace: 'pre',
            boxShadow: isLight ? 'inset 0 1px 0 rgba(255,255,255,0.8)' : 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {code}
        </pre>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              minWidth: 118,
              padding: '12px 28px',
              borderRadius: 8,
              border: `1.5px solid ${isLight ? '#2fc9df' : '#2dd4bf'}`,
              background: isLight
                ? 'linear-gradient(135deg, rgba(45,201,223,0.22), rgba(139,92,246,0.14))'
                : 'linear-gradient(135deg, rgba(45,212,191,0.18), rgba(45,212,191,0.10))',
              color: isLight ? '#124b73' : '#d7fffa',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 15,
              letterSpacing: 1.4,
              fontWeight: 900,
            }}
          >
            OK
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function LockedProgramList({ sequence, theme, depth = 0 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.max(6, 10 - depth * 2) }}>
      {sequence.map((command, index) => {
        const meta = getMeta(command, theme)
        const isRepeat = isRepeatCommand(command)
        const isIf = isIfPathCommand(command)
        const conditionLabel = {
          ahead: 'PATH ahead',
          left: 'PATH to the left',
          right: 'PATH to the right',
        }[command.condition ?? 'ahead'] ?? 'PATH ahead'

        if (isRepeat || isIf) {
          return (
            <div
              key={`${command.type}-${index}-${depth}`}
              style={{
                border: `1.5px solid ${meta.color}77`,
                borderLeft: `4px solid ${meta.color}`,
                borderRadius: 10,
                background: meta.bg,
                padding: 10,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,${theme === 'light' ? 0.62 : 0.06})`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: meta.color, fontSize: 10, fontFamily: 'monospace', fontWeight: 900, width: 18, textAlign: 'right' }}>{String(index + 1).padStart(2, '0')}</span>
                <span style={{ color: meta.color, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 900 }}>
                  {isRepeat ? `REPEAT (${command.times}) TIMES` : `IF ${conditionLabel}`}
                </span>
              </div>
              {isIf ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 14 }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: meta.color, fontSize: 10, fontFamily: 'monospace', fontWeight: 900 }}>do:</p>
                    <LockedProgramList sequence={command.commands ?? []} theme={theme} depth={depth + 1} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: meta.color, fontSize: 10, fontFamily: 'monospace', fontWeight: 900 }}>else:</p>
                    <LockedProgramList sequence={command.elseCommands ?? []} theme={theme} depth={depth + 1} />
                  </div>
                </div>
              ) : (
                <div style={{ paddingLeft: 14 }}>
                  <LockedProgramList sequence={command.commands ?? []} theme={theme} depth={depth + 1} />
                </div>
              )}
            </div>
          )
        }

        return (
          <div
            key={`${command}-${index}-${depth}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 32,
              borderRadius: 8,
              borderLeft: `3px solid ${meta.color}`,
              background: meta.bg,
              padding: '6px 10px',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ color: meta.color, fontSize: 10, fontFamily: 'monospace', fontWeight: 900, width: 18, textAlign: 'right' }}>{String(index + 1).padStart(2, '0')}</span>
            <span style={{ color: meta.color, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 900 }}>{meta.rowLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function CommandBuilder({
  sequence,
  isRunning,
  isMirrored,
  onAdd,
  onRemove,
  onClear,
  onRun,
  visorFlipCount,
  onVisorFlip,
  phase,
  onReorder,
  needsReset,
  onReset,
  runBlocked = false,
  speed,
  onSpeedChange,
  showVisorFlip = true,
  targetCommands = null,
  showRepeat = false,
  showCollect = false,
  showIfPath = false,
  showIfElse = false,
  ifElseBlocked = false,
  defaultIfPathCondition = 'ahead',
  lockedProgram = false,
  paletteDisabled = false,
}) {
  const theme = useContext(ThemeContext)
  const t = THEMES[theme]
  const [dragOver, setDragOver] = useState(false)
  const [ifPathPaletteCondition, setIfPathPaletteCondition] = useState(defaultIfPathCondition)
  const [repeatPaletteTimes, setRepeatPaletteTimes] = useState(2)
  const [showCodeModal, setShowCodeModal] = useState(false)

  useEffect(() => {
    setIfPathPaletteCondition(defaultIfPathCondition)
  }, [defaultIfPathCondition])

  const totalBlocks = countProgramBlocks(sequence)
  const programCode = programToPython(sequence)
  const isDisabled = isRunning || sequence.length === 0 || needsReset || runBlocked
  const wrapperBg = theme === 'light' ? 'rgba(255,255,255,0.18)' : 'rgba(6,11,20,0.16)'
  const subPanelStyle = {
    flex: '1 1 0',
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: t.panelBg,
    border: `1.5px solid ${t.panelBorder}`,
    borderRadius: 12,
    padding: '16px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    boxShadow: theme === 'light' ? '0 18px 40px rgba(74,144,226,0.12), 0 10px 24px rgba(45,201,223,0.10), inset 0 1px 0 rgba(255,255,255,0.7)' : '0 4px 24px rgba(0,0,0,0.45)',
  }
  const actionBtn = (disabled) => ({
    width: 34,
    height: 30,
    padding: 0,
    background: 'transparent',
    border: `1.5px solid ${t.btnBorder}`,
    borderRadius: 6,
    color: disabled ? t.btnDisabled : t.btnColor,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 800,
    flexShrink: 0,
  })
  const showCodeBtn = {
    padding: '8px 12px',
    background: theme === 'light' ? 'rgba(45,201,223,0.12)' : 'rgba(45,212,191,0.08)',
    border: `1.5px solid ${theme === 'light' ? '#2fc9df88' : '#2dd4bf55'}`,
    borderRadius: 7,
    color: theme === 'light' ? '#124b73' : '#9ff5ec',
    cursor: 'pointer',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  }

  const handleTopLevelAdd = useCallback((command) => {
    onAdd(command)
  }, [onAdd])

  const handleDelete = useCallback((path) => {
    onReorder(removeCommandAtPath(sequence, path))
  }, [onReorder, sequence])

  const handleUpdateBlock = useCallback((path, nextBlock) => {
    onReorder(updateBlockAtPath(sequence, path, (block) => {
      if (isRepeatCommand(block)) return createRepeatCommand(nextBlock.times, nextBlock.commands ?? [])
      if (isIfPathCommand(block)) {
        return createIfPathCommand(
          nextBlock.condition ?? block.condition ?? 'ahead',
          nextBlock.commands ?? block.commands ?? [],
          nextBlock.elseCommands ?? block.elseCommands ?? []
        )
      }
      return block
    }))
  }, [onReorder, sequence])

  const handleDropIntoBlock = useCallback((path, raw, index = Number.MAX_SAFE_INTEGER, ifPathCondition = 'ahead', repeatTimes = 2) => {
    const dropped = createCommandFromCode(raw, ifPathCondition, repeatTimes)
    onReorder(insertCommandAtPath(sequence, path, index, dropped))
  }, [onReorder, sequence])

  const handleInsertAt = useCallback((rawCommand, index, ifPathCondition = 'ahead', repeatTimes = 2) => {
    const inserted = createCommandFromCode(rawCommand, ifPathCondition, repeatTimes)
    onReorder(insertCommandAtPath(sequence, [], index, inserted))
  }, [onReorder, sequence])

  const visibleCommands = PALETTE_ORDER.filter((code) => {
    if (code === 'REPEAT') return showRepeat
    if (code === 'IF_PATH') return showIfPath
    if (code === 'C') return showCollect
    return true
  })

  if (phase !== 'develop') return null

  if (lockedProgram) {
    return (
      <div data-tutorial-id="command-builder" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', height: '100%', flex: 1, minHeight: 0, background: wrapperBg, padding: 0, boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: showVisorFlip ? 'minmax(0, 1fr) 170px' : '1fr', gap: 12, alignItems: 'stretch', flexShrink: 0 }}>
          <div style={{ ...subPanelStyle, padding: '12px 14px', flex: '0 0 auto' }}>
            <SpeedBar speed={speed} onSpeedChange={onSpeedChange} theme={theme} />
          </div>
          {showVisorFlip && (
            <motion.button whileTap={{ scale: 0.96 }} onClick={onVisorFlip} disabled={visorFlipCount >= 3} data-tutorial-id="visor-flip-button" style={{ width: '100%', minHeight: 62, padding: '9px 12px', background: visorFlipCount >= 3 ? t.visorExhBg : t.visorBg, border: `1.5px solid ${visorFlipCount >= 3 ? t.visorExhBd : t.visorBorder}`, borderRadius: 8, color: visorFlipCount >= 3 ? t.visorExhTx : t.visorText, cursor: visorFlipCount >= 3 ? 'not-allowed' : 'pointer', fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 800 }}>
              <span>{'\u{1F441}'} VISOR FLIP</span>
              <span style={{ fontSize: 10 }}>{3 - visorFlipCount} left</span>
            </motion.button>
          )}
        </div>

        <div data-tutorial-id="trace-program-box" style={{ ...subPanelStyle, flex: '1 1 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: 12, color: t.programLabel, fontFamily: 'monospace', letterSpacing: 1.2, margin: 0, fontWeight: 900 }}>LAUNCH PROGRAM</p>
              <p style={{ fontSize: 10, color: t.programCount, fontFamily: 'monospace', letterSpacing: 0.8, margin: '4px 0 0 0' }}>Read it, trace it, then choose LUMA's ending tile.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
              {targetCommands !== null && <span style={{ color: t.targetCmdColor, fontSize: 10.5, fontFamily: 'monospace', fontWeight: 900, whiteSpace: 'nowrap' }}>Shortest Path: {targetCommands} Blocks</span>}
              <button type="button" onClick={() => setShowCodeModal(true)} style={showCodeBtn}>{'</>'} Show Code</button>
            </div>
          </div>
          <div
            data-tutorial-id="sequence-area"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              borderRadius: 10,
              border: `1.5px solid ${t.scrollBorder}`,
              background: theme === 'light'
                ? 'linear-gradient(180deg, rgba(231,250,255,0.96), rgba(241,245,255,0.94))'
                : 'linear-gradient(180deg, rgba(2,8,18,0.97), rgba(7,13,26,0.95))',
              padding: 12,
              boxSizing: 'border-box',
            }}
          >
            <LockedProgramList sequence={sequence} theme={theme} />
          </div>
        </div>
        <AnimatePresence>
          {showCodeModal && (
            <ShowCodeModal
              code={programCode}
              theme={theme}
              onClose={() => setShowCodeModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div data-tutorial-id="command-builder" style={{ display: 'flex', gap: 16, width: '100%', height: '100%', flex: 1, minHeight: 0, background: wrapperBg, padding: 0, boxSizing: 'border-box' }}>
      <div style={{ flex: '0 0 280px', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {showVisorFlip && (
          <motion.button whileTap={{ scale: 0.96 }} onClick={onVisorFlip} disabled={visorFlipCount >= 3} data-tutorial-id="visor-flip-button" style={{ width: '100%', padding: '9px 12px', background: visorFlipCount >= 3 ? t.visorExhBg : t.visorBg, border: `1.5px solid ${visorFlipCount >= 3 ? t.visorExhBd : t.visorBorder}`, borderRadius: 8, color: visorFlipCount >= 3 ? t.visorExhTx : t.visorText, cursor: visorFlipCount >= 3 ? 'not-allowed' : 'pointer', fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>{'\u{1F441}'} VISOR FLIP</span>
            <span style={{ fontSize: 10, fontWeight: 800 }}>{3 - visorFlipCount} left</span>
          </motion.button>
        )}

        <SpeedBar speed={speed} onSpeedChange={onSpeedChange} theme={theme} />

        <AnimatePresence>
          {isMirrored && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', padding: '6px 10px', background: t.mirrorBg, border: `1.5px solid ${t.mirrorBorder}`, borderRadius: 6, color: t.mirrorText, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 800 }}>WARNING: LEFT / RIGHT FLIPPED</motion.div>}
        </AnimatePresence>
        <div style={{ ...subPanelStyle, flex: '1 1 0' }}>
          <div data-tutorial-id="command-palette" style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <p style={{ fontSize: 11, color: t.subLabel, fontFamily: 'monospace', letterSpacing: 1.1, margin: 0, fontWeight: 800 }}>INSTRUCTIONS</p>
            <p style={{ fontSize: 10, color: t.programCount, fontFamily: 'monospace', letterSpacing: 0.8, margin: 0 }}>Tap or drag from here</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleCommands.map((code) => (
                <PaletteButton
                  key={code}
                  code={code}
                  disabled={isRunning || paletteDisabled}
                  onAdd={handleTopLevelAdd}
                  theme={theme}
                  tutorialId={code === 'F' ? 'command-forward' : code === 'C' ? 'command-collect' : code === 'TR' || code === 'TL' ? 'command-turn' : code === 'IF_PATH' ? (showIfElse ? 'command-if-else-path' : 'command-if-path') : 'command-repeat'}
                  ifPathCondition={ifPathPaletteCondition}
                  onIfPathConditionChange={setIfPathPaletteCondition}
                  repeatTimes={repeatPaletteTimes}
                  onRepeatTimesChange={setRepeatPaletteTimes}
                  showIfElse={showIfElse}
                />
              ))}
            </div>
          </div>
        </div>

        {needsReset && <motion.button key="reset-btn" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }} onClick={onReset} disabled={isRunning} data-tutorial-id="reset-button" style={{ width: '100%', padding: '11px 0', background: t.resetBg, border: '2px solid #fb7185', borderRadius: 8, color: theme === 'light' ? '#be123c' : '#fb7185', fontFamily: 'monospace', fontSize: 13, letterSpacing: 2, cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 800 }}>{'\u21BA'} RESET LUMA</motion.button>}

        {!needsReset && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={onRun} disabled={isDisabled} data-tutorial-id="run-button" style={{ width: '100%', padding: '13px 0', background: isDisabled ? t.runBgDisabled : t.runBgActive, border: `2px solid ${isDisabled ? t.runBorderDisabled : t.runBorderActive}`, borderRadius: 8, color: isDisabled ? t.runColorDisabled : t.runColorActive, fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, cursor: isDisabled ? 'not-allowed' : 'pointer', fontWeight: 800 }}>
            {isRunning ? 'RUNNING' : ifElseBlocked ? 'ADD ELSE BLOCK' : runBlocked ? 'SET PREDICTION FIRST' : 'EXECUTE PROGRAM'}
          </motion.button>
        )}
      </div>

      <div style={{ ...subPanelStyle, flex: '1 1 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexShrink: 0, width: '100%' }}>
            <div style={{ minWidth: 0, flex: '1 1 auto' }}>
              <p style={{ fontSize: 11, color: t.programLabel, fontFamily: 'monospace', letterSpacing: 1.1, margin: 0, fontWeight: 800, whiteSpace: 'nowrap' }}>PROGRAM <span style={{ color: t.programCount, fontWeight: 600, whiteSpace: 'nowrap' }}>({totalBlocks} {totalBlocks === 1 ? 'block' : 'blocks'})</span></p>
              <p style={{ fontSize: 10, color: t.programCount, fontFamily: 'monospace', letterSpacing: 0.8, margin: '4px 0 0 0' }}>Top to bottom order</p>
            </div>
            <div style={{ flex: '0 1 168px', minWidth: 150, textAlign: 'right', overflow: 'hidden', marginRight: 6 }}>
              {targetCommands !== null && <span style={{ display: 'block', fontSize: 10.5, color: t.targetCmdColor, fontFamily: 'monospace', letterSpacing: 0.2, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip' }}>Shortest Path: {targetCommands} Blocks</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-end', flex: '0 0 auto' }}>
              <button title="Delete" aria-label="Delete" onClick={onRemove} disabled={isRunning || sequence.length === 0} style={actionBtn(isRunning || sequence.length === 0)}>⌫</button>
              <button title="Clear" aria-label="Clear" onClick={onClear} disabled={isRunning || sequence.length === 0} style={actionBtn(isRunning || sequence.length === 0)}>✕</button>
              <button type="button" onClick={() => setShowCodeModal(true)} style={showCodeBtn}>{'</>'} Show Code</button>
            </div>
          </div>

          <div
            data-tutorial-id="sequence-area"
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
                setDragOver(false)
              }
            }}
            onDrop={(event) => {
              if (sequence.length > 0) return
              event.preventDefault()
              setDragOver(false)
              const rawCommand = event.dataTransfer.getData('cmd')
              if (!rawCommand) return
              onReorder(insertCommandAtPath(sequence, [], sequence.length, createCommandFromCode(
                rawCommand,
                event.dataTransfer.getData('ifPathCondition') || 'ahead',
                event.dataTransfer.getData('repeatTimes') || 2,
              )))
            }}
            style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto', background: dragOver ? (theme === 'light' ? 'linear-gradient(180deg, rgba(210,248,255,0.98), rgba(239,240,255,0.96))' : 'rgba(45,212,191,0.04)') : t.scrollBg, border: `1.5px ${dragOver ? `dashed ${theme === 'light' ? '#2fc9df88' : '#2dd4bf55'}` : `solid ${t.scrollBorder}`}`, borderRadius: 8, padding: 10, boxSizing: 'border-box' }}
          >
            {sequence.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', gap: 6 }}>
                <div style={{ fontSize: 18, opacity: theme === 'light' ? 0.28 : 0.18, color: theme === 'light' ? '#14b8d4' : '#5a8890' }}>↓</div>
                <p style={{ color: t.emptyText, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1, margin: 0, userSelect: 'none', fontWeight: 700 }}>Drag blocks here</p>
              </div>
            ) : (
              <DraggableProgram
                sequence={sequence}
                isRunning={isRunning}
                onReorder={onReorder}
                onInsertAt={handleInsertAt}
                onDelete={handleDelete}
                onUpdateBlock={handleUpdateBlock}
                onDropIntoBlock={handleDropIntoBlock}
                theme={theme}
                setDragOver={setDragOver}
                showIfElse={showIfElse}
              />
            )}
          </div>
        </div>

      <AnimatePresence>
        {showCodeModal && (
          <ShowCodeModal
            code={programCode}
            theme={theme}
            onClose={() => setShowCodeModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
