<template>
  <div class="settings-modal-overlay" @click="close">
    <div ref="settingsModalRef" class="settings-modal" @click.stop>
      <div class="modal-header">
        <h2>{{ $t('settings.title') }}</h2>
        <button @click="close" class="close-btn" :aria-label="$t('settings.close')">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6L18 18" />
          </svg>
        </button>
      </div>

      <div class="settings-content">
        <!-- Appearance -->
        <div class="setting-group">
          <h3>{{ $t('settings.appearance') }}</h3>

          <div class="setting-item">
            <label>{{ $t('settings.theme') }}</label>
            <div class="theme-options">
              <button
                type="button"
                :class="{ active: settings.theme === 'dark' }"
                :aria-label="$t('settings.themeDark')"
                :aria-pressed="settings.theme === 'dark'"
                @click="settings.theme = 'dark'"
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
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                {{ $t('settings.dark') }}
              </button>
              <button
                type="button"
                :class="{ active: settings.theme === 'light' }"
                :aria-label="$t('settings.themeLight')"
                :aria-pressed="settings.theme === 'light'"
                @click="settings.theme = 'light'"
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
                {{ $t('settings.light') }}
              </button>
              <button
                type="button"
                :class="{ active: settings.theme === 'system' }"
                :aria-label="$t('settings.themeSystem')"
                :aria-pressed="settings.theme === 'system'"
                @click="settings.theme = 'system'"
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
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                {{ $t('settings.system') }}
              </button>
            </div>
          </div>

          <div class="setting-item">
            <label>{{ $t('settings.accentColor') }}</label>
            <div class="color-options">
              <button
                v-for="(hex, name) in ACCENT_COLORS"
                :key="name"
                type="button"
                class="color-option"
                :class="{ active: settings.accentColor === name }"
                :aria-label="$t('settings.accentColorLabel', { name })"
                :aria-pressed="settings.accentColor === name"
                @click="settings.accentColor = name"
                :title="name"
              >
                <span class="color-swatch" :style="{ background: hex }"></span>
                <span class="color-name">{{ name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- API Configuration -->
        <div class="setting-group">
          <h3>{{ $t('settings.apiConfig') }}</h3>

          <div class="setting-item">
            <label for="api-url">{{ $t('settings.apiBaseUrl') }}</label>
            <input
              id="api-url"
              type="text"
              v-model="settings.apiBaseUrl"
              placeholder="http://localhost:8080/api"
            />
            <p class="hint">{{ $t('settings.apiBaseUrlHint') }}</p>
          </div>

          <div class="setting-item">
            <label for="model">{{ $t('settings.defaultModel') }}</label>
            <select id="model" v-model="settings.model">
              <optgroup :label="$t('settings.builtIn')">
                <option v-for="m in builtInModels" :key="m.id" :value="m.id">{{ m.name }}</option>
              </optgroup>
              <optgroup v-if="customModels.length > 0" :label="$t('settings.custom')">
                <option v-for="m in customModels" :key="m.id" :value="m.id">
                  {{ m.name }}
                </option>
              </optgroup>
            </select>
          </div>
        </div>

        <!-- Custom Models -->
        <div class="setting-group">
          <div class="setting-group-header">
            <h3>{{ $t('settings.customModels') }}</h3>
            <button
              type="button"
              class="group-add-btn"
              @click="openCustomModelForm"
              :aria-label="$t('settings.addCustomModel')"
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {{ $t('settings.add') }}
            </button>
          </div>

          <div v-if="customModels.length === 0" class="custom-model-empty">
            {{ $t('settings.noCustomModels') }}
          </div>

          <div v-else class="custom-model-list">
            <div
              v-for="m in customModels"
              :key="m.id"
              class="custom-model-item"
              :class="{ active: settings.model === m.id }"
            >
              <div class="custom-model-info">
                <span class="custom-model-name">{{ m.name }}</span>
                <span class="custom-model-id">{{ m.modelName || m.modelId }}</span>
              </div>
              <div class="custom-model-actions">
                <button
                  type="button"
                  class="custom-model-action-btn"
                  :aria-label="$t('settings.editCustomModel')"
                  title="Edit"
                  @click="editCustomModel(m)"
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
                  type="button"
                  class="custom-model-action-btn delete"
                  :aria-label="$t('settings.deleteCustomModel')"
                  title="Delete"
                  @click="removeCustomModel(m.id)"
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
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Model Form Modal -->
        <div v-if="showCustomModelForm" class="custom-model-overlay" @click="closeCustomModelForm">
          <div ref="customModelFormRef" class="custom-model-form" @click.stop>
            <div class="custom-model-form-header">
              <h4>
                {{ editingModelId ? $t('settings.editModelTitle') : $t('settings.addModelTitle') }}
              </h4>
              <p class="custom-model-form-hint">{{ $t('settings.modelFormHint') }}</p>
            </div>

            <div class="custom-model-form-body">
              <div class="form-field">
                <label for="cm-name">{{ $t('settings.displayName') }}</label>
                <input
                  id="cm-name"
                  v-model="cmForm.name"
                  type="text"
                  :placeholder="$t('settings.displayNamePlaceholder')"
                />
              </div>
              <div class="form-field">
                <label for="cm-model-id">{{ $t('settings.modelId') }}</label>
                <input
                  id="cm-model-id"
                  v-model="cmForm.modelId"
                  type="text"
                  :placeholder="$t('settings.modelIdPlaceholder')"
                />
              </div>
              <div class="form-field">
                <label for="cm-model-name">{{ $t('settings.modelName') }}</label>
                <input
                  id="cm-model-name"
                  v-model="cmForm.modelName"
                  type="text"
                  :placeholder="$t('settings.modelNamePlaceholder')"
                />
                <p class="hint">{{ $t('settings.modelNameHint') }}</p>
              </div>
              <div class="form-field">
                <label for="cm-provider">{{ $t('settings.provider') }}</label>
                <select id="cm-provider" v-model="cmForm.provider">
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="ollama">Ollama</option>
                  <option value="zhipuai">Zhipu AI</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div class="form-field">
                <label for="cm-api-url">{{ $t('settings.apiUrlOptional') }}</label>
                <input
                  id="cm-api-url"
                  v-model="cmForm.apiUrl"
                  type="text"
                  :placeholder="$t('settings.apiUrlPlaceholder')"
                />
                <p class="hint">{{ $t('settings.apiUrlHint') }}</p>
              </div>
              <div class="form-field">
                <label for="cm-api-key">{{ $t('settings.apiKeyOptional') }}</label>
                <input
                  id="cm-api-key"
                  v-model="cmForm.apiKey"
                  type="password"
                  :placeholder="$t('settings.apiKeyPlaceholder')"
                />
                <p class="hint">{{ $t('settings.apiKeyHint') }}</p>
              </div>
            </div>

            <div class="custom-model-form-actions">
              <button
                type="button"
                class="cm-btn cm-btn-cancel"
                :aria-label="$t('settings.cancel')"
                @click="closeCustomModelForm"
              >
                {{ $t('settings.cancel') }}
              </button>
              <button
                type="button"
                class="cm-btn cm-btn-save"
                :aria-label="editingModelId ? $t('settings.update') : $t('settings.add')"
                :disabled="isSavingModel"
                @click="saveCustomModel"
              >
                {{ isSavingModel ? $t('settings.saving') : (editingModelId ? $t('settings.update') : $t('settings.add')) }}
              </button>
            </div>
          </div>
        </div>

        <!-- Templates -->
        <div class="setting-group">
          <div class="setting-group-header">
            <h3>{{ $t('settings.templates') }}</h3>
            <button
              type="button"
              class="group-add-btn"
              @click="openTemplateForm"
              :aria-label="$t('settings.addTemplate')"
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {{ $t('settings.add') }}
            </button>
          </div>

          <div v-if="allTemplates.length === BUILT_IN_TEMPLATES.length" class="custom-model-empty">
            {{ $t('settings.noCustomTemplates') }}
          </div>

          <div class="custom-model-list">
            <div v-for="t in allTemplates" :key="t.id" class="custom-model-item">
              <div class="custom-model-info">
                <span class="custom-model-name">
                  <span style="margin-right: 0.35rem">{{ t.icon }}</span>
                  {{ t.name }}
                  <span v-if="t.builtIn" class="template-built-in-badge">{{
                    $t('settings.builtInBadge')
                  }}</span>
                </span>
                <span class="custom-model-id">{{ t.description }}</span>
              </div>
              <div v-if="!t.builtIn" class="custom-model-actions">
                <button
                  type="button"
                  class="custom-model-action-btn"
                  :aria-label="$t('settings.editTemplate')"
                  title="Edit"
                  @click="editTemplate(t)"
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
                  type="button"
                  class="custom-model-action-btn delete"
                  :aria-label="$t('settings.deleteTemplate')"
                  title="Delete"
                  @click="removeTemplate(t.id)"
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
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Template Form Modal -->
        <div v-if="showTemplateForm" class="custom-model-overlay" @click="closeTemplateForm">
          <div ref="templateFormRef" class="custom-model-form" @click.stop>
            <div class="custom-model-form-header">
              <h4>
                {{
                  editingTemplateId
                    ? $t('settings.editTemplateTitle')
                    : $t('settings.addTemplateTitle')
                }}
              </h4>
              <p class="custom-model-form-hint">{{ $t('settings.templateFormHint') }}</p>
            </div>

            <div class="custom-model-form-body">
              <div class="form-field">
                <label for="tmpl-name">{{ $t('settings.name') }}</label>
                <input
                  id="tmpl-name"
                  v-model="tmplForm.name"
                  type="text"
                  :placeholder="$t('settings.namePlaceholder')"
                />
              </div>
              <div
                class="form-field"
                style="display: grid; grid-template-columns: 80px 1fr; gap: 0.75rem"
              >
                <div>
                  <label for="tmpl-icon">{{ $t('settings.icon') }}</label>
                  <input
                    id="tmpl-icon"
                    v-model="tmplForm.icon"
                    type="text"
                    :placeholder="$t('settings.iconPlaceholder')"
                    style="text-align: center"
                  />
                </div>
                <div>
                  <label for="tmpl-desc">{{ $t('settings.description') }}</label>
                  <input
                    id="tmpl-desc"
                    v-model="tmplForm.description"
                    type="text"
                    :placeholder="$t('settings.descriptionPlaceholder')"
                  />
                </div>
              </div>
              <div class="form-field">
                <label for="tmpl-prompt">{{ $t('settings.systemPrompt') }}</label>
                <textarea
                  id="tmpl-prompt"
                  v-model="tmplForm.systemPrompt"
                  rows="4"
                  placeholder="e.g., You are a helpful coding assistant..."
                  style="
                    width: 100%;
                    padding: 0.65rem 0.75rem;
                    border-radius: 20px;
                    border: 2.5px solid var(--border-color);
                    background: var(--bg-input);
                    color: var(--text-primary);
                    font-size: 0.875rem;
                    font-family: inherit;
                    font-weight: 500;
                    resize: vertical;
                    outline: none;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 3px 0 0 var(--input-shadow);
                  "
                />
                <p class="hint">{{ $t('settings.templatePromptHint') }}</p>
              </div>
            </div>

            <div class="custom-model-form-actions">
              <button
                type="button"
                class="cm-btn cm-btn-cancel"
                :aria-label="$t('settings.cancel')"
                @click="closeTemplateForm"
              >
                {{ $t('settings.cancel') }}
              </button>
              <button
                type="button"
                class="cm-btn cm-btn-save"
                :aria-label="editingTemplateId ? $t('settings.update') : $t('settings.add')"
                @click="saveTemplate"
              >
                {{ editingTemplateId ? $t('settings.update') : $t('settings.add') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Model Parameters -->
        <div class="setting-group">
          <div class="setting-group-header">
            <h3>{{ $t('settings.modelParams') }}</h3>
            <button
              type="button"
              class="group-reset-btn"
              :aria-label="$t('settings.resetToDefault')"
              @click="handleResetModelParams"
              :title="$t('settings.resetToDefault')"
            >
              {{ $t('settings.resetToDefaultShort') }}
            </button>
          </div>

          <div class="setting-item">
            <div class="slider-label-row">
              <label>{{ $t('settings.temperature') }}</label>
              <span class="slider-value">{{ Number(settings.temperature).toFixed(1) }}</span>
            </div>
            <input
              type="range"
              :min="MODEL_PARAM_BOUNDS.temperature.min"
              :max="MODEL_PARAM_BOUNDS.temperature.max"
              :step="MODEL_PARAM_BOUNDS.temperature.step"
              v-model.number="settings.temperature"
              class="slider-input"
            />
            <p class="hint">
              {{ $t('settings.temperatureHint', { default: DEFAULT_MODEL_PARAMS.temperature }) }}
            </p>
          </div>

          <div class="setting-item">
            <div class="slider-label-row">
              <label>{{ $t('settings.maxTokens') }}</label>
              <span class="slider-value">{{ settings.maxTokens }}</span>
            </div>
            <input
              type="number"
              :min="MODEL_PARAM_BOUNDS.maxTokens.min"
              :max="MODEL_PARAM_BOUNDS.maxTokens.max"
              v-model.number="settings.maxTokens"
              class="number-input"
            />
            <p class="hint">
              {{ $t('settings.maxTokensHint', { default: DEFAULT_MODEL_PARAMS.maxTokens }) }}
            </p>
          </div>

          <div class="setting-item">
            <div class="slider-label-row">
              <label>{{ $t('settings.topP') }}</label>
              <span class="slider-value">{{ Number(settings.topP).toFixed(2) }}</span>
            </div>
            <input
              type="range"
              :min="MODEL_PARAM_BOUNDS.topP.min"
              :max="MODEL_PARAM_BOUNDS.topP.max"
              :step="MODEL_PARAM_BOUNDS.topP.step"
              v-model.number="settings.topP"
              class="slider-input"
            />
            <p class="hint">
              {{ $t('settings.topPHint', { default: DEFAULT_MODEL_PARAMS.topP }) }}
            </p>
          </div>
        </div>

        <!-- System Prompt -->
        <div class="setting-group">
          <h3>{{ $t('settings.systemPrompt') }}</h3>

          <div class="setting-item">
            <label for="default-system-prompt">{{ $t('settings.defaultSystemPrompt') }}</label>
            <textarea
              id="default-system-prompt"
              v-model="settings.defaultSystemPrompt"
              rows="4"
              placeholder="e.g., You are a helpful coding assistant..."
            />
            <p class="hint">
              {{ $t('settings.defaultSystemPromptHint') }}
            </p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="reset-btn"
          :aria-label="$t('settings.resetAll')"
          @click="handleReset"
        >
          {{ $t('settings.resetAll') }}
        </button>
        <button type="button" class="save-btn" :aria-label="$t('settings.done')" @click="close">
          {{ $t('settings.done') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { useText } from '@/composables/useText'

const { t } = useText()

const emit = defineEmits(['close'])

// ─── Focus trap ───
const settingsModalRef = ref(null)
const customModelFormRef = ref(null)
const templateFormRef = ref(null)
let preOpenActiveElement = null

function getFocusableElements(container) {
  if (!container) return []
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  return Array.from(container.querySelectorAll(selector)).filter(
    (el) => !el.disabled && el.offsetParent !== null
  )
}

function getActiveTrapContainer() {
  if (showCustomModelForm.value && customModelFormRef.value) {
    return customModelFormRef.value
  }
  if (showTemplateForm.value && templateFormRef.value) {
    return templateFormRef.value
  }
  if (settingsModalRef.value) {
    return settingsModalRef.value
  }
  return null
}

function applyFocusTrap(e) {
  const container = getActiveTrapContainer()
  if (!container) return

  if (e.key === 'Escape') {
    e.preventDefault()
    if (showCustomModelForm.value) {
      closeCustomModelForm()
    } else if (showTemplateForm.value) {
      closeTemplateForm()
    } else {
      close()
    }
    return
  }

  if (e.key !== 'Tab') return

  const focusable = getFocusableElements(container)
  if (focusable.length === 0) {
    e.preventDefault()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey) {
    if (document.activeElement === first || !container.contains(document.activeElement)) {
      e.preventDefault()
      last.focus()
    }
  } else {
    if (document.activeElement === last || !container.contains(document.activeElement)) {
      e.preventDefault()
      first.focus()
    }
  }
}

function focusFirstInContainer(container) {
  const focusable = getFocusableElements(container)
  if (focusable.length > 0) {
    focusable[0].focus()
  }
}

const {
  settings,
  allModels,
  resetSettings,
  resetModelParams,
  addCustomModel,
  updateCustomModel,
  deleteCustomModel,
  addCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  getAllTemplates,
  DEFAULT_MODEL_PARAMS,
  MODEL_PARAM_BOUNDS,
  ACCENT_COLORS,
  BUILT_IN_TEMPLATES,
} = useSettings()

const allTemplates = computed(() =>
  getAllTemplates().map((t) => ({ ...t, builtIn: t.builtIn ?? false }))
)

const builtInModels = computed(() => allModels.value.filter((m) => m.builtIn))
const customModels = computed(() => allModels.value.filter((m) => m.isCustom))

function close() {
  emit('close')
}

function handleReset() {
  if (confirm(t('settings.resetAllConfirm'))) {
    resetSettings()
  }
}

function handleResetModelParams() {
  if (confirm(t('settings.resetParamsConfirm'))) {
    resetModelParams()
  }
}

// ─── Custom model form ───
const showCustomModelForm = ref(false)
const editingModelId = ref(null)
const cmForm = ref({
  name: '',
  modelId: '',
  modelName: '',
  provider: 'openai',
  apiUrl: '',
  apiKey: '',
})
const isSavingModel = ref(false)

function openCustomModelForm() {
  editingModelId.value = null
  cmForm.value = { name: '', modelId: '', modelName: '', provider: 'openai', apiUrl: '', apiKey: '' }
  showCustomModelForm.value = true
}

function editCustomModel(model) {
  editingModelId.value = model.id
  cmForm.value = {
    name: model.name,
    modelId: model.modelId || model.id,
    modelName: model.modelName || model.modelId || '',
    provider: model.provider || 'openai',
    apiUrl: model.apiUrl || '',
    apiKey: '',
  }
  showCustomModelForm.value = true
}

function closeCustomModelForm() {
  showCustomModelForm.value = false
  editingModelId.value = null
  cmForm.value = { name: '', modelId: '', modelName: '', provider: 'openai', apiUrl: '', apiKey: '' }
}

async function saveCustomModel() {
  if (isSavingModel.value) return

  const payload = {
    name: cmForm.value.name,
    modelId: cmForm.value.modelId,
    modelName: cmForm.value.modelName,
    provider: cmForm.value.provider,
    apiUrl: cmForm.value.apiUrl,
  }
  if (cmForm.value.apiKey?.trim()) {
    payload.apiKey = cmForm.value.apiKey.trim()
  }

  if (!payload.name?.trim()) {
    alert(t('settings.enterDisplayName'))
    return
  }
  if (!payload.modelId?.trim()) {
    alert(t('settings.enterModelId'))
    return
  }

  isSavingModel.value = true
  try {
    if (editingModelId.value) {
      await updateCustomModel(editingModelId.value, payload)
    } else {
      const created = await addCustomModel(payload)
      settings.value.model = created.id
    }
    closeCustomModelForm()
  } catch (err) {
    alert(err.friendlyMessage || err.message || t('settings.saveModelFailed'))
  } finally {
    isSavingModel.value = false
  }
}

async function removeCustomModel(id) {
  const model = customModels.value.find((m) => m.id === id)
  if (model && confirm(t('settings.deleteModelConfirm', { name: model.name }))) {
    try {
      await deleteCustomModel(id)
    } catch (err) {
      alert(err.friendlyMessage || err.message || t('settings.deleteModelFailed'))
    }
  }
}

// ─── Template form ───
const showTemplateForm = ref(false)
const editingTemplateId = ref(null)
const tmplForm = ref({
  name: '',
  icon: '',
  description: '',
  systemPrompt: '',
})

function openTemplateForm() {
  editingTemplateId.value = null
  tmplForm.value = { name: '', icon: '✨', description: '', systemPrompt: '' }
  showTemplateForm.value = true
}

function editTemplate(template) {
  editingTemplateId.value = template.id
  tmplForm.value = {
    name: template.name,
    icon: template.icon || '✨',
    description: template.description || '',
    systemPrompt: template.systemPrompt || '',
  }
  showTemplateForm.value = true
}

function closeTemplateForm() {
  showTemplateForm.value = false
  editingTemplateId.value = null
  tmplForm.value = { name: '', icon: '', description: '', systemPrompt: '' }
}

function saveTemplate() {
  const payload = {
    name: tmplForm.value.name,
    icon: tmplForm.value.icon || '✨',
    description: tmplForm.value.description,
    systemPrompt: tmplForm.value.systemPrompt,
  }

  if (!payload.name?.trim()) {
    alert(t('settings.enterTemplateName'))
    return
  }

  if (editingTemplateId.value) {
    updateCustomTemplate(editingTemplateId.value, payload)
  } else {
    addCustomTemplate(payload)
  }
  closeTemplateForm()
}

function removeTemplate(id) {
  const template = settings.value.customTemplates?.find((t) => t.id === id)
  if (template && confirm(t('settings.deleteTemplateConfirm', { name: template.name }))) {
    deleteCustomTemplate(id)
  }
}

// ─── Focus trap activation ───
watch(showCustomModelForm, (visible) => {
  if (visible) {
    preOpenActiveElement = document.activeElement
    nextTick(() => {
      if (customModelFormRef.value) focusFirstInContainer(customModelFormRef.value)
    })
  } else {
    if (preOpenActiveElement && typeof preOpenActiveElement.focus === 'function') {
      preOpenActiveElement.focus()
    }
    preOpenActiveElement = null
    nextTick(() => {
      if (settingsModalRef.value) focusFirstInContainer(settingsModalRef.value)
    })
  }
})

watch(showTemplateForm, (visible) => {
  if (visible) {
    preOpenActiveElement = document.activeElement
    nextTick(() => {
      if (templateFormRef.value) focusFirstInContainer(templateFormRef.value)
    })
  } else {
    if (preOpenActiveElement && typeof preOpenActiveElement.focus === 'function') {
      preOpenActiveElement.focus()
    }
    preOpenActiveElement = null
    nextTick(() => {
      if (settingsModalRef.value) focusFirstInContainer(settingsModalRef.value)
    })
  }
})

onMounted(() => {
  preOpenActiveElement = document.activeElement
  nextTick(() => {
    if (settingsModalRef.value) focusFirstInContainer(settingsModalRef.value)
  })
  document.addEventListener('keydown', applyFocusTrap)
})

onUnmounted(() => {
  document.removeEventListener('keydown', applyFocusTrap)
  if (preOpenActiveElement && typeof preOpenActiveElement.focus === 'function') {
    preOpenActiveElement.focus()
  }
})
</script>


<style scoped>
.settings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(42, 35, 24, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.settings-modal {
  width: 520px;
  max-width: 90vw;
  background: var(--bg-secondary);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(107, 92, 67, 0.25);
  color: var(--text-primary);
  animation: slideUp 0.25s ease-out;
  border: 2px solid var(--border-color);
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
  padding: 1rem 1.5rem;
  border-bottom: 2px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: #794f27;
}

html.dark .modal-header h2 {
  color: #e8dcc8;
}

.close-btn {
  background: transparent;
  border: none;
  color: #c4b89e;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.settings-content {
  padding: 1.5rem;
  max-height: 65vh;
  overflow-y: auto;
}

.setting-group {
  margin-bottom: 1.75rem;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group h3 {
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-subtle);
}

.setting-item {
  margin-bottom: 1.25rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.hint {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

input,
select {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border-radius: 50px;
  border: 2.5px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 0 var(--input-shadow);
  outline: none;
}

input:focus,
select:focus {
  border-color: var(--focus-yellow);
  box-shadow: 0 3px 0 0 var(--focus-yellow-darker), 0 0 0 3px rgba(255, 204, 0, 0.15);
}

select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c4b89e' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2rem;
}

/* ─── Theme buttons ─── */
.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.theme-options button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 0.5rem;
  border-radius: 50px;
  border: 2px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 0 0 var(--input-shadow);
}

.theme-options button:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: 0 3px 0 0 var(--input-shadow);
  transform: translateY(-1px);
}

.theme-options button.active {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
  box-shadow: 0 3px 0 0 #11a89b;
}

.theme-options button.active:hover {
  box-shadow: 0 4px 0 0 #11a89b;
}

/* ─── Accent color swatches ─── */
.color-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.4rem;
  border-radius: 20px;
  border: 2px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: capitalize;
  font-weight: 600;
}

.color-option:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: 0 3px 0 0 var(--input-shadow);
  transform: translateY(-1px);
}

.color-option.active {
  border-color: var(--accent-primary);
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: 0 0 0 2px var(--accent-primary);
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(114, 93, 66, 0.15);
}

.color-option.active .color-swatch {
  border-color: #fff;
  box-shadow: 0 0 0 2px var(--accent-primary);
}

/* ─── Footer ─── */
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 2px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.reset-btn {
  padding: 0.55rem 1rem;
  background: transparent;
  color: var(--text-muted);
  border: 2px solid var(--border-color);
  border-radius: 50px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  letter-spacing: 0.02em;
}

.reset-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.save-btn {
  padding: 0.55rem 1.5rem;
  background: var(--accent-primary);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 0 0 #11a89b;
}

.save-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 5px 0 0 #11a89b;
  transform: translateY(-1px);
}

.save-btn:active {
  box-shadow: 0 1px 0 0 #11a89b;
  transform: translateY(2px);
}

/* ─── Setting group header with inline reset ─── */
.setting-group-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-subtle);
}

.setting-group-header h3 {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.group-reset-btn {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
  font-weight: 600;
  font-family: inherit;
}

.group-reset-btn:hover {
  color: var(--accent-primary);
  text-decoration: underline;
}

/* ─── Slider + number inputs ─── */
.slider-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-value {
  font-size: 0.8125rem;
  color: var(--accent-primary);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.slider-input {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-color);
  outline: none;
  margin: 0.6rem 0 0.2rem;
  cursor: pointer;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid var(--bg-primary);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(25, 200, 185, 0.2);
}

.slider-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid var(--bg-primary);
  cursor: pointer;
}

.number-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 50px;
  border: 2.5px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 0 var(--input-shadow);
  outline: none;
}

