// Captures a clean PNG of each mockup screen from design/mockups.html
// Usage: node scripts/capture-mockups.mjs
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const mockupPath = resolve(root, 'design', 'mockups.html')
const outDir = resolve(root, 'design', 'screenshots')
mkdirSync(outDir, { recursive: true })

const fileUrl = 'file:///' + mockupPath.replace(/\\/g, '/')

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 2 }) // crisp, retina-quality
await page.setViewportSize({ width: 1280, height: 1000 })
await page.goto(fileUrl, { waitUntil: 'load' })
// White page background + expand each phone to its full content height so
// scrollable screens (momentum, reflection, AI report) aren't cut off.
await page.addStyleTag({ content: `
  body{background:#ffffff !important}
  .phone{height:auto !important}
  .screen{height:auto !important}
  .scroll{overflow:visible !important; height:auto !important; flex:none !important}
  .fab{position:static !important; margin-top:14px !important}
  .scout-foot{margin-top:14px !important}
` })
await page.waitForTimeout(300) // let fonts/gradients settle

const frames = page.locator('.frame-wrap')
const count = await frames.count()
console.log('Found', count, 'mockup screens')

const manifest = []
for (let i = 0; i < count; i++) {
  const f = frames.nth(i)
  const title = (await f.locator('.frame-title').innerText()).trim()
  const caption = (await f.locator('.frame-cap').innerText()).trim()
  await f.scrollIntoViewIfNeeded()
  await page.waitForTimeout(80)
  const num = String(i + 1).padStart(2, '0')
  const fileName = `${num}.png`
  // Capture just the phone device for a clean, uniform image in the document
  await f.locator('.phone').screenshot({ path: resolve(outDir, fileName) })
  manifest.push({ num, file: fileName, title, caption })
  console.log('Saved', fileName, '-', title)
}

// Save a manifest so the document builder knows titles + captions
writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
await browser.close()
console.log('Done. Screenshots in design/screenshots/')
