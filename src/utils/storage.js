const STORAGE_KEY = 'ai-chat-conversations'
const DRAFT_KEY_PREFIX = 'ai-chat-draft-'
const DRAFT_PENDING_KEY = '__pending__'

/**
 * Load all conversations from localStorage.
 */
export function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Save all conversations to localStorage.
 */
export function saveConversations(conversations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch (e) {
    console.error('Failed to save conversations:', e)
  }
}

/**
 * Generate a unique ID.
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function draftKey(conversationId) {
  return `${DRAFT_KEY_PREFIX}${conversationId || DRAFT_PENDING_KEY}`
}

/**
 * Load the input draft for a given conversation.
 * Returns an empty string if no draft exists or storage is unavailable.
 */
export function loadDraft(conversationId) {
  try {
    return localStorage.getItem(draftKey(conversationId)) || ''
  } catch {
    return ''
  }
}

/**
 * Save the input draft for a given conversation.
 * Empty content removes the draft to avoid storing empty entries.
 */
export function saveDraft(conversationId, content) {
  try {
    if (!content) {
      localStorage.removeItem(draftKey(conversationId))
    } else {
      localStorage.setItem(draftKey(conversationId), content)
    }
  } catch (e) {
    console.error('Failed to save draft:', e)
  }
}

/**
 * Remove the input draft for a given conversation.
 */
export function clearDraft(conversationId) {
  try {
    localStorage.removeItem(draftKey(conversationId))
  } catch (e) {
    console.error('Failed to clear draft:', e)
  }
}

/**
 * Load all draft entries from localStorage.
 * Returns a mapping object: { [conversationId]: draftContent }
 */
export function loadAllDrafts() {
  try {
    const drafts = {}
    const prefix = DRAFT_KEY_PREFIX
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        const convId = key.slice(prefix.length)
        if (convId && convId !== DRAFT_PENDING_KEY) {
          drafts[convId] = localStorage.getItem(key) || ''
        }
      }
    }
    return drafts
  } catch {
    return {}
  }
}
