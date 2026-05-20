import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import { t } from '@/composables/useText'

/**
 * Configure marked with code highlighting renderer.
 */
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false,
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
})

/**
 * Override the code renderer to wrap blocks with a copy button header.
 * Note: no inline onclick — handled via event delegation for XSS safety.
 */
const renderer = new marked.Renderer()

renderer.code = function (token) {
  const { text, lang } = token
  const code = lang ? hljs.highlight(text, { language: lang }).value : escapeHtml(text)

  const escapedLang = escapeHtml(lang || 'text')

  return `<div class="code-block-wrapper" data-lang="${escapedLang}">
    <div class="code-block-header">
      <span class="lang-label">${escapedLang}</span>
      <button class="copy-btn" data-action="copy-code" aria-label="${t('message.copyCode')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        ${t('message.copyCodeBtn')}
      </button>
    </div>
    <pre><code class="hljs language-${escapedLang}">${code}</code></pre>
  </div>`
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * DOMPurify config for markdown-rendered content.
 * Keeps structural + styling attributes; strips scripts, iframes,
 * form elements and all event handlers (on*).
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'del',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'code',
    'pre',
    'blockquote',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
    'div',
    'span',
    'sup',
    'sub',
    'svg',
    'path',
    'rect',
    'polyline',
    'circle',
    'line',
  ],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'class',
    'id',
    'data-lang',
    'data-action',
    'width',
    'height',
    'viewBox',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'd',
    'x',
    'y',
    'rx',
    'ry',
    'points',
    'aria-label',
  ],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: true,
  SANITIZE_DOM: true,
}

/**
 * Render markdown string to sanitized HTML.
 * @param {string} text
 * @returns {string}
 */
export function renderMarkdown(text) {
  const rawHtml = marked(text, { renderer })
  return DOMPurify.sanitize(rawHtml, PURIFY_CONFIG)
}

/**
 * Escape HTML entities for plain-text fallback.
 * @param {string} text
 * @returns {string}
 */
export function escapeHtmlText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default marked
