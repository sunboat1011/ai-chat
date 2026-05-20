import { beforeEach, vi } from 'vitest'

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

beforeEach(() => {
  localStorage.clear()
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('style')
  }
  vi.restoreAllMocks()
})
