<template>
  <div class="app-layout">
    <Sidebar
      :conversations="conversations"
      :active-conversation="activeConversation"
      :mobile-open="sidebarOpen"
      @select="handleSelectConversation"
      @delete="handleDeleteConversation"
      @new-chat="handleNewChat"
      @open-settings="openSettings"
      @close-sidebar="closeSidebar"
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import RoleSelectModal from '@/components/RoleSelectModal.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import ErrorToast from '@/components/ErrorToast.vue'
import { useChat } from '@/composables/useChat'
import { track } from '@/composables/useAnalytics'

const router = useRouter()
const isSettingsOpen = ref(false)
const isRoleSelectOpen = ref(false)
const pendingNewChat = ref(false)
const sidebarOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)

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

onMounted(() => {
  init()
  window.addEventListener('resize', checkMobile)
})

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

function handleSelectConversation(id) {
  setActiveConversation(id)
  router.push(`/chat/${id}`)
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

function handleNewChat() {
  isRoleSelectOpen.value = true
  pendingNewChat.value = true
}

function handleRoleSelect(templatePayload) {
  isRoleSelectOpen.value = false
  if (!pendingNewChat.value) return
  pendingNewChat.value = false

  const hasMessages = templatePayload.messages && templatePayload.messages.length > 0
  if (hasMessages) {
    const conv = createConversationFromTemplate(templatePayload)
    router.push(`/chat/${conv.id}`)
  } else {
    const conv = createNewConversation(templatePayload.systemPrompt || '')
    router.push(`/chat/${conv.id}`)
  }
}

function handleRoleSkip() {
  isRoleSelectOpen.value = false
  if (pendingNewChat.value) {
    const conv = createNewConversation()
    pendingNewChat.value = false
    router.push(`/chat/${conv.id}`)
  }
}

function handleDeleteConversation(id) {
  deleteConversation(id)
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

function handleBranchMessage(messageId) {
  const newConv = branchFromMessage(messageId)
  if (newConv) {
    router.push(`/chat/${newConv.id}`)
  }
}

function handleUndoDelete() {
  undoDelete()
}

function handleUpdateSystemPrompt(systemPrompt) {
  if (activeConversation.value) {
    updateSystemPrompt(activeConversation.value, systemPrompt)
  }
}

function openSettings() {
  isSettingsOpen.value = true
  track('settings_open')
}

function closeSettings() {
  isSettingsOpen.value = false
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
  background: rgba(0, 0, 0, 0.5);
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
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.875rem;
  color: var(--text-primary);
  animation: slideDown 0.2s ease-out;
}

.undo-btn {
  padding: 0.25rem 0.75rem;
  border: none;
  background: var(--accent-primary);
  color: white;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.undo-btn:hover {
  background: var(--accent-hover);
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
