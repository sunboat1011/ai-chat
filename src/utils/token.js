/**
 * Token management utilities.
 * Stores JWT access token and user info in localStorage.
 */

const TOKEN_KEY = 'ai-chat-token'
const USER_KEY = 'ai-chat-user'
const EXPIRES_AT_KEY = 'ai-chat-expires-at'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (e) {
    console.error('Failed to save token:', e)
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
  } catch (e) {
    console.error('Failed to remove token:', e)
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch (e) {
    console.error('Failed to save user:', e)
  }
}

export function setExpiresAt(expiresInSeconds) {
  try {
    const expiresAt = Date.now() + expiresInSeconds * 1000
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt))
  } catch (e) {
    console.error('Failed to save expiresAt:', e)
  }
}

export function isTokenExpired() {
  try {
    const raw = localStorage.getItem(EXPIRES_AT_KEY)
    if (!raw) return false
    return Date.now() > parseInt(raw, 10)
  } catch {
    return false
  }
}
