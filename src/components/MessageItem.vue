<template>
  <div :class="['message-wrapper', message.role]">
    <div class="message-content">
      <div class="message-avatar">
        <div v-if="message.role === 'user'" class="avatar user-avatar">
          U
        </div>
        <div v-else class="avatar ai-avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
      </div>

      <div class="message-body">
        <div class="message-author">
          {{ message.role === 'user' ? 'You' : 'AI Assistant' }}
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
            <button class="edit-btn edit-cancel" @click="cancelEdit">Cancel</button>
            <button class="edit-btn edit-save" @click="saveEdit">Save & Submit</button>
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

          <div v-if="message.streaming" class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div class="message-actions">
            <button v-if="message.role === 'user'" class="action-btn" @click="startEdit" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="action-btn" @click="copyMessage" title="Copy">
              <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { renderMarkdown, escapeHtmlText } from '@/utils/markdown'

const props = defineProps({
  message: { type: Object, required: true },
})

const emit = defineEmits(['edit'])

const contentRef = ref(null)
const copied = ref(false)
const isEditing = ref(false)
const editContent = ref('')
const editTextareaRef = ref(null)

const renderedContent = computed(() => {
  const { content, role } = props.message
  if (!content) return ''

  if (role === 'user') {
    // For user messages, escape HTML to prevent XSS, convert newlines
    return escapeHtmlText(content).replace(/\n/g, '<br>')
  }

  // For AI messages, render markdown
  return renderMarkdown(content)
})

// Auto-scroll when streaming content updates
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

async function copyMessage() {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = props.message.content
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

/**
 * Event-delegation handler for clicks inside rendered markdown.
 * Currently handles code-block copy buttons (replaces inline onclick).
 */
async function handleContentClick(e) {
  const btn = e.target.closest('button[data-action="copy-code"]')
  if (!btn) return

  const wrapper = btn.closest('.code-block-wrapper')
  const codeEl = wrapper?.querySelector('code')
  if (!codeEl) return

  try {
    await navigator.clipboard.writeText(codeEl.textContent)
    btn.classList.add('copied')
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied!`
    setTimeout(() => {
      btn.classList.remove('copied')
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        Copy`
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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
}

.user-avatar {
  background: #6366f1;
  color: white;
}

.ai-avatar {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-author {
  font-size: 0.8125rem;
  font-weight: 600;
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
  padding: 0.3rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* ─── Edit Area ─── */
.edit-area {
  width: 100%;
}

.edit-textarea {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  outline: none;
  min-height: 48px;
  max-height: 200px;
}

.edit-textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.15);
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.edit-btn {
  padding: 0.4rem 0.875rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
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
  color: white;
  border-color: var(--accent-primary);
}

.edit-save:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}
</style>
