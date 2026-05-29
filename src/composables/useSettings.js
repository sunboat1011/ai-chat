import { ref, watch } from 'vue'

const SETTINGS_KEY = 'ai-chat-settings'

// ─── Built-in models ───
const BUILT_IN_MODELS = [
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
]

// ─── Built-in templates ───
const BUILT_IN_TEMPLATES = [
  {
    id: 'builtin-general',
    name: 'General Assistant',
    icon: '🤖',
    description: 'Helpful, harmless, honest',
    systemPrompt: 'You are a helpful AI assistant. Answer questions clearly and concisely.',
    messages: [],
    builtIn: true,
  },
  {
    id: 'builtin-code-reviewer',
    name: 'Code Reviewer',
    icon: '🔍',
    description: 'Review & improve code',
    systemPrompt:
      'You are a senior software engineer. Review code for bugs, performance issues, security vulnerabilities, and style violations. Provide constructive feedback with specific suggestions.',
    messages: [],
    builtIn: true,
  },
  {
    id: 'builtin-translator',
    name: 'English Translator',
    icon: '🌐',
    description: 'Translate to English',
    systemPrompt:
      "You are a professional translator. Translate the user's text into English accurately and naturally. Preserve tone and context. Only output the translated text, no extra explanation.",
    messages: [],
    builtIn: true,
  },
  {
    id: 'builtin-weekly-report',
    name: 'Weekly Report',
    icon: '📋',
    description: 'Write work reports',
    systemPrompt:
      'You are an expert at writing professional work reports. Help the user organize their weekly achievements, challenges, and plans into a clear, well-structured report.',
    messages: [
      { role: 'user', content: '请帮我写一份周报，包含本周完成的工作、遇到的问题和下周计划。' },
      {
        role: 'assistant',
        content:
          '好的，请告诉我本周你完成了哪些具体工作，遇到了什么问题，以及下周的计划是什么？我会帮你整理成一份专业的周报。',
      },
    ],
    builtIn: true,
  },
  {
    id: 'builtin-creative-writer',
    name: 'Creative Writer',
    icon: '✍️',
    description: 'Storytelling & copywriting',
    systemPrompt:
      'You are a creative writing assistant. Help with storytelling, copywriting, and brainstorming. Be imaginative and inspiring.',
    messages: [],
    builtIn: true,
  },
  {
    id: 'builtin-data-analyst',
    name: 'Data Analyst',
    icon: '📊',
    description: 'Analysis & insights',
    systemPrompt:
      'You are a data analyst. Help interpret data, create visualizations (in text/Markdown), and derive actionable insights. Be precise with numbers.',
    messages: [],
    builtIn: true,
  },
]

// ─── Model parameter defaults & bounds (single source of truth) ───
const DEFAULT_MODEL_PARAMS = {
  temperature: 1.0,
  maxTokens: 2048,
  topP: 1.0,
}

const MODEL_PARAM_BOUNDS = {
  temperature: { min: 0, max: 2, step: 0.1 },
  maxTokens: { min: 1, max: 32000, step: 1 },
  topP: { min: 0, max: 1, step: 0.05 },
}

const DEFAULT_SETTINGS = {
  theme: 'light',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  model: 'claude-3-sonnet',
  accentColor: 'mint',
  defaultSystemPrompt: '',
  customModels: [],
  customTemplates: [],
  ...DEFAULT_MODEL_PARAMS,
}

