<template>
  <div :class="['message-wrapper', message.role]">
    <div class="message-content">
      <div class="message-avatar">
        <div v-if="message.role === 'user'" class="avatar user-avatar">U</div>
        <div v-else class="avatar ai-avatar">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#19c8b9"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>

      <div class="message-body">
        <div class="message-author">
          {{ message.role === 'user' ? $t('message.user') : $t('message.assistant') }}
          <time
            v-if="message.timestamp"
            :datetime="isoTimestamp"
            :title="absoluteTime"
            class="message-time"
          >
            {{ relativeTime }}
          </time>
        </div>

        <!-- Editing mode -->
        <div v-if="isEditing" class="edit-area">
          <textarea
            ref="editTextareaRef"
            v-model="editContent"
            class="edit-textarea"
            rows="3"
            @keydown="handleEditKeydown"
          />
          <div class="edit-actions">
            <button
              class="edit-btn edit-cancel"
              :aria-label="$t('message.cancelEdit')"
              @click="cancelEdit"
            >
              {{ $t('message.cancelEdit') }}
            </button>
            <button
              class="edit-btn edit-save"
              :aria-label="$t('message.saveAndSubmit')"
              @click="saveEdit"
            >
              {{ $t('message.saveAndSubmit') }}
            </button>
          </div>
        </div>

        <!-- Normal display mode -->
        <template v-else>
          <div
            ref="contentRef"
            class="markdown-body"
            v-html="renderedContent"
            @click="handleContentClick"
          ></div>

          <!-- Status indicators -->
          <div v-if="message.role === 'assistant' && message.status === 'error'" class="message-status error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ $t('message.statusError') }}
          </div>
          <div v-else-if="message.role === 'assistant' && message.status === 'interrupted'" class="message-status interrupted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {{ $t('message.statusInterrupted') }}
          </div>

          <div v-if="message.streaming" class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div class="message-actions">
            <button
              v-if="message.role === 'user'"
              class="action-btn"
              :aria-label="$t('message.edit')"
              @click="startEdit"
              title="Edit"
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
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              class="action-btn"
              :aria-label="$t('message.delete')"
              @click="confirmDelete"
              title="Delete"
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
                <path
                  d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                />
              </svg>
            </button>
            <button
              v-if="message.role === 'assistant'"
              class="action-btn"
              :aria-label="$t('message.regenerate')"
              @click="handleRegenerate"
              title="Regenerate"
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
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
              </svg>
            </button>
            <button
              class="action-btn"
              :aria-label="copied ? $t('message.copied') : $t('message.copy')"
              @click="copyMessage"
              title="Copy"
            >
              <svg
                v-if="!copied"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <svg
                v-else
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#19c8b9"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              class="action-btn"
              :aria-label="$t('message.branch')"
              @click="handleBranch"
              title="Branch from here"
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
                <line x1="6" y1="3" x2="6" y2="15" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
            </button>
          </div>
        </template>
      </div>
    </div>

    <ConfirmModal
      :visible="showDeleteConfirm"
      :title="$t('message.deleteConfirmTitle')"
      :message="$t('message.deleteConfirmMessage')"
      :confirm-text="$t('message.deleteConfirmBtn')"
      :cancel-text="$t('message.cancel')"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { renderMarkdown, escapeHtmlText } from '@/utils/markdown'
import { formatRelative, formatAbsolute, formatISOTime } from '@/utils/time'
import { useNow } from '@/composables/useNow'
import { useText } from '@/composables/useText'
import ConfirmModal from './ConfirmModal.vue'

const { t } = useText()

const props = defineProps({
  message: { type: Object, required: true },
  searchQuery: { type: String, default: '' },
  currentLocalMatchIndex: { type: Number, default: -1 },
})

const emit = defineEmits(['edit', 'delete', 'regenerate', 'branch'])

const contentRef = ref(null)
const copied = ref(false)
const isEditing = ref(false)
const editContent = ref('')
const editTextareaRef = ref(null)
const showDeleteConfirm = ref(false)

// ─── Timestamp display ───
const { now } = useNow()

const isoTimestamp = computed(() =>
  props.message.timestamp ? formatISOTime(props.message.timestamp) : ''
)

