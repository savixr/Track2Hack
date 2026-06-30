/**
 * Client-side structured logger
 *
 * In production, logs are silenced (console.log → noop) to prevent
 * accidental data leakage in browser DevTools.
 * Error-level events are always kept; they surface real exceptions.
 *
 * Usage:
 *   import { log } from '../lib/logger'
 *   log.info('entry saved', { id: entryId })
 *   log.error('upload failed', { file: name, reason: err.message })
 */

const IS_DEV = import.meta.env.DEV

const fmt = (level, msg, meta) => {
  const ts = new Date().toISOString()
  return meta ? `[${ts}] [${level.toUpperCase()}] ${msg}` : `[${ts}] [${level.toUpperCase()}] ${msg}`
}

export const log = {
  debug: (msg, meta) => {
    if (!IS_DEV) return
    meta ? console.debug(fmt('debug', msg), meta) : console.debug(fmt('debug', msg))
  },
  info: (msg, meta) => {
    if (!IS_DEV) return
    meta ? console.info(fmt('info', msg), meta) : console.info(fmt('info', msg))
  },
  warn: (msg, meta) => {
    meta ? console.warn(fmt('warn', msg), meta) : console.warn(fmt('warn', msg))
  },
  error: (msg, meta) => {
    // always log errors regardless of env
    meta ? console.error(fmt('error', msg), meta) : console.error(fmt('error', msg))
  },
}