.number-input:focus {
  border-color: var(--focus-yellow);
  box-shadow: 0 3px 0 0 var(--focus-yellow-darker), 0 0 0 3px rgba(255, 204, 0, 0.15);
}

.number-input::-webkit-inner-spin-button,
.number-input::-webkit-outer-spin-button {
  opacity: 1;
}

/* ─── Custom Model List ─── */
.custom-model-empty {
  font-size: 0.8125rem;
  color: var(--text-muted);
  padding: 0.75rem 0;
  text-align: center;
  font-weight: 500;
}

.custom-model-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.custom-model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border-radius: 16px;
  border: 2px solid var(--border-color);
  background: var(--bg-input);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-model-item.active {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(25, 200, 185, 0.15);
}

.custom-model-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.custom-model-name {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-model-id {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: 'Fira Code', monospace;
}

.custom-model-actions {
  display: flex;
  gap: 0.25rem;
}

.custom-model-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #c4b89e;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-model-action-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.custom-model-action-btn.delete:hover {
  background: rgba(224, 90, 90, 0.15);
  color: #e05a5a;
}

.group-add-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--accent-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0.35rem 0.5rem;
  border-radius: 50px;
  font-weight: 700;
  font-family: inherit;
}

.group-add-btn:hover {
  color: var(--accent-hover);
  background: rgba(25, 200, 185, 0.08);
}

