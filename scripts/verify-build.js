#!/usr/bin/env node
/**
 * 构建产物健康检查脚本
 * 验证：构建是否成功、产物文件是否完整、体积是否超标、是否有警告
 */

import { execSync } from 'child_process'
import { existsSync, statSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const distDir = resolve(rootDir, 'dist')

const THRESHOLDS = {
  jsTotalGzipKb: 150,
  cssTotalGzipKb: 20,
}

let exitCode = 0

function log(level, message) {
  const prefix = { info: 'ℹ ', ok: '✓ ', warn: '⚠ ', error: '✗ ' }
  console.log(`${prefix[level] || ''}${message}`)
}

function fail(message) {
  log('error', message)
  exitCode = 1
}

function getFileSizeKb(filePath) {
  const bytes = statSync(filePath).size
  return bytes / 1024
}

function gzipSizeSync(filePath) {
  const result = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf-8' })
  return parseInt(result.trim(), 10) / 1024
}

// ─── 1. 执行构建 ───
log('info', 'Step 1: Running npm run build...')
let buildOutput
let buildHasWarning = false
try {
  buildOutput = execSync('npm run build', {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
} catch (e) {
  buildOutput = e.stdout || ''
  const stderr = e.stderr || ''
  if (e.status !== 0) {
    fail(`Build failed with exit code ${e.status}`)
    if (stderr) console.error(stderr)
    process.exit(exitCode)
  }
}

// 检查构建输出中的 warning（排除 Rollup 的 chunk size warning，我们已配置 manualChunks）
const warningLines = buildOutput
  .split('\n')
  .filter((line) => /warning/i.test(line) && !/chunk size warning/i.test(line))
if (warningLines.length > 0) {
  buildHasWarning = true
  log('warn', `Build produced ${warningLines.length} warning(s):`)
  warningLines.forEach((l) => console.log(`  ${l.trim()}`))
} else {
  log('ok', 'Build completed with no unexpected warnings')
}

// ─── 2. 检查产物文件 ───
log('info', 'Step 2: Checking output files...')

if (!existsSync(distDir)) {
  fail('dist/ directory does not exist')
  process.exit(exitCode)
}

const distFiles = readdirSync(distDir, { recursive: true })
const files = distFiles
  .filter((f) => typeof f === 'string')
  .map((f) => resolve(distDir, f))
  .filter((f) => !statSync(f).isDirectory())

const htmlFiles = files.filter((f) => f.endsWith('.html'))
const jsFiles = files.filter((f) => f.endsWith('.js'))
const cssFiles = files.filter((f) => f.endsWith('.css'))

if (htmlFiles.length === 0) {
  fail('No HTML files found in dist/')
} else {
  log('ok', `Found ${htmlFiles.length} HTML file(s)`)
}

if (jsFiles.length === 0) {
  fail('No JS files found in dist/')
} else {
  log('ok', `Found ${jsFiles.length} JS file(s)`)
}

if (cssFiles.length === 0) {
  fail('No CSS files found in dist/')
} else {
  log('ok', `Found ${cssFiles.length} CSS file(s)`)
}

// ─── 3. 体积检查 ───
log('info', 'Step 3: Checking bundle size...')

let jsTotalGzip = 0
let cssTotalGzip = 0

for (const file of jsFiles) {
  const rawKb = getFileSizeKb(file)
  const gzipKb = gzipSizeSync(file)
  jsTotalGzip += gzipKb
  const name = file.replace(distDir + '/', '')
  log('info', `  ${name}: ${rawKb.toFixed(2)} kB (gzip: ${gzipKb.toFixed(2)} kB)`)
}

for (const file of cssFiles) {
  const rawKb = getFileSizeKb(file)
  const gzipKb = gzipSizeSync(file)
  cssTotalGzip += gzipKb
  const name = file.replace(distDir + '/', '')
  log('info', `  ${name}: ${rawKb.toFixed(2)} kB (gzip: ${gzipKb.toFixed(2)} kB)`)
}

if (jsTotalGzip > THRESHOLDS.jsTotalGzipKb) {
  fail(
    `JS total gzip size (${jsTotalGzip.toFixed(2)} kB) exceeds threshold (${THRESHOLDS.jsTotalGzipKb} kB)`
  )
} else {
  log('ok', `JS total gzip: ${jsTotalGzip.toFixed(2)} kB (threshold: ${THRESHOLDS.jsTotalGzipKb} kB)`)
}

if (cssTotalGzip > THRESHOLDS.cssTotalGzipKb) {
  fail(
    `CSS total gzip size (${cssTotalGzip.toFixed(2)} kB) exceeds threshold (${THRESHOLDS.cssTotalGzipKb} kB)`
  )
} else {
  log(
    'ok',
    `CSS total gzip: ${cssTotalGzip.toFixed(2)} kB (threshold: ${THRESHOLDS.cssTotalGzipKb} kB)`
  )
}

// ─── 4. 产物预览验证（检查 index.html 可访问性） ───
log('info', 'Step 4: Checking index.html content...')
const indexHtml = htmlFiles.find((f) => f.endsWith('index.html'))
if (indexHtml) {
  const content = execSync(`cat "${indexHtml}"`, { encoding: 'utf-8' })
  if (!content.includes('<script') && jsFiles.length > 0) {
    fail('index.html does not reference any script (check build output)')
  } else if (!content.includes('<link') && cssFiles.length > 0) {
    fail('index.html does not reference any stylesheet (check build output)')
  } else {
    log('ok', 'index.html references JS/CSS resources correctly')
  }
}

// ─── 总结 ───
console.log('')
if (exitCode === 0) {
  log('ok', 'Build verification PASSED ✓')
} else {
  log('error', 'Build verification FAILED ✗')
}
process.exit(exitCode)
