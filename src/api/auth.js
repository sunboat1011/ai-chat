/**
 * Authentication API — login / register.
 *
 * Endpoints:
 *   POST /api/auth/register
 *   POST /api/auth/login
 */

import { request } from './request.js'
import { setToken, setUser, setExpiresAt } from '@/utils/token.js'

/**
 * Register a new user.
 *
 * @param {object} params
 * @param {string} params.username
 * @param {string} params.password
 * @param {string} [params.email]
 * @returns {Promise<object>} TokenResponse
 */
export async function register(params) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: {
      username: params.username,
      password: params.password,
      ...(params.email ? { email: params.email } : {}),
    },
  })

  // Persist token and user info
  if (data.accessToken) {
    setToken(data.accessToken)
  }
  if (data.user) {
    setUser(data.user)
  }
  if (data.expiresIn) {
    setExpiresAt(data.expiresIn)
  }

  return data
}

/**
 * Log in an existing user.
 *
 * @param {object} params
 * @param {string} params.username
 * @param {string} params.password
 * @returns {Promise<object>} TokenResponse
 */
export async function login(params) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: {
      username: params.username,
      password: params.password,
    },
  })

  // Persist token and user info
  if (data.accessToken) {
    setToken(data.accessToken)
  }
  if (data.user) {
    setUser(data.user)
  }
  if (data.expiresIn) {
    setExpiresAt(data.expiresIn)
  }

  return data
}
