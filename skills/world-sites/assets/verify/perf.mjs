/**
 * Frame-time gate: a scripted 10s scroll through the whole world on the
 * real GPU. Fails if avg frame > 16.7ms or p95 > 25ms.
 *   npm run preview &  node scripts/perf.mjs
 */
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.KW_URL || 'http://localhost:5197'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: ['--no-first-run', '--disable-extensions', '--disable-backgrounding-occluded-windows', '--window-size=1680,1050', '--window-position=40,40'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 }) // retina — the honest case
await page.goto(BASE + '/?nosmooth', { waitUntil: 'networkidle2', timeout: 30000 })
await page.waitForFunction(() => window.__world && window.__world.drawn, { timeout: 15000 })
await new Promise((r) => setTimeout(r, 500))

const stats = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const DURATION = 10000
      const frames = []
      const max = document.documentElement.scrollHeight - window.innerHeight
      const t0 = performance.now()
      let last = t0
      function tick(now) {
        frames.push(now - last)
        last = now
        const t = (now - t0) / DURATION
        if (t >= 1) {
          frames.shift() // first frame includes setup
          const sorted = [...frames].sort((a, b) => a - b)
          resolve({
            n: frames.length,
            avg: frames.reduce((a, b) => a + b, 0) / frames.length,
            p95: sorted[Math.floor(sorted.length * 0.95)],
            worst: sorted[sorted.length - 1],
          })
          return
        }
        // full descent and back — clamped inside the loop's hard-wrap band
        const s = t < 0.5 ? t * 2 : 2 - t * 2
        window.scrollTo({ top: Math.min(Math.max(s * max, 1), max - 2), behavior: 'instant' })
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }),
)

console.log(
  `frames=${stats.n} avg=${stats.avg.toFixed(2)}ms p95=${stats.p95.toFixed(2)}ms worst=${stats.worst.toFixed(2)}ms`,
)
const ok = stats.avg < 16.7 && stats.p95 < 25
console.log(ok ? 'PERF PASS' : 'PERF FAIL')
await browser.close()
process.exit(ok ? 0 : 1)
