import { ref } from 'vue'
import { streamChat, fetchConversations, createConversation as apiCreateConversation } from '@/api/chat'
import { loadConversations, saveConversations, generateId } from '@/utils/storage'

/**
 * Composable that manages chat state: conversations, messages, streaming.
 *
 * NOTE: In production you'd use a state-management library (Pinia).
 * For simplicity this composable uses reactive refs.
 */
export function useChat() {
  const conversations = ref(loadConversations())
  const activeConversation = ref(null)
  const messages = ref([])
  const isLoading = ref(false)
  const abortController = ref(null)

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
    init,
    setActiveConversation,
    createNewConversation,
    deleteConversation,
    updateConversationTitle,
    sendMessage,
    cancelStreaming,
  }
}
