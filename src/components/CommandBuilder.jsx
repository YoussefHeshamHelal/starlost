// CommandBuilder.jsx — Lightbot-style vertical stacked command sequence
// Fully theme-aware (light + dark mode).
import { useState, useRef, useCallback, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeContext } from '../context/theme'

const THEMES_CMD = {
  light: {
    panelBg:       'linear-gradient(180deg, rgba(255,255,255,0.99), rgba(235,248,255,0.98) 55%, rgba(243,237,255,0.96))',
    panelBorder:   '#2fc9df',
    phaseLabel:    '#1377aa',
    subLabel:      '#4b6d8a',
    scrollBg:      'linear-gradient(180deg, rgba(228,250,255,0.98), rgba(244,245,255,0.96))',
    scrollBgHover: 'linear-gradient(180deg, rgba(216,247,255,0.98), rgba(236,241,255,0.96))',
    scrollBorder:  '#bddff2',
    scrollBorderDrag:'#2fc9df88',
    emptyText:     '#7190a9',
    emptyArrow:    '#acdff0',
    btnBorder:     '#b7dbef',
    btnColor:      '#355978',
    btnDisabled:   '#b7c8d8',
    railBg:        '#dbe7f4',
    railBorder:    '#b8cfe6',
    tickColor:     '#64809a',
    speedLabelClr: '#355978',
    visorBg:       'linear-gradient(135deg, rgba(244,238,255,0.98), rgba(232,246,255,0.96))',
    visorBorder:   '#8b5cf6',
    visorText:     '#5b31b7',
    visorExhBg:    'linear-gradient(135deg, rgba(240,236,255,0.76), rgba(236,242,255,0.64))',
    visorExhBd:    '#d2c2ff',
    visorExhTx:    '#9987c2',
    mirrorBg:      'linear-gradient(135deg, rgba(255,214,224,0.42), rgba(255,240,243,0.22))',
    mirrorBorder:  '#fb718577',
    mirrorText:    '#be123c',
    programLabel:  '#173f66',
    programCount:  '#60809d',
    resetBg:       'linear-gradient(135deg, rgba(255,178,195,0.22), rgba(255,237,242,0.12))',
    runBgActive:   'linear-gradient(135deg, rgba(45,201,223,0.20), rgba(139,92,246,0.12))',
    runBgDisabled: 'rgba(222,233,244,0.82)',
    runBorderActive: '#2fc9df',
    runBorderDisabled: '#bfd1e4',
    runColorActive: '#124b73',
    runColorDisabled: '#a2b3c5',
    targetCmdColor: '#1377aa',
  },
  dark: {
    // DARK MODE: everything dark, text bright and readable
    panelBg:       'rgba(6,11,20,0.98)',
    panelBorder:   '#f59e0b',
    phaseLabel:    '#fbbf24',
    subLabel:      '#a0b0c8',
    scrollBg:      'rgba(3,7,14,0.95)',
    scrollBgHover: 'rgba(45,212,191,0.05)',
    scrollBorder:  '#0c1828',
    scrollBorderDrag:'#2dd4bf55',
    emptyText:     '#3a5060',
    emptyArrow:    '#2a3848',
    btnBorder:     '#182838',
    btnColor:      '#7a9aaa',
    btnDisabled:   '#1a2838',
    railBg:        '#0a1828',
    railBorder:    '#182838',
    tickColor:     '#5a7888',
    speedLabelClr: '#7a9aaa',
    visorBg:       'rgba(139,92,246,0.14)',
    visorBorder:   '#a78bfa',
    visorText:     '#c4b5fd',
    visorExhBg:    'rgba(6,10,18,0.7)',
    visorExhBd:    '#182838',
    visorExhTx:    '#2a3848',
    mirrorBg:      'rgba(251,113,133,0.07)',
    mirrorBorder:  '#fb718555',
    mirrorText:    '#fb7185',
    programLabel:  '#a0b0c8',
    programCount:  '#5a7888',
    resetBg:       'linear-gradient(135deg, rgba(251,113,133,0.14), rgba(251,113,133,0.07))',
    runBgActive:   'linear-gradient(135deg, rgba(45,212,191,0.16), rgba(45,212,191,0.08))',
    runBgDisabled: 'rgba(6,10,18,0.6)',
    runBorderActive: '#2dd4bf',
    runBorderDisabled: '#182838',
    runColorActive: '#2dd4bf',
    runColorDisabled: '#1a2838',
    targetCmdColor: '#2dd4bf99',
  },
}

