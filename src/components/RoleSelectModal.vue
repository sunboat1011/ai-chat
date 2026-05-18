<template>
  <div class="role-modal-overlay" @click="handleOverlayClick">
    <div class="role-modal" @click.stop>
      <div class="modal-header">
        <h2>Choose a Role</h2>
        <p class="modal-subtitle">Select a preset or create your own system prompt</p>
      </div>

      <div class="role-content">
        <!-- Preset roles -->
        <div class="preset-grid">
          <button
            v-for="preset in PRESETS"
            :key="preset.name"
            type="button"
            :class="['preset-card', { active: selectedPreset === preset.name }]"
            @click="selectPreset(preset)"
          >
            <span class="preset-icon">{{ preset.icon }}</span>
            <span class="preset-name">{{ preset.name }}</span>
            <span class="preset-desc">{{ preset.description }}</span>
          </button>

          <button
            type="button"
            :class="['preset-card', 'custom-card', { active: selectedPreset === 'Custom' }]"
            @click="selectCustom"
          >
            <span class="preset-icon">✏️</span>
            <span class="preset-name">Custom</span>
            <span class="preset-desc">Write your own system prompt</span>
          </button>
        </div>

        <!-- Custom prompt textarea -->
        <div v-if="selectedPreset === 'Custom' || customPrompt" class="custom-area">
          <label for="custom-prompt">System Prompt</label>
          <textarea
            id="custom-prompt"
            v-model="customPrompt"
            rows="4"
            placeholder="e.g., You are a helpful coding assistant..."
            class="custom-textarea"
          />
          <p class="hint">
            The system prompt defines how the AI behaves throughout this conversation.
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="skip-btn" @click="handleSkip">Skip</button>
        <button
          type="button"
          class="confirm-btn"
          :disabled="selectedPreset === 'Custom' && !customPrompt.trim()"
          @click="handleConfirm"
        >
          Start Chat
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const PRESETS = [
  {
    name: 'General Assistant',
    icon: '🤖',
    description: 'Helpful, harmless, honest',
    prompt: 'You are a helpful AI assistant. Answer questions clearly and concisely.',
  },
  {
    name: 'Code Expert',
    icon: '💻',
    description: 'Programming & debugging',
    prompt: 'You are an expert software engineer. Provide clean, well-documented code. Explain your reasoning step by step. Prefer modern best practices.',
  },
  {
    name: 'Creative Writer',
    icon: '✍️',
    description: 'Storytelling & copywriting',
    prompt: 'You are a creative writing assistant. Help with storytelling, copywriting, and brainstorming. Be imaginative and inspiring.',
  },
  {
    name: 'Translator',
    icon: '🌐',
    description: 'Accurate translations',
    prompt: 'You are a professional translator. Provide accurate, natural-sounding translations. Preserve tone and context. Explain nuances when relevant.',
  },
  {
    name: 'Data Analyst',
    icon: '📊',
    description: 'Analysis & insights',
    prompt: 'You are a data analyst. Help interpret data, create visualizations (in text/Markdown), and derive actionable insights. Be precise with numbers.',
  },
]

const emit = defineEmits(['confirm', 'skip'])

const selectedPreset = ref('General Assistant')
const customPrompt = ref('')

function selectPreset(preset) {
  selectedPreset.value = preset.name
  customPrompt.value = preset.prompt
}

function selectCustom() {
  selectedPreset.value = 'Custom'
  customPrompt.value = ''
}

function handleSkip() {
  emit('skip')
}

function handleConfirm() {
  const prompt = selectedPreset.value === 'Custom'
    ? customPrompt.value.trim()
    : customPrompt.value.trim()
  emit('confirm', prompt)
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
  width: 480px;
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
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.875rem 0.5rem;
  border: 1px solid var(--border-color, #424242);
  border-radius: 0.5rem;
  background: var(--bg-input, #2a2a2a);
  color: var(--text-primary, #ececec);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
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
  font-size: 1.5rem;
  line-height: 1;
}

.preset-name {
  font-size: 0.8125rem;
  font-weight: 600;
}

.preset-desc {
  font-size: 0.6875rem;
  color: var(--text-secondary, #a0a0a0);
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
  transition: border-color 0.2s, box-shadow 0.2s;
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
</style>
