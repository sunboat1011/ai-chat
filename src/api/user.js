/**
 * API layer — user settings endpoints.
 *
 * Uses `request()` from `@/api/request.js` for automatic token injection
 * + response unwrapping.
 */

import { request } from './request.js'

/**
 * Fetch current user settings from backend.
 *
 * @returns {Promise<Object>} SettingsResponse
 */
export async function fetchUserSettings() {
  return request('/users/me/settings')
}

/**
 * Update user settings on backend (partial update).
 *
 * Only fields that are provided will be updated; others remain unchanged.
 *
 * @param {Object} payload
 * @param {string} [payload.theme]                - Theme: 'dark' | 'light' | 'system'
 * @param {string} [payload.accentColor]          - Accent color in HEX format
 * @param {string} [payload.defaultSystemPrompt]  - Default system prompt
 * @param {number} [payload.defaultTemperature]   - Default temperature [0.0, 2.0]
 * @param {number} [payload.defaultMaxTokens]     - Default max tokens [1, 128000]
 * @param {number} [payload.defaultTopP]          - Default top-P [0.0, 1.0]
 * @param {string} [payload.defaultModelId]       - Default model ID
 * @param {string} [payload.language]             - Language code (e.g. 'zh-CN')
 * @returns {Promise<Object>} Updated SettingsResponse
 */
export async function updateUserSettings(payload) {
  return request('/users/me/settings', {
    method: 'PUT',
    body: payload,
  })
}
