/**
 * Composable that wires up analytics tracking into the app lifecycle.
 *
 * Responsibilities:
 *   - Import and start web-vitals collection
 *   - Start the analytics flush timer on first use
 *   - Provide convenience wrappers for common event types
 */

import { onMounted, onUnmounted } from 'vue'
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals'
import { track, trackError, trackWebVital, startAnalyticsFlush } from '@/utils/analytics'

let initialized = false

function initWebVitals() {
  onLCP((metric) => trackWebVital('LCP', metric.value, metric.rating))
  onINP((metric) => trackWebVital('INP', metric.value, metric.rating))
  onCLS((metric) => trackWebVital('CLS', metric.value, metric.rating))
  onFCP((metric) => trackWebVital('FCP', metric.value, metric.rating))
  onTTFB((metric) => trackWebVital('TTFB', metric.value, metric.rating))
}

function initAnalytics() {
  if (initialized) return
  initialized = true
  initWebVitals()
  startAnalyticsFlush()
}

/**
 * Call once at app startup (e.g. in main.js).
 */
export function setupAnalytics() {
  initAnalytics()
}

/**
 * Use inside a component to ensure analytics is running.
 * Safe to call in multiple components (idempotent).
 */
export function useAnalytics() {
  onMounted(() => {
    initAnalytics()
  })
  onUnmounted(() => {
    // Do NOT stop flush here — it's a global singleton.
  })

  return {
    track,
    trackError,
    trackWebVital,
  }
}

export { track, trackError, trackWebVital }
