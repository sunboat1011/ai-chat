<template>
  <div class="settings-modal-overlay" @click="close">
    <div class="settings-modal" @click.stop>
      <div class="modal-header">
        <h2>Settings</h2>
        <button @click="close" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18" />
            <path d="M6 6L18 18" />
          </svg>
        </button>
      </div>

      <div class="settings-content">
        <div class="setting-group">
          <h3>Appearance</h3>
          <div class="setting-item">
            <label>Theme</label>
            <div class="theme-options">
              <button
                :class="{ active: theme === 'dark' }"
                @click="setTheme('dark')"
              >
                Dark
              </button>
              <button
                :class="{ active: theme === 'light' }"
                @click="setTheme('light')"
              >
                Light
              </button>
              <button
                :class="{ active: theme === 'system' }"
                @click="setTheme('system')"
              >
                System
              </button>
            </div>
          </div>

          <div class="setting-item">
            <label>Accent Color</label>
            <div class="color-options">
              <button
                class="color-option"
                :class="{ active: accentColor === 'green' }"
                @click="setAccentColor('green')"
                style="--accent-color: #10a37f"
              >
                Green
              </button>
              <button
                class="color-option"
                :class="{ active: accentColor === 'blue' }"
                @click="setAccentColor('blue')"
                style="--accent-color: #3b82f6"
              >
                Blue
              </button>
              <button
                class="color-option"
                :class="{ active: accentColor === 'purple' }"
                @click="setAccentColor('purple')"
                style="--accent-color: #8b5cf6"
              >
                Purple
              </button>
              <button
                class="color-option"
                :class="{ active: accentColor === 'red' }"
                @click="setAccentColor('red')"
                style="--accent-color: #ef4444"
              >
                Red
              </button>
            </div>
          </div>
        </div>

        <div class="setting-group">
          <h3>API Configuration</h3>
          <div class="setting-item">
            <label for="api-url">API Base URL</label>
            <input
              id="api-url"
              type="text"
              v-model="apiBaseUrl"
              placeholder="http://localhost:8080/api"
            />
          </div>

          <div class="setting-item">
            <label for="model">Model</label>
            <select id="model" v-model="selectedModel">
              <option value="claude-3-haiku">Claude 3 Haiku</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="applySettings" class="save-btn">Save Changes</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSettings } from '@/composables/useSettings'

const emit = defineEmits(['close'])
const { settings, saveSettings, loadSettings } = useSettings()

const isOpen = ref(true)
const theme = ref(settings.value.theme)
const apiBaseUrl = ref(settings.value.apiBaseUrl)
const selectedModel = ref(settings.value.model)
const accentColor = ref(settings.value.accentColor || 'green')

onMounted(() => {
  loadSettings()
  applyAccentColor(accentColor.value)
})

function setTheme(newTheme) {
  theme.value = newTheme
}

function setAccentColor(color) {
  accentColor.value = color
  applyAccentColor(color)
}

function applyAccentColor(color) {
  const root = document.documentElement
  let accentHex = '#10a37f' // 默认绿色

  switch(color) {
    case 'blue':
      accentHex = '#3b82f6'
      break
    case 'purple':
      accentHex = '#8b5cf6'
      break
    case 'red':
      accentHex = '#ef4444'
      break
    case 'green':
    default:
      accentHex = '#10a37f'
  }

  root.style.setProperty('--accent-primary', accentHex)
  root.style.setProperty('--accent-hover', shadeColor(accentHex, -20))
  root.style.setProperty('--accent-light', shadeColor(accentHex, 20))
}

function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16)
  let G = parseInt(color.substring(3, 5), 16)
  let B = parseInt(color.substring(5, 7), 16)

  R = Math.min(255, Math.max(0, R + R * percent / 100))
  G = Math.min(255, Math.max(0, G + G * percent / 100))
  B = Math.min(255, Math.max(0, B + B * percent / 100))

  const RR = Math.round(R).toString(16).padStart(2, '0')
  const GG = Math.round(G).toString(16).padStart(2, '0')
  const BB = Math.round(B).toString(16).padStart(2, '0')

  return `#${RR}${GG}${BB}`
}

function applySettings() {
  const newSettings = {
    theme: theme.value,
    apiBaseUrl: apiBaseUrl.value,
    model: selectedModel.value,
    accentColor: accentColor.value
  }

  saveSettings(newSettings)
  close()
}

function close() {
  isOpen.value = false
  emit('close')
}

// Apply theme immediately
watch(theme, (newTheme) => {
  if (newTheme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', prefersDark)
  } else {
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }
})

// Initialize theme on mount
onMounted(() => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark' ||
    (theme.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
})
</script>

<style scoped>
.settings-modal-overlay {
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
}

.settings-modal {
  width: 480px;
  background: #2f2f2f;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: #ececec;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #424242;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: #a0a0a0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #424242;
  color: #ececec;
}

.settings-content {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-group h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #ececec;
  opacity: 0.9;
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-item label {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 0.4rem;
  color: #a0a0a0;
}

input, select {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #424242;
  background: #2a2a2a;
  color: #ececec;
  font-size: 0.875rem;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--accent-primary, #10a37f);
}

.theme-options {
  display: flex;
  gap: 0.5rem;
}

.theme-options button {
  flex: 1;
  padding: 0.55rem;
  border-radius: 0.5rem;
  border: 1px solid #424242;
  background: #2a2a2a;
  color: #a0a0a0;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-options button.active {
  background: var(--accent-primary, #10a37f);
  color: white;
  border-color: var(--accent-primary, #10a37f);
}

.color-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.color-option {
  padding: 0.55rem;
  border-radius: 0.5rem;
  border: 1px solid #424242;
  background: #2a2a2a;
  color: #a0a0a0;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.color-option.active {
  background: var(--accent-primary, #10a37f);
  color: white;
  border-color: var(--accent-primary, #10a37f);
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #424242;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  padding: 0.55rem 1.25rem;
  background: var(--accent-primary, #10a37f);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.save-btn:hover {
  background: var(--accent-hover, #0d8a6c);
}
</style>
