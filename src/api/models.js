/**
 * API layer — model configuration endpoints.
 *
 * Uses `request()` from `@/api/request.js` for automatic token injection
 * + response unwrapping.
 */

import { request } from './request.js'

/**
 * Fetch the list of available models (built-in + custom).
 *
 * @returns {Promise<Array>} Array of ModelResponse
 */
export async function fetchModels() {
  return request('/models')
}

/**
 * Create a custom model configuration.
 *
 * @param {Object} payload
 * @param {string} payload.displayName   - Display name
 * @param {string} payload.modelId       - Model unique identifier
 * @param {string} payload.apiBaseUrl    - API base URL
 * @param {string} [payload.apiKey]      - API key (optional)
 * @param {string} payload.modelName     - Actual model name for SDK
 * @param {string} payload.provider      - Provider type
 * @returns {Promise<Object>} ModelResponse
 */
export async function createCustomModel(payload) {
  return request('/models/custom', {
    method: 'POST',
    body: payload,
  })
}

/**
 * Update a custom model configuration.
 *
 * @param {string} id                    - Custom model ID
 * @param {Object} payload
 * @param {string} payload.displayName   - Display name
 * @param {string} payload.apiBaseUrl    - API base URL
 * @param {string} [payload.apiKey]      - API key (optional)
 * @param {string} payload.modelName     - Actual model name for SDK
 * @param {string} payload.provider      - Provider type
 * @returns {Promise<Object>} Updated ModelResponse
 */
export async function updateCustomModel(id, payload) {
  return request(`/models/custom/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

/**
 * Delete a custom model configuration.
 *
 * @param {string} id - Custom model ID
 * @returns {Promise<null>}
 */
export async function deleteCustomModel(id) {
  return request(`/models/custom/${id}`, { method: 'DELETE' })
}
