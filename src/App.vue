<template>
  <div class="app-layout">
    <Sidebar
      :conversations="conversations"
      :active-conversation="activeConversation"
      @select="handleSelectConversation"
      @delete="handleDeleteConversation"
      @new-chat="handleNewChat"
      @toggle-theme="toggleTheme"
    />

    <router-view
      :messages="messages"
      :is-loading="isLoading"
      @send="handleSendMessage"
      @cancel="handleCancelStreaming"
    />
  </div>
</template>

<script setup>
import { onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import { useChat } from '@/composables/useChat'

const route = useRoute()
const router = useRouter()

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

function toggleTheme() {
  // Placeholder: could toggle a dark/light class on <html>
  console.log('Theme toggle clicked — implement light/dark swap here.')
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
