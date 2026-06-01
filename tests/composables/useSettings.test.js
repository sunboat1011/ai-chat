import { describe, it, expect, beforeEach, vi } from 'vitest'

async function freshImport() {
  vi.resetModules()
  return await import('@/composables/useSettings')
}

/**
 * Create a mock fetch that simulates the backend model API.
 */
function createMockFetch() {
  let modelCounter = 1
  let models = []
  const builtinModels = [
    { id: 'claude-3-haiku', displayName: 'Claude 3 Haiku', provider: 'openai', apiBaseUrl: '', modelName: 'claude-3-haiku', isBuiltin: true, isCustom: false, isEnabled: true },
    { id: 'claude-3-sonnet', displayName: 'Claude 3 Sonnet', provider: 'openai', apiBaseUrl: '', modelName: 'claude-3-sonnet', isBuiltin: true, isCustom: false, isEnabled: true },
    { id: 'claude-3-opus', displayName: 'Claude 3 Opus', provider: 'openai', apiBaseUrl: '', modelName: 'claude-3-opus', isBuiltin: true, isCustom: false, isEnabled: true },
    { id: 'claude-3-5-sonnet', displayName: 'Claude 3.5 Sonnet', provider: 'openai', apiBaseUrl: '', modelName: 'claude-3-5-sonnet', isBuiltin: true, isCustom: false, isEnabled: true },
    { id: 'gpt-4', displayName: 'GPT-4', provider: 'openai', apiBaseUrl: '', modelName: 'gpt-4', isBuiltin: true, isCustom: false, isEnabled: true },
    { id: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', provider: 'openai', apiBaseUrl: '', modelName: 'gpt-4-turbo', isBuiltin: true, isCustom: false, isEnabled: true },
    { id: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo', provider: 'openai', apiBaseUrl: '', modelName: 'gpt-3.5-turbo', isBuiltin: true, isCustom: false, isEnabled: true },
  ]

  return vi.fn().mockImplementation(async (url, options = {}) => {
    // GET /api/models (list)
    if ((url.includes('/models') && !url.includes('/custom')) && (!options.method || options.method === 'GET')) {
      return {
        status: 200,
        json: async () => ({ code: 'SUCCESS', message: 'ok', data: [...builtinModels, ...models] }),
      }
    }

    // POST /api/models/custom (create)
    if (url.includes('/models/custom') && options.method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body
      const created = {
        id: `custom_${modelCounter++}`,
        displayName: body.displayName,
        modelId: body.modelId,
        apiBaseUrl: body.apiBaseUrl || '',
        modelName: body.modelName || body.modelId,
        provider: body.provider || 'openai',
        isBuiltin: false,
        isCustom: true,
        isEnabled: true,
      }
      models.push(created)
      return {
        status: 200,
        json: async () => ({ code: 'SUCCESS', message: 'ok', data: created }),
      }
    }

    // PUT /api/models/custom/{id} (update)
    if (url.includes('/models/custom/') && options.method === 'PUT') {
      const id = url.split('/').pop()
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body
      const idx = models.findIndex((m) => m.id === id)
      if (idx >= 0) {
        models[idx] = { ...models[idx], ...body, id }
        return {
          status: 200,
          json: async () => ({ code: 'SUCCESS', message: 'ok', data: models[idx] }),
        }
      }
      return {
        status: 404,
        json: async () => ({ code: 'NOT_FOUND', message: 'Model not found', data: null }),
      }
    }

    // DELETE /api/models/custom/{id} (delete)
    if (url.includes('/models/custom/') && options.method === 'DELETE') {
      const id = url.split('/').pop()
      models = models.filter((m) => m.id !== id)
      return {
        status: 200,
        json: async () => ({ code: 'SUCCESS', message: 'ok', data: null }),
      }
    }

    // Default fallback for other APIs (e.g. settings)
    return {
      status: 200,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: null }),
    }
  })
}

