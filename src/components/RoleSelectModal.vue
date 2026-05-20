<template>
  <div class="role-modal-overlay" @click="handleOverlayClick">
    <div class="role-modal" @click.stop>
      <div class="modal-header">
        <h2>{{ $t('roleModal.title') }}</h2>
        <p class="modal-subtitle">{{ $t('roleModal.subtitle') }}</p>
      </div>

      <div class="role-content">
        <!-- Template grid -->
        <div class="preset-grid">
          <button
            v-for="template in allTemplates"
            :key="template.id"
            type="button"
            :class="['preset-card', { active: selectedTemplateId === template.id }]"
            :aria-label="$t('roleModal.selectTemplate', { name: template.name })"
            :aria-pressed="selectedTemplateId === template.id"
            @click="selectTemplate(template)"
          >
            <span class="preset-icon">{{ template.icon }}</span>
            <span class="preset-name">{{ template.name }}</span>
            <span class="preset-desc">{{ template.description }}</span>
            <span
              v-if="template.messages && template.messages.length > 0"
              class="preset-badge"
              title="Has initial messages"
            >
              {{ template.messages.length }} msg
            </span>
          </button>

          <button
            type="button"
            :class="['preset-card', 'custom-card', { active: selectedTemplateId === '__custom__' }]"
            :aria-label="$t('roleModal.customAria')"
            :aria-pressed="selectedTemplateId === '__custom__'"
            @click="selectCustom"
          >
            <span class="preset-icon">✏️</span>
            <span class="preset-name">{{ $t('roleModal.custom') }}</span>
            <span class="preset-desc">{{ $t('roleModal.customDesc') }}</span>
          </button>
        </div>

        <!-- Custom prompt textarea -->
        <div v-if="selectedTemplateId === '__custom__' || showCustomArea" class="custom-area">
          <label for="custom-prompt">{{ $t('roleModal.systemPrompt') }}</label>
          <textarea
            id="custom-prompt"
            v-model="customPrompt"
            rows="4"
            placeholder="e.g., You are a helpful coding assistant..."
            class="custom-textarea"
          />
          <p class="hint">
            {{ $t('roleModal.systemPromptHint') }}
          </p>
        </div>

        <!-- Template detail preview -->
        <div v-else-if="selectedTemplate && selectedTemplate.systemPrompt" class="template-preview">
          <label>{{ $t('roleModal.systemPrompt') }}</label>
          <p class="template-preview-text">{{ selectedTemplate.systemPrompt }}</p>
          <div
            v-if="selectedTemplate.messages && selectedTemplate.messages.length > 0"
            class="template-messages-preview"
          >
            <label
              >{{ $t('roleModal.initialMessages') }} ({{ selectedTemplate.messages.length }})</label
            >
            <div
              v-for="(msg, idx) in selectedTemplate.messages"
              :key="idx"
              class="template-msg-item"
            >
              <span class="template-msg-role">{{ msg.role }}</span>
              <span class="template-msg-content">{{ msg.content }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="skip-btn"
          :aria-label="$t('roleModal.skip')"
          @click="handleSkip"
        >
          {{ $t('roleModal.skip') }}
        </button>
        <button
          type="button"
          class="confirm-btn"
          :aria-label="$t('roleModal.startChatAria')"
          :disabled="selectedTemplateId === '__custom__' && !customPrompt.trim()"
          @click="handleConfirm"
        >
          {{ $t('roleModal.startChat') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettings } from '@/composables/useSettings'

const emit = defineEmits(['confirm', 'skip'])

const { getAllTemplates } = useSettings()

const allTemplates = computed(() => getAllTemplates())

const selectedTemplateId = ref('builtin-general')
const customPrompt = ref('')

const selectedTemplate = computed(() =>
  allTemplates.value.find((t) => t.id === selectedTemplateId.value)
)

const showCustomArea = computed(() => {
  const t = selectedTemplate.value
  return t && !t.systemPrompt && t.id !== '__custom__'
})

function selectTemplate(template) {
  selectedTemplateId.value = template.id
  customPrompt.value = template.systemPrompt || ''
}

function selectCustom() {
  selectedTemplateId.value = '__custom__'
  customPrompt.value = ''
}

function handleSkip() {
  emit('skip')
}

function handleConfirm() {
  if (selectedTemplateId.value === '__custom__') {
    emit('confirm', {
      systemPrompt: customPrompt.value.trim(),
      messages: [],
    })
  } else {
    const template = selectedTemplate.value
    if (template) {
      emit('confirm', {
        systemPrompt: template.systemPrompt || '',
        messages: template.messages || [],
      })
    } else {
      emit('confirm', { systemPrompt: '', messages: [] })
    }
  }
}

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) {
    handleSkip()
  }
}
</script>