/* ─── Custom Model Form Modal ─── */
.custom-model-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(42, 35, 24, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  animation: fadeIn 0.2s ease-out;
}

.custom-model-form {
  width: 440px;
  max-width: 90vw;
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(107, 92, 67, 0.25);
  color: var(--text-primary);
  animation: slideUp 0.25s ease-out;
  border: 2px solid var(--border-color);
}

.custom-model-form-header h4 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: #794f27;
}

html.dark .custom-model-form-header h4 {
  color: #e8dcc8;
}

.custom-model-form-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0 0 1rem;
  font-weight: 500;
}

.custom-model-form-body {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.form-field label {
  display: block;
  font-size: 0.8125rem;
  margin-bottom: 0.35rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.form-field input,
.form-field select {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 50px;
  border: 2.5px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 0 var(--input-shadow);
  outline: none;
}

.form-field input:focus,
.form-field select:focus {
  border-color: var(--focus-yellow);
  box-shadow: 0 3px 0 0 var(--focus-yellow-darker), 0 0 0 3px rgba(255, 204, 0, 0.15);
}

.form-field select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c4b89e' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2rem;
}

.custom-model-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.cm-btn {
  padding: 0.5rem 1.1rem;
  border-radius: 50px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  font-family: inherit;
  letter-spacing: 0.02em;
}

.cm-btn-cancel {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--border-color);
}

