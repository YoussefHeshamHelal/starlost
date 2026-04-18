import { useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeContext } from '../context/theme'
import { clampRepeatTimes, countProgramBlocks, createRepeatCommand, isRepeatCommand } from '../utils/commands'

const THUMB_R = 8
const CHIP_HEIGHT = 44
const ITEM_GAP = 6

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
  F: { buttonLabel: 'MOVE FORWARD', rowLabel: 'FORWARD', icon: '↑', color: '#14b8d4', darkColor: '#2dd4bf', bg: 'rgba(20,184,212,0.12)', darkBg: 'rgba(45,212,191,0.20)' },
  TR: { buttonLabel: 'TURN RIGHT', rowLabel: 'TURN RIGHT', icon: '→', color: '#f59e0b', darkColor: '#f59e0b', bg: 'rgba(245,158,11,0.12)', darkBg: 'rgba(245,158,11,0.20)' },
  TL: { buttonLabel: 'TURN LEFT', rowLabel: 'TURN LEFT', icon: '←', color: '#8b5cf6', darkColor: '#a78bfa', bg: 'rgba(139,92,246,0.11)', darkBg: 'rgba(167,139,250,0.22)' },
  C: { buttonLabel: 'COLLECT', rowLabel: 'COLLECT', icon: 'collect', color: '#38bdf8', darkColor: '#67e8f9', bg: 'rgba(56,189,248,0.12)', darkBg: 'rgba(103,232,249,0.16)' },
  REPEAT: { buttonLabel: 'REPEAT', rowLabel: 'REPEAT', icon: '↺', color: '#22c55e', darkColor: '#4ade80', bg: 'rgba(34,197,94,0.12)', darkBg: 'rgba(74,222,128,0.18)' },
}

const PALETTE_ORDER = ['F', 'TR', 'TL', 'C', 'REPEAT']

function updateCommandsAtPath(sequence, path, updater) {
  if (path.length === 0) return updater(sequence)
  const [index, ...rest] = path
  return sequence.map((command, commandIndex) => {
    if (commandIndex !== index || !isRepeatCommand(command)) return command
    return { ...command, commands: updateCommandsAtPath(command.commands ?? [], rest, updater) }
  })
}

