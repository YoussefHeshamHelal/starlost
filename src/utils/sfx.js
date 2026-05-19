const SFX = {
  executeProgram: { src: '/assets/audio/execute-program.mp3', volume: 0.45 },
  collectFragment: { src: '/assets/audio/collect-fragment.mp3', volume: 0.55 },
  levelSuccess: { src: '/assets/audio/level-success.mp3', volume: 0.6 },
  blockedPath: { src: '/assets/audio/blocked-path.mp3', volume: 0.55 },
}

const audioCache = new Map()

function getAudio(name) {
  if (typeof Audio === 'undefined') return null
  const config = SFX[name]
  if (!config) return null

  if (!audioCache.has(name)) {
    const audio = new Audio(config.src)
    audio.preload = 'auto'
    audio.volume = config.volume
    audioCache.set(name, audio)
  }

  return audioCache.get(name)
}

export function preloadSfx() {
  Object.keys(SFX).forEach((name) => {
    try {
      getAudio(name)?.load?.()
    } catch {
      // SFX are decorative; loading failures should never interrupt gameplay.
    }
  })
}

export function playSfx(name) {
  try {
    const baseAudio = getAudio(name)
    if (!baseAudio) return

    const audio = baseAudio.cloneNode(true)
    audio.volume = SFX[name]?.volume ?? baseAudio.volume
    const playPromise = audio.play()
    if (playPromise?.catch) playPromise.catch(() => {})
  } catch {
    // SFX are best-effort and should never crash the game.
  }
}