describe('composables/useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('style')
    global.fetch = createMockFetch()
  })

  describe('defaults & initialization', () => {
    it('returns the default settings when localStorage is empty', async () => {
      const { useSettings } = await freshImport()
      const { settings } = useSettings()
      expect(settings.value.theme).toBe('light')
      expect(settings.value.model).toBe('claude-3-sonnet')
      expect(settings.value.accentColor).toBe('mint')
      expect(settings.value.temperature).toBe(1.0)
      expect(settings.value.maxTokens).toBe(2048)
      expect(settings.value.topP).toBe(1.0)
      expect(settings.value.customModels).toEqual([])
      expect(settings.value.customTemplates).toEqual([])
    })

    it('applies the light theme to <html> on init', async () => {
      await freshImport()
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('loads persisted settings from localStorage', async () => {
      localStorage.setItem(
        'ai-chat-settings',
        JSON.stringify({ theme: 'dark', accentColor: 'coral', temperature: 0.5 })
      )
      const { useSettings } = await freshImport()
      const { settings } = useSettings()
      expect(settings.value.theme).toBe('dark')
      expect(settings.value.accentColor).toBe('coral')
      expect(settings.value.temperature).toBe(0.5)
      // Untouched keys fall back to defaults
      expect(settings.value.model).toBe('claude-3-sonnet')
    })

    it('applies the dark theme class when persisted theme is dark', async () => {
      localStorage.setItem('ai-chat-settings', JSON.stringify({ theme: 'dark' }))
      await freshImport()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it('falls back to defaults on corrupted JSON', async () => {
      localStorage.setItem('ai-chat-settings', '{not-json')
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { useSettings } = await freshImport()
      const { settings } = useSettings()
      expect(settings.value.theme).toBe('light')
      expect(errorSpy).toHaveBeenCalled()
    })
  })

  describe('saveSettings & persistence', () => {
    it('saveSettings merges into current state and writes to localStorage', async () => {
      const { useSettings } = await freshImport()
      const { saveSettings, settings } = useSettings()
      saveSettings({ accentColor: 'lavender', temperature: 0.7 })
      // Allow the deep watcher to flush
      await Promise.resolve()
      expect(settings.value.accentColor).toBe('lavender')
      expect(settings.value.temperature).toBe(0.7)
      // Persist immediately via watch
      await new Promise((r) => setTimeout(r, 0))
      const stored = JSON.parse(localStorage.getItem('ai-chat-settings'))
      expect(stored.accentColor).toBe('lavender')
      expect(stored.temperature).toBe(0.7)
    })

    it('switching theme toggles the html class', async () => {
      const { useSettings } = await freshImport()
      const { saveSettings } = useSettings()
      saveSettings({ theme: 'dark' })
      await new Promise((r) => setTimeout(r, 0))
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      saveSettings({ theme: 'light' })
      await new Promise((r) => setTimeout(r, 0))
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })

    it('resetSettings restores all defaults', async () => {
      const { useSettings } = await freshImport()
      const { saveSettings, resetSettings, settings } = useSettings()
      saveSettings({ theme: 'dark', temperature: 0.2 })
      resetSettings()
      expect(settings.value.theme).toBe('light')
      expect(settings.value.temperature).toBe(1.0)
    })

    it('resetModelParams restores only model-parameter defaults', async () => {
      const { useSettings } = await freshImport()
      const { saveSettings, resetModelParams, settings } = useSettings()
      saveSettings({ accentColor: 'sunshine', temperature: 0.2, maxTokens: 500, topP: 0.5 })
      resetModelParams()
      expect(settings.value.accentColor).toBe('sunshine')
      expect(settings.value.temperature).toBe(1.0)
      expect(settings.value.maxTokens).toBe(2048)
      expect(settings.value.topP).toBe(1.0)
    })
  })

  describe('custom model CRUD (backend)', () => {
    it('addCustomModel creates a model via API and refreshes the list', async () => {
      const { useSettings } = await freshImport()
      const { addCustomModel, loadModels, allModels } = useSettings()
      const created = await addCustomModel({
        name: 'My GPT',
        modelId: 'gpt-4-custom',
        apiUrl: 'https://example.com',
        apiKey: 'sk-secret',
        modelName: 'gpt-4',
        provider: 'openai',
      })
      expect(created.name).toBe('My GPT')
      expect(created.modelId).toBe('gpt-4-custom')
      // Refresh list from backend
      await loadModels()
      expect(allModels.value.some((m) => m.id === created.id)).toBe(true)
    })

    it('updateCustomModel updates via API and refreshes the list', async () => {
      const { useSettings } = await freshImport()
      const { addCustomModel, updateCustomModel, loadModels, allModels } = useSettings()
      const m = await addCustomModel({ name: 'A', modelId: 'x', apiUrl: 'https://a.com' })
      await loadModels()
      await updateCustomModel(m.id, { name: 'B', apiUrl: 'https://b.com' })
      await loadModels()
      const updated = allModels.value.find((model) => model.id === m.id)
      expect(updated.name).toBe('B')
    })

    it('updateCustomModel throws for unknown id', async () => {
      const { useSettings } = await freshImport()
      const { updateCustomModel } = useSettings()
      await expect(updateCustomModel('nope', { name: 'x' })).rejects.toThrow()
    })

    it('deleteCustomModel removes by id and falls back to default model when active', async () => {
      const { useSettings } = await freshImport()
      const { addCustomModel, deleteCustomModel, saveSettings, loadModels, allModels, settings } = useSettings()
      const m = await addCustomModel({ name: 'A', modelId: 'x' })
      await loadModels()
      saveSettings({ model: m.id })
      await deleteCustomModel(m.id)
      await loadModels()
      expect(allModels.value.some((model) => model.id === m.id)).toBe(false)
      // Model fallback happens automatically inside deleteCustomModel
      expect(settings.value.model).toBe('claude-3-sonnet')
    })

    it('getActiveModelConfig returns built-in config for non-custom models', async () => {
      const { useSettings } = await freshImport()
      const { getActiveModelConfig } = useSettings()
      const cfg = getActiveModelConfig()
      expect(cfg.modelId).toBe('claude-3-sonnet')
    })

    it('getActiveModelConfig overlays custom model fields after loading', async () => {
      const { useSettings } = await freshImport()
      const { addCustomModel, saveSettings, loadModels, getActiveModelConfig } = useSettings()
      const m = await addCustomModel({
        name: 'C',
        modelId: 'gpt-4-x',
        apiUrl: 'https://h.example/api',
        apiKey: 'sk-abc',
        modelName: 'gpt-4-real',
        provider: 'openai',
      })
      await loadModels()
      saveSettings({ model: m.id })
      const cfg = getActiveModelConfig()
      expect(cfg.modelId).toBe('gpt-4-real')
      expect(cfg.apiBaseUrl).toBe('https://h.example/api')
    })

    it('getAllModels includes built-ins and custom flagged appropriately after load', async () => {
      const { useSettings } = await freshImport()
      const { addCustomModel, getAllModels, loadModels, BUILT_IN_MODELS } = useSettings()
      await addCustomModel({ name: 'C', modelId: 'cm' })
      await loadModels()
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
