// CommandBuilder.jsx — Lightbot-style vertical stacked command sequence
// Drag reordering uses raw pointer events for true free-drag (any position in one move).
// Palette drag supports inserting at a specific position in the sequence (not just appending).
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CMD_META = {
  F:  { label: 'FORWARD',     icon: '↑', color: '#2dd4bf', bg: 'rgba(45,212,191,0.13)',  darkBg: 'rgba(45,212,191,0.22)'  },
  TL: { label: 'TURN LEFT',   icon: '↺', color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', darkBg: 'rgba(167,139,250,0.24)' },
  TR: { label: 'TURN RIGHT',  icon: '↻', color: '#f59e0b', bg: 'rgba(245,158,11,0.13)',  darkBg: 'rgba(245,158,11,0.22)'  },
}

const CHIP_HEIGHT = 36
const THUMB_R = 8

// ── Speed Bar ────────────────────────────────────────────────────────────────
function SpeedBar({ speed, onSpeedChange }) {
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
  const trackColor = speed < 40 ? '#f59e0b' : speed < 75 ? '#2dd4bf' : '#4ade80'

  const tickLabels = [
    { label: 'SLOW', speedVal: 10  },
    { label: 'MED',  speedVal: 50  },
    { label: 'FAST', speedVal: 100 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>

      {/* Label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace', letterSpacing: 1, margin: 0 }}>
          LUMA SPEED
        </p>
        <span style={{
          fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
          color: trackColor,
          background: `rgba(${speed < 40 ? '245,158,11' : speed < 75 ? '45,212,191' : '74,222,128'},0.1)`,
          border: `1px solid ${trackColor}44`,
          borderRadius: 4, padding: '1px 6px',
          minWidth: 40, textAlign: 'center',
          transition: 'color 0.2s, background 0.2s, border-color 0.2s',
        }}>
          {speed}%
        </span>
      </div>

      {/* Track container */}
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
          height: 4, background: '#0f1c2e',
          borderRadius: 2, border: '1px solid #1e2a42',
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

      {/* Tick labels — absolutely positioned at their true speed positions */}
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
                fontSize: 7,
                // BRIGHTENED: was #1e2a42, now a visible slate blue-grey
                color: '#64748b',
                fontFamily: 'monospace',
                letterSpacing: 0.5,
                fontWeight: 600,
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
function DraggableStrip({ sequence, isRunning, onReorder, onInsertAt }) {
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
              boxShadow: isDragging ? `0 6px 28px ${m.color}44` : 'none',
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
                background: m.color, opacity: 0.8, borderRadius: 2, zIndex: 60,
              }}/>
            )}

            {paletteInsertAt === i && dragIndex === null && (
              <div style={{
                position: 'absolute', top: -2, left: 0, right: 0, height: 3,
                background: '#2dd4bf', opacity: 0.9, borderRadius: 2, zIndex: 60,
                boxShadow: '0 0 8px #2dd4bf',
              }}/>
            )}

            <div style={{
              width: '100%', height: CHIP_HEIGHT,
              background: isDragging ? m.darkBg : m.bg,
              borderLeft: `3px solid ${m.color}`,
              borderBottom: `1px solid ${m.color}22`,
              display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12,
              cursor: isRunning ? 'not-allowed' : 'grab',
              userSelect: 'none', touchAction: 'none', boxSizing: 'border-box',
            }}>
              <span style={{ fontSize: 8, color: m.color, fontFamily: 'monospace', opacity: 0.5, width: 14, textAlign: 'right', flexShrink: 0 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 18, color: m.color, lineHeight: 1, flexShrink: 0 }}>
                {m.icon}
              </span>
              <span style={{ fontSize: 10, color: m.color, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 600, flex: 1 }}>
                {m.label}
              </span>
              <div style={{ display:'flex', flexDirection:'column', gap: 1.5, opacity:0.3, paddingRight: 28 }}>
                {[0,1,2].map(di => (
                  <div key={di} style={{ width: 14, display:'flex', gap: 2 }}>
                    <div style={{ width: 2, height: 2, borderRadius:'50%', background:m.color }}/>
                    <div style={{ width: 2, height: 2, borderRadius:'50%', background:m.color }}/>
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
                  background:'rgba(0,0,0,0.5)',
                  border:`1px solid ${m.color}44`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', fontSize:10, color:`${m.color}99`,
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
          height: 3, background: '#2dd4bf', opacity: 0.9,
          borderRadius: 2, zIndex: 60, boxShadow: '0 0 8px #2dd4bf',
        }}/>
      )}
    </div>
  )
}

