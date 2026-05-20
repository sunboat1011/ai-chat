/**
 * Lightweight frontend analytics system.
 *
 * Design goals:
 *   - No third-party SDK, fully self-hosted.
 *   - Privacy-first: never capture message content, user input, or AI output.
 *   - Batched writes to localStorage; periodic flush to console (remote endpoint TBD).
 *   - Graceful degradation if storage is full or unavailable.
 *
 * Events are stored in a ring buffer (max ANALYTICS_MAX_EVENTS).
 * On flush, the buffer is cleared and sent to the configured transport.
 */

const ANALYTICS_KEY = 'ai-chat-analytics-queue'
const ANALYTICS_MAX_EVENTS = 200
const ANALYTICS_FLUSH_INTERVAL = 30000 // 30s
const ANALYTICS_VERSION = 1

let flushTimer = null
let sessionId = null

/**
 * Generate or retrieve a stable session ID for the current page session.
 */
function getSessionId() {
  if (sessionId) return sessionId
  try {
    const key = 'ai-chat-analytics-session'
    let id = window.sessionStorage.getItem(key)
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      window.sessionStorage.setItem(key, id)
    }
    sessionId = id
    return id
  } catch {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    return sessionId
  }
}

/**
 * Read the event queue from localStorage.
 */
function readQueue() {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Write the event queue to localStorage.
 */
function writeQueue(queue) {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(queue))
  } catch {
    // Storage full or unavailable — silently drop
  }
}

/**
 * Push a single event into the local ring buffer.
 */
function pushEvent(event) {
  const queue = readQueue()
  queue.push(event)
  // Ring buffer: trim oldest when over limit
  if (queue.length > ANALYTICS_MAX_EVENTS) {
    queue.splice(0, queue.length - ANALYTICS_MAX_EVENTS)
  }
  writeQueue(queue)
}

/**
 * Build the common event envelope.
 */
function buildEnvelope(eventName, params = {}) {
  return {
    v: ANALYTICS_VERSION,
    ts: Date.now(),
    sid: getSessionId(),
    evt: eventName,
    params: { ...params },
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    url: typeof location !== 'undefined' ? location.href : '',
    screen: typeof window.screen !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
  }
}

/**
 * Track a user behavior event.
 *
 * @param {string} eventName - e.g. 'message_send', 'model_switch'
 * @param {Object} [params]  - Additional metadata (must NOT contain message content)
 */
export function track(eventName, params = {}) {
  const envelope = buildEnvelope(eventName, params)

  // In development, mirror to console for easy verification
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[Analytics]', envelope.evt, envelope.params)
  }

  pushEvent(envelope)
}

/**
 * Track an error event with sanitized metadata.
 *
 * @param {string} category - 'api' | 'runtime' | 'vue' | 'unhandledrejection'
 * @param {Object} [meta]   - Error metadata (message is truncated, no stack in production)
 */
export function trackError(category, meta = {}) {
  const safeMeta = { ...meta }
  // Never store raw error messages longer than 200 chars
  if (safeMeta.message && typeof safeMeta.message === 'string') {
    safeMeta.message = safeMeta.message.slice(0, 200)
  }
  // Stack trace only in dev
  if (!import.meta.env.DEV) {
    delete safeMeta.stack
  }
  track('error_' + category, safeMeta)
}

/**
 * Track a Web Vital metric.
 *
 * @param {string} name   - Metric name (LCP, FID, CLS, etc.)
 * @param {number} value  - Metric value
 * @param {string} rating - 'good' | 'needs-improvement' | 'poor'
 */
export function trackWebVital(name, value, rating) {
  track('web_vital', { name, value: Math.round(value * 1000) / 1000, rating })
}

/**
 * Flush queued events to the transport.
 * Currently logs to console and clears queue.
 * When a backend endpoint is ready, replace the body of this function.
 */
export function flushEvents() {
  const queue = readQueue()
  if (queue.length === 0) return

  // TODO: replace with actual HTTP POST to analytics backend
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics] flush (${queue.length} events)`, queue)
  }

  // Clear the queue after "successful" flush
  try {
    localStorage.removeItem(ANALYTICS_KEY)
  } catch {
    // ignore
  }
}

/**
 * Start the periodic flush timer.
 */
export function startAnalyticsFlush() {
  if (flushTimer) return
  flushTimer = setInterval(flushEvents, ANALYTICS_FLUSH_INTERVAL)
  // Also flush on page hide / unload
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushEvents()
      }
    })
  }
}

/**
 * Stop the periodic flush timer.
 */
export function stopAnalyticsFlush() {
  if (flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }
}

/**
 * Get the current queue size (for diagnostics).
 */
export function getQueueSize() {
  return readQueue().length
}
