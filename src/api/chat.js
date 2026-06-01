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
 * Shared SSE stream parser for streamChat and streamRegenerate.
 * Reads a ReadableStream, parses `event: message` / `data: ...` lines,
 * and calls the provided callbacks.
 *
 * @param {ReadableStreamDefaultReader} reader
 * @param {Function} [onChunk]  - (chunkText, fullText) => void
 * @param {Function} [onDone]   - (fullText) => void
 * @param {Function} [onError]  - (err, fullText) => void
 */
function parseSSEStream(reader, onChunk, onDone, onError) {
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  const processChunk = () => {
    reader
      .read()
      .then(({ done, value }) => {
        if (done) {
          // Process any remaining buffered event before closing
          if (buffer.trim()) {
            parseEvent(buffer)
          }
          onDone?.(fullText)
          return
        }

        buffer += decoder.decode(value, { stream: true })
        // Normalize \r\n → \n so event splitting is consistent
        buffer = buffer.replace(/\r\n/g, '\n')

        // SSE events are separated by two consecutive newlines
        while (true) {
          const eventEnd = buffer.indexOf('\n\n')
          if (eventEnd === -1) break

          const event = buffer.slice(0, eventEnd)
          buffer = buffer.slice(eventEnd + 2)
          parseEvent(event)
        }

        processChunk()
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        onError?.(err, fullText)
      })
  }

  function parseEvent(event) {
    const lines = event.split('\n')
    const dataLines = []

    for (const line of lines) {
      // Support both 'data: <value>' (with space, per spec) and 'data:<value>'
      // (without space, as Spring SseEmitter sends by default).
      if (line.startsWith('data:')) {
        let value = line.slice(5)
        // SSE spec: only the first space after 'data:' is a field separator,
        // not part of the value. Do NOT trim all leading whitespace — that
        // would destroy code indentation (leading spaces/tabs inside the data).
        if (value.startsWith(' ')) {
          value = value.slice(1)
        }
        dataLines.push(value)
      }
    }

    if (dataLines.length === 0) return

    // Multiple data: lines inside one event are joined with a single \n per spec
    const data = dataLines.join('\n')

    if (data === '[DONE]') {
      onDone?.(fullText)
      return
    }

    try {
      const parsed = JSON.parse(data)

      // Spring SseEmitter serializes plain strings as JSON (e.g. data:"hello").
      // After JSON.parse we get a JS string, not an object — use it directly.
      if (typeof parsed === 'string') {
        if (parsed) {
          fullText += parsed
          onChunk?.(parsed, fullText)
        }
        return
      }

      // Try multiple common field paths (OpenAI-style, direct content, text, etc.)
      const content =
        parsed.choices?.[0]?.delta?.content ??
        parsed.choices?.[0]?.text ??
        parsed.delta?.content ??
        parsed.content ??
        parsed.text ??
        parsed.message ??
        ''

      if (content) {
        fullText += content
        onChunk?.(content, fullText)
      }
    } catch {
      // Raw text mode — append directly (preserve spaces, newlines, etc.)
      fullText += data
      onChunk?.(data, fullText)
    }
  }

  processChunk()
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

  fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        // Try unified JSON format first (backend contract: { code, message, data })
        let friendlyMessage
        try {
          const result = await res.json()
          if (result.code !== 'SUCCESS' && result.message) {
            friendlyMessage = result.message
          }
        } catch {
          // Not JSON — ignore, will fall back below
        }

        if (!friendlyMessage) {
          const errText = await res.text().catch(() => '')
          const err = new Error(`HTTP ${res.status}: ${errText}`)
          err.status = res.status
          friendlyMessage = describeError(err, { status: res.status })
        }

        const err = new Error(friendlyMessage)
        err.status = res.status
        err.friendlyMessage = friendlyMessage
        throw err
      }

      const reader = res.body.getReader()

      parseSSEStream(
        reader,
        (chunk, fullText) => {
          onChunk?.(chunk, fullText)
        },
        (fullText) => {
          onDone?.(fullText)
        },
        (err, fullText) => {
          // Stream interrupted mid-flight — preserve partial content.
          showWarning(t('errors.streamInterrupted'))
          trackError('api', { message: 'stream_interrupted', status: err.status })
          const wrapped = new Error(t('errors.streamInterrupted'))
          wrapped.cause = err
          wrapped.partialText = fullText
          onError?.(wrapped)
        }
      )
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
 * Regenerate an AI response via SSE streaming.
 *
 * @param {Object}   options
 * @param {string}   options.conversationId  - Conversation ID
 * @param {string}   options.messageId       - The assistant message ID to regenerate
 * @param {Function} [options.onChunk]       - Called with each text chunk
 * @param {Function} [options.onDone]        - Called when stream finishes
 * @param {Function} [options.onError]       - Called on network / parse error
 * @returns {AbortController} - Call .abort() to cancel the request
 */
export function streamRegenerate({ conversationId, messageId, onChunk, onDone, onError }) {
  const controller = new AbortController()

  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  fetch(`${API_BASE}/conversations/${conversationId}/messages/${messageId}/regenerate`, {
    method: 'POST',
    headers,
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        // Try unified JSON format first (backend contract: { code, message, data })
        let friendlyMessage
        try {
          const result = await res.json()
          if (result.code !== 'SUCCESS' && result.message) {
            friendlyMessage = result.message
          }
        } catch {
          // Not JSON — ignore, will fall back below
        }

        if (!friendlyMessage) {
          const errText = await res.text().catch(() => '')
          const err = new Error(`HTTP ${res.status}: ${errText}`)
          err.status = res.status
          friendlyMessage = describeError(err, { status: res.status })
        }

        const err = new Error(friendlyMessage)
        err.status = res.status
        err.friendlyMessage = friendlyMessage
        throw err
      }

      const reader = res.body.getReader()

      parseSSEStream(
        reader,
        (chunk, fullText) => {
          onChunk?.(chunk, fullText)
        },
        (fullText) => {
          onDone?.(fullText)
        },
        (err, fullText) => {
          showWarning(t('errors.streamInterrupted'))
          trackError('api', { message: 'stream_regenerate_interrupted', status: err.status })
          const wrapped = new Error(t('errors.streamInterrupted'))
          wrapped.cause = err
          wrapped.partialText = fullText
          onError?.(wrapped)
        }
      )
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
 * Update a conversation (title and/or systemPrompt).
 *
 * @param {string} conversationId
 * @param {Object} payload
 * @param {string} [payload.title] - New title
 * @param {string} [payload.systemPrompt] - New system prompt
 * @returns {Promise<Object>} Updated ConversationResponse
 */
export async function updateConversation(conversationId, payload = {}) {
  const body = {}
  if (payload.title !== undefined) body.title = payload.title
  if (payload.systemPrompt !== undefined) body.systemPrompt = payload.systemPrompt

  return request(`/conversations/${conversationId}`, {
    method: 'PUT',
    body,
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

/**
 * Delete a message.
 *
 * @param {string} messageId
 * @returns {Promise<null>}
 */
export async function deleteMessage(messageId) {
  return request(`/messages/${messageId}`, { method: 'DELETE' })
}

/**
 * Restore a deleted message.
 *
 * @param {string} messageId
 * @returns {Promise<Object>} MessageResponse
 */
export async function restoreMessage(messageId) {
  return request(`/messages/${messageId}/restore`, { method: 'POST' })
}
