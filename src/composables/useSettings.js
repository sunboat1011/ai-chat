import { ref, watch } from 'vue'

const SETTINGS_KEY = 'ai-chat-settings'

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'dark',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  model: 'claude-3-sonnet',
  accentColor: 'green',
}

export function useSettings() {
  const settings = ref({ ...DEFAULT_SETTINGS })

  // Load settings from localStorage
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Only apply known settings
        settings.value = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          // Ensure apiBaseUrl has a reasonable fallback
          apiBaseUrl: parsed.apiBaseUrl || DEFAULT_SETTINGS.apiBaseUrl,
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }

    // Apply theme immediately
    applyTheme(settings.value.theme)
  }

  // Save settings to localStorage
  const saveSettings = (newSettings) => {
    settings.value = {
      ...settings.value,
      ...newSettings,
    }

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
      applyTheme(settings.value.theme)
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  // Apply theme to document
  const applyTheme = (theme) => {
    const html = document.documentElement
    html.classList.remove('dark', 'light')

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      html.classList.add(prefersDark ? 'dark' : 'light')
    } else {
      html.classList.add(theme)
    }
  }

  // Watch for system theme changes when in system mode
  watch(() => settings.value.theme, (newTheme) => {
    if (newTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e) => {
        document.documentElement.classList.toggle('dark', e.matches)
        document.documentElement.classList.toggle('light', !e.matches)
      }
      mediaQuery.addEventListener('change', handleChange)
      // Cleanup
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  })

  return {
    settings,
    loadSettings,
    saveSettings,
  }
}