<style scoped>
.role-modal-overlay {
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

.role-modal {
  width: 520px;
  max-width: 90vw;
  max-height: 85vh;
  background: var(--bg-secondary, #2f2f2f);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  color: var(--text-primary, #ececec);
  animation: slideUp 0.25s ease-out;
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 1.25rem 1.5rem 0.75rem;
  text-align: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.modal-subtitle {
  font-size: 0.8125rem;
  color: var(--text-secondary, #a0a0a0);
  margin: 0;
}

.role-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1.5rem;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.4rem;
  border: 1px solid var(--border-color, #424242);
  border-radius: 0.5rem;
  background: var(--bg-input, #2a2a2a);
  color: var(--text-primary, #ececec);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  position: relative;
}

.preset-card:hover {
  border-color: var(--accent-primary, #10a37f);
  background: var(--bg-elevated, #353535);
}

.preset-card.active {
  border-color: var(--accent-primary, #10a37f);
  background: rgba(16, 163, 127, 0.1);
}

.preset-icon {
  font-size: 1.35rem;
  line-height: 1;
}

.preset-name {
  font-size: 0.78rem;
  font-weight: 600;
}

.preset-desc {
  font-size: 0.65rem;
  color: var(--text-secondary, #a0a0a0);
  line-height: 1.2;
}

.preset-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.6rem;
  padding: 1px 4px;
  background: var(--accent-primary, #10a37f);
  color: white;
  border-radius: 0.25rem;
  font-weight: 500;
}

.custom-area {
  margin-top: 1rem;
}

.custom-area label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  margin-bottom: 0.4rem;
  color: var(--text-secondary, #a0a0a0);
}

.custom-textarea {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color, #424242);
  background: var(--bg-input, #2a2a2a);
  color: var(--text-primary, #ececec);
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.custom-textarea:focus {
  outline: none;
  border-color: var(--accent-primary, #10a37f);
  box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.2);
}

.custom-textarea::placeholder {
  color: var(--text-muted, #6b6b6b);
}

.hint {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-muted, #6b6b6b);
}

/* ─── Template preview ─── */
.template-preview {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: var(--bg-input, #2a2a2a);
  border: 1px solid var(--border-color, #424242);
}

.template-preview label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #a0a0a0);
  margin-bottom: 0.35rem;
}

.template-preview-text {
  font-size: 0.8125rem;
  color: var(--text-primary, #ececec);
  line-height: 1.5;
  margin: 0;
}

.template-messages-preview {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color, #424242);
}

.template-msg-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.4rem 0;
  font-size: 0.78rem;
}

.template-msg-role {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--accent-primary, #10a37f);
  text-transform: capitalize;
  min-width: 3.5rem;
}

.template-msg-content {
  color: var(--text-secondary, #a0a0a0);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color, #424242);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.skip-btn {
  padding: 0.55rem 1rem;
  background: transparent;
  color: var(--text-secondary, #a0a0a0);
  border: 1px solid var(--border-color, #424242);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.skip-btn:hover {
  background: var(--bg-elevated, #353535);
  color: var(--text-primary, #ececec);
}

.confirm-btn {
  padding: 0.55rem 1.5rem;
  background: var(--accent-primary, #10a37f);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background: var(--accent-hover, #0d8a6c);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Mobile Responsive ─── */
@media (max-width: 768px) {
  .role-modal {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .preset-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .preset-card {
    padding: 0.625rem 0.3rem;
  }

  .preset-icon {
    font-size: 1.15rem;
  }

  .preset-name {
    font-size: 0.75rem;
  }

  .preset-desc {
    font-size: 0.625rem;
  }

  .modal-header {
    padding: 1rem 1rem 0.5rem;
  }

  .modal-header h2 {
    font-size: 1.1rem;
  }

  .role-content {
    padding: 0.5rem 1rem;
  }

  .modal-footer {
    padding: 0.875rem 1rem;
  }

  .template-msg-item {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
