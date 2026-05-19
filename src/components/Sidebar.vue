<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <button class="new-chat-btn" aria-label="New Chat" @click="handleNewChat" title="New Chat">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Chat
      </button>
    </div>

    <div class="sidebar-search">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search conversations..."
        class="search-input"
      />
    </div>

    <nav class="conversation-list">
      <div
        v-for="conv in filteredConversations"
        :key="conv.id"
        :class="['conversation-item', { active: conv.id === activeConversation }]"
        @click="$emit('select', conv.id)"
      >
        <div class="conv-info">
          <span class="conv-title">{{ conv.title }}</span>
          <span class="conv-time">{{ formatRelative(getLastActiveAt(conv), now) }}</span>
        </div>
        <button
          class="delete-btn"
          @click.stop="$emit('delete', conv.id)"
          title="Delete conversation"
          aria-label="Delete conversation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      </div>

      <div v-if="filteredConversations.length === 0" class="empty-state">
        No conversations found
      </div>
    </nav>

    <div class="sidebar-footer">
      <button class="footer-btn" aria-label="Open settings" @click="$emit('open-settings')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        Settings
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatRelative } from '@/utils/time'
import { useNow } from '@/composables/useNow'

const props = defineProps({
  conversations: { type: Array, required: true },
  activeConversation: { type: String, default: null },
})

const emit = defineEmits(['select', 'delete', 'new-chat', 'toggle-theme'])

const searchQuery = ref('')
const { now } = useNow()

const filteredConversations = computed(() => {
  if (!searchQuery.value) return props.conversations
  const q = searchQuery.value.toLowerCase()
  return props.conversations.filter((c) =>
    c.title.toLowerCase().includes(q)
  )
})

function handleNewChat() {
  emit('new-chat')
}

function getLastActiveAt(conv) {
  const lastMsg = conv.messages?.[conv.messages.length - 1]
  return lastMsg?.timestamp || conv.updatedAt || conv.createdAt || 0
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: var(--bg-tertiary);
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
  border-right: 1px solid var(--border-subtle);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.sidebar-header {
  padding: 0.75rem;
}

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  background: var(--bg-secondary);
}

.sidebar-search {
  position: relative;
  padding: 0 0.75rem 0.75rem;
}

.search-icon {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.55rem 0.75rem 0.55rem 2.25rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.8125rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--accent-primary);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.5rem;
}

.conversation-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}

.conversation-item:hover {
  background: var(--bg-secondary);
}

.conversation-item.active {
  background: var(--bg-elevated);
}

.conv-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.conv-title {
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.conv-time {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.delete-btn {
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-top: 0.15rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--bg-elevated);
  color: #ef4444;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--border-subtle);
}

.footer-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.15s;
}

.footer-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
</style>