function updateRepeatAtPath(sequence, path, updater) {
  const [index, ...rest] = path
  return sequence.map((command, commandIndex) => {
    if (commandIndex !== index || !isRepeatCommand(command)) return command
    if (rest.length === 0) return updater(command)
    return { ...command, commands: updateRepeatAtPath(command.commands ?? [], rest, updater) }
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

function adjustPathAfterTopLevelRemoval(path, removedIndex) {
  if (path.length === 0 || removedIndex >= path[0]) return path
  return [path[0] - 1, ...path.slice(1)]
}

function getMeta(command, theme) {
  const base = isRepeatCommand(command) ? META.REPEAT : META[command]
  const color = theme === 'light' ? base.color : base.darkColor
  const bg = theme === 'light' ? base.bg : base.darkBg
  return { ...base, color, bg }
}

function getRowEstimate(command) {
  if (!isRepeatCommand(command)) return CHIP_HEIGHT
  const childCount = command.commands?.length ?? 0
  const nestedHeight = childCount === 0 ? 66 : childCount * (CHIP_HEIGHT + ITEM_GAP) + 22
  return 78 + nestedHeight
}

function CommandIcon({ meta, size = 20 }) {
  return <span style={{ fontSize: size, lineHeight: 1 }}>{meta.icon === 'collect' ? '🫳' : meta.icon}</span>
}

function SpeedBar({ speed, onSpeedChange, theme }) {
  const t = THEMES[theme]
  const trackRef = useRef(null)
  const dragging = useRef(false)

  const computeSpeed = useCallback((clientX) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const usableLeft = rect.left + THUMB_R
    const usableWidth = rect.width - THUMB_R * 2
    const ratio = Math.max(0, Math.min(1, (clientX - usableLeft) / usableWidth))
    const raw = Math.round((ratio * 90 + 10) / 5) * 5
    onSpeedChange(Math.max(10, Math.min(100, raw)))
  }, [onSpeedChange])

  const fillPct = ((speed - 10) / 90) * 100
  const trackColor = speed < 40 ? '#f59e0b' : speed < 75 ? (theme === 'light' ? '#14b8d4' : '#2dd4bf') : '#10b981'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 10, color: t.speedLabelClr, fontFamily: 'monospace', letterSpacing: 1, margin: 0, fontWeight: 800 }}>LUMA SPEED</p>
        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: trackColor }}>{speed}%</span>
      </div>

      <div
        ref={trackRef}
        onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); computeSpeed(event.clientX) }}
        onPointerMove={(event) => { if (dragging.current) computeSpeed(event.clientX) }}
        onPointerUp={() => { dragging.current = false }}
        style={{ position: 'relative', height: THUMB_R * 2, cursor: 'pointer', touchAction: 'none' }}
      >
        <div style={{ position: 'absolute', left: THUMB_R, right: THUMB_R, top: '50%', transform: 'translateY(-50%)', height: 4, background: t.railBg, borderRadius: 2, border: `1px solid ${t.railBorder}` }}>
          <div style={{ width: `${fillPct}%`, height: '100%', background: `linear-gradient(90deg, #f59e0b, ${trackColor})` }} />
        </div>
        <div style={{ position: 'absolute', left: `calc(${fillPct / 100} * (100% - ${THUMB_R * 2}px))`, top: '50%', transform: 'translateY(-50%)', width: THUMB_R * 2, height: THUMB_R * 2, borderRadius: '50%', background: trackColor }} />
      </div>

      <div style={{ position: 'relative', height: 10, fontSize: 8, color: t.tickColor, fontFamily: 'monospace', letterSpacing: 0.5, fontWeight: 700 }}>
        <span style={{ position: 'absolute', left: 0 }}>SLOW</span>
        <span style={{ position: 'absolute', left: `calc(${THUMB_R}px + (100% - ${THUMB_R * 2}px) * ${(50 - 10) / 90})`, transform: 'translateX(-50%)' }}>MED</span>
        <span style={{ position: 'absolute', right: 0 }}>FAST</span>
      </div>
    </div>
  )
}

function PaletteButton({ code, disabled, onAdd, theme, tutorialId, repeatDefaults }) {
  const meta = getMeta(code === 'REPEAT' ? createRepeatCommand(repeatDefaults.times) : code, theme)
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={() => !disabled && onAdd(code === 'REPEAT' ? createRepeatCommand(repeatDefaults.times) : code)}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('cmd', code)
        event.dataTransfer.effectAllowed = 'copy'
      }}
      disabled={disabled}
      data-tutorial-id={tutorialId}
      style={{ width: '100%', padding: '10px 12px', background: meta.bg, border: `1.5px solid ${meta.color}`, borderRadius: 10, color: meta.color, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'monospace', opacity: disabled ? 0.35 : 1 }}
    >
      <CommandIcon meta={meta} size={20} />
      <span style={{ fontSize: 10, letterSpacing: 0.8, fontWeight: 800 }}>{meta.buttonLabel}</span>
    </motion.button>
  )
}

