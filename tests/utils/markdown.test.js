import { describe, it, expect } from 'vitest'
import { renderMarkdown, escapeHtmlText } from '@/utils/markdown'

describe('utils/markdown', () => {
  describe('renderMarkdown', () => {
    it('renders bold and emphasis', () => {
      const html = renderMarkdown('**bold** and *italic*')
      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('<em>italic</em>')
    })

    it('renders headings, lists, and links', () => {
      const html = renderMarkdown('# Title\n\n- one\n- two\n\n[link](https://example.com)')
      expect(html).toContain('<h1>Title</h1>')
      expect(html).toContain('<ul>')
      expect(html).toContain('<li>one</li>')
      expect(html).toContain('href="https://example.com"')
    })

    it('wraps fenced code blocks with code-block wrapper and language label', () => {
      const html = renderMarkdown('```js\nconst a = 1\n```')
      expect(html).toContain('class="code-block-wrapper"')
      expect(html).toContain('data-lang="js"')
      expect(html).toContain('class="lang-label">js</span>')
      expect(html).toContain('<pre>')
      // Copy button text survives DOMPurify even when <button> tag is stripped.
      expect(html).toContain('Copy')
    })

    it('falls back to "text" lang label for plain fenced blocks', () => {
      const html = renderMarkdown('```\nhello\n```')
      expect(html).toContain('class="lang-label">text</span>')
    })

    it('strips <script> tags via DOMPurify', () => {
      const html = renderMarkdown('Hi <script>alert(1)</script> there')
      expect(html).not.toContain('<script')
      expect(html).not.toContain('alert(1)')
    })

    it('strips inline event handlers (on*)', () => {
      const html = renderMarkdown('<img src="x" onerror="alert(1)" />')
      expect(html).not.toMatch(/onerror=/i)
      expect(html).not.toContain('alert(1)')
    })

    it('strips <iframe> tags', () => {
      const html = renderMarkdown('<iframe src="https://evil.com"></iframe>')
      expect(html).not.toContain('<iframe')
    })

    it('preserves SVG inside code-block copy button', () => {
      const html = renderMarkdown('```py\nprint(1)\n```')
      expect(html).toContain('<svg')
      expect(html).toContain('</svg>')
    })

    it('renders tables (GFM)', () => {
      const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |')
      expect(html).toContain('<table>')
      expect(html).toContain('<th>a</th>')
    })
  })

  describe('escapeHtmlText', () => {
    it('escapes the five HTML entities', () => {
      expect(escapeHtmlText(`<a href="x" id='y'>& test</a>`)).toBe(
        '&lt;a href=&quot;x&quot; id=&#39;y&#39;&gt;&amp; test&lt;/a&gt;'
      )
    })

    it('returns empty string when input is empty', () => {
      expect(escapeHtmlText('')).toBe('')
    })

    it('does not modify plain text without special chars', () => {
      expect(escapeHtmlText('plain text 123')).toBe('plain text 123')
    })
  })
})
