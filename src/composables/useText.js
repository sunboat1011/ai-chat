import { zhCN } from '@/locales/zh-CN.js'

/**
 * Simple text lookup helper (no vue-i18n dependency).
 * Supports nested keys via dot notation and basic interpolation with {key}.
 *
 * Usage:
 *   In <script setup>: const { t } = useText()
 *   In template: {{ $t('sidebar.newChat') }}  (via global property)
 */

function getValue(obj, path) {
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current == null || !(part in current)) {
      return undefined
    }
    current = current[part]
  }
  return current
}

function interpolate(template, values) {
  if (!values || typeof template !== 'string') return template
  return template.replace(/\{([^{}]+)\}/g, (_, key) => {
    return values[key.trim()] !== undefined ? String(values[key.trim()]) : `{${key}}`
  })
}

export function t(key, values) {
  const value = getValue(zhCN, key)
  if (value === undefined) {
    console.warn(`[useText] Missing key: ${key}`)
    return key
  }
  return interpolate(value, values)
}

export function useText() {
  return { t }
}