function RepeatCounter({ command, color, onChange }) {
  const [inputValue, setInputValue] = useState(String(command.times))
  const buttonStyle = { width: 20, height: 16, borderRadius: 6, border: `1px solid ${color}55`, background: 'rgba(255,255,255,0.72)', color, cursor: 'pointer', padding: 0, fontWeight: 900, fontFamily: 'monospace' }

  const updateTimes = (times) => {
    const nextTimes = clampRepeatTimes(times)
    setInputValue(String(nextTimes))
    onChange({ ...command, times: nextTimes })
  }

  const handleInputChange = (event) => {
    const rawValue = event.target.value.replace(/\D/g, '')
    if (rawValue === '') {
      setInputValue('')
      return
    }

    const nextTimes = clampRepeatTimes(rawValue)
    setInputValue(String(nextTimes))
    onChange({ ...command, times: nextTimes })
  }

  return (
    <div data-tutorial-id="repeat-block-counter" onPointerDown={(event) => event.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 7px', background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 10 }}>
      <span style={{ fontSize: 8, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 800, color }}>REPEAT</span>
      <input type="text" inputMode="numeric" value={inputValue} onChange={handleInputChange} onBlur={() => inputValue === '' && setInputValue(String(command.times))} style={{ width: 40, padding: '3px 5px', borderRadius: 8, border: `1px solid ${color}55`, background: 'rgba(255,255,255,0.82)', color, fontFamily: 'monospace', fontSize: 12, fontWeight: 800, textAlign: 'center' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button type="button" style={buttonStyle} onClick={() => updateTimes(command.times + 1)}>+</button>
        <button type="button" style={buttonStyle} onClick={() => updateTimes(command.times - 1)}>-</button>
      </div>
    </div>
  )
}

function RowDelete({ color, isRunning, onDelete, theme }) {
  return (
    <button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onDelete}
      disabled={isRunning}
      style={{ position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', border: `1px solid ${color}55`, background: theme === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.6)', color: `${color}cc`, cursor: isRunning ? 'not-allowed' : 'pointer', fontSize: 10, lineHeight: 1, zIndex: 5 }}
    >
      ×
    </button>
  )
}
function CommandChip({ command, index, depth, path, theme, isRunning, onDelete }) {
  const meta = getMeta(command, theme)
  return (
    <div style={{ position: 'relative', minHeight: CHIP_HEIGHT, marginLeft: depth * 12, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 34px 8px 10px', background: meta.bg, borderLeft: `3px solid ${meta.color}`, borderBottom: `1px solid ${meta.color}22`, borderRadius: 10 }}>
      <span style={{ fontSize: 8, color: meta.color, fontFamily: 'monospace', width: 14, textAlign: 'right', fontWeight: 700 }}>{String(index + 1).padStart(2, '0')}</span>
      <span style={{ width: 18, height: 18, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CommandIcon meta={meta} size={16} />
      </span>
      <span style={{ fontSize: 10, color: meta.color, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 700, flex: 1 }}>{meta.rowLabel}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5, opacity: theme === 'light' ? 0.4 : 0.35, paddingRight: 14 }}>
        {[0, 1, 2].map((dotRow) => (
          <div key={dotRow} style={{ width: 14, display: 'flex', gap: 2 }}>
            <div style={{ width: 2, height: 2, borderRadius: '50%', background: meta.color }} />
            <div style={{ width: 2, height: 2, borderRadius: '50%', background: meta.color }} />
          </div>
        ))}
      </div>
      <RowDelete color={meta.color} isRunning={isRunning} onDelete={() => onDelete(path)} theme={theme} />
    </div>
  )
}

function StaticSequence({ sequence, parentPath, depth, theme, isRunning, onDelete, onUpdateRepeat, onDropIntoRepeat, onNestedPaletteHoverChange, activeRepeatDropPath }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: ITEM_GAP }}>
      {sequence.map((command, index) => {
        const path = [...parentPath, index]
        return isRepeatCommand(command) ? (
          <RepeatCard
            key={`repeat-${path.join('-')}`}
            command={command}
            index={index}
            depth={depth}
            path={path}
            theme={theme}
            isRunning={isRunning}
            onDelete={onDelete}
            onUpdateRepeat={onUpdateRepeat}
            onDropIntoRepeat={onDropIntoRepeat}
            onNestedPaletteHoverChange={onNestedPaletteHoverChange}
            activeRepeatDropPath={activeRepeatDropPath}
          >
            <StaticSequence
              sequence={command.commands ?? []}
              parentPath={path}
              depth={depth + 1}
              theme={theme}
              isRunning={isRunning}
              onDelete={onDelete}
              onUpdateRepeat={onUpdateRepeat}
              onDropIntoRepeat={onDropIntoRepeat}
              onNestedPaletteHoverChange={onNestedPaletteHoverChange}
              activeRepeatDropPath={activeRepeatDropPath}
            />
          </RepeatCard>
        ) : (
          <CommandChip
            key={`${command}-${path.join('-')}`}
            command={command}
            index={index}
            depth={depth}
            path={path}
            theme={theme}
            isRunning={isRunning}
            onDelete={onDelete}
          />
        )
      })}
    </div>
  )
}

function RepeatCard({ command, index, depth, path, theme, isRunning, onDelete, onUpdateRepeat, onDropIntoRepeat, onNestedPaletteHoverChange, activeRepeatDropPath, children }) {
  const meta = getMeta(command, theme)
  const [isDragOver, setIsDragOver] = useState(false)
  const childCount = command.commands?.length ?? 0
  const isDropActive = isDragOver || activeRepeatDropPath === JSON.stringify(path)
  const dropPath = JSON.stringify(path)

  const handleRepeatDragOver = (event) => {
    const raw = event.dataTransfer.getData('cmd')
    if (raw === 'REPEAT') return
    event.preventDefault()
    setIsDragOver(true)
    onNestedPaletteHoverChange?.(true)
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleRepeatDragLeave = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      setIsDragOver(false)
      onNestedPaletteHoverChange?.(false)
    }
  }

  const handleRepeatDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
    onNestedPaletteHoverChange?.(false)
    const raw = event.dataTransfer.getData('cmd')
    if (!raw || raw === 'REPEAT') return
    onDropIntoRepeat(path, raw)
  }

  return (
    <div
      data-repeat-drop-path={dropPath}
      onDragOver={handleRepeatDragOver}
      onDragLeave={handleRepeatDragLeave}
      onDrop={handleRepeatDrop}
      style={{ position: 'relative', marginLeft: depth * 12, padding: '8px 34px 10px 10px', background: meta.bg, border: `1.5px solid ${meta.color}66`, borderRadius: 14 }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 8, color: meta.color, fontFamily: 'monospace', width: 14, textAlign: 'right', fontWeight: 700, paddingTop: 7 }}>{String(index + 1).padStart(2, '0')}</span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, color: meta.color }}>{meta.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 10, color: meta.color, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 800 }}>REPEAT x{command.times}</span>
                <span style={{ fontSize: 7, color: `${meta.color}cc`, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 700 }}>{childCount} BLOCK{childCount === 1 ? '' : 'S'}</span>
              </div>
            </div>
            <RepeatCounter command={command} color={meta.color} onChange={(next) => onUpdateRepeat(path, next)} />
          </div>

          <div
            onDragOver={(event) => {
              const raw = event.dataTransfer.getData('cmd')
              if (raw === 'REPEAT') return
              event.preventDefault()
              event.stopPropagation()
              setIsDragOver(true)
              onNestedPaletteHoverChange?.(true)
              event.dataTransfer.dropEffect = 'copy'
            }}
            onDragLeave={(event) => {
              event.stopPropagation()
              const rect = event.currentTarget.getBoundingClientRect()
              if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
                setIsDragOver(false)
                onNestedPaletteHoverChange?.(false)
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setIsDragOver(false)
              onNestedPaletteHoverChange?.(false)
              const raw = event.dataTransfer.getData('cmd')
              if (!raw || raw === 'REPEAT') return
              onDropIntoRepeat(path, raw)
            }}
            data-repeat-drop-path={dropPath}
            style={{ minHeight: 92, padding: '10px', borderRadius: 12, background: isDropActive ? (theme === 'light' ? 'rgba(216,247,255,0.96)' : 'rgba(45,212,191,0.07)') : (theme === 'light' ? 'rgba(255,255,255,0.68)' : 'rgba(3,7,14,0.72)'), border: `1.5px ${isDropActive ? `dashed ${meta.color}88` : `solid ${meta.color}33`}`, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {childCount === 0 ? (
              <div style={{ flex: 1, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: `${meta.color}cc`, fontSize: 11, fontFamily: 'monospace', letterSpacing: 0.8, margin: 0, fontWeight: 700 }}>Drag commands here</p>
              </div>
            ) : children}
          </div>
        </div>
      </div>
      <RowDelete color={meta.color} isRunning={isRunning} onDelete={() => onDelete(path)} theme={theme} />
    </div>
  )
}

