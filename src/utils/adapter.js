/**
 * Backend → Frontend data structure adapters.
 *
 * Converts backend API response formats (ISO-8601 timestamps, snake_case fields)
 * into frontend internal formats (unix ms timestamps, camelCase fields).
 */

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
    createdAt: backendConv.createdAt ? new Date(backendConv.createdAt).getTime() : Date.now(),
    updatedAt: backendConv.updatedAt ? new Date(backendConv.updatedAt).getTime() : Date.now(),
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
    timestamp: backendMsg.createdAt ? new Date(backendMsg.createdAt).getTime() : Date.now(),
    streaming: backendMsg.status === 'streaming',
  }
}
