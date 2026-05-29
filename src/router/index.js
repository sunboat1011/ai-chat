import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '@/views/ChatView.vue'
import LoginView from '@/views/LoginView.vue'
import { getToken, isTokenExpired } from '@/utils/token.js'

const routes = [
  {
    path: '/',
    name: 'home',
    component: ChatView,
  },
  {
    path: '/chat/:id?',
    name: 'chat',
    component: ChatView,
    props: true,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = getToken()
  const hasValidToken = !!token && !isTokenExpired()
  const isAuthPage = to.path === '/login'

  if (!hasValidToken && !isAuthPage) {
    next('/login')
  } else if (hasValidToken && isAuthPage) {
    next('/')
  } else {
    next()
  }
})

export default router
