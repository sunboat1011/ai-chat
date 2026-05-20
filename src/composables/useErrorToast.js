import { ref } from 'vue'

/**
 * Module-level singleton for the global error/notification toast system.
 *
 * Levels: 'error' | 'warning' | 'info'
 * Auto-dismiss after `duration` ms (default 5000). Pass duration=0 to keep until manual close.
 *
 * Usage:
 *   import { showError, showWarning, showInfo, dismissToast } from '@/composables/useErrorToast'
 *   showError('Network connection failed')
 *
 *   In a component:
 *     const { toasts, dismiss } = useErrorToast()
 */

const toasts = ref([])
let nextId = 1

function pushToast(level, message, options = {}) {
  if (!message) return null
  const id = nextId++
  const duration = options.duration !== undefined ? options.duration : 5000
  const toast = { id, level, message }
  toasts.value.push(toast)
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration)
  }
  return id
}

export function dismissToast(id) {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

export function showError(message, options) {
  return pushToast('error', message, options)
}

export function showWarning(message, options) {
  return pushToast('warning', message, options)
}

export function showInfo(message, options) {
  return pushToast('info', message, options)
}

export function clearToasts() {
  toasts.value = []
}

export function useErrorToast() {
  return {
    toasts,
    showError,
    showWarning,
    showInfo,
    dismiss: dismissToast,
    clear: clearToasts,
  }
}