const ACCENT_COLORS = {
  mint: '#19c8b9',
  coral: '#e59266',
  lavender: '#b77dee',
  sunshine: '#f7cd67',
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
  const accent = ACCENT_COLORS[color] || ACCENT_COLORS.mint
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

// ─── API Key base64 encode / decode ───
function encodeApiKey(key) {
  if (!key) return ''
  try {
    return btoa(key)
  } catch {
    return btoa(unescape(encodeURIComponent(key)))
  }
}

// ─── Custom model helpers ───
function getAllModelOptions(customModels = []) {
  const builtins = BUILT_IN_MODELS.map((m) => ({ ...m, builtIn: true }))
  const customs = (customModels || []).map((m) => ({ ...m, builtIn: false }))
  return [...builtins, ...customs]
}

function getCustomModel(modelId, customModels = []) {
  return customModels.find((m) => m.id === modelId)
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

  function resetModelParams() {
    settings.value = {
      ...settings.value,
      ...DEFAULT_MODEL_PARAMS,
    }
  }

  // ─── Custom model CRUD ───
  function addCustomModel(model) {
    const encodedKey = encodeApiKey(model.apiKey || '')
    const newModel = {
      id: `custom-${Date.now()}`,
      name: model.name?.trim() || 'Custom Model',
      modelId: model.modelId?.trim() || 'gpt-4',
      apiUrl: model.apiUrl?.trim() || '',
      apiKey: encodedKey,
    }
    settings.value.customModels = [...(settings.value.customModels || []), newModel]
    return newModel
  }

  function updateCustomModel(modelId, updates) {
    const list = settings.value.customModels || []
    const idx = list.findIndex((m) => m.id === modelId)
    if (idx === -1) return null

    const updated = { ...list[idx] }
    if (updates.name !== undefined) updated.name = updates.name?.trim() || updated.name
    if (updates.modelId !== undefined) updated.modelId = updates.modelId?.trim() || updated.modelId
    if (updates.apiUrl !== undefined) updated.apiUrl = updates.apiUrl?.trim() || ''
    if (updates.apiKey !== undefined) {
      const key = updates.apiKey?.trim() || ''
      updated.apiKey = key ? encodeApiKey(key) : ''
    }

    const newList = [...list]
    newList[idx] = updated
    settings.value.customModels = newList

    if (settings.value.model === modelId) {
      settings.value.model = modelId
    }
    return updated
  }

  function deleteCustomModel(modelId) {
    const list = settings.value.customModels || []
    settings.value.customModels = list.filter((m) => m.id !== modelId)
    if (settings.value.model === modelId) {
      settings.value.model = DEFAULT_SETTINGS.model
    }
  }

  // ─── Template helpers ───
  function getAllTemplates() {
    const customs = settings.value.customTemplates || []
    return [...BUILT_IN_TEMPLATES, ...customs.map((t) => ({ ...t, builtIn: false }))]
  }

  function getTemplateById(id) {
    return getAllTemplates().find((t) => t.id === id)
  }

  // ─── Custom template CRUD ───
  function addCustomTemplate(template) {
    const newTemplate = {
      id: `template-${Date.now()}`,
      name: template.name?.trim() || 'Custom Template',
      icon: template.icon?.trim() || '✨',
      description: template.description?.trim() || '',
      systemPrompt: template.systemPrompt?.trim() || '',
      messages: template.messages || [],
      builtIn: false,
    }
    settings.value.customTemplates = [...(settings.value.customTemplates || []), newTemplate]
    return newTemplate
  }

  function updateCustomTemplate(templateId, updates) {
    const list = settings.value.customTemplates || []
    const idx = list.findIndex((t) => t.id === templateId)
    if (idx === -1) return null

    const updated = { ...list[idx] }
    if (updates.name !== undefined) updated.name = updates.name?.trim() || updated.name
    if (updates.icon !== undefined) updated.icon = updates.icon?.trim() || updated.icon
    if (updates.description !== undefined) updated.description = updates.description?.trim() || ''
    if (updates.systemPrompt !== undefined)
      updated.systemPrompt = updates.systemPrompt?.trim() || ''
    if (updates.messages !== undefined) updated.messages = updates.messages || []

    const newList = [...list]
    newList[idx] = updated
    settings.value.customTemplates = newList
    return updated
  }

  function deleteCustomTemplate(templateId) {
    const list = settings.value.customTemplates || []
    settings.value.customTemplates = list.filter((t) => t.id !== templateId)
  }

  function getAllModels() {
    return getAllModelOptions(settings.value.customModels)
  }

  function getActiveModelConfig() {
    const modelId = settings.value.model
    const custom = getCustomModel(modelId, settings.value.customModels)
    if (custom) {
      return {
        modelId: custom.modelId,
        apiBaseUrl: custom.apiUrl || settings.value.apiBaseUrl,
      }
    }
    return {
      modelId,
      apiBaseUrl: settings.value.apiBaseUrl,
    }
  }

  return {
    settings,
    saveSettings,
    loadSettings,
    resetSettings,
    resetModelParams,
    addCustomModel,
    updateCustomModel,
    deleteCustomModel,
    getAllModels,
    getActiveModelConfig,
    addCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate,
    getAllTemplates,
    getTemplateById,
    DEFAULT_MODEL_PARAMS,
    MODEL_PARAM_BOUNDS,
    ACCENT_COLORS,
    BUILT_IN_MODELS,
    BUILT_IN_TEMPLATES,
  }
}
