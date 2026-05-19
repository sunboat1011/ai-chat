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

    <!-- Top bar: System Prompt + Model Selector -->
    <div class="chat-top-bar">
      <div v-if="systemPrompt" class="system-prompt-banner">
        <div class="system-prompt-content">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span class="system-prompt-label">Role:</span>
          <span class="system-prompt-text" :title="systemPrompt">{{ systemPrompt }}</span>
          <button class="system-prompt-edit-btn" aria-label="Edit system prompt" title="Edit system prompt" @click="openSystemPromptEdit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>
      <div v-else-if="activeConversation" class="system-prompt-banner empty">
        <div class="system-prompt-content">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span class="system-prompt-label">General Assistant</span>
          <button class="system-prompt-edit-btn" aria-label="Edit system prompt" title="Edit system prompt" @click="openSystemPromptEdit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Model Selector -->
      <div v-if="activeConversation" class="model-selector-wrap">
        <select
          :value="currentModel"
          class="model-selector"
          aria-label="Select model"
          title="Select model"
          @change="handleModelChange"
        >
          <optgroup label="Built-in">
            <option v-for="m in builtInModels" :key="m.id" :value="m.id">{{ m.name }}</option>
          </optgroup>
          <optgroup v-if="customModels.length > 0" label="Custom">
            <option v-for="m in customModels" :key="m.id" :value="m.id">{{ m.name }}</option>
          </optgroup>
        </select>
      </div>
    </div>

    <!-- System Prompt Edit Modal -->
    <div v-if="showSystemPromptEdit" class="sp-edit-overlay" @click="closeSystemPromptEdit">
      <div class="sp-edit-modal" @click.stop>
        <div class="sp-edit-header">
          <h3>Edit System Prompt</h3>
          <p class="sp-edit-hint">Changes affect all future messages in this conversation.</p>
        </div>
        <textarea
          ref="spTextareaRef"
          v-model="editingSystemPrompt"
          rows="5"
          class="sp-edit-textarea"
          placeholder="e.g., You are a helpful coding assistant..."
        />
        <div class="sp-edit-actions">
          <button class="sp-edit-btn sp-edit-cancel" aria-label="Cancel system prompt edit" @click="closeSystemPromptEdit">Cancel</button>
          <button class="sp-edit-btn sp-edit-save" aria-label="Save system prompt" @click="saveSystemPrompt">Save</button>
        </div>
      </div>
    </div>

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
    <div ref="messagesContainerRef" class="messages-container" @scroll="handleMessagesScroll">
      <button
        v-if="hiddenCount > 0"
        class="load-earlier-btn"
        aria-label="Load earlier messages"
        @click="loadEarlier"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
        Load earlier ({{ hiddenCount }} {{ hiddenCount === 1 ? 'message' : 'messages' }})
      </button>
      <MessageItem
        v-for="(msg, idx) in visibleMessages"
        :key="msg.id"
        :message="msg"
        :search-query="searchQuery"
        :current-local-match-index="getLocalMatchIndex(visibleStartIndex + idx)"
        @edit="handleEdit"
        @delete="handleDelete"
        @regenerate="handleRegenerate"
        @branch="handleBranch"
      />
    </div>

    <!-- Input Area -->
    <div class="input-area-wrapper">
      <ChatInput
        :disabled="false"
        :is-streaming="isLoading"
        :conversation-id="activeConversation"
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
import { useSettings } from '@/composables/useSettings'

const props = defineProps({
  messages: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  activeConversation: { type: String, default: null },
  systemPrompt: { type: String, default: '' },
})

const emit = defineEmits(['send', 'cancel', 'edit', 'delete', 'regenerate', 'branch', 'update-system-prompt', 'select-model'])

const messagesContainerRef = ref(null)
const searchInputRef = ref(null)
const showSearch = ref(false)
const searchQuery = ref('')
const currentMatchIndex = ref(0)
const showSystemPromptEdit = ref(false)
const editingSystemPrompt = ref('')
const spTextareaRef = ref(null)

// ─── Model selector ───
const { settings, getAllModels, BUILT_IN_MODELS } = useSettings()

const currentModel = computed(() => settings.value.model)
const allModels = computed(() => getAllModels())
const builtInModels = computed(() => BUILT_IN_MODELS)
const customModels = computed(() => settings.value.customModels || [])

function handleModelChange(e) {
  const modelId = e.target.value
  if (modelId && modelId !== settings.value.model) {
    settings.value.model = modelId
  }
}

