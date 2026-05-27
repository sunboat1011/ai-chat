<template>
  <div
    v-if="toasts.length > 0"
    class="toast-container"
    role="region"
    :aria-label="$t('errorToast.region')"
    aria-live="polite"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="['toast--' + toast.level]"
      role="alert"
    >
      <span class="toast-icon" aria-hidden="true">
        <svg
          v-if="toast.level === 'error'"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <svg
          v-else-if="toast.level === 'warning'"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <svg
          v-else
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </span>
      <span class="toast-message">{{ toast.message }}</span>
      <button class="toast-close" :aria-label="$t('errorToast.close')" @click="dismiss(toast.id)">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useErrorToast } from '@/composables/useErrorToast'

const { toasts, dismiss } = useErrorToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
  max-width: 90vw;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 280px;
  max-width: 480px;
  padding: 0.625rem 0.75rem 0.625rem 0.875rem;
  border-radius: 20px;
  background: var(--bg-elevated);
  border: 2px solid var(--border-color);
  box-shadow: 0 4px 14px rgba(107, 92, 67, 0.15);
  font-size: 0.875rem;
  color: var(--text-primary);
  animation: toast-slide-in 0.2s ease-out;
  font-weight: 500;
}

.toast--error {
  border-color: #e05a5a;
  color: #e05a5a;
  background: rgba(224, 90, 90, 0.08);
}

html.dark .toast--error {
  color: #e05a5a;
  background: rgba(224, 90, 90, 0.12);
}

.toast--warning {
  border-color: #f5c31c;
  color: #9a7a1a;
  background: rgba(245, 195, 28, 0.1);
}

html.dark .toast--warning {
  color: #f5c31c;
  background: rgba(245, 195, 28, 0.12);
}

.toast--info {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: rgba(25, 200, 185, 0.08);
}

html.dark .toast--info {
  background: rgba(25, 200, 185, 0.12);
}

.toast-icon {
  display: inline-flex;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  width: 28px;
  height: 28px;
}

.toast-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
}

@keyframes toast-slide-in {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>