// ── Palette button ────────────────────────────────────────────────────────────
function PaletteBtn({ cmd, onAdd, disabled }) {
  const m = CMD_META[cmd]
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      whileHover={{ background: m.darkBg }}
      onClick={() => !disabled && onAdd(cmd)}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('cmd', cmd)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      disabled={disabled}
      style={{
        flex: 1, padding: '10px 4px',
        background: m.bg, border: `1.5px solid ${m.color}`,
        borderRadius: 8, color: m.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        fontFamily: 'monospace', transition: 'background 0.15s',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <span style={{ fontSize: 20 }}>{m.icon}</span>
      <span style={{ fontSize: 8, letterSpacing: 0.5, textAlign:'center', lineHeight:1.2 }}>
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
  const [dragOver, setDragOver] = useState(false)

  if (phase !== 'develop') return null

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
      background: 'rgba(8,14,24,0.95)',
      border: '1.5px solid #f59e0b',
      borderRadius: 12,
      padding: '16px 16px 16px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/* ── PHASE 2 — DEVELOP label (hidden on Level 1 via targetCommands===3 heuristic,
              but cleaner: we pass showPhaseLabel prop — see App.jsx) ── */}
      {showPhaseLabel && (
        <p style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'monospace', letterSpacing: 3, margin: 0, flexShrink: 0 }}>
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
          padding: '8px 12px',
          background: visorFlipCount >= 3 ? 'rgba(10,15,25,0.5)' : 'rgba(167,139,250,0.1)',
          border: `1.5px solid ${visorFlipCount >= 3 ? '#1e2a3a' : '#a78bfa'}`,
          borderRadius: 8,
          color: visorFlipCount >= 3 ? '#1e2a3a' : '#a78bfa',
          cursor: visorFlipCount >= 3 ? 'not-allowed' : 'pointer',
          fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.2s', boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <span>👁  VISOR FLIP</span>
        <span style={{
          background: visorFlipCount >= 3 ? 'transparent' : 'rgba(167,139,250,0.15)',
          border: `1px solid ${visorFlipCount >= 3 ? '#1e2a3a' : '#a78bfa55'}`,
          borderRadius: 20, padding: '2px 8px', fontSize: 9,
        }}>
          {3 - visorFlipCount} left
        </span>
      </motion.button>
      )}

      {/* ── SPEED BAR ── */}
      <SpeedBar speed={speed} onSpeedChange={onSpeedChange} />

      {/* Mirror warning */}
      <AnimatePresence>
        {isMirrored && (
          <motion.div
            initial={{ opacity:0, height:0 }}
            animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }}
            style={{
              overflow:'hidden', padding:'5px 10px',
              background:'rgba(251,113,133,0.06)', border:'1px solid #fb718544',
              borderRadius:6, color:'#fb7185', fontSize:11,
              fontFamily:'monospace', letterSpacing:1,
              flexShrink: 0,
            }}
          >
            ⚠ MIRROR MODE — L / R FLIPPED
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMMAND PALETTE ── */}
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontSize:10, color:'#64748b', fontFamily:'monospace', letterSpacing:1, marginBottom:6 }}>
          TAP OR DRAG TO ADD
        </p>
        <div style={{ display:'flex', gap:8 }}>
          {Object.keys(CMD_META).map(cmd => (
            <PaletteBtn key={cmd} cmd={cmd} onAdd={onAdd} disabled={isRunning}/>
          ))}
        </div>
      </div>

      {/* ── SEQUENCE STRIP WITH SCROLL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, flexShrink: 1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, flexShrink: 0 }}>
          <p style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace', letterSpacing:1, margin: 0 }}>
            PROGRAM  <span style={{ color: '#475569' }}>({sequence.length} commands)</span>
          </p>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            {targetCommands !== null && (
              <span style={{ fontSize:10, color:'#2dd4bf99', fontFamily:'monospace', letterSpacing:0.5, marginRight: 4 }}>
                Best Path: {targetCommands}
              </span>
            )}
            <button
              onClick={onRemove}
              disabled={isRunning || sequence.length === 0}
              style={{
                padding:'3px 10px', background:'transparent',
                border:'1px solid #1e2a3a', borderRadius:4,
                color: sequence.length === 0 ? '#1e2a3a' : '#64748b',
                cursor: isRunning || sequence.length === 0 ? 'not-allowed' : 'pointer',
                fontSize:12, fontFamily:'monospace',
              }}
              title="Remove last"
            >⌫</button>
            <button
              onClick={onClear}
              disabled={isRunning || sequence.length === 0}
              style={{
                padding:'3px 10px', background:'transparent',
                border:'1px solid #1e2a3a', borderRadius:4,
                color: sequence.length === 0 ? '#1e2a3a' : '#64748b',
                cursor: isRunning || sequence.length === 0 ? 'not-allowed' : 'pointer',
                fontSize:12, fontFamily:'monospace',
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
            background: dragOver ? 'rgba(45,212,191,0.04)' : 'rgba(5,8,14,0.85)',
            border: `1.5px ${dragOver ? 'dashed #2dd4bf55' : 'solid #0f1c2e'}`,
            borderRadius: 8,
            transition: 'border 0.2s, background 0.2s',
            scrollbarWidth: 'thin',
            scrollbarColor: '#2dd4bf44 #0f1c2e',
          }}
        >
          {sequence.length === 0 ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDropOnEmptyZone}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height: '100%', gap:6 }}
            >
              <div style={{ fontSize:18, opacity:0.15 }}>↓</div>
              <p style={{ color:'#334155', fontSize:11, fontFamily:'monospace', letterSpacing:1, userSelect:'none' }}>
                drag commands here
              </p>
            </div>
          ) : (
            <DraggableStrip
              sequence={sequence}
              isRunning={isRunning}
              onReorder={onReorder}
              onInsertAt={handleInsertAt}
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
              padding: '10px 0',
              background: 'linear-gradient(135deg, rgba(251,113,133,0.13), rgba(251,113,133,0.06))',
              border: '1.5px solid #fb7185',
              borderRadius: 8, color: '#fb7185',
              fontFamily: 'monospace', fontSize: 12, letterSpacing: 2,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 0 20px rgba(251,113,133,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              flexShrink: 0,
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
        disabled={isRunning || sequence.length === 0 || needsReset || runBlocked}
        style={{
          width: '100%',
          padding: '12px 0',
          background: isRunning || sequence.length === 0 || needsReset || runBlocked
            ? 'rgba(10,15,25,0.5)'
            : 'linear-gradient(135deg, rgba(45,212,191,0.14), rgba(45,212,191,0.07))',
          border: `1.5px solid ${isRunning || sequence.length === 0 || needsReset || runBlocked ? '#1e2a3a' : '#2dd4bf'}`,
          borderRadius: 8,
          color: isRunning || sequence.length === 0 || needsReset || runBlocked ? '#1e2a3a' : '#2dd4bf',
          fontFamily: 'monospace', fontSize: 13, letterSpacing: 2,
          cursor: isRunning || sequence.length === 0 || needsReset || runBlocked ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: isRunning || sequence.length === 0 || needsReset || runBlocked
            ? 'none' : '0 0 20px rgba(45,212,191,0.1)',
          flexShrink: 0,
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