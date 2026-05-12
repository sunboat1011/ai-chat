import { marked } from 'marked'
import hljs from 'highlight.js'

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
 */
const renderer = new marked.Renderer()

renderer.code = function (token) {
  const { text, lang } = token
  const code = lang
    ? hljs.highlight(text, { language: lang }).value
    : escapeHtml(text)

  const escapedLang = escapeHtml(lang || 'text')

  return `<div class="code-block-wrapper" data-lang="${escapedLang}">
    <div class="code-block-header">
      <span class="lang-label">${escapedLang}</span>
      <button class="copy-btn" onclick="copyCode(this)" aria-label="Copy code">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        Copy
      </button>
    </div>
    <pre><code class="hljs language-${escapedLang}">${code}</code></pre>
  </div>`
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Render markdown string to HTML.
 * @param {string} text
 * @returns {string}
 */
export function renderMarkdown(text) {
  return marked(text, { renderer })
}

/**
 * Escape HTML entities for plain-text fallback.
 * @param {string} text
 * @returns {string}
 */
export function escapeHtmlText(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export default marked
