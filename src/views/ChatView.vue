<template>
  <div class="chat-main">
    <!-- Empty State -->
    <div v-if="messages.length === 0" class="welcome-screen">
      <div class="welcome-logo">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h1 class="welcome-title">How can I help you today?</h1>
      <p class="welcome-sub">Ask me anything — code, writing, analysis, or just chat.</p>
    </div>

    <!-- Messages -->
    <div ref="messagesContainerRef" class="messages-container">
      <MessageItem
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />
    </div>

    <!-- Input Area -->
    <div class="input-area-wrapper">
      <ChatInput
        :disabled="false"
        :is-streaming="isLoading"
        @send="handleSend"
        @cancel="cancelStreaming"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import MessageItem from '@/components/MessageItem.vue'
import ChatInput from '@/components/ChatInput.vue'

const props = defineProps({
  messages: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['send', 'cancel'])

const messagesContainerRef = ref(null)

function handleSend(message) {
  emit('send', message)
}

function cancelStreaming() {
  emit('cancel')
}

// Auto-scroll to bottom on new messages
watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

// Auto-scroll during streaming
watch(
  () => props.messages[props.messages.length - 1]?.content,
  () => {
    const lastMsg = props.messages[props.messages.length - 1]
    if (lastMsg?.streaming) {
      scrollToBottom()
    }
  }
)

function scrollToBottom() {
  const el = messagesContainerRef.value
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}
</script>

<style scoped>
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  min-width: 0;
  position: relative;
  transition: background-color 0.2s ease;
}

.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.welcome-logo {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border-subtle);
  border-radius: 1rem;
  background: var(--bg-code);
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.welcome-sub {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  text-align: center;
  max-width: 36rem;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.input-area-wrapper {
  flex-shrink: 0;
  background: linear-gradient(transparent, var(--bg-primary) 20%);
  padding-top: 2rem;
}
</style>
