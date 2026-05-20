const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const pad2 = (n) => (n < 10 ? '0' + n : String(n))

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const formatHM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`

/**
 * Format a timestamp as absolute datetime, e.g. 2026-05-18 14:23:45
 */
export function formatAbsolute(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${formatHM(d)}:${pad2(d.getSeconds())}`
}

/**
 * Format a timestamp as a short ISO string for <time datetime="...">
 */
export function formatISOTime(ts) {
  if (!ts) return ''
  return new Date(ts).toISOString()
}

/**
 * Format a timestamp as user-friendly relative time.
 *
 * Granularity:
 *   < 1 min   → just now
 *   < 1 hr    → N min ago
 *   < 6 hr    → N hr ago
 *   same day  → Today HH:mm
 *   yesterday → Yesterday HH:mm
 *   < 7 days  → Weekday HH:mm
 *   same year → Mon D HH:mm
 *   else      → YYYY-MM-DD
 */
export function formatRelative(ts, now = Date.now()) {
  if (!ts) return ''
  const diff = Math.max(0, now - ts)

  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE)
    return `${m} min ago`
  }
  if (diff < 6 * HOUR) {
    const h = Math.floor(diff / HOUR)
    return `${h} hr ago`
  }

  const d = new Date(ts)
  const n = new Date(now)

  if (sameDay(d, n)) return `Today ${formatHM(d)}`

  const yesterday = new Date(n)
  yesterday.setDate(yesterday.getDate() - 1)
  if (sameDay(d, yesterday)) return `Yesterday ${formatHM(d)}`

  if (diff < 7 * DAY) return `${WEEKDAYS[d.getDay()]} ${formatHM(d)}`

  if (d.getFullYear() === n.getFullYear()) {
    return `${MONTHS[d.getMonth()]} ${d.getDate()} ${formatHM(d)}`
  }

  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
