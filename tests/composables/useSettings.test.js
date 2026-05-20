import { describe, it, expect, beforeEach, vi } from 'vitest'

async function freshImport() {
  vi.resetModules()
  return await import('@/composables/useSettings')
}

describe('composables/useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('style')
  })

  describe('defaults & initialization', () => {
    it('returns the default settings when localStorage is empty', async () => {
      const { useSettings } = await freshImport()
      const { settings } = useSettings()
      expect(settings.value.theme).toBe('dark')
      expect(settings.value.model).toBe('claude-3-sonnet')
      expect(settings.value.accentColor).toBe('green')
      expect(settings.value.temperature).toBe(1.0)
      expect(settings.value.maxTokens).toBe(2048)
      expect(settings.value.topP).toBe(1.0)
      expect(settings.value.customModels).toEqual([])
      expect(settings.value.customTemplates).toEqual([])
    })

    it('applies the dark theme to <html> on init', async () => {
      await freshImport()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('loads persisted settings from localStorage', async () => {
      localStorage.setItem(
        'ai-chat-settings',
        JSON.stringify({ theme: 'light', accentColor: 'blue', temperature: 0.5 })
      )
      const { useSettings } = await freshImport()
      const { settings } = useSettings()
      expect(settings.value.theme).toBe('light')
      expect(settings.value.accentColor).toBe('blue')
      expect(settings.value.temperature).toBe(0.5)
      // Untouched keys fall back to defaults
      expect(settings.value.model).toBe('claude-3-sonnet')
    })

    it('applies the light theme class when persisted theme is light', async () => {
      localStorage.setItem('ai-chat-settings', JSON.stringify({ theme: 'light' }))
      await freshImport()
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('falls back to defaults on corrupted JSON', async () => {
      localStorage.setItem('ai-chat-settings', '{not-json')
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { useSettings } = await freshImport()
      const { settings } = useSettings()
      expect(settings.value.theme).toBe('dark')
      expect(errorSpy).toHaveBeenCalled()
    })
  })

  describe('saveSettings & persistence', () => {
    it('saveSettings merges into current state and writes to localStorage', async () => {
      const { useSettings } = await freshImport()
      const { saveSettings, settings } = useSettings()
      saveSettings({ accentColor: 'purple', temperature: 0.7 })
      // Allow the deep watcher to flush
      await Promise.resolve()
      expect(settings.value.accentColor).toBe('purple')
      expect(settings.value.temperature).toBe(0.7)
      // Persist immediately via watch
      await new Promise((r) => setTimeout(r, 0))
      const stored = JSON.parse(localStorage.getItem('ai-chat-settings'))
      expect(stored.accentColor).toBe('purple')
      expect(stored.temperature).toBe(0.7)
    })

    it('switching theme toggles the html class', async () => {
      const { useSettings } = await freshImport()
      const { saveSettings } = useSettings()
      saveSettings({ theme: 'light' })
      await new Promise((r) => setTimeout(r, 0))
      expect(document.documentElement.classList.contains('light')).toBe(true)
      saveSettings({ theme: 'dark' })
      await new Promise((r) => setTimeout(r, 0))
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('resetSettings restores all defaults', async () => {
      const { useSettings } = await freshImport()
      const { saveSettings, resetSettings, settings } = useSettings()
      saveSettings({ theme: 'light', temperature: 0.2 })
      resetSettings()
      expect(settings.value.theme).toBe('dark')
      expect(settings.value.temperature).toBe(1.0)
    })

    it('resetModelParams restores only model-parameter defaults', async () => {
      const { useSettings } = await freshImport()
      const { saveSettings, resetModelParams, settings } = useSettings()
      saveSettings({ accentColor: 'red', temperature: 0.2, maxTokens: 500, topP: 0.5 })
      resetModelParams()
      expect(settings.value.accentColor).toBe('red')
      expect(settings.value.temperature).toBe(1.0)
      expect(settings.value.maxTokens).toBe(2048)
      expect(settings.value.topP).toBe(1.0)
    })
  })

  describe('custom model CRUD', () => {
    it('addCustomModel appends a model and base64-encodes the API key', async () => {
      const { useSettings } = await freshImport()
      const { addCustomModel, settings } = useSettings()
      const created = addCustomModel({
        name: 'My GPT',
        modelId: 'gpt-4-custom',
        apiUrl: 'https://example.com',
        apiKey: 'sk-secret',
      })
      expect(settings.value.customModels).toHaveLength(1)
      expect(created.name).toBe('My GPT')
      expect(created.modelId).toBe('gpt-4-custom')
      expect(created.apiKey).toBe(btoa('sk-secret'))
      expect(created.apiKey).not.toBe('sk-secret')
    })

    it('updateCustomModel changes specific fields and re-encodes the key', async () => {
      const { useSettings } = await freshImport()
      const { addCustomModel, updateCustomModel, settings } = useSettings()
      const m = addCustomModel({ name: 'A', modelId: 'x', apiKey: 'k1' })
      updateCustomModel(m.id, { name: 'B', apiKey: 'k2' })
      const stored = settings.value.customModels[0]
      expect(stored.name).toBe('B')
      expect(stored.apiKey).toBe(btoa('k2'))
    })

    it('updateCustomModel returns null for unknown id', async () => {
      const { useSettings } = await freshImport()
      const { updateCustomModel } = useSettings()
      expect(updateCustomModel('nope', { name: 'x' })).toBeNull()
    })

    it('deleteCustomModel removes by id and falls back to default model when active', async () => {
      const { useSettings } = await freshImport()
      const { addCustomModel, deleteCustomModel, saveSettings, settings } = useSettings()
      const m = addCustomModel({ name: 'A', modelId: 'x' })
      saveSettings({ model: m.id })
      deleteCustomModel(m.id)
      expect(settings.value.customModels).toHaveLength(0)
      expect(settings.value.model).toBe('claude-3-sonnet')
    })

    it('getActiveModelConfig returns built-in config for non-custom models', async () => {
      const { useSettings } = await freshImport()
      const { getActiveModelConfig } = useSettings()
      const cfg = getActiveModelConfig()
      expect(cfg.model).toBe('claude-3-sonnet')
      expect(cfg.apiKey).toBe('')
    })

    it('getActiveModelConfig overlays custom model fields and decodes API key', async () => {
      const { useSettings } = await freshImport()
      const { addCustomModel, saveSettings, getActiveModelConfig } = useSettings()
      const m = addCustomModel({
        name: 'C',
        modelId: 'gpt-4-x',
        apiUrl: 'https://h.example/api',
        apiKey: 'sk-abc',
      })
      saveSettings({ model: m.id })
      const cfg = getActiveModelConfig()
      expect(cfg.model).toBe('gpt-4-x')
      expect(cfg.apiBaseUrl).toBe('https://h.example/api')
      expect(cfg.apiKey).toBe('sk-abc')
    })

    it('getAllModels includes built-ins and custom flagged appropriately', async () => {
      const { useSettings } = await freshImport()
      const { addCustomModel, getAllModels, BUILT_IN_MODELS } = useSettings()
      addCustomModel({ name: 'C', modelId: 'cm' })
      const all = getAllModels()
      expect(all.length).toBe(BUILT_IN_MODELS.length + 1)
      expect(all.find((m) => m.builtIn === false)).toBeTruthy()
    })
  })

  describe('custom template CRUD', () => {
    it('addCustomTemplate appends to the list', async () => {
      const { useSettings } = await freshImport()
      const { addCustomTemplate, settings } = useSettings()
      const t = addCustomTemplate({
        name: 'My role',
        icon: '🎯',
        description: 'do something',
        systemPrompt: 'You are X',
      })
      expect(t.builtIn).toBe(false)
      expect(settings.value.customTemplates).toHaveLength(1)
      expect(settings.value.customTemplates[0].name).toBe('My role')
    })

    it('updateCustomTemplate edits the matching record', async () => {
      const { useSettings } = await freshImport()
      const { addCustomTemplate, updateCustomTemplate, settings } = useSettings()
      const t = addCustomTemplate({ name: 'X', systemPrompt: 'p' })
      updateCustomTemplate(t.id, { name: 'Y', systemPrompt: 'q' })
      expect(settings.value.customTemplates[0].name).toBe('Y')
      expect(settings.value.customTemplates[0].systemPrompt).toBe('q')
    })

    it('deleteCustomTemplate removes by id', async () => {
      const { useSettings } = await freshImport()
      const { addCustomTemplate, deleteCustomTemplate, settings } = useSettings()
      const t = addCustomTemplate({ name: 'X' })
      deleteCustomTemplate(t.id)
      expect(settings.value.customTemplates).toHaveLength(0)
    })

    it('getAllTemplates merges built-in and custom templates', async () => {
      const { useSettings } = await freshImport()
      const { addCustomTemplate, getAllTemplates, BUILT_IN_TEMPLATES } = useSettings()
      addCustomTemplate({ name: 'extra' })
      const all = getAllTemplates()
      expect(all).toHaveLength(BUILT_IN_TEMPLATES.length + 1)
      expect(all.find((t) => t.name === 'extra')).toBeTruthy()
    })

    it('getTemplateById finds built-in by id', async () => {
      const { useSettings } = await freshImport()
      const { getTemplateById } = useSettings()
      const tpl = getTemplateById('builtin-general')
      expect(tpl).toBeDefined()
      expect(tpl.name).toBe('General Assistant')
    })
  })
})
