/**
 * Waypoint screenshots for human review — one frame at each anchor.
 *   npm run preview &  node scripts/shots.mjs
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.KW_URL || 'http://localhost:5197'
const OUT = new URL('../shots/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: ['--no-first-run', '--disable-extensions', '--disable-backgrounding-occluded-windows', '--window-size=1680,1050', '--window-position=40,40'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
await page.goto(BASE + '/?nosmooth&nodamp', { waitUntil: 'networkidle2', timeout: 30000 })
await page.waitForFunction(() => window.__world && window.__world.drawn, { timeout: 15000 })
await page.evaluate(() => document.fonts.ready)

const anchors = await page.evaluate(() => window.__world.state().anchors)
const ids = ['hero', 'descent', 'vault', 'core', 'growth', 'signal', 'footer']
for (let i = 0; i < anchors.length; i++) {
  await page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: p * max, behavior: 'instant' })
  }, anchors[i])
  await new Promise((r) => setTimeout(r, 350))
  await page.screenshot({ path: `${OUT}/${String(i).padStart(2, '0')}-${ids[i]}.png` })
  console.log(`shot ${ids[i]} @ p=${anchors[i].toFixed(3)}`)
}
// two mid-travel frames — the flight itself
for (const [name, p] of [['travel-descent', (anchors[1] + anchors[2]) / 2], ['travel-pullback', (anchors[4] + anchors[5]) / 2]]) {
  await page.evaluate((pp) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: pp * max, behavior: 'instant' })
  }, p)
  await new Promise((r) => setTimeout(r, 350))
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log(`shot ${name}`)
}
await browser.close()
