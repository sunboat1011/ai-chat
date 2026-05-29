<template>
  <aside :class="['sidebar', { 'mobile-open': mobileOpen }]">
    <div class="sidebar-header">
      <button
        class="new-chat-btn"
        :aria-label="$t('sidebar.newChat')"
        @click="handleNewChat"
        :title="$t('sidebar.newChat')"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {{ $t('sidebar.newChat') }}
      </button>
      <button
        v-if="mobileOpen"
        class="sidebar-close-btn"
        :aria-label="$t('sidebar.close')"
        @click="$emit('close-sidebar')"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div class="sidebar-search">
      <svg
        class="search-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="$t('sidebar.searchPlaceholder')"
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
          :title="$t('sidebar.deleteConversation')"
          :aria-label="$t('sidebar.deleteConversation')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      </div>

      <div v-if="filteredConversations.length === 0" class="empty-state">
        {{ $t('sidebar.noConversations') }}
      </div>
    </nav>

    <div class="sidebar-footer">
      <div v-if="currentUser" class="user-info">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span class="user-name">{{ currentUser.username }}</span>
      </div>
      <button
        class="footer-btn"
        :aria-label="$t('sidebar.settings')"
        @click="$emit('open-settings')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        {{ $t('sidebar.settings') }}
      </button>
      <button
        class="footer-btn logout-btn"
        :aria-label="$t('auth.logout')"
        @click="$emit('logout')"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {{ $t('auth.logout') }}
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
  mobileOpen: { type: Boolean, default: false },
  currentUser: { type: Object, default: null },
})

const emit = defineEmits([
  'select',
  'delete',
  'new-chat',
  'toggle-theme',
  'close-sidebar',
  'open-settings',
  'logout',
])

const searchQuery = ref('')
const { now } = useNow()

const filteredConversations = computed(() => {
  if (!searchQuery.value) return props.conversations
  const q = searchQuery.value.toLowerCase()
  return props.conversations.filter((c) => c.title.toLowerCase().includes(q))
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
  width: 220px;
  background: var(--bg-tertiary);
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
  border-right: 2px solid var(--border-subtle);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header {
  padding: 0.75rem;
}

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 20px;
  height: 45px;
  border: 2px solid transparent;
  border-radius: 50px;
  background: var(--bg-secondary);
  color: #794f27;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 5px 0 0 var(--btn-shadow);
  font-family: inherit;
}

html.dark .new-chat-btn {
  color: #e8dcc8;
}

.new-chat-btn:hover {
  box-shadow: 0 6px 0 0 var(--btn-shadow);
  transform: translateY(-1px);
}

.new-chat-btn:active {
  box-shadow: 0 1px 0 0 var(--btn-shadow);
  transform: translateY(2px);
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
  color: #c4b89e;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.55rem 0.75rem 0.55rem 2.25rem;
  border: 2.5px solid var(--border-color);
  border-radius: 50px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: 500;
  outline: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 0 var(--input-shadow);
}

.search-input::placeholder {
  color: #c4b89e;
  font-weight: 400;
}

.search-input:focus {
  border-color: var(--focus-yellow);
  box-shadow: 0 3px 0 0 var(--focus-yellow-darker), 0 0 0 3px rgba(255, 204, 0, 0.15);
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
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 2px;
  color: #8a7b66;
}

.conversation-item:hover {
  background: var(--sidebar-hover);
  color: var(--text-primary);
}

.conversation-item.active {
  background: var(--sidebar-selected);
  color: #fff;
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
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-time {
  font-size: 0.6875rem;
  opacity: 0.8;
}

.delete-btn {
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-top: 0.15rem;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(224, 90, 90, 0.15);
  color: #e05a5a;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: #c4b89e;
  font-size: 0.8125rem;
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 2px solid var(--border-subtle);
}

.footer-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  color: #8a7b66;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.15s;
  font-family: inherit;
}

.footer-btn:hover {
  background: var(--sidebar-hover);
  color: var(--text-primary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  margin-bottom: 0.25rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.user-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn:hover {
  color: #e05a5a;
  background: rgba(224, 90, 90, 0.1);
}

/* ─── Mobile Responsive ─── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
    width: 240px;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .sidebar-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: #8a7b66;
    cursor: pointer;
    border-radius: 12px;
    flex-shrink: 0;
    transition: all 0.15s;
  }

  .sidebar-close-btn:hover {
    background: var(--sidebar-hover);
    color: var(--text-primary);
  }

  .conversation-item {
    padding: 0.75rem;
  }

  .delete-btn {
    opacity: 1;
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }
}
</style>
