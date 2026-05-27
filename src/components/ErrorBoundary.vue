<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-boundary__inner">
      <div class="error-boundary__icon" aria-hidden="true">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 class="error-boundary__title">{{ $t('errorBoundary.title') }}</h2>
      <p class="error-boundary__message">{{ $t('errorBoundary.message') }}</p>
      <div class="error-boundary__actions">
        <button
          class="error-boundary__btn error-boundary__btn--secondary"
          :aria-label="$t('errorBoundary.reset')"
          @click="reset"
        >
          {{ $t('errorBoundary.reset') }}
        </button>
        <button
          class="error-boundary__btn error-boundary__btn--primary"
          :aria-label="$t('errorBoundary.refresh')"
          @click="refresh"
        >
          {{ $t('errorBoundary.refresh') }}
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)

onErrorCaptured((err, instance, info) => {
  hasError.value = true
  console.error('[ErrorBoundary] Caught child error:', err, '\nInfo:', info)
  return false
})

function refresh() {
  window.location.reload()
}

function reset() {
  hasError.value = false
}
</script>

<style scoped>
.error-boundary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100%;
}

.error-boundary__inner {
  max-width: 440px;
  text-align: center;
}

.error-boundary__icon {
  color: #e05a5a;
  display: inline-flex;
  margin-bottom: 1rem;
}

.error-boundary__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}

.error-boundary__message {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem;
  line-height: 1.55;
  font-weight: 500;
}

.error-boundary__actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.error-boundary__btn {
  padding: 0.55rem 1.25rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  letter-spacing: 0.02em;
}

.error-boundary__btn--secondary {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.error-boundary__btn--secondary:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.error-boundary__btn--primary {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
  box-shadow: 0 4px 0 0 #11a89b;
}

.error-boundary__btn--primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 5px 0 0 #11a89b;
  transform: translateY(-1px);
}

.error-boundary__btn--primary:active {
  box-shadow: 0 1px 0 0 #11a89b;
  transform: translateY(2px);
}
</style>
