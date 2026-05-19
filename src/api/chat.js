const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

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
export function streamChat({ apiBaseUrl, model, message, systemPrompt, conversationId, temperature, maxTokens, topP, onChunk, onDone, onError }) {
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

  fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${errText}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      const processStream = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            onDone?.(fullText)
            return
          }

          const chunk = decoder.decode(value, { stream: true })
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
      }

      processStream()
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err)
      }
    })

  return controller
}

/**
 * Fetch conversation history from the backend.
 */
export async function fetchConversation(conversationId) {
  const res = await fetch(`${API_BASE}/conversation/${conversationId}`)
  if (!res.ok) throw new Error(`Failed to fetch conversation: ${res.status}`)
  return res.json()
}

/**
 * List all conversations.
 */
export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/conversations`)
  if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.status}`)
  return res.json()
}

/**
 * Create a new conversation.
 */
export async function createConversation(title = 'New Chat') {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`)
  return res.json()
}

/**
 * Delete a conversation.
 */
export async function deleteConversation(conversationId) {
  const res = await fetch(`${API_BASE}/conversation/${conversationId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`)
  return res.json()
}

/**
 * Rename a conversation.
 */
export async function renameConversation(conversationId, title) {
  const res = await fetch(`${API_BASE}/conversation/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error(`Failed to rename conversation: ${res.status}`)
  return res.json()
}
