import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─── Mock the API layer so tests don't need fetch ───
const streamMock = vi.fn()

vi.mock('@/api/chat', () => ({
  streamChat: (opts) => {
    streamMock(opts)
    return { abort: vi.fn() }
  },
  fetchConversations: vi.fn(() => Promise.reject(new Error('offline'))),
  createConversation: vi.fn(() => Promise.reject(new Error('offline'))),
  fetchConversation: vi.fn(() => Promise.reject(new Error('offline'))),
  updateConversation: vi.fn(() => Promise.reject(new Error('offline'))),
  deleteConversation: vi.fn(() => Promise.reject(new Error('offline'))),
}))

vi.mock('@/composables/useErrorToast', () => ({
  showWarning: vi.fn(),
  showError: vi.fn(),
}))

vi.mock('@/composables/useText', () => ({
  t: vi.fn((key) => key),
}))

async function freshImport() {
  vi.resetModules()
  return await import('@/composables/useChat')
}

describe('composables/useChat', () => {
  beforeEach(() => {
    localStorage.clear()
    streamMock.mockClear()
  })

  describe('createNewConversation', () => {
    it('creates a conversation with default fields and activates it', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      const conv = await chat.createNewConversation()
      expect(conv.title).toBe('New Chat')
      expect(conv.messages).toEqual([])
      expect(typeof conv.id).toBe('string')
      expect(typeof conv.createdAt).toBe('number')
      expect(typeof conv.updatedAt).toBe('number')
      expect(chat.activeConversation.value).toBe(conv.id)
      expect(chat.conversations.value).toHaveLength(1)
    })

    it('persists the new conversation to localStorage', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      const stored = JSON.parse(localStorage.getItem('ai-chat-conversations'))
      expect(stored).toHaveLength(1)
    })

    it('uses an explicit system prompt when provided', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      const conv = await chat.createNewConversation('You are X')
      expect(conv.systemPrompt).toBe('You are X')
    })

    it('unshifts new conversations so the newest sits at the top', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      const first = await chat.createNewConversation()
      const second = await chat.createNewConversation()
      expect(chat.conversations.value[0].id).toBe(second.id)
      expect(chat.conversations.value[1].id).toBe(first.id)
    })
  })

  describe('sendMessage', () => {
    it('appends a user message, AI placeholder, and triggers streamChat', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('hello world')
      expect(chat.messages.value).toHaveLength(2)
      expect(chat.messages.value[0].role).toBe('user')
      expect(chat.messages.value[0].content).toBe('hello world')
      expect(chat.messages.value[1].role).toBe('assistant')
      expect(chat.messages.value[1].streaming).toBe(true)
      expect(streamMock).toHaveBeenCalledTimes(1)
      expect(streamMock.mock.calls[0][0].message).toBe('hello world')
    })

    it('auto-creates a conversation when none is active', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      expect(chat.activeConversation.value).toBeNull()
      await chat.sendMessage('hi')
      expect(chat.activeConversation.value).not.toBeNull()
      expect(chat.conversations.value).toHaveLength(1)
    })

    it('auto-generates a title from the first user message', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('this is the first message')
      const conv = chat.conversations.value[0]
      expect(conv.title).toBe('this is the first message')
    })

    it('truncates and appends ellipsis when title exceeds 40 characters', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      const long = 'a'.repeat(60)
      await chat.sendMessage(long)
      const conv = chat.conversations.value[0]
      expect(conv.title.endsWith('...')).toBe(true)
      expect(conv.title.length).toBeLessThanOrEqual(43)
    })

    it('ignores blank input', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('   ')
      expect(chat.messages.value).toEqual([])
      expect(streamMock).not.toHaveBeenCalled()
    })

    it('does not start a new stream while one is loading', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('first')
      // Simulate ongoing stream
      expect(chat.isLoading.value).toBe(true)
      await chat.sendMessage('second')
      expect(streamMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('streaming callbacks (onChunk / onDone / onError)', () => {
    it('appends streamed content to the AI message and clears streaming on done', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('q')
      const { onChunk, onDone } = streamMock.mock.calls[0][0]
      onChunk('Hello ', 'Hello ')
      onChunk('world', 'Hello world')
      expect(chat.messages.value[1].content).toBe('Hello world')
      onDone('Hello world')
      expect(chat.messages.value[1].streaming).toBe(false)
      expect(chat.isLoading.value).toBe(false)
    })

    it('preserves partial content on error when content already streamed', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('q')
      const { onChunk, onError } = streamMock.mock.calls[0][0]
      onChunk('partial', 'partial')
      onError(new Error('boom'))
      expect(chat.messages.value[1].content).toBe('partial')
      expect(chat.messages.value[1].streaming).toBe(false)
      expect(chat.isLoading.value).toBe(false)
    })

    it('inserts an **Error:** placeholder when nothing was streamed', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('q')
      const { onError } = streamMock.mock.calls[0][0]
      onError(new Error('network down'))
      expect(chat.messages.value[1].content).toBe('**Error:** network down')
    })
  })

  describe('deleteMessage / undoDelete', () => {
    it('removes the message and stores the deleted record for undo', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('hi')
      const aiId = chat.messages.value[1].id
      // Mark stream done so isLoading clears
      streamMock.mock.calls[0][0].onDone('answer')
      chat.deleteMessage(aiId)
      expect(chat.messages.value).toHaveLength(1)
      expect(chat.lastDeleted.value).toBeTruthy()
    })

    it('undoDelete restores the removed message at its original index', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('hi')
      streamMock.mock.calls[0][0].onDone('answer')
      const userId = chat.messages.value[0].id
      const aiId = chat.messages.value[1].id
      chat.deleteMessage(aiId)
      chat.undoDelete()
      expect(chat.messages.value).toHaveLength(2)
      expect(chat.messages.value[0].id).toBe(userId)
      expect(chat.messages.value[1].id).toBe(aiId)
      expect(chat.lastDeleted.value).toBeNull()
    })

    it('clearUndo wipes the pending undo record', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('hi')
      streamMock.mock.calls[0][0].onDone('answer')
      chat.deleteMessage(chat.messages.value[1].id)
      chat.clearUndo()
      expect(chat.lastDeleted.value).toBeNull()
    })
  })

  describe('branchFromMessage', () => {
    it('creates a new conversation copying messages up to and including target', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('one')
      streamMock.mock.calls[0][0].onDone('answer1')
      const branchTargetId = chat.messages.value[1].id

      const branch = await chat.branchFromMessage(branchTargetId)
      expect(branch).not.toBeNull()
      expect(branch.title).toContain('(branch)')
      expect(branch.messages).toHaveLength(2)
      expect(branch.messages[0].role).toBe('user')
      expect(branch.messages[1].role).toBe('assistant')
      // Branch IDs are regenerated so they don't collide with original
      expect(branch.messages[1].id).not.toBe(branchTargetId)
    })

    it('returns null when message id is not found', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('one')
      streamMock.mock.calls[0][0].onDone('a')
      expect(await chat.branchFromMessage('not-here')).toBeNull()
    })
  })

  describe('editMessage', () => {
    it('truncates from the edited message and re-triggers sendMessage', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.createNewConversation()
      await chat.sendMessage('first')
      streamMock.mock.calls[0][0].onDone('a1')
      streamMock.mockClear()

      const userId = chat.messages.value[0].id
      await chat.editMessage(userId, 'edited first')
      // Messages truncated then re-sent → user + new placeholder
      expect(chat.messages.value).toHaveLength(2)
      expect(chat.messages.value[0].content).toBe('edited first')
      expect(streamMock).toHaveBeenCalledTimes(1)
      expect(streamMock.mock.calls[0][0].message).toBe('edited first')
    })
  })

  describe('system prompt handling', () => {
    it('updates and reads back the conversation system prompt', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      const conv = await chat.createNewConversation()
      await chat.updateSystemPrompt(conv.id, 'You are Z')
      expect(chat.getConversationSystemPrompt(conv.id)).toBe('You are Z')
    })

    it('forwards the conversation system prompt to streamChat', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      const conv = await chat.createNewConversation('You are W')
      await chat.setActiveConversation(conv.id)
      await chat.sendMessage('hi')
      expect(streamMock.mock.calls[0][0].systemPrompt).toBe('You are W')
    })
  })

  describe('deleteConversation', () => {
    it('removes the conversation and switches active to the next one', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      const a = await chat.createNewConversation()
      const b = await chat.createNewConversation()
      // b is now active (most recent)
      await chat.deleteConversation(b.id)
      expect(chat.conversations.value).toHaveLength(1)
      expect(chat.activeConversation.value).toBe(a.id)
    })

    it('sets active to null when last conversation is deleted', async () => {
      const { useChat } = await freshImport()
      const chat = useChat()
      const a = await chat.createNewConversation()
      await chat.deleteConversation(a.id)
      expect(chat.conversations.value).toHaveLength(0)
      expect(chat.activeConversation.value).toBeNull()
    })
  })

  describe('init migration', () => {
    it('backfills systemPrompt, updatedAt, and message timestamps on stored data', async () => {
      const legacy = [
        {
          id: 'old-1',
          title: 'Old chat',
          messages: [{ id: 'm1', role: 'user', content: 'hi' }],
          createdAt: 1000,
        },
      ]
      localStorage.setItem('ai-chat-conversations', JSON.stringify(legacy))
      const { useChat } = await freshImport()
      const chat = useChat()
      await chat.init()
      const conv = chat.conversations.value[0]
      expect(conv.systemPrompt).toBe('')
      expect(conv.updatedAt).toBeDefined()
      expect(conv.messages[0].timestamp).toBeDefined()
    })
  })
})