const CMD_META = {
  F:  { label: 'FORWARD',    icon: '↑', color: '#14b8d4', darkColor: '#2dd4bf', bg: 'rgba(20,184,212,0.12)',  darkBg: 'rgba(45,212,191,0.20)', lightBorderLeft: '#14b8d4' },
  TL: { label: 'TURN LEFT',  icon: '↺', color: '#8b5cf6', darkColor: '#a78bfa', bg: 'rgba(139,92,246,0.11)', darkBg: 'rgba(167,139,250,0.22)', lightBorderLeft: '#8b5cf6' },
  TR: { label: 'TURN RIGHT', icon: '↻', color: '#f59e0b', darkColor: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  darkBg: 'rgba(245,158,11,0.20)', lightBorderLeft: '#f59e0b' },
}

const CHIP_HEIGHT = 36
const THUMB_R = 8

// ── Speed Bar ────────────────────────────────────────────────────────────────
function SpeedBar({ speed, onSpeedChange, theme }) {
  const t = THEMES_CMD[theme]
  const trackRef = useRef(null)
  const dragging  = useRef(false)

  const computeSpeed = useCallback((clientX) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const usableLeft  = rect.left  + THUMB_R
    const usableWidth = rect.width - THUMB_R * 2
    const ratio = Math.max(0, Math.min(1, (clientX - usableLeft) / usableWidth))
    const raw = Math.round((ratio * 90 + 10) / 5) * 5
    onSpeedChange(Math.max(10, Math.min(100, raw)))
  }, [onSpeedChange])

  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    trackRef.current.setPointerCapture(e.pointerId)
    computeSpeed(e.clientX)
  }, [computeSpeed])

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return
    computeSpeed(e.clientX)
  }, [computeSpeed])

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const fillPct = ((speed - 10) / 90) * 100
  const trackColor = speed < 40 ? '#f59e0b' : speed < 75 ? (theme === 'light' ? '#14b8d4' : '#2dd4bf') : '#10b981'

  const tickLabels = [
    { label: 'SLOW', speedVal: 10  },
    { label: 'MED',  speedVal: 50  },
    { label: 'FAST', speedVal: 100 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 10, color: t.speedLabelClr, fontFamily: 'monospace', letterSpacing: 1, margin: 0, fontWeight: 800 }}>
          LUMA SPEED
        </p>
        <span style={{
          fontSize: 11, fontFamily: 'monospace', fontWeight: 800,
          color: trackColor,
          background: `rgba(${speed < 40 ? '245,158,11' : speed < 75 ? (theme === 'light' ? '20,184,212' : '45,212,191') : '16,185,129'},0.13)`,
          border: `1px solid ${trackColor}55`,
          borderRadius: 5, padding: '2px 7px',
          minWidth: 40, textAlign: 'center',
          transition: 'color 0.2s, background 0.2s, border-color 0.2s',
        }}>
          {speed}%
        </span>
      </div>

      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'relative',
          height: THUMB_R * 2,
          cursor: 'pointer',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Rail */}
        <div style={{
          position: 'absolute',
          left: THUMB_R, right: THUMB_R,
          top: '50%', transform: 'translateY(-50%)',
          height: 4, background: t.railBg,
          borderRadius: 2, border: `1px solid ${t.railBorder}`,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${fillPct}%`,
            background: `linear-gradient(90deg, #f59e0b, ${trackColor})`,
            borderRadius: 2,
            transition: 'width 0.08s, background 0.2s',
          }}/>
        </div>

        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: `calc(${fillPct / 100} * (100% - ${THUMB_R * 2}px))`,
          top: '50%', transform: 'translateY(-50%)',
          width: THUMB_R * 2, height: THUMB_R * 2,
          borderRadius: '50%', background: trackColor,
          boxShadow: `0 0 8px ${trackColor}88`,
          transition: 'left 0.08s, background 0.2s, box-shadow 0.2s',
          pointerEvents: 'none',
        }}/>
      </div>

      <div style={{ position: 'relative', height: 10 }}>
        {tickLabels.map(({ label, speedVal }) => {
          const tickFill = ((speedVal - 10) / 90) * 100
          return (
            <span
              key={label}
              style={{
                position: 'absolute',
                left: `calc(${THUMB_R}px + ${tickFill / 100} * (100% - ${THUMB_R * 2}px))`,
                transform: 'translateX(-50%)',
                fontSize: 8,
                color: t.tickColor,
                fontFamily: 'monospace',
                letterSpacing: 0.5,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Draggable sequence strip ─────────────────────────────────────────────────
function DraggableStrip({ sequence, isRunning, onReorder, onInsertAt, theme }) {
  const [dragIndex, setDragIndex]             = useState(null)
  const [ghostY, setGhostY]                   = useState(0)
  const [insertAt, setInsertAt]               = useState(null)
  const [paletteInsertAt, setPaletteInsertAt] = useState(null)

  const stripRef  = useRef(null)
  const startYRef = useRef(0)
  const startTop  = useRef(0)

  const computeInsert = useCallback((pointerY) => {
    const slotIndex = Math.round(pointerY / CHIP_HEIGHT)
    return Math.max(0, Math.min(sequence.length, slotIndex))
  }, [sequence.length])

  const onPointerDown = useCallback((e, index) => {
    if (isRunning) return
    if (e.button !== 0) return
    e.preventDefault()
    startYRef.current = e.clientY
    startTop.current  = index * CHIP_HEIGHT
    setDragIndex(index)
    setGhostY(index * CHIP_HEIGHT)
    setInsertAt(index)
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [isRunning])

  const onPointerMove = useCallback((e, index) => {
    if (dragIndex !== index) return
    const stripRect = stripRef.current.getBoundingClientRect()
    const pointerYInStrip = e.clientY - stripRect.top
    const delta = e.clientY - startYRef.current
    setGhostY(Math.max(0, Math.min((sequence.length - 1) * CHIP_HEIGHT, startTop.current + delta)))
    setInsertAt(computeInsert(pointerYInStrip))
  }, [dragIndex, sequence.length, computeInsert])

  const onPointerUp = useCallback((e, index) => {
    if (dragIndex !== index) return
    if (insertAt !== null && insertAt !== dragIndex) {
      const newSeq = [...sequence]
      const [removed] = newSeq.splice(dragIndex, 1)
      newSeq.splice(insertAt, 0, removed)
      onReorder(newSeq)
    }
    setDragIndex(null)
    setInsertAt(null)
  }, [dragIndex, insertAt, sequence, onReorder])

  const onStripDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    if (!stripRef.current) return
    const rect = stripRef.current.getBoundingClientRect()
    setPaletteInsertAt(computeInsert(e.clientY - rect.top))
  }, [computeInsert])

  const onStripDragLeave = useCallback((e) => {
    if (!stripRef.current) return
    const rect = stripRef.current.getBoundingClientRect()
    if (e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top  || e.clientY > rect.bottom) {
      setPaletteInsertAt(null)
    }
  }, [])

  const onStripDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const cmd = e.dataTransfer.getData('cmd')
    if (cmd && CMD_META[cmd] && stripRef.current) {
      const rect = stripRef.current.getBoundingClientRect()
      onInsertAt(cmd, computeInsert(e.clientY - rect.top))
    }
    setPaletteInsertAt(null)
  }, [computeInsert, onInsertAt])

  const stripHeight = Math.max(sequence.length * CHIP_HEIGHT, CHIP_HEIGHT)
  const isLight = theme === 'light'

  return (
    <div
      ref={stripRef}
      onDragOver={onStripDragOver}
      onDragLeave={onStripDragLeave}
      onDrop={onStripDrop}
      style={{ position: 'relative', height: stripHeight, minHeight: CHIP_HEIGHT }}
    >
      {sequence.map((cmd, i) => {
        const m = CMD_META[cmd]
        const color  = isLight ? m.color    : m.darkColor
        const chipBg = isLight ? m.bg       : m.darkBg
        const isDragging     = dragIndex === i
        const isInsertTarget = insertAt === i && dragIndex !== null && dragIndex !== i

        let slotTop = i * CHIP_HEIGHT
        if (dragIndex !== null && dragIndex !== i) {
          if (dragIndex < insertAt) {
            if (i > dragIndex && i <= insertAt) slotTop -= CHIP_HEIGHT
          } else {
            if (i >= insertAt && i < dragIndex) slotTop += CHIP_HEIGHT
          }
        }

        return (
          <div
            key={`${cmd}-${i}`}
            style={{
              position: 'absolute', left: 0, right: 0,
              top: isDragging ? ghostY : slotTop,
              height: CHIP_HEIGHT,
              zIndex: isDragging ? 50 : 1,
              transition: isDragging ? 'none' : 'top 0.15s cubic-bezier(0.25,0.46,0.45,0.94)',
              boxShadow: isDragging ? `0 6px 28px ${color}44` : 'none',
              transform: isDragging ? 'scale(1.02)' : 'scale(1)',
              opacity: isDragging ? 0.95 : 1,
            }}
            onPointerDown={e => onPointerDown(e, i)}
            onPointerMove={e => onPointerMove(e, i)}
            onPointerUp={e => onPointerUp(e, i)}
          >
            {isInsertTarget && (
              <div style={{
                position: 'absolute', top: dragIndex > insertAt ? 0 : CHIP_HEIGHT - 2,
                left: 0, right: 0, height: 2,
                background: color, opacity: 0.8, borderRadius: 2, zIndex: 60,
              }}/>
            )}

            {paletteInsertAt === i && dragIndex === null && (
              <div style={{
                position: 'absolute', top: -2, left: 0, right: 0, height: 3,
                background: isLight ? '#14b8d4' : '#2dd4bf',
                opacity: 0.9, borderRadius: 2, zIndex: 60,
                boxShadow: `0 0 8px ${isLight ? '#14b8d4' : '#2dd4bf'}`,
              }}/>
            )}

            <div style={{
              width: '100%', height: CHIP_HEIGHT,
              background: chipBg,
              borderLeft: `3px solid ${color}`,
              borderBottom: `1px solid ${color}22`,
              display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12,
              cursor: isRunning ? 'not-allowed' : 'grab',
              userSelect: 'none', touchAction: 'none', boxSizing: 'border-box',
            }}>
              <span style={{ fontSize: 8, color: color, fontFamily: 'monospace', opacity: isLight ? 0.8 : 0.6, width: 14, textAlign: 'right', flexShrink: 0, fontWeight: 700 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 18, color: color, lineHeight: 1, flexShrink: 0 }}>
                {m.icon}
              </span>
              <span style={{ fontSize: 11, color: color, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 700, flex: 1 }}>
                {m.label}
              </span>
              <div style={{ display:'flex', flexDirection:'column', gap: 1.5, opacity: isLight ? 0.4 : 0.35, paddingRight: 28 }}>
                {[0,1,2].map(di => (
                  <div key={di} style={{ width: 14, display:'flex', gap: 2 }}>
                    <div style={{ width: 2, height: 2, borderRadius:'50%', background:color }}/>
                    <div style={{ width: 2, height: 2, borderRadius:'50%', background:color }}/>
                  </div>
                ))}
              </div>
              <div
                onPointerDown={e => e.stopPropagation()}
                onClick={() => onReorder(sequence.filter((_, si) => si !== i))}
                style={{
                  position:'absolute', top:'50%', right:6,
                  transform:'translateY(-50%)',
                  width:18, height:18, borderRadius:'50%',
                  background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  border:`1px solid ${color}55`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', fontSize:10, color:`${color}bb`,
                  lineHeight:1, transition:'all 0.15s', zIndex: 10,
                }}
                title="Remove"
              >×</div>
            </div>
          </div>
        )
      })}

      {paletteInsertAt === sequence.length && dragIndex === null && (
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: sequence.length * CHIP_HEIGHT - 2,
          height: 3, background: theme === 'light' ? '#14b8d4' : '#2dd4bf',
          opacity: 0.9, borderRadius: 2, zIndex: 60,
          boxShadow: `0 0 8px ${theme === 'light' ? '#14b8d4' : '#2dd4bf'}`,
        }}/>
      )}
    </div>
  )
}

// ── Palette button ────────────────────────────────────────────────────────────
function PaletteBtn({ cmd, onAdd, disabled, theme }) {
  const m = CMD_META[cmd]
  const isLight = theme === 'light'
  const color = isLight ? m.color : m.darkColor
  const chipBg = isLight ? m.bg : m.darkBg
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => !disabled && onAdd(cmd)}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('cmd', cmd)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      disabled={disabled}
      style={{
        flex: 1, padding: '10px 4px',
        background: chipBg,
        border: `1.5px solid ${color}`,
        borderRadius: 8, color: color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        fontFamily: 'monospace', transition: 'background 0.15s',
        opacity: disabled ? 0.35 : 1,
        boxShadow: isLight && !disabled ? `0 10px 18px ${color}1f, inset 0 1px 0 rgba(255,255,255,0.45)` : 'none',
      }}
    >
      <span style={{ fontSize: 20 }}>{m.icon}</span>
      <span style={{ fontSize: 9, letterSpacing: 0.5, textAlign:'center', lineHeight:1.2, fontWeight: 800 }}>
        {m.label}
      </span>
    </motion.button>
  )
}

