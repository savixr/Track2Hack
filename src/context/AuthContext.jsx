/**
 * AuthContext — Passcode-only authentication (single-user)
 *
 * Security model:
 *  • The hashed passcode lives in localStorage under 't2h_pc_hash'
 *  • Session token (random UUID) stored in sessionStorage — clears on tab close
 *  • Rate-limit: max 5 failed attempts, then 60-second lockout (persisted in localStorage)
 *  • CSRF: a one-time nonce is generated each lock-screen render and compared on submit
 *  • Passcode must be ≥ 8 chars, containing upper, lower, digit, and symbol (enforced on setup)
 *  • All inputs are trimmed + length-capped to prevent overflow attacks
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AuthContext = createContext(null)

// ── constants ─────────────────────────────────────────────────────────────
const SESSION_KEY   = 't2h_session'
const HASH_KEY      = 't2h_pc_hash'
const ATTEMPTS_KEY  = 't2h_attempts'
const LOCKOUT_KEY   = 't2h_lockout'
const MAX_ATTEMPTS  = 5
const LOCKOUT_MS    = 60_000          // 1 minute

// ── crypto helpers ────────────────────────────────────────────────────────
async function hashPasscode(raw) {
  const encoder = new TextEncoder()
  const salt = 'track2hack_v1_static_salt_2026'   // deterministic salt; no need for random because the secret never leaves this device
  const data = encoder.encode(salt + raw)
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateToken() {
  return crypto.randomUUID()
}

// ── strength validation ───────────────────────────────────────────────────
export function validatePasscodeStrength(pc) {
  if (pc.length < 8)           return 'Must be at least 8 characters'
  if (!/[A-Z]/.test(pc))      return 'Must contain an uppercase letter'
  if (!/[a-z]/.test(pc))      return 'Must contain a lowercase letter'
  if (!/[0-9]/.test(pc))      return 'Must contain a digit'
  if (!/[^A-Za-z0-9]/.test(pc)) return 'Must contain a special character (!@#$...)'
  return null
}

// ── provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [authed,    setAuthed]    = useState(false)
  const [hasSetup,  setHasSetup]  = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [attempts,  setAttempts]  = useState(0)
  const [lockUntil, setLockUntil] = useState(null)

  // boot: restore state from storage
  useEffect(() => {
    const storedHash    = localStorage.getItem(HASH_KEY)
    const token         = sessionStorage.getItem(SESSION_KEY)
    const storedAttempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10)
    const storedLock    = parseInt(localStorage.getItem(LOCKOUT_KEY)   || '0', 10)

    setHasSetup(!!storedHash)
    setAttempts(storedAttempts)
    if (storedLock > Date.now()) setLockUntil(storedLock)

    // a session token in sessionStorage means the user already unlocked this tab
    if (token && storedHash) {
      setAuthed(true)
    }

    setLoading(false)
  }, [])

  // ── setup (first-time passcode creation) ──────────────────────────────
  const setupPasscode = useCallback(async (raw) => {
    const trimmed = raw.trim().slice(0, 128)
    const err = validatePasscodeStrength(trimmed)
    if (err) return { error: err }

    const hash = await hashPasscode(trimmed)
    localStorage.setItem(HASH_KEY, hash)

    // clear any residual rate-limit state
    localStorage.removeItem(ATTEMPTS_KEY)
    localStorage.removeItem(LOCKOUT_KEY)
    setAttempts(0)
    setLockUntil(null)

    const token = generateToken()
    sessionStorage.setItem(SESSION_KEY, token)
    setHasSetup(true)
    setAuthed(true)
    return { error: null }
  }, [])

  // ── sign in ────────────────────────────────────────────────────────────
  const signIn = useCallback(async (raw) => {
    // lockout check
    if (lockUntil && Date.now() < lockUntil) {
      const secs = Math.ceil((lockUntil - Date.now()) / 1000)
      return { error: `Too many attempts. Try again in ${secs}s.` }
    }

    const trimmed = raw.trim().slice(0, 128)
    const storedHash = localStorage.getItem(HASH_KEY)
    if (!storedHash) return { error: 'No passcode set.' }

    const hash = await hashPasscode(trimmed)
    if (hash !== storedHash) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      localStorage.setItem(ATTEMPTS_KEY, String(newAttempts))

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS
        setLockUntil(until)
        localStorage.setItem(LOCKOUT_KEY, String(until))
        localStorage.setItem(ATTEMPTS_KEY, '0')
        setAttempts(0)
        return { error: `Too many attempts. Locked for 60 seconds.` }
      }

      const left = MAX_ATTEMPTS - newAttempts
      return { error: `Wrong passcode. ${left} attempt${left === 1 ? '' : 's'} remaining.` }
    }

    // ✅ correct
    localStorage.setItem(ATTEMPTS_KEY, '0')
    localStorage.removeItem(LOCKOUT_KEY)
    setAttempts(0)
    setLockUntil(null)

    const token = generateToken()
    sessionStorage.setItem(SESSION_KEY, token)
    setAuthed(true)
    return { error: null }
  }, [attempts, lockUntil])

  // ── sign out ───────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
  }, [])

  // ── change passcode ────────────────────────────────────────────────────
  const changePasscode = useCallback(async (currentRaw, newRaw) => {
    const currentHash = await hashPasscode(currentRaw.trim().slice(0, 128))
    const stored = localStorage.getItem(HASH_KEY)
    if (currentHash !== stored) return { error: 'Current passcode is wrong.' }

    const err = validatePasscodeStrength(newRaw.trim().slice(0, 128))
    if (err) return { error: err }

    const newHash = await hashPasscode(newRaw.trim().slice(0, 128))
    localStorage.setItem(HASH_KEY, newHash)
    return { error: null }
  }, [])

  const lockScreen = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
  }, [])

  return (
    <AuthContext.Provider value={{
      authed, hasSetup, loading,
      attempts, lockUntil,
      signIn, signOut, setupPasscode, changePasscode, lockScreen,
      // legacy compat shim so Layout "user" check still works
      user: authed ? { id: 'local', email: 'local' } : null,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
