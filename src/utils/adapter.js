/**
 * Backend ↔ Frontend data structure adapters.
 *
 * Converts backend API response formats (ISO-8601 timestamps, camelCase fields)
 * into frontend internal formats (unix ms timestamps, camelCase fields).
 */

import { parseISOTime, toISOTime } from './time.js'

/**
 * Adapt a backend ConversationResponse to the frontend internal format.
 *
 * @param {Object} backendConv - Backend conversation object
 * @returns {Object} Frontend conversation object
 */
export function adaptConversation(backendConv) {
  return {
    id: backendConv.id,
    title: backendConv.title,
    systemPrompt: backendConv.systemPrompt || '',
    modelId: backendConv.modelId,
    temperature: backendConv.temperature,
    maxTokens: backendConv.maxTokens,
    topP: backendConv.topP,
    createdAt: parseISOTime(backendConv.createdAt),
    updatedAt: parseISOTime(backendConv.updatedAt),
    messages: backendConv.messages || [], // List endpoint may not include messages
  }
}

/**
 * Adapt a backend MessageResponse to the frontend internal format.
 *
 * @param {Object} backendMsg - Backend message object
 * @returns {Object} Frontend message object
 */
export function adaptMessage(backendMsg) {
  return {
    id: backendMsg.id,
    role: backendMsg.role,
    content: backendMsg.content,
    modelId: backendMsg.modelId,
    status: backendMsg.status,
    timestamp: parseISOTime(backendMsg.createdAt),
    streaming: backendMsg.status === 'streaming',
  }
}

/**
 * Convert a frontend conversation object to backend request format.
 * Used for data migration (POST /api/users/migrate).
 *
 * @param {Object} frontendConv - Frontend conversation object
 * @returns {Object} Backend MigrateConversation format
 */
export function toBackendConversation(frontendConv) {
  return {
    id: frontendConv.id,
    title: frontendConv.title,
    systemPrompt: frontendConv.systemPrompt || '',
    modelId: frontendConv.modelId || '',
    temperature: frontendConv.temperature,
    maxTokens: frontendConv.maxTokens,
    topP: frontendConv.topP,
    createdAt: toISOTime(frontendConv.createdAt),
    updatedAt: toISOTime(frontendConv.updatedAt),
  }
}

/**
 * Convert a frontend message object to backend request format.
 * Used for data migration (POST /api/users/migrate).
 *
 * @param {Object} frontendMsg - Frontend message object
 * @returns {Object} Backend MigrateMessage format
 */
export function toBackendMessage(frontendMsg) {
  return {
    id: frontendMsg.id,
    role: frontendMsg.role,
    content: frontendMsg.content,
    modelId: frontendMsg.modelId || '',
    status: frontendMsg.streaming ? 'streaming' : (frontendMsg.status || 'done'),
    createdAt: toISOTime(frontendMsg.timestamp),
  }
}
