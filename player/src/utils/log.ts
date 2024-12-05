/**
 * Logging utiltities
 *
 * Provides functions to log objects without serialization overhead it
 * the logs are not active.
 *
 * To activate logs, write `localStorage.setItem('msl-player-debug', 'true')` in
 * the console. Set to false or remove to disable logs.
 * Errors are always logged.
 */

const key = 'msl-player-debug'

let active = false
try {
  active = Boolean(JSON.parse(localStorage.getItem(key) ?? 'false'))
} catch {}

if (active) {
  console.warn(
    `${key} logs are active, use localStorage.removeItem('${key}') to deactivate`
  )
}

const styles = {
  blue: 'color: light-dark(#0f2b45, #7fb3e0);',
}

let last = performance.now()
function out(level: 'debug' | 'error' | 'info' | 'warn', ...args: unknown[]) {
  const now = performance.now()
  const elapsed = now - last
  last = now
  console[level](
    `%c[+${elapsed}ms]`,
    styles.blue,
    ...args.map((arg) => `${arg}`)
  )
}

export function logDebug(...args: unknown[]) {
  if (!active) return
  out('debug', ...args)
}

export function logError(...args: unknown[]) {
  out('error', ...args)
}

export function logInfo(...args: unknown[]) {
  if (!active) return
  out('info', ...args)
}

export function logWarn(...args: unknown[]) {
  if (!active) return
  out('warn', ...args)
}