const absoluteTime = computed(() =>
  props.message.timestamp ? formatAbsolute(props.message.timestamp) : ''
)

const relativeTime = computed(() =>
  props.message.timestamp ? formatRelative(props.message.timestamp, now.value) : ''
)

const renderedContent = computed(() => {
  const { content, role } = props.message
  if (!content) return ''

  if (role === 'user') {
    return escapeHtmlText(content).replace(/\n/g, '<br>')
  }

  return renderMarkdown(content)
})

watch(
  () => props.message.content,
  async () => {
    if (props.message.streaming && contentRef.value) {
      await nextTick()
      const container = contentRef.value.closest('.messages-container')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }
)

// ─── Search Highlight ───
function highlightMatches() {
  if (!contentRef.value || isEditing.value) return

  const query = props.searchQuery
  if (!query) {
    // No active search: only rewrite innerHTML if there are leftover <mark>
    // tags from a previous search. Otherwise let v-html handle rendering,
    // avoiding redundant DOM writes during streaming.
    if (contentRef.value.querySelector('mark.search-highlight')) {
      contentRef.value.innerHTML = renderedContent.value
    }
    return
  }

  contentRef.value.innerHTML = renderedContent.value

  const lowerQuery = query.toLowerCase()

  const walker = document.createTreeWalker(contentRef.value, NodeFilter.SHOW_TEXT, null)
  const targets = []
  let node = walker.nextNode()
  while (node) {
    if (node.nodeValue && node.nodeValue.toLowerCase().includes(lowerQuery)) {
      targets.push(node)
    }
    node = walker.nextNode()
  }

  let localIndex = 0
  for (const textNode of targets) {
    const text = textNode.nodeValue
    const lowerText = text.toLowerCase()
    const fragment = document.createDocumentFragment()
    let pos = 0
    while (pos < text.length) {
      const hit = lowerText.indexOf(lowerQuery, pos)
      if (hit === -1) {
        fragment.appendChild(document.createTextNode(text.slice(pos)))
        break
      }
      if (hit > pos) {
        fragment.appendChild(document.createTextNode(text.slice(pos, hit)))
      }
      const mark = document.createElement('mark')
      mark.className = 'search-highlight'
      if (localIndex === props.currentLocalMatchIndex) {
        mark.classList.add('search-highlight-current')
      }
      mark.textContent = text.slice(hit, hit + lowerQuery.length)
      fragment.appendChild(mark)
      localIndex++
      pos = hit + lowerQuery.length
    }
    textNode.parentNode?.replaceChild(fragment, textNode)
  }
}

watch(
  () => [props.searchQuery, props.currentLocalMatchIndex, renderedContent.value, isEditing.value],
  highlightMatches,
  { flush: 'post', immediate: true }
)

watch(
  () => [props.searchQuery, props.currentLocalMatchIndex],
  () => {
    if (props.currentLocalMatchIndex === -1) return
    nextTick(() => {
      const el = contentRef.value?.querySelector('.search-highlight-current')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }
)

// ─── Edit ───
function startEdit() {
  if (props.message.streaming) return
  editContent.value = props.message.content
  isEditing.value = true
  nextTick(() => {
    editTextareaRef.value?.focus()
    autoResizeEdit()
  })
}

function saveEdit() {
  const trimmed = editContent.value.trim()
  if (!trimmed || trimmed === props.message.content) {
    isEditing.value = false
    return
  }
  emit('edit', props.message.id, trimmed)
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  editContent.value = ''
}

function handleEditKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    saveEdit()
  }
  if (e.key === 'Escape') {
    cancelEdit()
  }
  nextTick(autoResizeEdit)
}

function autoResizeEdit() {
  const el = editTextareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

function confirmDelete() {
  if (props.message.streaming) return
  showDeleteConfirm.value = true
}

function handleDeleteConfirm() {
  showDeleteConfirm.value = false
  emit('delete', props.message.id)
}

function handleDeleteCancel() {
  showDeleteConfirm.value = false
}

function handleRegenerate() {
  if (props.message.streaming) return
  emit('regenerate', props.message.id)
}

function handleBranch() {
  if (props.message.streaming) return
  emit('branch', props.message.id)
}

async function copyMessage() {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = props.message.content
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

async function handleContentClick(e) {
  // Try data-action first (preferred), fall back to .copy-btn class
  // in case DOMPurify strips the data attribute in some versions.
  const btn = e.target.closest('button[data-action="copy-code"]') || e.target.closest('.copy-btn')
  if (!btn) return

  const wrapper = btn.closest('.code-block-wrapper')
  const codeEl = wrapper?.querySelector('code')
  if (!codeEl) return

  try {
    await navigator.clipboard.writeText(codeEl.textContent)
    btn.classList.add('copied')
    btn.setAttribute('aria-label', t('message.codeCopied'))
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      ${t('message.copiedBtn')}`
    setTimeout(() => {
      btn.classList.remove('copied')
      btn.setAttribute('aria-label', t('message.copyCode'))
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        ${t('message.copyCodeBtn')}`
    }, 2000)
  } catch {
    // silently ignore clipboard errors
  }
}
</script>

<style scoped>
.message-wrapper {
  padding: 1.25rem 0;
  animation: slideUp 0.3s ease-out;
}

.message-wrapper.user {
  background: var(--bg-secondary);
  margin: 0 -1.5rem;
  padding: 1.25rem 1.5rem;
}

.message-wrapper.assistant {
  background: transparent;
}

.message-content {
  display: flex;
  gap: 1rem;
  max-width: 48rem;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.message-avatar {
  flex-shrink: 0;
  padding-top: 0.15rem;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
}

.user-avatar {
  background: var(--accent-primary);
  color: #fff;
  box-shadow: 0 3px 0 0 #11a89b;
}

.ai-avatar {
  background: var(--bg-secondary);
  border: 2px solid var(--accent-primary);
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-author {
  font-size: 0.8125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.message-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: #c4b89e;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* ─── Status Indicators ─── */
.message-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.message-status.error {
  color: #e05a5a;
  background: rgba(224, 90, 90, 0.08);
}

.message-status.interrupted {
  color: #c49a3a;
  background: rgba(196, 154, 58, 0.08);
}

/* ─── Edit Area ─── */
.edit-area {
  width: 100%;
}

.edit-textarea {
  width: 100%;
  background: var(--bg-input);
  border: 2.5px solid var(--border-color);
  border-radius: 20px;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.5;
  resize: none;
  outline: none;
  min-height: 48px;
  max-height: 200px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 0 var(--input-shadow);
}

.edit-textarea:focus {
  border-color: var(--focus-yellow);
  box-shadow: 0 3px 0 0 var(--focus-yellow-darker), 0 0 0 3px rgba(255, 204, 0, 0.15);
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.edit-btn {
  padding: 0.4rem 0.875rem;
  border-radius: 50px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  font-family: inherit;
  letter-spacing: 0.02em;
}

.edit-cancel {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.edit-cancel:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.edit-save {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
  box-shadow: 0 4px 0 0 #11a89b;
}

.edit-save:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  box-shadow: 0 5px 0 0 #11a89b;
  transform: translateY(-1px);
}

.edit-save:active {
  box-shadow: 0 1px 0 0 #11a89b;
  transform: translateY(2px);
}

.message-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.message-time {
  font-size: 0.6875rem;
  font-weight: 400;
  color: var(--text-muted);
  opacity: 0.7;
  transition: opacity 0.2s, color 0.2s;
}

.message-wrapper:hover .message-time {
  opacity: 1;
  color: var(--text-secondary);
}

/* ─── Mobile Responsive ─── */
@media (max-width: 768px) {
  .message-wrapper {
    padding: 0.875rem 0;
  }

  .message-wrapper.user {
    margin: 0 -0.75rem;
    padding: 0.875rem 0.75rem;
  }

  .message-content {
    gap: 0.625rem;
    padding: 0 0.75rem;
  }

  .avatar {
    width: 32px;
    height: 32px;
    font-size: 0.7rem;
  }

  .message-author {
    font-size: 0.75rem;
    margin-bottom: 0.375rem;
  }

  .markdown-body {
    font-size: 0.875rem;
    line-height: 1.65;
  }

  .message-actions {
    opacity: 1;
    gap: 0.375rem;
    margin-top: 0.5rem;
  }

  .action-btn {
    width: 36px;
    height: 36px;
  }

  .action-btn svg {
    width: 16px;
    height: 16px;
  }
}
</style>
