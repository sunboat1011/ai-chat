<template>
  <div class="app-layout">
    <template v-if="isLoggedIn">
      <Sidebar
        :conversations="conversations"
        :active-conversation="activeConversation"
        :mobile-open="sidebarOpen"
        :current-user="currentUser"
        @select="handleSelectConversation"
        @delete="handleDeleteConversation"
        @new-chat="handleNewChat"
        @open-settings="openSettings"
        @close-sidebar="closeSidebar"
        @logout="handleLogout"
      />

      <div v-if="isMobile && sidebarOpen" class="sidebar-overlay" @click="closeSidebar"></div>

      <ErrorBoundary>
        <router-view
          :messages="messages"
          :is-loading="isLoading"
          :active-conversation="activeConversation"
          :system-prompt="activeConversation ? getConversationSystemPrompt(activeConversation) : ''"
          @send="handleSendMessage"
          @cancel="handleCancelStreaming"
          @edit="handleEditMessage"
          @delete="handleDeleteMessage"
          @regenerate="handleRegenerateMessage"
          @branch="handleBranchMessage"
          @update-system-prompt="handleUpdateSystemPrompt"
          @toggle-sidebar="toggleSidebar"
        />
      </ErrorBoundary>

      <!-- Global error/notification toast stack -->
      <ErrorToast />

      <!-- Undo toast -->
      <div v-if="lastDeleted" class="undo-toast">
        <span>{{ $t('app.undoToast') }}</span>
        <button class="undo-btn" :aria-label="$t('app.undo')" @click="handleUndoDelete">
          {{ $t('app.undo') }}
        </button>
      </div>

      <RoleSelectModal v-if="isRoleSelectOpen" @confirm="handleRoleSelect" @skip="handleRoleSkip" />

      <SettingsModal v-if="isSettingsOpen" @close="closeSettings" />

      <ConfirmModal
        v-if="logoutConfirmOpen"
        :visible="true"
        :title="$t('auth.logoutConfirmTitle')"
        :message="$t('auth.logoutConfirmMessage')"
        :confirm-text="$t('auth.logoutConfirmBtn')"
        :cancel-text="$t('message.cancel')"
        @confirm="doLogout"
        @cancel="logoutConfirmOpen = false"
      />
    </template>

    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import RoleSelectModal from '@/components/RoleSelectModal.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import ErrorToast from '@/components/ErrorToast.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useChat } from '@/composables/useChat'
import { track } from '@/composables/useAnalytics'
import { getToken, removeToken, getUser, isTokenExpired } from '@/utils/token.js'

const router = useRouter()
const isSettingsOpen = ref(false)
const isRoleSelectOpen = ref(false)
const pendingNewChat = ref(false)
const sidebarOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)
const logoutConfirmOpen = ref(false)
const hasInited = ref(false)
const isInitializing = ref(false)

// Use ref instead of computed because localStorage is not reactive.
// The value is refreshed on mount and on every route change.
const isLoggedIn = ref(false)
const currentUser = ref(getUser())

function checkAuth() {
  const token = getToken()
  isLoggedIn.value = !!token && !isTokenExpired()
  currentUser.value = getUser()
}

const {
  conversations,
  activeConversation,
  messages,
  isLoading,
  lastDeleted,
  init,
  setActiveConversation,
  createNewConversation,
  createConversationFromTemplate,
  deleteConversation,
  sendMessage,
  cancelStreaming,
  editMessage,
  deleteMessage,
  undoDelete,
  regenerateMessage,
  getConversationSystemPrompt,
  updateSystemPrompt,
  branchFromMessage,
} = useChat()

onMounted(async () => {
  checkAuth()
  if (isLoggedIn.value && !hasInited.value) {
    isInitializing.value = true
    await init()
    isInitializing.value = false
    hasInited.value = true
  }
  window.addEventListener('resize', checkMobile)
})

// Re-check auth state on every route change (e.g. after login/logout)
watch(
  () => router.currentRoute.value.path,
  async () => {
    checkAuth()
    if (isLoggedIn.value && !hasInited.value) {
      isInitializing.value = true
      await init()
      isInitializing.value = false
      hasInited.value = true
    }
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    sidebarOpen.value = false
  }
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

async function handleSelectConversation(id) {
  await setActiveConversation(id)
  router.push(`/chat/${id}`)
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

function handleNewChat() {
  isRoleSelectOpen.value = true
  pendingNewChat.value = true
}

async function handleRoleSelect(templatePayload) {
  isRoleSelectOpen.value = false
  if (!pendingNewChat.value) return
  pendingNewChat.value = false

  const hasMessages = templatePayload.messages && templatePayload.messages.length > 0
  if (hasMessages) {
    const conv = await createConversationFromTemplate(templatePayload)
    router.push(`/chat/${conv.id}`)
  } else {
    const conv = await createNewConversation(templatePayload.systemPrompt || '')
    router.push(`/chat/${conv.id}`)
  }
}

async function handleRoleSkip() {
  isRoleSelectOpen.value = false
  if (pendingNewChat.value) {
    const conv = await createNewConversation()
    pendingNewChat.value = false
    router.push(`/chat/${conv.id}`)
  }
}

async function handleDeleteConversation(id) {
  await deleteConversation(id)
  if (!activeConversation.value) {
    router.push('/')
  } else {
    router.push(`/chat/${activeConversation.value}`)
  }
}

async function handleSendMessage(message) {
  await sendMessage(message)
}

function handleCancelStreaming() {
  cancelStreaming()
}

async function handleEditMessage(messageId, newContent) {
  await editMessage(messageId, newContent)
}

function handleDeleteMessage(messageId) {
  deleteMessage(messageId)
}

async function handleRegenerateMessage(messageId) {
  await regenerateMessage(messageId)
}

async function handleBranchMessage(messageId) {
  const newConv = await branchFromMessage(messageId)
  if (newConv) {
    router.push(`/chat/${newConv.id}`)
  }
}

function handleUndoDelete() {
  undoDelete()
}

async function handleUpdateSystemPrompt(systemPrompt) {
  if (activeConversation.value) {
    await updateSystemPrompt(activeConversation.value, systemPrompt)
  }
}

function openSettings() {
  isSettingsOpen.value = true
  track('settings_open')
}

function closeSettings() {
  isSettingsOpen.value = false
}

function handleLogout() {
  logoutConfirmOpen.value = true
}

function doLogout() {
  logoutConfirmOpen.value = false
  removeToken()
  checkAuth()
  hasInited.value = false
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(42, 35, 24, 0.5);
  z-index: 40;
}

.undo-toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.625rem 1.25rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 20px;
  box-shadow: 0 4px 14px rgba(107, 92, 67, 0.15);
  font-size: 0.875rem;
  color: var(--text-primary);
  animation: slideDown 0.2s ease-out;
  font-weight: 500;
}

.undo-btn {
  padding: 0.35rem 0.875rem;
  border: none;
  background: var(--accent-primary);
  color: #fff;
  border-radius: 50px;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  letter-spacing: 0.02em;
  box-shadow: 0 3px 0 0 #11a89b;
}

.undo-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 0 0 #11a89b;
  transform: translateY(-1px);
}

.undo-btn:active {
  box-shadow: 0 1px 0 0 #11a89b;
  transform: translateY(2px);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