function DraggableProgram({ sequence, isRunning, onReorder, onInsertAt, onDelete, onUpdateRepeat, onDropIntoRepeat, theme, setDragOver }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [ghostY, setGhostY] = useState(0)
  const [insertAt, setInsertAt] = useState(null)
  const [paletteInsertAt, setPaletteInsertAt] = useState(null)
  const [activeRepeatDropPath, setActiveRepeatDropPath] = useState(null)
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
    setLayout({ heights: [...heightsRef.current], tops, totalHeight })
  }, [sequence])

  useLayoutEffect(() => {
    measureHeights()
    window.addEventListener('resize', measureHeights)
    return () => window.removeEventListener('resize', measureHeights)
  }, [measureHeights])

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
    setInsertAt(computeInsert(pointerYInStrip))
    const dropTarget = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('[data-repeat-drop-path]')
    setActiveRepeatDropPath(
      dropTarget && !isRepeatCommand(sequence[index])
        ? dropTarget.getAttribute('data-repeat-drop-path')
        : null
    )
  }, [computeInsert, dragIndex, layout.totalHeight])

  const handlePointerUp = useCallback((event, index) => {
    if (dragIndex !== index) return
    const dropTarget = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('[data-repeat-drop-path]')

    if (dropTarget && !isRepeatCommand(sequence[dragIndex])) {
      const targetPath = JSON.parse(dropTarget.getAttribute('data-repeat-drop-path') ?? '[]')
      const moved = sequence[dragIndex]
      const withoutMoved = sequence.filter((_, commandIndex) => commandIndex !== dragIndex)
      const adjustedTargetPath = adjustPathAfterTopLevelRemoval(targetPath, dragIndex)
      onReorder(updateRepeatAtPath(withoutMoved, adjustedTargetPath, (repeatCommand) => ({
        ...repeatCommand,
        commands: [...(repeatCommand.commands ?? []), moved],
      })))
      setDragIndex(null)
      setInsertAt(null)
      setActiveRepeatDropPath(null)
      return
    }

    if (insertAt !== null) {
      const adjustedIndex = dragIndex < insertAt ? insertAt - 1 : insertAt
      if (adjustedIndex !== dragIndex) {
        const next = [...sequence]
        const [moved] = next.splice(dragIndex, 1)
        next.splice(adjustedIndex, 0, moved)
        onReorder(next)
      }
    }
    setDragIndex(null)
    setInsertAt(null)
    setActiveRepeatDropPath(null)
  }, [dragIndex, insertAt, onReorder, sequence])

  const handleStripDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDragOver(true)
    if (!stripRef.current) return
    const rect = stripRef.current.getBoundingClientRect()
    setPaletteInsertAt(computeInsert(event.clientY - rect.top))
  }, [computeInsert, setDragOver])

  const handleStripDragLeave = useCallback((event) => {
    if (!stripRef.current) return
    const rect = stripRef.current.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      setPaletteInsertAt(null)
      setDragOver(false)
    }
  }, [setDragOver])

  const handleStripDrop = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    const cmd = event.dataTransfer.getData('cmd')
    if (cmd && stripRef.current) {
      const rect = stripRef.current.getBoundingClientRect()
      onInsertAt(cmd, computeInsert(event.clientY - rect.top))
    }
    setPaletteInsertAt(null)
    setDragOver(false)
  }, [computeInsert, onInsertAt, setDragOver])

  const handleNestedPaletteHoverChange = useCallback((isHovering) => {
    if (isHovering) {
      setPaletteInsertAt(null)
      return
    }
  }, [])

  const tops = layout.tops
  const totalHeight = layout.totalHeight
  const insertLineTop = (() => {
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
            key={`${isRepeatCommand(command) ? 'repeat' : command}-${index}`}
            ref={(node) => { itemRefs.current[index] = node }}
            style={{ position: 'absolute', left: 0, right: 0, top: isDragging ? ghostY : slotTop, zIndex: isDragging ? 50 : 1, transition: isDragging ? 'none' : 'top 0.15s cubic-bezier(0.25,0.46,0.45,0.94)', boxShadow: isDragging ? `0 6px 28px ${getMeta(command, theme).color}44` : 'none', transform: isDragging ? 'scale(1.02)' : 'scale(1)', opacity: isDragging ? 0.95 : 1, pointerEvents: isDragging ? 'none' : 'auto' }}
            onPointerDown={(event) => handlePointerDown(event, index)}
            onPointerMove={(event) => handlePointerMove(event, index)}
            onPointerUp={(event) => handlePointerUp(event, index)}
          >
            {isRepeatCommand(command) ? (
              <RepeatCard
                command={command}
                index={index}
                depth={0}
                path={[index]}
                theme={theme}
                isRunning={isRunning}
                onDelete={onDelete}
                onUpdateRepeat={onUpdateRepeat}
                onDropIntoRepeat={onDropIntoRepeat}
                onNestedPaletteHoverChange={handleNestedPaletteHoverChange}
                activeRepeatDropPath={activeRepeatDropPath}
              >
                <StaticSequence
                  sequence={command.commands ?? []}
                  parentPath={[index]}
                  depth={1}
                  theme={theme}
                  isRunning={isRunning}
                  onDelete={onDelete}
                  onUpdateRepeat={onUpdateRepeat}
                  onDropIntoRepeat={onDropIntoRepeat}
                  onNestedPaletteHoverChange={handleNestedPaletteHoverChange}
                  activeRepeatDropPath={activeRepeatDropPath}
                />
              </RepeatCard>
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
  showPhaseLabel = false,
  showRepeat = false,
  showCollect = false,
  repeatDefaults = { times: 2 },
}) {
  const theme = useContext(ThemeContext)
  const t = THEMES[theme]
  const [dragOver, setDragOver] = useState(false)

  const totalBlocks = countProgramBlocks(sequence)
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
  const actionBtn = (disabled) => ({ padding: '3px 10px', background: 'transparent', border: `1.5px solid ${t.btnBorder}`, borderRadius: 6, color: disabled ? t.btnDisabled : t.btnColor, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'monospace', fontWeight: 800 })

  const handleTopLevelAdd = useCallback((command) => {
    onAdd(command)
  }, [onAdd])

  const handleDelete = useCallback((path) => {
    onReorder(removeCommandAtPath(sequence, path))
  }, [onReorder, sequence])

  const handleUpdateRepeat = useCallback((path, nextRepeat) => {
    onReorder(updateRepeatAtPath(sequence, path, () => createRepeatCommand(nextRepeat.times, nextRepeat.commands ?? [])))
  }, [onReorder, sequence])

  const handleDropIntoRepeat = useCallback((path, raw) => {
    const dropped = raw === 'REPEAT' ? createRepeatCommand(repeatDefaults.times) : raw
    onReorder(updateRepeatAtPath(sequence, path, (repeatCommand) => ({
      ...repeatCommand,
      commands: [...(repeatCommand.commands ?? []), dropped],
    })))
  }, [onReorder, repeatDefaults.times, sequence])

  const handleInsertAt = useCallback((rawCommand, index) => {
    const inserted = rawCommand === 'REPEAT' ? createRepeatCommand(repeatDefaults.times) : rawCommand
    onReorder(insertCommandAtPath(sequence, [], index, inserted))
  }, [onReorder, repeatDefaults.times, sequence])

  const visibleCommands = PALETTE_ORDER.filter((code) => {
    if (code === 'REPEAT') return showRepeat
    if (code === 'C') return showCollect
    return true
  })

  if (phase !== 'develop') return null

  return (
    <div data-tutorial-id="command-builder" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', height: '100%', flex: 1, minHeight: 0, background: wrapperBg, padding: 0, boxSizing: 'border-box' }}>
      {showPhaseLabel && <p style={{ fontSize: 10, color: t.phaseLabel, fontFamily: 'monospace', letterSpacing: 3, margin: 0, fontWeight: 800 }}>PHASE 2 - DEVELOP</p>}

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

      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', minHeight: 0, flex: 1 }}>
        <div style={subPanelStyle}>
          <div data-tutorial-id="command-palette" style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            <p style={{ fontSize: 11, color: t.subLabel, fontFamily: 'monospace', letterSpacing: 1.1, margin: 0, fontWeight: 800 }}>COMMANDS</p>
            <p style={{ fontSize: 10, color: t.programCount, fontFamily: 'monospace', letterSpacing: 0.8, margin: 0 }}>Tap or drag from here</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleCommands.map((code) => (
                <PaletteButton
                  key={code}
                  code={code}
                  disabled={isRunning}
                  onAdd={handleTopLevelAdd}
                  theme={theme}
                  repeatDefaults={repeatDefaults}
                  tutorialId={code === 'F' ? 'command-forward' : code === 'C' ? 'command-collect' : code === 'TR' || code === 'TL' ? 'command-turn' : 'command-repeat'}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={subPanelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10, flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: 11, color: t.programLabel, fontFamily: 'monospace', letterSpacing: 1.1, margin: 0, fontWeight: 800, whiteSpace: 'nowrap' }}>PROGRAM <span style={{ color: t.programCount, fontWeight: 600, whiteSpace: 'nowrap' }}>({totalBlocks} {totalBlocks === 1 ? 'block' : 'blocks'})</span></p>
              <p style={{ fontSize: 10, color: t.programCount, fontFamily: 'monospace', letterSpacing: 0.8, margin: '4px 0 0 0' }}>Top to bottom order</p>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {targetCommands !== null && <span style={{ fontSize: 10, color: t.targetCmdColor, fontFamily: 'monospace', letterSpacing: 0.5, marginRight: 4, fontWeight: 700 }}>Best Path: {targetCommands}</span>}
              <button onClick={onRemove} disabled={isRunning || sequence.length === 0} style={actionBtn(isRunning || sequence.length === 0)}>⌫</button>
              <button onClick={onClear} disabled={isRunning || sequence.length === 0} style={actionBtn(isRunning || sequence.length === 0)}>✕</button>
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
              onReorder(insertCommandAtPath(sequence, [], sequence.length, rawCommand === 'REPEAT' ? createRepeatCommand(repeatDefaults.times) : rawCommand))
            }}
            style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', background: dragOver ? (theme === 'light' ? 'linear-gradient(180deg, rgba(210,248,255,0.98), rgba(239,240,255,0.96))' : 'rgba(45,212,191,0.04)') : t.scrollBg, border: `1.5px ${dragOver ? `dashed ${theme === 'light' ? '#2fc9df88' : '#2dd4bf55'}` : `solid ${t.scrollBorder}`}`, borderRadius: 8, padding: 10, boxSizing: 'border-box' }}
          >
            {sequence.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', gap: 6 }}>
                <div style={{ fontSize: 18, opacity: theme === 'light' ? 0.28 : 0.18, color: theme === 'light' ? '#14b8d4' : '#5a8890' }}>↓</div>
                <p style={{ color: t.emptyText, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1, margin: 0, userSelect: 'none', fontWeight: 700 }}>drag commands here</p>
              </div>
            ) : (
              <DraggableProgram
                sequence={sequence}
                isRunning={isRunning}
                onReorder={onReorder}
                onInsertAt={handleInsertAt}
                onDelete={handleDelete}
                onUpdateRepeat={handleUpdateRepeat}
                onDropIntoRepeat={handleDropIntoRepeat}
                theme={theme}
                setDragOver={setDragOver}
              />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {needsReset && <motion.button key="reset-btn" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} whileTap={{ scale: 0.97 }} onClick={onReset} disabled={isRunning} data-tutorial-id="reset-button" style={{ width: '100%', padding: '11px 0', background: t.resetBg, border: '2px solid #fb7185', borderRadius: 8, color: theme === 'light' ? '#be123c' : '#fb7185', fontFamily: 'monospace', fontSize: 13, letterSpacing: 2, cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 800 }}>↺ RESET LUMA</motion.button>}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.97 }} onClick={onRun} disabled={isDisabled} data-tutorial-id="run-button" style={{ width: '100%', padding: '13px 0', background: isDisabled ? t.runBgDisabled : t.runBgActive, border: `2px solid ${isDisabled ? t.runBorderDisabled : t.runBorderActive}`, borderRadius: 8, color: isDisabled ? t.runColorDisabled : t.runColorActive, fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, cursor: isDisabled ? 'not-allowed' : 'pointer', fontWeight: 800 }}>
        {isRunning ? 'RUNNING' : runBlocked ? 'SET PREDICTION FIRST' : 'EXECUTE PROGRAM'}
      </motion.button>
    </div>
  )
}

