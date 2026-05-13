<template>
  <div class="settings-modal-overlay" @click="close">
    <div class="settings-modal" @click.stop>
      <div class="modal-header">
        <h2>Settings</h2>
        <button @click="close" class="close-btn" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18" />
            <path d="M6 6L18 18" />
          </svg>
        </button>
      </div>

      <div class="settings-content">
        <!-- Appearance -->
        <div class="setting-group">
          <h3>Appearance</h3>

          <div class="setting-item">
            <label>Theme</label>
            <div class="theme-options">
              <button
                type="button"
                :class="{ active: settings.theme === 'dark' }"
                @click="settings.theme = 'dark'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Dark
              </button>
              <button
                type="button"
                :class="{ active: settings.theme === 'light' }"
                @click="settings.theme = 'light'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                Light
              </button>
              <button
                type="button"
                :class="{ active: settings.theme === 'system' }"
                @click="settings.theme = 'system'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                System
              </button>
            </div>
          </div>

          <div class="setting-item">
            <label>Accent Color</label>
            <div class="color-options">
              <button
                v-for="(hex, name) in ACCENT_COLORS"
                :key="name"
                type="button"
                class="color-option"
                :class="{ active: settings.accentColor === name }"
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
          <h3>API Configuration</h3>

          <div class="setting-item">
            <label for="api-url">API Base URL</label>
            <input
              id="api-url"
              type="text"
              v-model="settings.apiBaseUrl"
              placeholder="http://localhost:8080/api"
            />
            <p class="hint">The base URL of your AI backend service.</p>
          </div>

          <div class="setting-item">
            <label for="model">Model</label>
            <select id="model" v-model="settings.model">
              <option value="claude-3-haiku">Claude 3 Haiku</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="reset-btn" @click="handleReset">Reset to Defaults</button>
        <button type="button" class="save-btn" @click="close">Done</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSettings } from '@/composables/useSettings'

const emit = defineEmits(['close'])
const { settings, resetSettings, ACCENT_COLORS } = useSettings()

function close() {
  emit('close')
}

function handleReset() {
  if (confirm('Reset all settings to defaults?')) {
    resetSettings()
  }
}
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
  animation: fadeIn 0.2s ease-out;
}

.settings-modal {
  width: 520px;
  max-width: 90vw;
  background: #2f2f2f;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  color: #ececec;
  animation: slideUp 0.25s ease-out;
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
  border-bottom: 1px solid #424242;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #a0a0a0;
  width: 32px;
  height: 32px;
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
  font-weight: 600;
  margin-bottom: 1rem;
  color: #ececec;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #3a3a3a;
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
  color: #cccccc;
  font-weight: 500;
}

.hint {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #888;
}

input, select {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #424242;
  background: #2a2a2a;
  color: #ececec;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--accent-primary, #10a37f);
  box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.2);
}

select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");
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
  border-radius: 0.5rem;
  border: 1px solid #424242;
  background: #2a2a2a;
  color: #a0a0a0;
  font-size: 0.8125rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.theme-options button:hover {
  background: #353535;
  color: #ececec;
}

.theme-options button.active {
  background: var(--accent-primary, #10a37f);
  color: #ffffff;
  border-color: var(--accent-primary, #10a37f);
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
  border-radius: 0.5rem;
  border: 1px solid #424242;
  background: #2a2a2a;
  color: #a0a0a0;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
  text-transform: capitalize;
}

.color-option:hover {
  background: #353535;
  color: #ececec;
}

.color-option.active {
  border-color: var(--accent-primary, #10a37f);
  background: #353535;
  color: #ffffff;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.color-option.active .color-swatch {
  border-color: #ffffff;
  box-shadow: 0 0 0 2px var(--accent-primary, #10a37f);
}

/* ─── Footer ─── */
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #424242;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.reset-btn {
  padding: 0.55rem 1rem;
  background: transparent;
  color: #a0a0a0;
  border: 1px solid #424242;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #353535;
  color: #ececec;
}

.save-btn {
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

.save-btn:hover {
  background: var(--accent-hover, #0d8a6c);
}
</style>
