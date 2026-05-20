<template>
  <div class="chat-input-container">
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="inputValue"
        :placeholder="
          disabled ? $t('chatInput.placeholderGenerating') : $t('chatInput.placeholder')
        "
        :disabled="disabled"
        class="chat-textarea"
        rows="1"
        @keydown="handleKeydown"
        @input="autoResize"
      />
      <button
        :class="['send-btn', { active: inputValue.trim() && !disabled, streaming: isStreaming }]"
        :disabled="!inputValue.trim() || disabled"
        :aria-label="isStreaming ? $t('chatInput.stop') : $t('chatInput.send')"
        :title="isStreaming ? $t('chatInput.stop') : $t('chatInput.send')"
        @click="handleSend"
      >
        <svg v-if="!isStreaming" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>
    </div>

    <p
      class="input-hint"
      v-html="$t('chatInput.hint', { enter: 'Enter', shiftEnter: 'Shift + Enter' })"
    ></p>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import { loadDraft, saveDraft, clearDraft } from '@/utils/storage'

const props = defineProps({
  disabled: { type: Boolean, default: false },
  isStreaming: { type: Boolean, default: false },
  conversationId: { type: String, default: null },
})

const emit = defineEmits(['send', 'cancel'])

const inputValue = ref('')
const textareaRef = ref(null)
let suppressSave = false

function restoreDraft() {
  suppressSave = true
  inputValue.value = loadDraft(props.conversationId)
  nextTick(() => {
    suppressSave = false
    autoResize()
  })
}

onMounted(() => {
  restoreDraft()
})

watch(
  () => props.conversationId,
  () => {
    restoreDraft()
  }
)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  const value = inputValue.value.trim()
  if (!value || props.disabled) return

  const currentConvId = props.conversationId
  emit('send', value)

  clearDraft(currentConvId)
  inputValue.value = ''

  nextTick(() => {
    autoResize()
    textareaRef.value?.focus()
  })
}

watch(inputValue, (val) => {
  autoResize()
  if (suppressSave) return
  if (!val) {
    clearDraft(props.conversationId)
  } else {
    saveDraft(props.conversationId, val)
  }
})

function focus() {
  textareaRef.value?.focus()
}

defineExpose({ focus })
</script>

<style scoped>
.chat-input-container {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1rem 1.5rem 1.5rem;
  width: 100%;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: flex-end;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 0.75rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.15);
}

.chat-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  max-height: 200px;
  min-height: 24px;
  padding: 0;
}

.chat-textarea::placeholder {
  color: var(--text-muted);
}

.chat-textarea:disabled {
  opacity: 0.6;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn.active {
  background: var(--accent-primary);
  color: white;
}

.send-btn.active:hover {
  background: var(--accent-hover);
}

.send-btn.streaming {
  background: #ef4444;
  color: white;
}

.send-btn.streaming:hover {
  background: #dc2626;
}

.send-btn:disabled {
  cursor: not-allowed;
}

.input-hint {
  text-align: center;
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.input-hint kbd {
  display: inline-block;
  padding: 0.1rem 0.35rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  font-size: 0.625rem;
  font-family: inherit;
  color: var(--text-secondary);
}
</style>
