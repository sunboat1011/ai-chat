import { ref } from 'vue'
import { streamChat, fetchConversations, createConversation as apiCreateConversation } from '@/api/chat'
import { loadConversations, saveConversations, generateId } from '@/utils/storage'
import { useSettings } from '@/composables'

/**
 * Composable that manages chat state: conversations, messages, streaming.
 *
 * NOTE: In production you'd use a state-management library (Pinia).
 * For simplicity this composable uses reactive refs.
 */
export function useChat() {
  const { settings } = useSettings()
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

  function createNewConversation() {
    const id = generateId()
    const conv = { id, title: 'New Chat', messages: [], createdAt: Date.now() }
    conversations.value.unshift(conv)
    saveConversations(conversations.value)
    setActiveConversation(id)
    return conv
  }

  function deleteConversation(id) {
    conversations.value = conversations.value.filter((c) => c.id !== id)
    saveConversations(conversations.value)
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

    // Call streaming API
    abortController.value = streamChat({
      apiBaseUrl: settings.value.apiBaseUrl,
      model: settings.value.model,
      message: userContent.trim(),
      conversationId: convId,
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
        aiMessage.content = `**Error:** Failed to get response. ${err.message}`
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
    deleteConversation,
    updateConversationTitle,
    sendMessage,
    cancelStreaming,
    editMessage,
    deleteMessage,
    undoDelete,
    clearUndo,
  }
}