// ── Main CommandBuilder ───────────────────────────────────────────────────────
export default function CommandBuilder({
  sequence, isRunning, isMirrored,
  onAdd, onRemove, onClear, onRun,
  visorFlipCount, onVisorFlip,
  phase, onReorder,
  needsReset, onReset,
  runBlocked = false,
  speed, onSpeedChange,
  showVisorFlip = true,
  targetCommands = null,
  showPhaseLabel = false,
}) {
  const theme = useContext(ThemeContext)
  const t = THEMES_CMD[theme]
  const [dragOver, setDragOver] = useState(false)

  if (phase !== 'develop') return null

  const isDisabled = isRunning || sequence.length === 0 || needsReset || runBlocked

  const handleDropOnEmptyZone = (e) => {
    e.preventDefault()
    setDragOver(false)
    const cmd = e.dataTransfer.getData('cmd')
    if (cmd && CMD_META[cmd]) onAdd(cmd)
  }

  const handleInsertAt = (cmd, index) => {
    const newSeq = [...sequence]
    newSeq.splice(index, 0, cmd)
    onReorder(newSeq)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      width: '100%',
      flex: 1,
      minHeight: 0,
      background: t.panelBg,
      border: `1.5px solid ${t.panelBorder}`,
      borderRadius: 12,
      padding: '16px 16px 16px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      boxShadow: theme === 'light'
        ? '0 18px 40px rgba(74,144,226,0.12), 0 10px 24px rgba(45,201,223,0.14), inset 0 1px 0 rgba(255,255,255,0.7)'
        : '0 4px 32px rgba(0,0,0,0.6)',
    }}>

      {showPhaseLabel && (
        <p style={{
          fontSize: 10, color: t.phaseLabel,
          fontFamily: 'monospace', letterSpacing: 3, margin: 0, flexShrink: 0, fontWeight: 800,
        }}>
          PHASE 2 — DEVELOP
        </p>
      )}

      {/* ── VISOR FLIP ── */}
      {showVisorFlip && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onVisorFlip}
          disabled={visorFlipCount >= 3}
          style={{
            width: '100%',
            padding: '9px 12px',
            background: visorFlipCount >= 3 ? t.visorExhBg : t.visorBg,
            border: `1.5px solid ${visorFlipCount >= 3 ? t.visorExhBd : t.visorBorder}`,
            borderRadius: 8,
            color: visorFlipCount >= 3 ? t.visorExhTx : t.visorText,
            cursor: visorFlipCount >= 3 ? 'not-allowed' : 'pointer',
            fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.2s', boxSizing: 'border-box',
            flexShrink: 0,
            fontWeight: 700,
          }}
        >
          <span>👁  VISOR FLIP</span>
          <span style={{
            background: visorFlipCount >= 3 ? 'transparent' : 'rgba(139,92,246,0.16)',
            border: `1px solid ${visorFlipCount >= 3 ? t.visorExhBd : '#8b5cf688'}`,
            borderRadius: 20, padding: '2px 8px', fontSize: 10,
            fontWeight: 800,
          }}>
            {3 - visorFlipCount} left
          </span>
        </motion.button>
      )}

      {/* ── SPEED BAR ── */}
      <SpeedBar speed={speed} onSpeedChange={onSpeedChange} theme={theme} />

      {/* Mirror warning */}
      <AnimatePresence>
        {isMirrored && (
          <motion.div
            initial={{ opacity:0, height:0 }}
            animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }}
            style={{
              overflow:'hidden', padding:'6px 10px',
              background: t.mirrorBg,
              border:`1.5px solid ${t.mirrorBorder}`,
              borderRadius:6, color: t.mirrorText, fontSize:12,
              fontFamily:'monospace', letterSpacing:1,
              flexShrink: 0, fontWeight: 800,
            }}
          >
            ⚠ MIRROR MODE — L / R FLIPPED
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMMAND PALETTE ── */}
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontSize:11, color: t.subLabel, fontFamily:'monospace', letterSpacing:1, marginBottom:7, fontWeight: 800 }}>
          TAP OR DRAG TO ADD
        </p>
        <div style={{ display:'flex', gap:8 }}>
          {Object.keys(CMD_META).map(cmd => (
            <PaletteBtn key={cmd} cmd={cmd} onAdd={onAdd} disabled={isRunning} theme={theme}/>
          ))}
        </div>
      </div>

      {/* ── SEQUENCE STRIP WITH SCROLL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, flexShrink: 1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7, flexShrink: 0 }}>
          <p style={{ fontSize:11, color: t.programLabel, fontFamily:'monospace', letterSpacing:1, margin: 0, fontWeight: 800 }}>
            PROGRAM  <span style={{ color: t.programCount, fontWeight: 600 }}>({sequence.length} commands)</span>
          </p>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            {targetCommands !== null && (
              <span style={{ fontSize:10, color: t.targetCmdColor, fontFamily:'monospace', letterSpacing:0.5, marginRight: 4, fontWeight: 700 }}>
                Best Path: {targetCommands}
              </span>
            )}
            <button
              onClick={onRemove}
              disabled={isRunning || sequence.length === 0}
              style={{
                padding:'3px 10px', background:'transparent',
                border:`1.5px solid ${t.btnBorder}`, borderRadius:6,
                color: sequence.length === 0 ? t.btnDisabled : t.btnColor,
                cursor: isRunning || sequence.length === 0 ? 'not-allowed' : 'pointer',
                fontSize:13, fontFamily:'monospace',
                fontWeight: 800,
              }}
              title="Remove last"
            >⌫</button>
            <button
              onClick={onClear}
              disabled={isRunning || sequence.length === 0}
              style={{
                padding:'3px 10px', background:'transparent',
                border:`1.5px solid ${t.btnBorder}`, borderRadius:6,
                color: sequence.length === 0 ? t.btnDisabled : t.btnColor,
                cursor: isRunning || sequence.length === 0 ? 'not-allowed' : 'pointer',
                fontSize:13, fontFamily:'monospace',
                fontWeight: 800,
              }}
              title="Clear all"
            >✕</button>
          </div>
        </div>

        {/* Scrollable container */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: dragOver
              ? (theme === 'light' ? 'linear-gradient(180deg, rgba(210,248,255,0.98), rgba(239,240,255,0.96))' : 'rgba(45,212,191,0.04)')
              : t.scrollBg,
            border: `1.5px ${dragOver
              ? `dashed ${theme === 'light' ? '#2fc9df88' : '#2dd4bf55'}`
              : `solid ${t.scrollBorder}`}`,
            borderRadius: 8,
            transition: 'border 0.2s, background 0.2s',
            scrollbarWidth: 'thin',
            scrollbarColor: theme === 'light' ? '#2fc9df55 #e8f4fb' : '#2dd4bf44 #0a1828',
          }}
        >
          {sequence.length === 0 ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDropOnEmptyZone}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height: '100%', gap:6 }}
            >
              <div style={{ fontSize:18, opacity: theme === 'light' ? 0.28 : 0.18, color: theme === 'light' ? '#14b8d4' : '#5a8890' }}>↓</div>
              <p style={{ color: t.emptyText, fontSize:12, fontFamily:'monospace', letterSpacing:1, userSelect:'none', fontWeight: 700 }}>
                drag commands here
              </p>
            </div>
          ) : (
            <DraggableStrip
              sequence={sequence}
              isRunning={isRunning}
              onReorder={onReorder}
              onInsertAt={handleInsertAt}
              theme={theme}
            />
          )}
        </div>
      </div>

      {/* ── RESET BUTTON ── */}
      <AnimatePresence>
        {needsReset && (
          <motion.button
            key="reset-btn"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReset}
            disabled={isRunning}
            style={{
              width: '100%',
              padding: '11px 0',
              background: t.resetBg,
              border: '2px solid #fb7185',
              borderRadius: 8, color: theme === 'light' ? '#be123c' : '#fb7185',
              fontFamily: 'monospace', fontSize: 13, letterSpacing: 2,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 0 20px rgba(251,113,133,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              flexShrink: 0,
              fontWeight: 800,
            }}
          >
            ↺  RESET LUMA
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── EXECUTE BUTTON ── */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onRun}
        disabled={isDisabled}
        style={{
          width: '100%',
          padding: '13px 0',
          background: isDisabled ? t.runBgDisabled : t.runBgActive,
          border: `2px solid ${isDisabled ? t.runBorderDisabled : t.runBorderActive}`,
          borderRadius: 8,
          color: isDisabled ? t.runColorDisabled : t.runColorActive,
          fontFamily: 'monospace', fontSize: 14, letterSpacing: 2,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: isDisabled ? 'none' : `0 0 20px rgba(${theme === 'light' ? '20,184,166' : '45,212,191'},0.14)`,
          flexShrink: 0,
          fontWeight: 800,
        }}
      >
        {isRunning ? (
          <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <motion.span
              animate={{ rotate:360 }}
              transition={{ duration:1, repeat:Infinity, ease:'linear' }}
              style={{ display:'inline-block' }}
            >◌</motion.span>
            RUNNING
          </span>
        ) : runBlocked ? '🎯  SET PREDICTION FIRST' : '▶  EXECUTE PROGRAM'}
      </motion.button>
    </div>
  )
}
