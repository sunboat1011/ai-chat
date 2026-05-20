import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { t } from '@/composables/useText'
import { showError } from '@/composables/useErrorToast'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue errorHandler]', err, '\nInfo:', info)
  showError(err?.message || t('errors.unknownError'))
}

window.addEventListener('error', (event) => {
  console.error('[window.onerror]', event.error || event.message)
  const message = event.error?.message || event.message || t('errors.unknownError')
  showError(message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandledrejection]', event.reason)
  const reason = event.reason
  const message =
    (reason && (reason.friendlyMessage || reason.message)) || t('errors.unhandledRejection')
  showError(message)
})

app.use(router)
app.config.globalProperties.$t = t
app.mount('#app')
