import { motion } from 'framer-motion'
import { useTheme, THEMES } from '../context/theme'

const PLAYABLE_LEVELS = 17
const HOME_MAPS = [
  { id: 'crash-site', title: 'Crash Site', levels: [1, 2, 3, 4, 5], accent: 'teal' },
  { id: 'forest-trail', title: 'Forest Trail', levels: [6, 7, 8, 9, 10, 11, 12, 13, 14], accent: 'amber' },
  { id: 'repair-site', title: 'Repair Site', levels: [15, 16, 17, 18, 19], accent: 'violet' },
]

export default function HomePage({ headerHeight, onSelectLevel }) {
  const theme = useTheme()
  const t = THEMES[theme]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: headerHeight,
        left: 0,
        right: 0,
        bottom: 0,
        padding: '28px 28px 32px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map(index => (
        <span
          key={index}
          style={{
            position: 'absolute',
            top: 36 + (index % 4) * 96,
            left: `${5 + index * 12}%`,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: theme === 'light' ? '#fff7b8' : '#7dd3fc',
            boxShadow: theme === 'light'
              ? '0 0 10px rgba(255,238,150,0.9)'
              : '0 0 10px rgba(125,211,252,0.7)',
            animation: `selector-twinkle ${2.1 + index * 0.22}s ease-in-out infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <div style={{
        position: 'relative',
        height: '100%',
        borderRadius: 32,
        border: `1.5px solid ${theme === 'light' ? '#7ed9ee' : '#163248'}`,
        background: theme === 'light'
          ? 'linear-gradient(165deg, rgba(255,255,255,0.78), rgba(232,248,255,0.90) 34%, rgba(244,237,255,0.86) 68%, rgba(255,233,213,0.82))'
          : 'linear-gradient(165deg, rgba(5,11,21,0.96), rgba(8,16,30,0.98) 42%, rgba(10,14,30,0.96) 72%, rgba(25,16,34,0.92))',
        boxShadow: theme === 'light'
          ? '0 28px 48px rgba(59,141,205,0.14), 0 12px 26px rgba(60,210,230,0.12)'
          : '0 18px 36px rgba(0,0,0,0.48), inset 0 1px 0 rgba(45,212,191,0.08)',
        overflow: 'hidden',
      }}>
        {[0, 1, 2].map(index => (
          <span
            key={`glow-${index}`}
            style={{
              position: 'absolute',
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: index === 0
                ? (theme === 'light'
                  ? 'radial-gradient(circle, rgba(45,201,223,0.24), rgba(45,201,223,0))'
                  : 'radial-gradient(circle, rgba(45,212,191,0.16), rgba(45,212,191,0))')
                : index === 1
                  ? (theme === 'light'
                    ? 'radial-gradient(circle, rgba(139,92,246,0.16), rgba(139,92,246,0))'
                    : 'radial-gradient(circle, rgba(56,189,248,0.12), rgba(56,189,248,0))')
                  : (theme === 'light'
                    ? 'radial-gradient(circle, rgba(251,146,60,0.16), rgba(251,146,60,0))'
                    : 'radial-gradient(circle, rgba(251,191,36,0.10), rgba(251,191,36,0))'),
              top: index === 0 ? -60 : index === 1 ? 160 : 'auto',
              bottom: index === 2 ? -80 : 'auto',
              left: index === 0 ? -40 : index === 1 ? '42%' : 'auto',
              right: index === 2 ? -40 : 'auto',
              pointerEvents: 'none',
            }}
          />
        ))}

        <div style={{
          position: 'relative',
          height: '100%',
          padding: '36px 34px 32px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 20,
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <p style={{
                margin: '0 0 10px 0',
                fontSize: 11,
                letterSpacing: 3.2,
                fontFamily: 'monospace',
                fontWeight: 800,
                color: theme === 'light' ? '#1579ac' : '#67e8f9',
              }}>
                MISSION CONTROL
              </p>
              <h2 style={{
                margin: 0,
                fontSize: 48,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: 1.5,
                color: t.levelTitle,
              }}>
                STARLOST
              </h2>
              <p style={{
                margin: '12px 0 0 0',
                fontSize: 20,
                fontWeight: 800,
                color: theme === 'light' ? '#124d74' : '#e8edf5',
              }}>
                Choose a mission and guide LUMA through the stars.
              </p>
              <p style={{
                margin: '10px 0 0 0',
                fontSize: 14,
                lineHeight: 1.5,
                color: t.textSecondary,
                maxWidth: 620,
              }}>
                Crash Site, Forest Trail, and the first three Repair Site missions are live now, with the final Repair Site missions planned next.
              </p>
            </div>

            <div style={{
              flex: '0 0 auto',
              padding: '12px 16px',
              borderRadius: 18,
              border: `1.5px solid ${theme === 'light' ? '#8fddec' : '#1d4658'}`,
              background: theme === 'light'
                ? 'linear-gradient(135deg, rgba(255,255,255,0.82), rgba(233,247,255,0.86))'
                : 'linear-gradient(135deg, rgba(8,15,28,0.96), rgba(7,12,22,0.94))',
              boxShadow: theme === 'light'
                ? '0 10px 20px rgba(57,139,201,0.10)'
                : '0 8px 18px rgba(0,0,0,0.35)',
            }}>
              <p style={{
                margin: '0 0 4px 0',
                fontSize: 10,
                letterSpacing: 2.4,
                fontFamily: 'monospace',
                fontWeight: 800,
                color: theme === 'light' ? '#1579ac' : '#67e8f9',
              }}>
                LIVE NOW
              </p>
              <p style={{ margin: 0, fontSize: 13, color: t.textSecondary, fontWeight: 700 }}>
                Levels 1-17 ready to play
              </p>
            </div>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 18,
            flex: 1,
            minHeight: 0,
          }}>
            {HOME_MAPS.map((mapConfig, index) => {
              const isLiveMap = mapConfig.levels[0] <= PLAYABLE_LEVELS
              const accentBorder = mapConfig.accent === 'teal'
                ? (theme === 'light' ? '#5fd7eb' : '#2dd4bf')
                : mapConfig.accent === 'amber'
                  ? (theme === 'light' ? '#f5b24d' : '#f59e0b')
                  : (theme === 'light' ? '#b78cff' : '#8b5cf6')

              return (
                <motion.div
                  key={mapConfig.id}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.08 }}
                  style={{
                    position: 'relative',
                    borderRadius: 28,
                    border: `1.5px solid ${isLiveMap ? accentBorder : (theme === 'light' ? '#cfdbe8' : '#203446')}`,
                    background: isLiveMap
                      ? (theme === 'light'
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(237,248,255,0.88) 60%, rgba(248,243,255,0.86))'
                        : 'linear-gradient(180deg, rgba(8,15,28,0.98), rgba(7,13,24,0.96) 60%, rgba(14,12,30,0.94))')
                      : (theme === 'light'
                        ? 'linear-gradient(180deg, rgba(244,248,252,0.94), rgba(233,239,246,0.9))'
                        : 'linear-gradient(180deg, rgba(8,13,24,0.94), rgba(8,12,22,0.9))'),
                    boxShadow: isLiveMap
                      ? (theme === 'light'
                        ? '0 18px 30px rgba(60,146,206,0.12)'
                        : '0 14px 26px rgba(0,0,0,0.38)')
                      : 'none',
                    padding: '20px 20px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: isLiveMap
                      ? (mapConfig.accent === 'teal'
                        ? (theme === 'light'
                          ? 'radial-gradient(circle at 85% 15%, rgba(45,201,223,0.18), rgba(45,201,223,0))'
                          : 'radial-gradient(circle at 85% 15%, rgba(45,212,191,0.10), rgba(45,212,191,0))')
                        : mapConfig.accent === 'amber'
                          ? (theme === 'light'
                            ? 'radial-gradient(circle at 85% 15%, rgba(251,191,36,0.18), rgba(251,191,36,0))'
                            : 'radial-gradient(circle at 85% 15%, rgba(245,158,11,0.10), rgba(245,158,11,0))')
                          : (theme === 'light'
                            ? 'radial-gradient(circle at 85% 15%, rgba(139,92,246,0.16), rgba(139,92,246,0))'
                            : 'radial-gradient(circle at 85% 15%, rgba(139,92,246,0.10), rgba(139,92,246,0))'))
                      : 'none',
                    pointerEvents: 'none',
                  }}/>

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{
                      margin: '0 0 6px 0',
                      fontSize: 10,
                      letterSpacing: 2.5,
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: isLiveMap ? accentBorder : t.textMuted,
                    }}>
                      {isLiveMap ? 'MISSION ZONE' : 'COMING SOON'}
                    </p>
                    <h3 style={{
                      margin: 0,
                      fontSize: 24,
                      fontWeight: 900,
                      color: t.levelTitle,
                    }}>
                      {mapConfig.title}
                    </h3>
                    <p style={{
                      margin: '6px 0 0 0',
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: t.textSecondary,
                    }}>
                      {isLiveMap
                        ? mapConfig.id === 'crash-site'
                          ? 'Explore the crash site and learn how to guide LUMA.'
                          : mapConfig.id === 'forest-trail'
                            ? 'Follow the glowing forest trail and start using repeat, visor help, and fragment routes.'
                            : 'Reach the repair bay, collect every fragment, and learn IF BOX AHEAD. Final missions 18-19 are planned.'
                        : 'New worlds are still powering up for future rescue missions.'}
                    </p>
                  </div>

                  <div style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                    gap: 10,
                    marginTop: 'auto',
                  }}>
                    {mapConfig.levels.map((levelNumber) => {
                      const unlocked = levelNumber <= PLAYABLE_LEVELS

                      return (
                        <motion.button
                          key={levelNumber}
                          type="button"
                          onClick={() => unlocked && onSelectLevel(levelNumber)}
                          whileHover={unlocked ? { y: -4, scale: 1.03 } : undefined}
                          whileTap={unlocked ? { scale: 0.97 } : undefined}
                          disabled={!unlocked}
                          style={{
                            minHeight: 92,
                            borderRadius: 20,
                            border: `1.5px solid ${unlocked ? accentBorder : (theme === 'light' ? '#d2dde9' : '#213346')}`,
                            background: unlocked
                              ? (theme === 'light'
                                ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(232,248,255,0.92))'
                                : 'linear-gradient(180deg, rgba(10,20,34,0.98), rgba(8,14,26,0.95))')
                              : (theme === 'light'
                                ? 'linear-gradient(180deg, rgba(241,246,251,0.98), rgba(228,236,244,0.94))'
                                : 'linear-gradient(180deg, rgba(8,12,21,0.92), rgba(7,12,20,0.88))'),
                            color: unlocked ? t.levelTitle : t.textMuted,
                            cursor: unlocked ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            boxShadow: unlocked
                              ? (theme === 'light'
                                ? '0 10px 20px rgba(58,145,204,0.10)'
                                : '0 10px 18px rgba(0,0,0,0.30)')
                              : 'none',
                            opacity: unlocked ? 1 : 0.88,
                            padding: '10px 6px',
                          }}
                        >
                          <span style={{ fontSize: unlocked ? 24 : 20, lineHeight: 1 }}>
                            {unlocked ? (mapConfig.accent === 'teal' ? '🛰️' : mapConfig.accent === 'amber' ? '🌲' : '🚀') : '🔒'}
                          </span>
                          <span style={{
                            fontSize: 14,
                            fontWeight: 900,
                            fontFamily: 'monospace',
                            letterSpacing: 0.8,
                          }}>
                            L{levelNumber}
                          </span>
                          <span style={{
                            fontSize: 9,
                            fontFamily: 'monospace',
                            letterSpacing: 1.3,
                            fontWeight: 800,
                            color: unlocked ? t.textSecondary : t.textMuted,
                          }}>
                            {unlocked ? 'PLAY' : 'LOCKED'}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