// ─── Virtual scrolling: render only the latest N messages, load more on scroll-up ───
const INITIAL_BATCH = 50
const LOAD_MORE_BATCH = 50
const SCROLL_NEAR_TOP_PX = 80

const visibleCount = ref(INITIAL_BATCH)
let isLoadingMore = false

const visibleMessages = computed(() => {
  const total = props.messages.length
  if (visibleCount.value >= total) return props.messages
  return props.messages.slice(total - visibleCount.value)
})

const visibleStartIndex = computed(
  () => props.messages.length - visibleMessages.value.length
)

const hiddenCount = computed(
  () => props.messages.length - visibleMessages.value.length
)

async function loadEarlier() {
  if (isLoadingMore || hiddenCount.value === 0) return
  isLoadingMore = true
  const el = messagesContainerRef.value
  const prevScrollHeight = el?.scrollHeight ?? 0
  const prevScrollTop = el?.scrollTop ?? 0
  visibleCount.value = Math.min(
    visibleCount.value + LOAD_MORE_BATCH,
    props.messages.length
  )
  await nextTick()
  if (el) {
    const delta = el.scrollHeight - prevScrollHeight
    el.scrollTop = prevScrollTop + delta
  }
  isLoadingMore = false
}

function handleMessagesScroll() {
  const el = messagesContainerRef.value
  if (!el || hiddenCount.value === 0) return
  if (el.scrollTop < SCROLL_NEAR_TOP_PX) {
    loadEarlier()
  }
}

// Reset window when switching conversations
watch(
  () => props.activeConversation,
  () => {
    visibleCount.value = INITIAL_BATCH
  }
)

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

// If the current search match falls in the hidden range, expand the window
watch(
  () => [currentMatchIndex.value, totalMatches.value, searchQuery.value],
  () => {
    if (!searchQuery.value || totalMatches.value === 0) return
    if (currentMatchIndex.value < 0) return
    let cumulative = 0
    for (let i = 0; i < matchCountsPerMessage.value.length; i++) {
      cumulative += matchCountsPerMessage.value[i]
      if (cumulative > currentMatchIndex.value) {
        if (i < visibleStartIndex.value) {
          visibleCount.value = props.messages.length - i
        }
        return
      }
    }
  }
)

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

function handleBranch(messageId) {
  emit('branch', messageId)
}

// ─── System Prompt Editing ───
function openSystemPromptEdit() {
  editingSystemPrompt.value = props.systemPrompt
  showSystemPromptEdit.value = true
  nextTick(() => {
    spTextareaRef.value?.focus()
  })
}

function closeSystemPromptEdit() {
  showSystemPromptEdit.value = false
  editingSystemPrompt.value = ''
}

function saveSystemPrompt() {
  emit('update-system-prompt', editingSystemPrompt.value.trim())
  showSystemPromptEdit.value = false
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

.load-earlier-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  max-width: 14rem;
  margin: 0.75rem auto 0.25rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s;
}

.load-earlier-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.load-earlier-btn svg {
  flex-shrink: 0;
}

/* ─── Top bar: System Prompt + Model Selector ─── */
.chat-top-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.system-prompt-banner {
  flex: 1;
  min-width: 0;
}

.system-prompt-banner.empty {
  background: transparent;
}

.model-selector-wrap {
  flex-shrink: 0;
}

.model-selector {
  padding: 0.3rem 1.8rem 0.3rem 0.6rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-subtle);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s, color 0.15s;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.45rem center;
  max-width: 12rem;
}

.model-selector:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.model-selector:focus {
  border-color: var(--accent-primary);
}

.model-selector option,
.model-selector optgroup {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.8125rem;
}

.system-prompt-content {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.system-prompt-content svg {
  flex-shrink: 0;
  color: var(--accent-primary);
}

.system-prompt-label {
  font-weight: 500;
  flex-shrink: 0;
}

.system-prompt-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.8;
}

.system-prompt-edit-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.system-prompt-edit-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* ─── System Prompt Edit Modal ─── */
.sp-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.sp-edit-modal {
  width: 480px;
  max-width: 90vw;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  color: var(--text-primary);
  animation: slideUp 0.25s ease-out;
}

.sp-edit-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.sp-edit-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
}

.sp-edit-textarea {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.sp-edit-textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.2);
}

.sp-edit-textarea::placeholder {
  color: var(--text-muted);
}

.sp-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.sp-edit-btn {
  padding: 0.45rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.sp-edit-cancel {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.sp-edit-cancel:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.sp-edit-save {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.sp-edit-save:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}
</style>
