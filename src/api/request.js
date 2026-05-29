/**
 * HTTP request interceptor with automatic token injection,
 * unified response unwrapping, and 401 redirect handling.
 *
 * Wraps native fetch. All non-SSE JSON API calls should use this.
 *
 * Backend contract (all JSON endpoints):
 *   { code: 'SUCCESS' | string, message: string, data: any }
 *
 * This module treats HTTP status codes as transport signals only.
 * Business errors are conveyed via the `code` / `message` fields.
 */

import { getToken, removeToken } from '@/utils/token.js'
import router from '@/router/index.js'
import { t } from '@/composables/useText.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

/**
 * Translate a low-level fetch / network error into a user-facing message.
 * Used only when we cannot parse a backend JSON response.
 */
function describeError(err, context = {}) {
  if (err instanceof TypeError) {
    const msg = String(err.message || '').toLowerCase()
    if (msg.includes('cors')) {
      return t('errors.cors')
    }
    return t('errors.networkFailed')
  }

  const status = context.status || err.status
  if (status === 401) return t('errors.unauthorized')
  if (status === 403) return t('errors.forbidden')
  if (status === 404) return t('errors.notFound')
  if (status === 429) return t('errors.rateLimited')
  if (status === 503) return t('errors.serviceUnavailable')
  if (status >= 500) return t('errors.serverError', { status })
  if (status >= 400) return t('errors.httpGeneric', { status })

  return err?.message || t('errors.unknownError')
}

/**
 * Make an authenticated HTTP request.
 *
 * @param {string} url       - Relative path (e.g. '/auth/login') or full URL
 * @param {object} options   - fetch options; body is auto-JSON-stringified
 * @returns {Promise<any>}   - Unwrapped `response.data`
 */
export async function request(url, options = {}) {
  const { headers: customHeaders = {}, body, ...rest } = options

  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`

  let res
  try {
    res = await fetch(fullUrl, {
      ...rest,
      headers,
      ...(body !== undefined
        ? { body: typeof body === 'string' ? body : JSON.stringify(body) }
        : {}),
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    const wrapped = new Error(describeError(err))
    wrapped.cause = err
    wrapped.isNetworkError = true
    wrapped.friendlyMessage = describeError(err)
    throw wrapped
  }

  // 204 No Content — nothing to parse
  if (res.status === 204) {
    return null
  }

  // ─── Unified JSON response handling ───
  // All backend endpoints return the same envelope shape regardless of HTTP status.
  let result
  try {
    result = await res.json()
  } catch {
    // Not valid JSON (e.g. HTML error page from a proxy / load balancer)
    const err = new Error(`HTTP ${res.status}: Invalid response format`)
    err.status = res.status
    err.friendlyMessage = describeError(err, { status: res.status })
    throw err
  }

  // Business-level error — always prefer the server's message
  if (result.code !== 'SUCCESS') {
    const serverMessage = result.message || 'Request failed'
    const err = new Error(serverMessage)
    err.code = result.code
    err.status = res.status
    err.data = result.data
    err.friendlyMessage = serverMessage

    // 401 — clear token and redirect to login
    if (res.status === 401) {
      removeToken()
      const currentPath = router.currentRoute.value?.path
      if (currentPath !== '/login') {
        router.push('/login')
      }
    }
    throw err
  }

  return result.data
}
