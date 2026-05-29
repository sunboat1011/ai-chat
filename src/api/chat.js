/**
 * API layer — chat and conversation endpoints.
 *
 * Non-SSE JSON calls use `request()` from `@/api/request.js` for automatic
 * token injection + response unwrapping.
 *
 * SSE streaming (`streamChat`) keeps using raw `fetch` because it reads
 * `response.body.getReader()`; it manually attaches the Authorization header.
 */

import { request } from './request.js'
import { getToken } from '@/utils/token.js'
import { t } from '@/composables/useText'
import { showError, showWarning } from '@/composables/useErrorToast'
import { trackError } from '@/composables/useAnalytics'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Translate a fetch / HTTP error into a user-facing message.
 * Used only for the raw-fetch SSE path (`streamChat`).
 */
function describeError(err, context = {}) {
  if (err instanceof TypeError) {
    const msg = String(err.message || '').toLowerCase()
    if (msg.includes('cors')) {
      return t('errors.cors')
    }
    return t('errors.networkFailed')
  }

  const status = context.status || err.status
  if (status === 401) return t('errors.unauthorized')
  if (status === 403) return t('errors.forbidden')
  if (status === 404) return t('errors.notFound')
  if (status === 429) return t('errors.rateLimited')
  if (status === 503) return t('errors.serviceUnavailable')
  if (status >= 500) return t('errors.serverError', { status })
  if (status >= 400) return t('errors.httpGeneric', { status })

  return err?.message || t('errors.unknownError')
}

/**
 * Send a message to the AI backend with SSE streaming.
 *
 * @param {Object}   options
 * @param {string}   options.message         - User message content
 * @param {string}   options.conversationId  - Existing conversation ID
 * @param {string}   options.modelId         - Model ID to use
 * @param {string}   [options.systemPrompt]  - System prompt override
 * @param {number}   [options.temperature]   - Sampling temperature
 * @param {number}   [options.maxTokens]     - Max tokens to generate
 * @param {number}   [options.topP]          - Top-P sampling
 * @param {Function} [options.onChunk]       - Called with each text chunk
 * @param {Function} [options.onDone]        - Called when stream finishes
 * @param {Function} [options.onError]       - Called on network / parse error
 * @returns {AbortController} - Call .abort() to cancel the request
 */
export function streamChat({
  message,
  conversationId,
  modelId,
  systemPrompt,
  temperature,
  maxTokens,
  topP,
  onChunk,
  onDone,
  onError,
}) {
  const controller = new AbortController()

  const body = { conversationId, message, modelId }
  if (systemPrompt && systemPrompt.trim()) {
    body.systemPrompt = systemPrompt.trim()
  }
  if (temperature !== undefined && temperature !== null) {
    body.temperature = temperature
  }
  if (maxTokens !== undefined && maxTokens !== null) {
    body.maxTokens = maxTokens
  }
  if (topP !== undefined && topP !== null) {
    body.topP = topP
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let receivedAny = false

  fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        const err = new Error(`HTTP ${res.status}: ${errText}`)
        err.status = res.status
        err.friendlyMessage = describeError(err, { status: res.status })
        throw err
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      const processStream = () => {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              onDone?.(fullText)
              return
            }

            const chunk = decoder.decode(value, { stream: true })
            receivedAny = receivedAny || chunk.length > 0
            // Parse SSE lines: data: ...\n\n
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') {
                  onDone?.(fullText)
                  return
                }
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content ?? parsed.content ?? ''
                  if (content) {
                    fullText += content
                    onChunk?.(content, fullText)
                  }
                } catch {
                  // Raw text mode — append directly
                  if (data) {
                    fullText += data
                    onChunk?.(data, fullText)
                  }
                }
              }
            }

            processStream()
          })
          .catch((err) => {
            if (err.name === 'AbortError') return
            // Stream interrupted mid-flight — preserve partial content.
            showWarning(t('errors.streamInterrupted'))
            trackError('api', { message: 'stream_interrupted', status: err.status })
            const wrapped = new Error(t('errors.streamInterrupted'))
            wrapped.cause = err
            wrapped.partialText = fullText
            onError?.(wrapped)
          })
      }

      processStream()
    })
    .catch((err) => {
      if (err.name === 'AbortError') return
      let friendly
      if (err.friendlyMessage) {
        friendly = err.friendlyMessage
      } else if (err instanceof TypeError) {
        friendly = describeError(err)
      } else {
        friendly = err.message || t('errors.unknownError')
      }
      showError(friendly)
      trackError('api', { message: friendly, status: err.status })
      const wrapped = new Error(friendly)
      wrapped.cause = err
      wrapped.status = err.status
      onError?.(wrapped)
    })

  return controller
}

/**
 * List conversations (paginated).
 *
 * @param {number} [page=0] - Page number (0-based)
 * @param {number} [size=20] - Page size
 * @returns {Promise<{content: Array, page: number, size: number, totalElements: number, totalPages: number, hasNext: boolean}>}
 */
export async function fetchConversations(page = 0, size = 20) {
  return request(`/conversations?page=${page}&size=${size}`)
}

/**
 * Create a new conversation.
 *
 * @param {Object} params
 * @param {string} [params.title]        - Conversation title
 * @param {string} [params.systemPrompt] - System prompt
 * @param {string} [params.modelId]      - Model ID
 * @param {number} [params.temperature]  - Temperature
 * @param {number} [params.maxTokens]    - Max tokens
 * @param {number} [params.topP]         - Top-P
 * @returns {Promise<Object>} ConversationResponse
 */
export async function createConversation(params = {}) {
  const body = {}
  if (params.title !== undefined) body.title = params.title
  if (params.systemPrompt !== undefined) body.systemPrompt = params.systemPrompt
  if (params.modelId !== undefined) body.modelId = params.modelId
  if (params.temperature !== undefined) body.temperature = params.temperature
  if (params.maxTokens !== undefined) body.maxTokens = params.maxTokens
  if (params.topP !== undefined) body.topP = params.topP

  return request('/conversations', { method: 'POST', body })
}

/**
 * Get a single conversation with its messages.
 *
 * @param {string} conversationId
 * @param {number} [page=0] - Message page number
 * @param {number} [size=50] - Messages per page
 * @returns {Promise<{conversation: Object, messages: Object}>}
 */
export async function fetchConversation(conversationId, page = 0, size = 50) {
  return request(`/conversations/${conversationId}?page=${page}&size=${size}`)
}

/**
 * Rename (update) a conversation.
 *
 * @param {string} conversationId
 * @param {string} title - New title
 * @returns {Promise<Object>} Updated ConversationResponse
 */
export async function renameConversation(conversationId, title) {
  return request(`/conversations/${conversationId}`, {
    method: 'PUT',
    body: { title },
  })
}

/**
 * Delete a conversation.
 *
 * @param {string} conversationId
 * @returns {Promise<null>}
 */
export async function deleteConversation(conversationId) {
  return request(`/conversations/${conversationId}`, { method: 'DELETE' })
}
