import { t } from '@/composables/useText'
import { showError, showWarning } from '@/composables/useErrorToast'
import { trackError } from '@/composables/useAnalytics'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Translate a fetch / HTTP error into a user-facing message.
 * Network errors (TypeError, AbortError-not-included) and HTTP non-2xx are normalized here.
 */
function describeError(err, context = {}) {
  // Network-level failure: fetch throws TypeError on connection refusal,
  // DNS failure, CORS preflight failure, etc.
  if (err instanceof TypeError) {
    const msg = String(err.message || '').toLowerCase()
    if (msg.includes('cors')) {
      return t('errors.cors')
    }
    return t('errors.networkFailed')
  }

  // HTTP errors carry a `status` property attached below.
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
 * Wrap a fetch call so that non-2xx responses throw with a `.status` property
 * and the result can be uniformly handled by callers.
 */
async function fetchWithStatus(url, init) {
  let res
  try {
    res = await fetch(url, init)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    // Re-throw network errors with normalized shape
    const wrapped = new Error(describeError(err))
    wrapped.cause = err
    wrapped.isNetworkError = true
    throw wrapped
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    const wrapped = new Error(`HTTP ${res.status}: ${errText}`)
    wrapped.status = res.status
    wrapped.friendlyMessage = describeError(wrapped, { status: res.status })
    throw wrapped
  }
  return res
}

/**
 * Send a message to the AI backend with SSE streaming.
 *
 * @param {Object}   options
 * @param {string}   options.message    - User message content
 * @param {string}   options.conversationId - Existing conversation ID (optional for new chat)
 * @param {Function} options.onChunk    - Called with each text chunk as it arrives
 * @param {Function} options.onDone     - Called when the stream finishes (receives full response)
 * @param {Function} options.onError    - Called on network / parse error
 * @returns {AbortController} - Call .abort() on this to cancel the request
 */
export function streamChat({
  apiBaseUrl,
  apiKey,
  model,
  message,
  systemPrompt,
  conversationId,
  temperature,
  maxTokens,
  topP,
  onChunk,
  onDone,
  onError,
}) {
  const API_BASE = apiBaseUrl || import.meta.env.VITE_API_BASE_URL || '/api'
  const controller = new AbortController()

  const body = { message, conversationId, model }
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

  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  let receivedAny = false

  fetch(`${API_BASE}/chat`, {
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
 * Fetch conversation history from the backend.
 */
export async function fetchConversation(conversationId) {
  try {
    const res = await fetchWithStatus(`${API_BASE}/conversation/${conversationId}`)
    return await res.json()
  } catch (err) {
    if (err.name !== 'AbortError') {
      showError(err.friendlyMessage || err.message || t('errors.unknownError'))
    }
    throw err
  }
}

/**
 * List all conversations.
 */
export async function fetchConversations() {
  try {
    const res = await fetchWithStatus(`${API_BASE}/conversations`)
    return await res.json()
  } catch (err) {
    if (err.name !== 'AbortError') {
      showError(err.friendlyMessage || err.message || t('errors.unknownError'))
    }
    throw err
  }
}

/**
 * Create a new conversation.
 */
export async function createConversation(title = 'New Chat') {
  try {
    const res = await fetchWithStatus(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    return await res.json()
  } catch (err) {
    if (err.name !== 'AbortError') {
      showError(err.friendlyMessage || err.message || t('errors.unknownError'))
    }
    throw err
  }
}

/**
 * Delete a conversation.
 */
export async function deleteConversation(conversationId) {
  try {
    const res = await fetchWithStatus(`${API_BASE}/conversation/${conversationId}`, {
      method: 'DELETE',
    })
    return await res.json()
  } catch (err) {
    if (err.name !== 'AbortError') {
      showError(err.friendlyMessage || err.message || t('errors.unknownError'))
    }
    throw err
  }
}

/**
 * Rename a conversation.
 */
export async function renameConversation(conversationId, title) {
  try {
    const res = await fetchWithStatus(`${API_BASE}/conversation/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    return await res.json()
  } catch (err) {
    if (err.name !== 'AbortError') {
      showError(err.friendlyMessage || err.message || t('errors.unknownError'))
    }
    throw err
  }
}
