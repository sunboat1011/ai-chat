<template>
  <div class="app-layout">
    <Sidebar
      :conversations="conversations"
      :active-conversation="activeConversation"
      @select="handleSelectConversation"
      @delete="handleDeleteConversation"
      @new-chat="handleNewChat"
      @open-settings="isSettingsOpen = true"
    />

    <router-view
      :messages="messages"
      :is-loading="isLoading"
      @send="handleSendMessage"
      @cancel="handleCancelStreaming"
      @edit="handleEditMessage"
    />

    <SettingsModal
      v-if="isSettingsOpen"
      @close="closeSettings"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { useChat } from '@/composables/useChat'

const route = useRoute()
const router = useRouter()
const isSettingsOpen = ref(false)

const {
  conversations,
  activeConversation,
  messages,
  isLoading,
  init,
  setActiveConversation,
  createNewConversation,
  deleteConversation,
  sendMessage,
  cancelStreaming,
  editMessage,
} = useChat()

onMounted(() => {
  init()
})

function handleSelectConversation(id) {
  setActiveConversation(id)
  router.push(`/chat/${id}`)
}

function handleNewChat() {
  const conv = createNewConversation()
  router.push(`/chat/${conv.id}`)
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
</style>
