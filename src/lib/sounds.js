// Lightweight UI sound effects, synthesized with the Web Audio API — no
// audio files to ship or fetch. A single AudioContext is created lazily on
// first use (browsers block audio until a user gesture has happened) and
// reused for every subsequent sound.

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    try {
      ctx = new AudioCtx()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function blip({ freqStart, freqEnd = freqStart, duration = 0.05, type = 'sine', gain = 0.07 }) {
  const audio = getCtx()
  if (!audio) return
  try {
    const osc = audio.createOscillator()
    const g = audio.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freqStart, audio.currentTime)
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), audio.currentTime + duration)
    }
    g.gain.setValueAtTime(gain, audio.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
    osc.connect(g)
    g.connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + duration + 0.02)
  } catch {
    // Audio is a nice-to-have; never let it break the UI.
  }
}

/** Soft rising tick — selecting a tab, nav item, or general button press. */
export function playClick() {
  blip({ freqStart: 720, freqEnd: 880, duration: 0.045, type: 'triangle', gain: 0.05 })
}

/** Lower, falling tone — closing a tab, panel, drawer, or modal. */
export function playClose() {
  blip({ freqStart: 520, freqEnd: 340, duration: 0.08, type: 'triangle', gain: 0.05 })
}

/** Bright upward chirp — starting the stopwatch. */
export function playStart() {
  blip({ freqStart: 600, freqEnd: 980, duration: 0.06, type: 'sine', gain: 0.06 })
}
