<template>
  <div class="chat-main">
    <!-- Search Toolbar -->
    <div v-if="showSearch && messages.length > 0" class="search-toolbar">
      <div class="search-input-wrap">
        <svg class="search-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Search in conversation..."
          class="search-input"
          aria-label="Search in conversation"
          @keydown="handleSearchKeydown"
        />
      </div>
      <span class="match-count" :class="{ 'no-match': searchQuery && totalMatches === 0 }">
        <template v-if="!searchQuery">&nbsp;</template>
        <template v-else-if="totalMatches === 0">0 / 0</template>
        <template v-else>{{ currentMatchIndex + 1 }} / {{ totalMatches }}</template>
      </span>
      <button
        class="search-nav-btn"
        :disabled="totalMatches === 0"
        aria-label="Previous match"
        title="Previous (Shift+Enter)"
        @click="prevMatch"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>
      <button
        class="search-nav-btn"
        :disabled="totalMatches === 0"
        aria-label="Next match"
        title="Next (Enter)"
        @click="nextMatch"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <button
        class="search-close-btn"
        aria-label="Close search"
        title="Close (Esc)"
        @click="closeSearch"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Floating Search Toggle (visible when search bar is hidden and we have messages) -->
    <button
      v-if="!showSearch && messages.length > 0"
      class="search-toggle-btn"
      aria-label="Search in conversation"
      title="Search in conversation (Ctrl/Cmd+F)"
      @click="openSearch"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    </button>

    <!-- Empty State -->
    <div v-if="messages.length === 0" class="welcome-screen">
      <div class="welcome-logo">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h1 class="welcome-title">How can I help you today?</h1>
      <p class="welcome-sub">Ask me anything — code, writing, analysis, or just chat.</p>
    </div>

    <!-- Messages -->
    <div ref="messagesContainerRef" class="messages-container">
      <MessageItem
        v-for="(msg, idx) in messages"
        :key="msg.id"
        :message="msg"
        :search-query="searchQuery"
        :current-local-match-index="getLocalMatchIndex(idx)"
        @edit="handleEdit"
        @delete="handleDelete"
        @regenerate="handleRegenerate"
      />
    </div>

    <!-- Input Area -->
    <div class="input-area-wrapper">
      <ChatInput
        :disabled="false"
        :is-streaming="isLoading"
        @send="handleSend"
        @cancel="cancelStreaming"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import MessageItem from '@/components/MessageItem.vue'
import ChatInput from '@/components/ChatInput.vue'

const props = defineProps({
  messages: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['send', 'cancel', 'edit', 'delete', 'regenerate'])

const messagesContainerRef = ref(null)
const searchInputRef = ref(null)
const showSearch = ref(false)
const searchQuery = ref('')
const currentMatchIndex = ref(0)

// ─── Search: count matches per message based on raw content ───
const matchCountsPerMessage = computed(() => {
  if (!searchQuery.value) return []
  const q = searchQuery.value.toLowerCase()
  return props.messages.map((msg) => {
    if (!msg.content) return 0
    const content = msg.content.toLowerCase()
    let count = 0
    let idx = content.indexOf(q)
    while (idx !== -1) {
      count++
      idx = content.indexOf(q, idx + q.length)
    }
    return count
  })
})

const totalMatches = computed(() =>
  matchCountsPerMessage.value.reduce((a, b) => a + b, 0)
)

function getLocalMatchIndex(messageIdx) {
  if (!searchQuery.value || totalMatches.value === 0) return -1
  let cumulative = 0
  for (let i = 0; i < matchCountsPerMessage.value.length; i++) {
    if (i === messageIdx) {
      const local = currentMatchIndex.value - cumulative
      if (local >= 0 && local < matchCountsPerMessage.value[i]) {
        return local
      }
      return -1
    }
    cumulative += matchCountsPerMessage.value[i]
  }
  return -1
}

watch(searchQuery, () => {
  currentMatchIndex.value = 0
})

watch(totalMatches, (n) => {
  if (currentMatchIndex.value >= n) {
    currentMatchIndex.value = 0
  }
})

function nextMatch() {
  if (totalMatches.value === 0) return
  currentMatchIndex.value = (currentMatchIndex.value + 1) % totalMatches.value
}

function prevMatch() {
  if (totalMatches.value === 0) return
  currentMatchIndex.value =
    (currentMatchIndex.value - 1 + totalMatches.value) % totalMatches.value
}

function openSearch() {
  showSearch.value = true
  nextTick(() => {
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
  })
}

function closeSearch() {
  showSearch.value = false
  searchQuery.value = ''
  currentMatchIndex.value = 0
}

function handleSearchKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    closeSearch()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (e.shiftKey) prevMatch()
    else nextMatch()
  }
}

function handleGlobalKeydown(e) {
  const isF = e.key && e.key.toLowerCase() === 'f'
  if ((e.ctrlKey || e.metaKey) && isF) {
    e.preventDefault()
    if (showSearch.value) {
      searchInputRef.value?.focus()
      searchInputRef.value?.select()
    } else {
      openSearch()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

function handleSend(message) {
  emit('send', message)
}

function cancelStreaming() {
  emit('cancel')
}

function handleEdit(messageId, newContent) {
  emit('edit', messageId, newContent)
}

function handleDelete(messageId) {
  emit('delete', messageId)
}

function handleRegenerate(messageId) {
  emit('regenerate', messageId)
}

// Auto-scroll to bottom on new messages
watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

// Auto-scroll during streaming
watch(
  () => props.messages[props.messages.length - 1]?.content,
  () => {
    const lastMsg = props.messages[props.messages.length - 1]
    if (lastMsg?.streaming) {
      scrollToBottom()
    }
  }
)

function scrollToBottom() {
  const el = messagesContainerRef.value
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}
</script>

<style scoped>
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  min-width: 0;
  position: relative;
  transition: background-color 0.2s ease;
}

/* ─── Search Toolbar ─── */
.search-toolbar {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInFromTop 0.18s ease-out;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-icon {
  position: absolute;
  left: 0.5rem;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 14rem;
  padding: 0.4rem 0.6rem 0.4rem 1.85rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.8125rem;
  outline: none;
  transition: border-color 0.15s;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--accent-primary);
}

.match-count {
  min-width: 3.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.match-count.no-match {
  color: #ef4444;
}

.search-nav-btn,
.search-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.search-nav-btn:hover:not(:disabled),
.search-close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.search-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.search-toggle-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 0.375rem;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.15s;
}

.search-toggle-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
  opacity: 1;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.welcome-logo {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border-subtle);
  border-radius: 1rem;
  background: var(--bg-code);
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.welcome-sub {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  text-align: center;
  max-width: 36rem;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.input-area-wrapper {
  flex-shrink: 0;
  background: linear-gradient(transparent, var(--bg-primary) 20%);
  padding-top: 2rem;
}
</style>
