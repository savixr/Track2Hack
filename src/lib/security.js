/**
 * Client-side security helpers
 *
 * Note: HTTPS, security headers, CSRF cookies, and rate-limiting at the
 * network level are enforced by the server/reverse-proxy (Vercel edge,
 * Nginx, Cloudflare…). These helpers provide defence-in-depth on the
 * browser side.
 */

// ── XSS: sanitise text before injecting into innerHTML ────────────────────
export function sanitizeText(raw) {
  if (typeof raw !== 'string') return ''
  // Cap length to prevent memory attacks
  return raw.slice(0, 50_000)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ── Input validation helpers ──────────────────────────────────────────────

/**
 * Trim, strip null bytes, cap length. Safe for text inputs.
 */
export function sanitizeInput(value, maxLen = 1000) {
  if (typeof value !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  return value.replace(/\x00/g, '').trim().slice(0, maxLen)
}

/**
 * Validate that a string looks like a UUID v4.
 * Used before passing IDs to Supabase queries.
 */
export function isValidUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

/**
 * Validate date string is a real calendar date (YYYY-MM-DD).
 * Prevents date injection in DB queries.
 */
export function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const d = new Date(str)
  return d instanceof Date && !isNaN(d)
}

/**
 * Clamp a numeric value to a safe range.
 */
export function clampNumber(val, min, max) {
  const n = parseFloat(val)
  if (isNaN(n)) return min
  return Math.min(Math.max(n, min), max)
}

// ── URL safety ────────────────────────────────────────────────────────────

/**
 * Validate that a URL is http/https (not javascript:, data:, etc.)
 */
export function isSafeUrl(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

// ── Simple in-memory client-side rate limiter ─────────────────────────────
const RL_STORE = new Map()

/**
 * Check whether `key` has been called more than `limit` times in `windowMs`.
 * Returns true if the call should be ALLOWED, false if rate-limited.
 *
 * Usage: if (!rateLimit('submit-entry', 10, 60_000)) { show error }
 */
export function rateLimit(key, limit = 10, windowMs = 60_000) {
  const now = Date.now()
  const entry = RL_STORE.get(key) || { count: 0, resetAt: now + windowMs }

  if (now > entry.resetAt) {
    // window expired — reset
    RL_STORE.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  RL_STORE.set(key, entry)
  return true
}
