/**
 * Data migration API — upload localStorage data to the backend.
 *
 * Triggered after first login when local data is detected.
 */

import { request } from './request.js'
import { loadConversations, loadAllDrafts } from '@/utils/storage.js'
import { toBackendConversation, toBackendMessage } from '@/utils/adapter.js'

const SETTINGS_KEY = 'ai-chat-settings'

const ACCENT_COLORS = {
  mint: '#19c8b9',
  coral: '#e59266',
  lavender: '#b77dee',
  sunshine: '#f7cd67',
}

function loadLocalSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Migrate localStorage conversations, settings, and drafts to the backend.
 *
 * @returns {Promise<{importedConversations: number, importedMessages: number, importedModels: number}>}
 */
export async function migrateLocalData() {
  const conversations = loadConversations()
  const settings = loadLocalSettings()
  const drafts = loadAllDrafts()

  const payload = {
    conversations: conversations.map((conv) => ({
      ...toBackendConversation(conv),
      messages: (conv.messages || []).map((msg) => toBackendMessage(msg)),
    })),
    settings: settings
      ? {
          theme: settings.theme || 'light',
          accentColor: ACCENT_COLORS[settings.accentColor] || settings.accentColor || '#19c8b9',
          defaultSystemPrompt: settings.defaultSystemPrompt || '',
          defaultTemperature: settings.temperature ?? 1.0,
          defaultMaxTokens: settings.maxTokens ?? 2048,
          defaultTopP: settings.topP ?? 1.0,
          defaultModelId: settings.model || '',
          language: 'zh-CN',
        }
      : undefined,
    drafts,
  }

  return request('/users/migrate', {
    method: 'POST',
    body: payload,
  })
}

/**
 * Check whether local conversation data exists.
 * Used to decide whether to show the migration prompt on login.
 *
 * @returns {boolean}
 */
export function hasLocalData() {
  const conversations = loadConversations()
  return conversations.length > 0
}
