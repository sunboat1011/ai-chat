import { ref } from 'vue'
import { streamChat } from '@/api/chat'
import { loadConversations, saveConversations, generateId, clearDraft } from '@/utils/storage'
import { useSettings } from '@/composables'
import { track } from '@/utils/analytics'

/**
 * Composable that manages chat state: conversations, messages, streaming.
 *
 * NOTE: In production you'd use a state-management library (Pinia).
 * For simplicity this composable uses reactive refs.
 */
export function useChat() {
  const { settings, getActiveModelConfig } = useSettings()
  const conversations = ref(loadConversations())
  const activeConversation = ref(null)
  const messages = ref([])
  const isLoading = ref(false)
  const abortController = ref(null)

  // ─── Delete undo ───
  const lastDeleted = ref(null)
  let undoTimer = null

  // ─── Initialize ───
  function init() {
    let needsSave = false
    for (const conv of conversations.value) {
      // Migrate old conversations: add systemPrompt field if missing
      if (!('systemPrompt' in conv)) {
        conv.systemPrompt = ''
        needsSave = true
      }
      // Migrate: ensure all messages have timestamps
      if (conv.messages && conv.messages.length > 0) {
        conv.messages.forEach((msg, idx) => {
          if (!msg.timestamp) {
            msg.timestamp = (conv.updatedAt || conv.createdAt || Date.now()) + idx * 1000
            needsSave = true
          }
        })
      }
      // Migrate: ensure updatedAt exists
      if (!conv.updatedAt) {
        const lastMsg = conv.messages?.[conv.messages.length - 1]
        conv.updatedAt = lastMsg?.timestamp || conv.createdAt || Date.now()
        needsSave = true
      }
    }
    if (needsSave) {
      saveConversations(conversations.value)
    }
    if (!activeConversation.value && conversations.value.length > 0) {
      setActiveConversation(conversations.value[0].id)
    }
  }

  // ─── Conversation Management ───
  function setActiveConversation(id) {
    activeConversation.value = id
    const conv = conversations.value.find((c) => c.id === id)
    messages.value = conv ? conv.messages : []
  }

  function createNewConversation(systemPrompt = '') {
    const id = generateId()
    const prompt = systemPrompt || settings.value.defaultSystemPrompt || ''
    const conv = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      systemPrompt: prompt,
    }
    conversations.value.unshift(conv)
    saveConversations(conversations.value)
    setActiveConversation(id)
    return conv
  }

  function createConversationFromTemplate(template) {
    const id = generateId()
    const prompt = template.systemPrompt || settings.value.defaultSystemPrompt || ''
    const initialMessages = (template.messages || []).map((m) => ({
      id: generateId(),
      role: m.role,
      content: m.content,
      timestamp: Date.now(),
    }))
    const title = template.name || 'New Chat'
    const conv = {
      id,
      title,
      messages: initialMessages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      systemPrompt: prompt,
    }
    conversations.value.unshift(conv)
    saveConversations(conversations.value)
    setActiveConversation(id)
    return conv
  }

  function deleteConversation(id) {
    conversations.value = conversations.value.filter((c) => c.id !== id)
    saveConversations(conversations.value)
    clearDraft(id)
    if (activeConversation.value === id) {
      activeConversation.value = conversations.value[0]?.id ?? null
      messages.value = conversations.value[0]?.messages ?? []
    }
  }

  function updateConversationTitle(id, title) {
    const conv = conversations.value.find((c) => c.id === id)
    if (conv) {
      conv.title = title
      saveConversations(conversations.value)
    }
  }

  function updateSystemPrompt(id, systemPrompt) {
    const conv = conversations.value.find((c) => c.id === id)
    if (conv) {
      conv.systemPrompt = systemPrompt
      saveConversations(conversations.value)
    }
  }

  function getConversationSystemPrompt(id) {
    const conv = conversations.value.find((c) => c.id === id)
    return conv?.systemPrompt || ''
  }

  // ─── Send Message ───
  async function sendMessage(userContent) {
    if (!userContent.trim() || isLoading.value) return

    // Ensure there's an active conversation
    if (!activeConversation.value) {
      createNewConversation()
    }

    const convId = activeConversation.value

    // Build user message
    const userMessage = {
      id: generateId(),
      role: 'user',
      content: userContent.trim(),
      timestamp: Date.now(),
    }

    messages.value.push(userMessage)

    // Auto-generate title from first message
    if (messages.value.length === 1) {
      const title = userContent.trim().slice(0, 40) + (userContent.length > 40 ? '...' : '')
      updateConversationTitle(convId, title)
    }

    // Prepare AI message placeholder
    const aiMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    }
    messages.value.push(aiMessage)
    isLoading.value = true

    const conv = conversations.value.find((c) => c.id === convId)
    const systemPrompt = conv?.systemPrompt || ''

    // Call streaming API
    const modelConfig = getActiveModelConfig()
    track('message_send', { model: modelConfig.model })
    abortController.value = streamChat({
      apiBaseUrl: modelConfig.apiBaseUrl,
      apiKey: modelConfig.apiKey,
      model: modelConfig.model,
      message: userContent.trim(),
      systemPrompt,
      conversationId: convId,
      temperature: settings.value.temperature,
      maxTokens: settings.value.maxTokens,
      topP: settings.value.topP,
      onChunk: (chunk, fullText) => {
        aiMessage.content = fullText
      },
      onDone: (fullText) => {
        aiMessage.content = fullText
        aiMessage.streaming = false
        isLoading.value = false
        persistConversation()
      },
      onError: (err) => {
        // Preserve partial content if any was streamed before the error.
        if (!aiMessage.content) {
          aiMessage.content = `**Error:** ${err.message}`
        }
        aiMessage.streaming = false
        isLoading.value = false
        persistConversation()
      },
    })

    persistConversation()
  }

  function cancelStreaming() {
    abortController.value?.abort()
  }

  // ─── Regenerate AI Response ───
  async function regenerateMessage(messageId) {
    if (isLoading.value) return

    const aiIndex = messages.value.findIndex((m) => m.id === messageId)
    if (aiIndex === -1) return
    if (aiIndex === 0) return // Cannot regenerate first message

    // Find the preceding user message
    const userMessage = messages.value[aiIndex - 1]
    if (userMessage?.role !== 'user') return

    const userContent = userMessage.content
    const convId = activeConversation.value
    const conv = conversations.value.find((c) => c.id === convId)
    const systemPrompt = conv?.systemPrompt || ''

    // Remove the old AI message and insert a new placeholder at the same position
    const newAiMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    }
    messages.value.splice(aiIndex, 1, newAiMessage)
    isLoading.value = true

    // Call streaming API with the same user content
    const modelConfig = getActiveModelConfig()
    track('message_regenerate', { model: modelConfig.model })
    abortController.value = streamChat({
      apiBaseUrl: modelConfig.apiBaseUrl,
      apiKey: modelConfig.apiKey,
      model: modelConfig.model,
      message: userContent,
      systemPrompt,
      conversationId: convId,
      temperature: settings.value.temperature,
      maxTokens: settings.value.maxTokens,
      topP: settings.value.topP,
      onChunk: (chunk, fullText) => {
        newAiMessage.content = fullText
      },
      onDone: (fullText) => {
        newAiMessage.content = fullText
        newAiMessage.streaming = false
        isLoading.value = false
        persistConversation()
      },
      onError: (err) => {
        if (!newAiMessage.content) {
          newAiMessage.content = `**Error:** ${err.message}`
        }
        newAiMessage.streaming = false
        isLoading.value = false
        persistConversation()
      },
    })

    persistConversation()
  }

  // ─── Branch from Message ───
  function branchFromMessage(messageId) {
    if (isLoading.value) return null
    const convId = activeConversation.value
    const conv = conversations.value.find((c) => c.id === convId)
    if (!conv) return null

    const index = messages.value.findIndex((m) => m.id === messageId)
    if (index === -1) return null

    const branchedMessages = messages.value.slice(0, index + 1).map((m) => ({
      ...m,
      id: generateId(),
      streaming: false,
    }))

    const newId = generateId()
    const baseTitle = (conv.title || 'New Chat').replace(/\s*\(branch( \d+)?\)$/i, '')
    const siblingCount = conversations.value.filter((c) =>
      (c.title || '').startsWith(`${baseTitle} (branch`)
    ).length
    const branchTitle =
      siblingCount === 0 ? `${baseTitle} (branch)` : `${baseTitle} (branch ${siblingCount + 1})`

    const newConv = {
      id: newId,
      title: branchTitle,
      messages: branchedMessages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      systemPrompt: conv.systemPrompt || '',
    }
    conversations.value.unshift(newConv)
    saveConversations(conversations.value)
    setActiveConversation(newId)
    track('conversation_branch', { sourceConvId: convId, newConvId: newId })
    return newConv
  }

  // ─── Edit Message ───
  async function editMessage(messageId, newContent) {
    if (!newContent.trim() || isLoading.value) return

    const index = messages.value.findIndex((m) => m.id === messageId)
    if (index === -1) return

    // Truncate from this message onward
    messages.value = messages.value.slice(0, index)
    persistConversation()

    // Re-send with edited content
    await sendMessage(newContent)
  }

  // ─── Delete Message ───
  function deleteMessage(messageId) {
    if (isLoading.value) return
    const index = messages.value.findIndex((m) => m.id === messageId)
    if (index === -1) return

    // Cancel any pending undo timer
    if (undoTimer) {
      clearTimeout(undoTimer)
      undoTimer = null
    }

    const deleted = messages.value[index]
    lastDeleted.value = { message: deleted, index, convId: activeConversation.value }

    messages.value.splice(index, 1)
    persistConversation()

    // Auto-clear undo after 5 seconds
    undoTimer = setTimeout(() => {
      lastDeleted.value = null
      undoTimer = null
    }, 5000)
  }

  function undoDelete() {
    if (!lastDeleted.value) return
    const { message, index, convId } = lastDeleted.value

    if (activeConversation.value !== convId) {
      setActiveConversation(convId)
    }

    messages.value.splice(index, 0, message)
    persistConversation()

    if (undoTimer) {
      clearTimeout(undoTimer)
      undoTimer = null
    }
    lastDeleted.value = null
  }

  function clearUndo() {
    if (undoTimer) {
      clearTimeout(undoTimer)
      undoTimer = null
    }
    lastDeleted.value = null
  }

  function persistConversation() {
    const conv = conversations.value.find((c) => c.id === activeConversation.value)
    if (conv) {
      conv.messages = [...messages.value]
      conv.updatedAt = Date.now()
      saveConversations(conversations.value)
    }
  }

  return {
    conversations,
    activeConversation,
    messages,
    isLoading,
    lastDeleted,
    init,
    setActiveConversation,
    createNewConversation,
    createConversationFromTemplate,
    deleteConversation,
    updateConversationTitle,
    updateSystemPrompt,
    getConversationSystemPrompt,
    sendMessage,
    cancelStreaming,
    editMessage,
    deleteMessage,
    undoDelete,
    clearUndo,
    regenerateMessage,
    branchFromMessage,
  }
}
