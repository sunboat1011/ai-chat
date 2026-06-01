import { ref } from 'vue'
import {
  streamChat,
  fetchConversations,
  createConversation,
  fetchConversation,
  updateConversation as apiUpdateConversation,
  deleteConversation as apiDeleteConversation,
  deleteMessage as apiDeleteMessage,
  restoreMessage as apiRestoreMessage,
  streamRegenerate,
} from '@/api/chat'
import { loadConversations, saveConversations, generateId, clearDraft } from '@/utils/storage'
import { adaptConversation, adaptMessage } from '@/utils/adapter'
import { useSettings } from '@/composables'
import { track } from '@/utils/analytics'
import { showWarning, showError } from '@/composables/useErrorToast'
import { t } from '@/composables/useText'

/**
 * Composable that manages chat state: conversations, messages, streaming.
 *
 * Backend-first with localStorage fallback (offline mode).
 * All conversation CRUD operations hit the backend API first;
 * on network failure they fall back to localStorage and show a warning.
 */
export function useChat() {
  const { settings, getActiveModelConfig } = useSettings()

  // Start with empty array; init() will load from backend or localStorage
  const conversations = ref([])
  const activeConversation = ref(null)
  const messages = ref([])
  const isLoading = ref(false)
  const abortController = ref(null)
  const isOfflineMode = ref(false)

  // ─── Delete undo ───
  const lastDeleted = ref(null)
  let undoTimer = null

  // ─── Concurrency control for setActiveConversation ───
  let lastFetchId = 0

  // ─── Initialize ───
  async function init() {
    // Try backend first
    try {
      const result = await fetchConversations(0, 100)
      conversations.value = (result.content || []).map(adaptConversation)
      saveConversations(conversations.value)
      isOfflineMode.value = false
    } catch {
      // Backend unavailable — fall back to localStorage
      conversations.value = loadConversations()
      isOfflineMode.value = true
      showWarning(t('errors.offlineMode'))
    }

    // Migrate old local data (only affects fields that may be missing)
    let needsSave = false
    for (const conv of conversations.value) {
      if (!('systemPrompt' in conv)) {
        conv.systemPrompt = ''
        needsSave = true
      }
      if (conv.messages && conv.messages.length > 0) {
        conv.messages.forEach((msg, idx) => {
          if (!msg.timestamp) {
            msg.timestamp = (conv.updatedAt || conv.createdAt || Date.now()) + idx * 1000
            needsSave = true
          }
        })
      }
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
      await setActiveConversation(conversations.value[0].id)
    }
  }

  // ─── Conversation Management ───
  async function setActiveConversation(id) {
    activeConversation.value = id
    const fetchId = ++lastFetchId

    // Try backend first
    if (!isOfflineMode.value) {
      try {
        const result = await fetchConversation(id)
        if (fetchId !== lastFetchId) return // Stale request, ignore

        const conv = adaptConversation(result.conversation)
        conv.messages = (result.messages?.content || []).map(adaptMessage)

        // Update local cache
        const idx = conversations.value.findIndex((c) => c.id === id)
        if (idx !== -1) {
          conversations.value[idx] = conv
        } else {
          conversations.value.push(conv)
        }
        saveConversations(conversations.value)

        messages.value = conv.messages
        return
      } catch {
        if (fetchId !== lastFetchId) return
        isOfflineMode.value = true
        showWarning(t('errors.offlineMode'))
      }
    }

    // Fallback: load from local cache
    const conv = conversations.value.find((c) => c.id === id)
    messages.value = conv ? [...conv.messages] : []
  }

  async function createNewConversation(systemPrompt = '') {
    const prompt = systemPrompt || settings.value.defaultSystemPrompt || ''

    // Try backend first
    if (!isOfflineMode.value) {
      try {
        const conv = await createConversation({
          systemPrompt: prompt,
          modelId: settings.value.model,
          temperature: settings.value.temperature,
          maxTokens: settings.value.maxTokens,
          topP: settings.value.topP,
        })
        const adapted = adaptConversation(conv)
        adapted.messages = []
        conversations.value.unshift(adapted)
        saveConversations(conversations.value)
        await setActiveConversation(adapted.id)
        return adapted
      } catch {
        isOfflineMode.value = true
        showWarning(t('errors.offlineMode'))
      }
    }

    // Fallback: local creation
    const id = generateId()
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
    await setActiveConversation(id)
    return conv
  }

  async function createConversationFromTemplate(template) {
    const prompt = template.systemPrompt || settings.value.defaultSystemPrompt || ''
    const initialMessages = (template.messages || []).map((m) => ({
      id: generateId(),
      role: m.role,
      content: m.content,
      timestamp: Date.now(),
    }))

    // Try backend first
    if (!isOfflineMode.value) {
      try {
        const conv = await createConversation({
          title: template.name || 'New Chat',
          systemPrompt: prompt,
          modelId: settings.value.model,
          temperature: settings.value.temperature,
          maxTokens: settings.value.maxTokens,
          topP: settings.value.topP,
        })
        const adapted = adaptConversation(conv)
        adapted.messages = initialMessages
        conversations.value.unshift(adapted)
        saveConversations(conversations.value)
        await setActiveConversation(adapted.id)
        return adapted
      } catch {
        isOfflineMode.value = true
        showWarning(t('errors.offlineMode'))
      }
    }

    // Fallback: local creation
    const id = generateId()
    const baseTitle = template.name || 'New Chat'
    const conv = {
      id,
      title: baseTitle,
      messages: initialMessages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      systemPrompt: prompt,
    }
    conversations.value.unshift(conv)
    saveConversations(conversations.value)
    await setActiveConversation(id)
    return conv
  }

  async function deleteConversation(id) {
    // Try backend first; on failure DO NOT delete locally (consistency)
    if (!isOfflineMode.value) {
      try {
        await apiDeleteConversation(id)
      } catch {
        showError(t('errors.deleteFailed'))
        return
      }
    }

    // Backend succeeded or offline mode: proceed with local deletion
    conversations.value = conversations.value.filter((c) => c.id !== id)
    saveConversations(conversations.value)
    clearDraft(id)

    if (activeConversation.value === id) {
      activeConversation.value = conversations.value[0]?.id ?? null
      messages.value = conversations.value[0]?.messages ?? []
    }
  }

  /**
   * Update conversation metadata (title and/or systemPrompt).
   * Syncs to backend; on failure stays in offline mode but keeps local changes.
   */
  async function updateConversation(id, payload) {
    const conv = conversations.value.find((c) => c.id === id)
    if (!conv) return

    // Update local state immediately for responsiveness
    if (payload.title !== undefined) conv.title = payload.title
    if (payload.systemPrompt !== undefined) conv.systemPrompt = payload.systemPrompt
    saveConversations(conversations.value)

    // Sync to backend
    if (!isOfflineMode.value) {
      try {
        const updated = await apiUpdateConversation(id, payload)
        const idx = conversations.value.findIndex((c) => c.id === id)
        if (idx !== -1) {
          const adapted = adaptConversation(updated)
          // Preserve local messages (backend response may not include them)
          adapted.messages = conv.messages
          conversations.value[idx] = adapted
          saveConversations(conversations.value)
        }
      } catch {
        isOfflineMode.value = true
        showWarning(t('errors.offlineMode'))
      }
    }
  }

  // Backward-compatible wrappers
  async function updateConversationTitle(id, title) {
    return updateConversation(id, { title })
  }

  async function updateSystemPrompt(id, systemPrompt) {
    return updateConversation(id, { systemPrompt })
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
      await createNewConversation()
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
      await updateConversationTitle(convId, title)
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
    track('message_send', { model: modelConfig.modelId })
    abortController.value = streamChat({
      modelId: modelConfig.modelId,
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
        // Backend auto-saves; just update local cache
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

    const convId = activeConversation.value

    // Create a new placeholder message (frontend shows loading immediately)
    const newAiMessage = {
      id: 'temp_' + generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    }
    messages.value.splice(aiIndex, 1, newAiMessage)
    isLoading.value = true

    // Call backend regenerate interface via SSE
    const modelConfig = getActiveModelConfig()
    track('message_regenerate', { model: modelConfig.modelId })
    abortController.value = streamRegenerate({
      conversationId: convId,
      messageId,
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
  async function branchFromMessage(messageId) {
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

    const baseTitle = (conv.title || 'New Chat').replace(/\s*\(branch( \d+)?\)$/i, '')
    const siblingCount = conversations.value.filter((c) =>
      (c.title || '').startsWith(`${baseTitle} (branch`)
    ).length
    const branchTitle =
      siblingCount === 0 ? `${baseTitle} (branch)` : `${baseTitle} (branch ${siblingCount + 1})`

    // Try backend first
    if (!isOfflineMode.value) {
      try {
        const newConv = await createConversation({
          title: branchTitle,
          systemPrompt: conv.systemPrompt || '',
          modelId: settings.value.model,
          temperature: settings.value.temperature,
          maxTokens: settings.value.maxTokens,
          topP: settings.value.topP,
        })
        const adapted = adaptConversation(newConv)
        adapted.messages = branchedMessages
        conversations.value.unshift(adapted)
        saveConversations(conversations.value)
        await setActiveConversation(adapted.id)
        track('conversation_branch', { sourceConvId: convId, newConvId: adapted.id })
        return adapted
      } catch {
        isOfflineMode.value = true
        showWarning(t('errors.offlineMode'))
      }
    }

    // Fallback: local creation
    const newId = generateId()
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
    await setActiveConversation(newId)
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
  async function deleteMessage(messageId) {
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

    // Immediate local deletion for instant feedback
    messages.value.splice(index, 1)
    persistConversation()

    // Async backend call (skip in offline mode)
    if (!isOfflineMode.value) {
      try {
        await apiDeleteMessage(messageId)
      } catch {
        // Backend delete failed — roll back local state
        messages.value.splice(index, 0, deleted)
        lastDeleted.value = null
        showError(t('errors.deleteMessageFailed'))
        return
      }
    }

    // Auto-clear undo after 5 seconds
    undoTimer = setTimeout(() => {
      lastDeleted.value = null
      undoTimer = null
    }, 5000)
  }

  async function undoDelete() {
    if (!lastDeleted.value) return
    const { message, index, convId } = lastDeleted.value

    if (activeConversation.value !== convId) {
      await setActiveConversation(convId)
    }

    // Immediate local restore for instant feedback
    messages.value.splice(index, 0, message)
    persistConversation()

    // Async backend call (skip in offline mode)
    if (!isOfflineMode.value) {
      try {
        await apiRestoreMessage(message.id)
      } catch {
        // Backend restore failed — re-delete locally
        messages.value.splice(index, 1)
        persistConversation()
        showError(t('errors.restoreMessageFailed'))
        return
      }
    }

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
    isOfflineMode,
    lastDeleted,
    init,
    setActiveConversation,
    createNewConversation,
    createConversationFromTemplate,
    deleteConversation,
    updateConversation,
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
