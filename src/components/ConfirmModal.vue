<template>
  <div v-if="visible" class="confirm-overlay" @click="handleCancel">
    <div class="confirm-modal" @click.stop>
      <h3 class="confirm-title">{{ title }}</h3>
      <p v-if="message" class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
        <button class="confirm-btn cancel" @click="handleCancel">{{ cancelText }}</button>
        <button class="confirm-btn danger" @click="handleConfirm">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
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
  background: rgba(0, 0, 0, 0.5);
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
  border-radius: 0.75rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  padding: 1.5rem;
  animation: scaleIn 0.2s ease-out;
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
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.confirm-message {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0 0 1.25rem;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.confirm-btn {
  padding: 0.55rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
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
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.confirm-btn.danger:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}
</style>
