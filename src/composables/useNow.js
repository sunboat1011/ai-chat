import { ref, onMounted, onBeforeUnmount } from 'vue'

const now = ref(Date.now())
let intervalId = null
let refCount = 0

function tick() {
  now.value = Date.now()
}

/**
 * Returns a reactive Date.now() that updates every 30 seconds.
 * Use with formatRelative(ts, now.value) to get auto-refreshing relative times.
 */
export function useNow() {
  onMounted(() => {
    refCount++
    if (!intervalId) {
      intervalId = setInterval(tick, 30 * 1000)
    }
  })

  onBeforeUnmount(() => {
    refCount--
    if (refCount === 0 && intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  })

  return { now }
}
