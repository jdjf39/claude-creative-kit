/**
 * Bake public/world-poster.webp — the ACTUAL p=0 frame rendered by the
 * engine (through the same post chain), so the poster-vs-live diff is a
 * true regression check, not an approximation.
 *   npm run preview &  node scripts/poster.mjs && npm run build
 */
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.KW_URL || 'http://localhost:5197'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: ['--no-first-run', '--disable-extensions', '--disable-backgrounding-occluded-windows', '--window-size=1680,1050', '--window-position=40,40'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
await page.goto(BASE + '/?nosmooth&nodamp', { waitUntil: 'networkidle2', timeout: 30000 })
await page.waitForFunction(() => window.__world && window.__world.drawn, { timeout: 15000 })
// no scroll needed — capturePoster renders the rest frame (hero anchor) itself
await new Promise((r) => setTimeout(r, 400))

const dataUrl = await page.evaluate(() => window.__world.capturePoster(1600, 1000))
if (!dataUrl.startsWith('data:image/webp')) throw new Error('poster capture failed: ' + dataUrl.slice(0, 60))
const out = new URL('../public/world-poster.webp', import.meta.url).pathname
writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'))
console.log('baked', out, Math.round(Buffer.from(dataUrl.split(',')[1], 'base64').length / 1024) + 'KB')
await browser.close()
