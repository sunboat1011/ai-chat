import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadConversations,
  saveConversations,
  generateId,
  loadDraft,
  saveDraft,
  clearDraft,
} from '@/utils/storage'

describe('utils/storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('generateId', () => {
    it('returns a non-empty string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('produces unique IDs across many calls', () => {
      const ids = new Set()
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(1000)
    })

    it('combines timestamp and random portion', () => {
      const id = generateId()
      expect(id).toMatch(/^[a-z0-9]+$/)
      // base36 timestamp portion at least 8 chars + 6 chars of random tail
      expect(id.length).toBeGreaterThanOrEqual(8)
    })
  })

  describe('loadConversations / saveConversations', () => {
    it('returns empty array when storage is empty', () => {
      expect(loadConversations()).toEqual([])
    })

    it('persists and retrieves a conversation array', () => {
      const conversations = [
        { id: 'a', title: 'one', messages: [] },
        { id: 'b', title: 'two', messages: [{ role: 'user', content: 'hi' }] },
      ]
      saveConversations(conversations)
      expect(loadConversations()).toEqual(conversations)
    })

    it('returns empty array when stored value is corrupted JSON', () => {
      localStorage.setItem('ai-chat-conversations', '{not-json')
      expect(loadConversations()).toEqual([])
    })

    it('logs but does not throw when saving fails', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })
      expect(() => saveConversations([{ id: 'x' }])).not.toThrow()
      expect(errorSpy).toHaveBeenCalled()
      setItemSpy.mockRestore()
    })
  })

  describe('draft CRUD', () => {
    it('returns empty string when no draft exists for a conversation', () => {
      expect(loadDraft('conv-1')).toBe('')
    })

    it('saves and loads a draft for a specific conversation', () => {
      saveDraft('conv-1', 'hello world')
      expect(loadDraft('conv-1')).toBe('hello world')
    })

    it('keeps drafts of different conversations isolated', () => {
      saveDraft('conv-a', 'draft-a')
      saveDraft('conv-b', 'draft-b')
      expect(loadDraft('conv-a')).toBe('draft-a')
      expect(loadDraft('conv-b')).toBe('draft-b')
    })

    it('uses __pending__ sentinel when no conversation id is provided', () => {
      saveDraft(null, 'pending-draft')
      expect(loadDraft(null)).toBe('pending-draft')
      expect(localStorage.getItem('ai-chat-draft-__pending__')).toBe('pending-draft')
    })

    it('saving empty content removes the draft', () => {
      saveDraft('conv-1', 'content')
      saveDraft('conv-1', '')
      expect(loadDraft('conv-1')).toBe('')
      expect(localStorage.getItem('ai-chat-draft-conv-1')).toBeNull()
    })

    it('clearDraft removes the specific draft only', () => {
      saveDraft('conv-1', 'one')
      saveDraft('conv-2', 'two')
      clearDraft('conv-1')
      expect(loadDraft('conv-1')).toBe('')
      expect(loadDraft('conv-2')).toBe('two')
    })

    it('does not throw when draft storage write fails', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('boom')
      })
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => saveDraft('conv-1', 'x')).not.toThrow()
      expect(errorSpy).toHaveBeenCalled()
      setItemSpy.mockRestore()
    })
  })
})
