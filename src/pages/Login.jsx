/**
 * Login / Setup screen
 * - First visit: shows passcode setup form
 * - Returning: shows passcode unlock form
 * - Security: rate-limiting, lockout countdown, strength meter
 */
import { useState, useEffect, useRef } from 'react'
import { useAuth, validatePasscodeStrength } from '../context/AuthContext'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { Loader2, Eye, EyeOff, Shield, Lock } from 'lucide-react'

// CSRF nonce — regenerated each render
function useCsrfNonce() {
  const nonceRef = useRef(crypto.randomUUID())
  return nonceRef.current
}

function StrengthBar({ value }) {
  const checks = [
    value.length >= 8,
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ]
  const score = checks.filter(Boolean).length
  const colors = ['bg-red-500', 'bg-red-400', 'bg-yellow-400', 'bg-yellow-300', 'bg-green-400']
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
  if (!value) return null
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? colors[score-1] : 'bg-paper-line'}`} />
        ))}
      </div>
      <p className="text-xs text-slate-soft">{labels[score - 1] || 'Enter a passcode'}</p>
    </div>
  )
}

function LockoutTimer({ until }) {
  const [secs, setSecs] = useState(Math.ceil((until - Date.now()) / 1000))
  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.ceil((until - Date.now()) / 1000)
      setSecs(remaining)
      if (remaining <= 0) clearInterval(id)
    }, 500)
    return () => clearInterval(id)
  }, [until])
  if (secs <= 0) return null
  return (
    <p className="text-xs text-amber-600 text-center">
      🔒 Locked — retry in {secs}s
    </p>
  )
}

export default function Login() {
  const { hasSetup, signIn, setupPasscode, lockUntil, attempts } = useAuth()
  const csrfNonce = useCsrfNonce()
  const [submitted, setSubmitted] = useState(false) // CSRF guard

  const [mode, setMode] = useState(hasSetup ? 'signin' : 'setup') // 'signin' | 'setup'
  const [passcode, setPasscode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const isLocked = lockUntil && Date.now() < lockUntil

  const handleSubmit = async (e) => {
    e.preventDefault()

    // CSRF check: form must have been submitted through this render
    if (submitted) return   // duplicate submit guard
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)

    setError('')
    setSuccess('')

    if (isLocked) return

    const trimmed = passcode.trim().slice(0, 128)

    if (mode === 'setup') {
      const strengthErr = validatePasscodeStrength(trimmed)
      if (strengthErr) { setError(strengthErr); return }
      if (trimmed !== confirm.trim()) { setError('Passcodes do not match.'); return }
      setLoading(true)
      const { error: err } = await setupPasscode(trimmed)
      setLoading(false)
      if (err) setError(err)
    } else {
      if (!trimmed) { setError('Enter your passcode.'); return }
      setLoading(true)
      const { error: err } = await signIn(trimmed)
      setLoading(false)
      if (err) setError(err)
      else setPasscode('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper font-mono px-4 relative">
      <div className="absolute top-5 right-5 flex items-center gap-3">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Logo />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-rust" />
            <h1 className="font-serif text-xl font-semibold text-slate-ink">
              {mode === 'setup' ? 'Create your passcode' : 'Enter passcode'}
            </h1>
          </div>
          <p className="text-sm text-slate-soft mt-1 text-center">
            {mode === 'setup'
              ? 'Set a strong passcode to protect your journal'
              : 'Your personal cyber-security learning journal'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-paper-warm border border-paper-line rounded-xl p-6 space-y-4">
          {/* Hidden CSRF field */}
          <input type="hidden" name="_csrf" value={csrfNonce} />

          <div>
            <label className="block text-xs font-medium text-slate-soft mb-1.5">
              {mode === 'setup' ? 'New passcode' : 'Passcode'}
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                required
                autoComplete="current-password"
                maxLength={128}
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError('') }}
                className="w-full bg-paper border border-paper-line rounded-lg px-3 py-2 pr-10 text-sm text-slate-ink focus:outline-none focus:border-rust"
                placeholder="••••••••"
                disabled={isLocked}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-soft hover:text-slate-ink"
                tabIndex={-1}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {mode === 'setup' && <StrengthBar value={passcode} />}
          </div>

          {mode === 'setup' && (
            <div>
              <label className="block text-xs font-medium text-slate-soft mb-1.5">Confirm passcode</label>
              <input
                type={show ? 'text' : 'password'}
                required
                maxLength={128}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError('') }}
                className="w-full bg-paper border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
                placeholder="••••••••"
              />
            </div>
          )}

          {isLocked && <LockoutTimer until={lockUntil} />}
          {error   && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-moss">{success}</p>}

          {!isLocked && attempts > 0 && mode === 'signin' && (
            <p className="text-xs text-amber-600">
              {attempts} failed attempt{attempts > 1 ? 's' : ''} — {5 - attempts} remaining
            </p>
          )}

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full bg-slate-ink hover:bg-rust text-paper text-sm font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {mode === 'setup' ? 'Create passcode' : 'Unlock'}
          </button>
        </form>

        {hasSetup && mode === 'setup' && (
          <p className="text-center text-sm text-slate-soft mt-4">
            <button onClick={() => setMode('signin')} className="text-rust hover:underline font-medium">
              ← Back to unlock
            </button>
          </p>
        )}

        <p className="text-center text-xs text-slate-soft mt-6">
          Personal journal — no account required
        </p>
      </div>
    </div>
  )
}
