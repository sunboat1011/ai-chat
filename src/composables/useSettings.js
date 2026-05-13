import { ref, watch } from 'vue'

const SETTINGS_KEY = 'ai-chat-settings'

const DEFAULT_SETTINGS = {
  theme: 'dark',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  model: 'claude-3-sonnet',
  accentColor: 'green',
}

const ACCENT_COLORS = {
  green: '#10a37f',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  red: '#ef4444',
}

// ─── Module-level singleton state ───
const settings = ref({ ...DEFAULT_SETTINGS })

// ─── Load from localStorage ───
function loadFromStorage() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      settings.value = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        apiBaseUrl: parsed.apiBaseUrl || DEFAULT_SETTINGS.apiBaseUrl,
      }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
}

// ─── Save to localStorage ───
function saveToStorage() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

// ─── Apply theme to <html> ───
function applyTheme(theme) {
  const html = document.documentElement
  let isDark = theme === 'dark'

  if (theme === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  html.classList.toggle('dark', isDark)
  html.classList.toggle('light', !isDark)
  html.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

// ─── Apply accent color via CSS variables ───
function applyAccentColor(color) {
  const accent = ACCENT_COLORS[color] || ACCENT_COLORS.green
  const root = document.documentElement
  root.style.setProperty('--accent-primary', accent)
  root.style.setProperty('--accent-hover', shadeColor(accent, -20))
  root.style.setProperty('--accent-light', shadeColor(accent, 20))
}

function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16)
  let G = parseInt(color.substring(3, 5), 16)
  let B = parseInt(color.substring(5, 7), 16)

  R = Math.min(255, Math.max(0, Math.round(R + (R * percent) / 100)))
  G = Math.min(255, Math.max(0, Math.round(G + (G * percent) / 100)))
  B = Math.min(255, Math.max(0, Math.round(B + (B * percent) / 100)))

  const toHex = (n) => n.toString(16).padStart(2, '0')
  return `#${toHex(R)}${toHex(G)}${toHex(B)}`
}

// ─── Listen for system theme changes ───
function initSystemThemeListener() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (settings.value.theme === 'system') {
      applyTheme('system')
    }
  })
}

// ─── Initialize: load → apply ───
loadFromStorage()
applyTheme(settings.value.theme)
applyAccentColor(settings.value.accentColor)
initSystemThemeListener()

// ─── Auto-persist and auto-apply on any change ───
watch(
  settings,
  (newVal) => {
    saveToStorage()
    applyTheme(newVal.theme)
    applyAccentColor(newVal.accentColor)
  },
  { deep: true }
)

// ─── Composable ───
export function useSettings() {
  function saveSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings }
  }

  function loadSettings() {
    loadFromStorage()
    applyTheme(settings.value.theme)
    applyAccentColor(settings.value.accentColor)
  }

  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
  }

  return {
    settings,
    saveSettings,
    loadSettings,
    resetSettings,
    ACCENT_COLORS,
  }
}