.cm-btn-cancel:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.cm-btn-save {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
  box-shadow: 0 4px 0 0 #11a89b;
}

.cm-btn-save:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  box-shadow: 0 5px 0 0 #11a89b;
  transform: translateY(-1px);
}

.cm-btn-save:active {
  box-shadow: 0 1px 0 0 #11a89b;
  transform: translateY(2px);
}

/* ─── Template badge ─── */
.template-built-in-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  background: var(--border-color);
  color: var(--text-secondary);
  border-radius: 8px;
  margin-left: 0.35rem;
  font-weight: 700;
  vertical-align: middle;
}

/* ─── Mobile Responsive ─── */
@media (max-width: 768px) {
  .settings-modal {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    border: none;
  }

  .settings-content {
    max-height: calc(100vh - 130px);
    padding: 1rem;
  }

  .theme-options {
    grid-template-columns: repeat(3, 1fr);
  }

  .theme-options button {
    padding: 0.5rem 0.3rem;
    font-size: 0.75rem;
  }

  .color-options {
    grid-template-columns: repeat(3, 1fr);
  }

  .custom-model-form {
    width: calc(100vw - 2rem);
    max-width: calc(100vw - 2rem);
    padding: 1rem;
    border-radius: 16px;
  }

  .modal-header {
    padding: 0.875rem 1rem;
  }

  .modal-header h2 {
    font-size: 1.1rem;
  }

  .modal-footer {
    padding: 0.875rem 1rem;
  }
}
</style>
