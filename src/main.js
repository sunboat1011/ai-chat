import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { t } from '@/composables/useText'
import { showError } from '@/composables/useErrorToast'
import { setupAnalytics, trackError } from '@/composables/useAnalytics'

const app = createApp(App)

// ─── Analytics ───
setupAnalytics()

app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue errorHandler]', err, '\nInfo:', info)
  trackError('vue', {
    message: err?.message,
    stack: err?.stack,
    info,
  })
  showError(err?.message || t('errors.unknownError'))
}

window.addEventListener('error', (event) => {
  console.error('[window.onerror]', event.error || event.message)
  const message = event.error?.message || event.message || t('errors.unknownError')
  trackError('runtime', {
    message,
    stack: event.error?.stack,
    source: event.filename,
    line: event.lineno,
    col: event.colno,
  })
  showError(message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandledrejection]', event.reason)
  const reason = event.reason
  const message =
    (reason && (reason.friendlyMessage || reason.message)) || t('errors.unhandledRejection')
  trackError('unhandledrejection', {
    message,
    stack: reason?.stack,
  })
  showError(message)
})

app.use(router)
app.config.globalProperties.$t = t
app.mount('#app')
