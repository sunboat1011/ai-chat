import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { t } from '@/composables/useText'

const app = createApp(App)
app.use(router)
app.config.globalProperties.$t = t
app.mount('#app')
