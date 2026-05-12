/**
 * Global copy-to-clipboard handler for code blocks.
 * Called from the rendered HTML via onclick="copyCode(this)".
 */
window.copyCode = function (btn) {
  const wrapper = btn.closest('.code-block-wrapper')
  const codeEl = wrapper?.querySelector('code')
  if (!codeEl) return

  const text = codeEl.textContent
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied')
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied!`
    setTimeout(() => {
      btn.classList.remove('copied')
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        Copy`
    }, 2000)
  })
}
