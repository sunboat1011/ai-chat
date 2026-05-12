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

        <div
          ref="contentRef"
          class="markdown-body"
          v-html="renderedContent"
        ></div>

        <div v-if="message.streaming" class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div class="message-actions">
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

const contentRef = ref(null)
const copied = ref(false)

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
</script>

<style scoped>
.message-wrapper {
  padding: 1.25rem 0;
  animation: slideUp 0.3s ease-out;
}

.message-wrapper.user {
  background: #2f2f2f;
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
  background: #2f2f2f;
  border: 1px solid #424242;
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-author {
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #ececec;
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
  color: #6b6b6b;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.action-btn:hover {
  background: #3d3d3d;
  color: #ececec;
}
</style>
