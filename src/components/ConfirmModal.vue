<template>
  <div v-if="visible" class="confirm-overlay" @click="handleCancel">
    <div class="confirm-modal" @click.stop>
      <h3 class="confirm-title">{{ title }}</h3>
      <p v-if="message" class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
        <button class="confirm-btn cancel" :aria-label="cancelText" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button class="confirm-btn danger" :aria-label="confirmText" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, required: true },
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
})

const emit = defineEmits(['confirm', 'cancel'])

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.confirm-overlay {
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

.confirm-modal {
  width: 400px;
  max-width: 90vw;
  background: var(--bg-secondary);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(107, 92, 67, 0.25);
  padding: 1.5rem;
  animation: scaleIn 0.2s ease-out;
  border: 2px solid var(--border-color);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.confirm-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #794f27;
  margin: 0 0 0.5rem;
}

html.dark .confirm-title {
  color: #e8dcc8;
}

.confirm-message {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0 0 1.25rem;
  line-height: 1.5;
  font-weight: 500;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.confirm-btn {
  padding: 0.55rem 1.25rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  font-family: inherit;
  letter-spacing: 0.02em;
}

.confirm-btn.cancel {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.confirm-btn.cancel:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.confirm-btn.danger {
  background: #e05a5a;
  color: #fff;
  border-color: #e05a5a;
  box-shadow: 0 4px 0 0 #c94444;
}

.confirm-btn.danger:hover {
  background: #e87878;
  box-shadow: 0 5px 0 0 #c94444;
  transform: translateY(-1px);
}

.confirm-btn.danger:active {
  box-shadow: 0 1px 0 0 #c94444;
  transform: translateY(2px);
}

@media (max-width: 768px) {
  .confirm-modal {
    width: calc(100vw - 2rem);
    border-radius: 16px;
  }
}
</style>
