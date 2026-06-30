import { Suspense, lazy, useEffect, useState } from 'react'
import { Clock, Timer, Play, Pause, RotateCcw } from 'lucide-react'
import { playClick, playClose, playStart } from '../../lib/sounds'

const ClockScene = lazy(() => import('./ClockScene'))

const pad = (n) => String(Math.floor(n)).padStart(2, '0')

function clockDigitalText() {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function stopwatchDigitalText(stopwatch) {
  const elapsed = Math.max(
    0,
    stopwatch.running ? stopwatch.elapsedMs + (performance.now() - stopwatch.startedAt) : stopwatch.elapsedMs
  )
  const mm = Math.floor(elapsed / 60000)
  const ss = Math.floor((elapsed % 60000) / 1000)
  const tenths = Math.floor((elapsed % 1000) / 100)
  return `${pad(mm)}:${pad(ss)}.${tenths}`
}

/**
 * Fixed-position floating 3D clock, mounted once at the app shell level so
 * it persists (no remount/flicker) across route changes. Doubles as a live
 * clock and a stopwatch — tap the small timer icon to switch modes.
 *
 * @param {number} hideUntilScroll - if set, the widget stays hidden until
 *   the page has been scrolled past this many pixels (used on the landing
 *   page so it doesn't compete with the larger hero piece).
 */
export default function FloatingClock({ hideUntilScroll = 0 }) {
  const [visible, setVisible] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [pastThreshold, setPastThreshold] = useState(hideUntilScroll === 0)
  const [mode, setMode] = useState('clock') // 'clock' | 'stopwatch'
  const [stopwatch, setStopwatch] = useState({ running: false, elapsedMs: 0, startedAt: null })
  const [, setTick] = useState(0) // re-render at low frequency to keep digital readout fresh

  useEffect(() => {
    const check = () => setVisible(window.innerWidth >= 480)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (hideUntilScroll === 0) return
    const onScroll = () => setPastThreshold(window.scrollY > hideUntilScroll)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hideUntilScroll])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100)
    return () => clearInterval(id)
  }, [])

  if (!visible || !pastThreshold) return null

  const toggleCollapse = () => {
    playClick()
    setCollapsed((c) => !c)
  }

  const toggleMode = () => {
    playClick()
    setMode((m) => (m === 'clock' ? 'stopwatch' : 'clock'))
  }

  const toggleRun = () => {
    setStopwatch((s) => {
      if (s.running) {
        playClose()
        return { running: false, elapsedMs: s.elapsedMs + (performance.now() - s.startedAt), startedAt: null }
      }
      playStart()
      return { ...s, running: true, startedAt: performance.now() }
    })
  }

  const handleReset = () => {
    playClick()
    setStopwatch({ running: false, elapsedMs: 0, startedAt: null })
  }

  const digitalText = mode === 'clock' ? clockDigitalText() : stopwatchDigitalText(stopwatch)

  return (
    <div
      className={`fixed z-20 pointer-events-none transition-all duration-300 ${
        collapsed
          ? 'bottom-2 right-2 w-16 sm:w-20'
          : 'bottom-3 right-3 sm:bottom-6 sm:right-6 w-28 sm:w-36'
      }`}
    >
      <div className="relative pointer-events-auto">
        <div className="bg-paper-warm/90 backdrop-blur-sm border border-paper-line rounded-xl shadow-sm overflow-hidden">
          <div className="aspect-square">
            <Suspense fallback={null}>
              <ClockScene className="w-full h-full" mode={mode} stopwatch={stopwatch} />
            </Suspense>
          </div>

          {!collapsed && (
            <div className="px-2 pb-2 -mt-1.5 flex flex-col items-center gap-1.5">
              <span className="font-mono text-[11px] text-slate-ink tabular-nums tracking-wide">{digitalText}</span>

              {mode === 'stopwatch' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleRun}
                    title={stopwatch.running ? 'Pause' : 'Start'}
                    className="w-6 h-6 rounded-full bg-paper border border-paper-line text-slate-soft flex items-center justify-center hover:text-rust hover:border-rust/40 transition-colors"
                  >
                    {stopwatch.running ? <Pause size={11} /> : <Play size={11} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Reset"
                    className="w-6 h-6 rounded-full bg-paper border border-paper-line text-slate-soft flex items-center justify-center hover:text-rust hover:border-rust/40 transition-colors"
                  >
                    <RotateCcw size={11} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleCollapse}
          title={collapsed ? 'Expand' : 'Minimize'}
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-paper border border-paper-line text-slate-soft text-[10px] flex items-center justify-center hover:text-rust hover:border-rust/40 transition-colors font-mono"
        >
          {collapsed ? '+' : '–'}
        </button>

        {!collapsed && (
          <button
            type="button"
            onClick={toggleMode}
            title={mode === 'clock' ? 'Switch to stopwatch' : 'Switch to clock'}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-paper border border-paper-line text-slate-soft flex items-center justify-center hover:text-rust hover:border-rust/40 transition-colors"
          >
            {mode === 'clock' ? <Timer size={11} /> : <Clock size={11} />}
          </button>
        )}
      </div>
    </div>
  )
}
