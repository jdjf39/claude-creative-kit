/**
 * Real-Chrome verification suite. Drives SYSTEM Chrome headful (real GPU)
 * against the production build on :5197. The preview pane cannot render
 * WebGL — nothing here is ever judged there.
 *
 *   npm run build && npm run preview &   # serve dist
 *   npm run verify
 */
import puppeteer from 'puppeteer-core'
import { PNG } from 'pngjs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.KW_URL || 'http://localhost:5197'
const URL_ = BASE + '/?nosmooth&nodamp'

let pass = 0
let fail = 0
const failures = []
function check(name, ok, detail = '') {
  if (ok) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    failures.push(`${name}${detail ? ' — ' + detail : ''}`)
    console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`)
  }
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: ['--no-first-run', '--disable-extensions', '--disable-backgrounding-occluded-windows', '--window-size=1680,1050', '--window-position=40,40'],
})

async function newPage(vp, media = []) {
  const page = await browser.newPage()
  const errs = []
  const external = []
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message))
  page.on('request', (r) => {
    if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) external.push(r.url())
  })
  await page.setViewport(vp)
  if (media.length) await page.emulateMediaFeatures(media)
  return { page, errs, external }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// clamp inside [1, max-2] so the loop's hard-wrap teleport never fires
// mid-sweep — p=0 and p=1 are exercised by the dedicated seam/wrap blocks
const setP = async (page, p) => {
  await page.evaluate((pp) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: Math.min(Math.max(pp * max, 1), max - 2), behavior: 'instant' })
  }, p)
  await sleep(160)
}

const pngOf = (dataUrl) => PNG.sync.read(Buffer.from(dataUrl.split(',')[1], 'base64'))
const deltaPct = (a, b) => {
  const total = a.width * a.height
  let diff = 0
  for (let i = 0; i < total * 4; i += 4) {
    const d =
      Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2])
    if (d > 60) diff++
  }
  return (diff / total) * 100
}

const worldState = (page) =>
  page.evaluate(() => {
    const s = window.__world.state()
    const truth = window.__world.poseAt(s.p)
    const activeDom = document.querySelector('[data-active="true"]')?.dataset.world ?? null
    return { ...s, truth, activeDom, gl: window.__glCount }
  })

const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/* ════ 1. DESKTOP — full tier, the lockstep sweep ════════════════════ */
console.log('\n[1] desktop 1600×1000 · full tier · lockstep')
{
  const { page, errs, external } = await newPage({ width: 1600, height: 1000, deviceScaleFactor: 1 })
  await page.goto(URL_, { waitUntil: 'networkidle2', timeout: 30000 })
  await page.waitForFunction(() => window.__world && window.__world.drawn, { timeout: 15000 })
  await page.evaluate(() => document.fonts.ready)
  // the REST frame is the hero anchor (p=0 is mid-wrap on the loop)
  const rest = await page.evaluate(() => window.__world.restP())
  await setP(page, rest)
  await sleep(250)

  check('exactly one live WebGL context', (await page.evaluate(() => window.__glCount)) === 1)
  check('loop publisher live (__worldScroll)', await page.evaluate(() => !!window.__worldScroll))
  check(
    'fonts self-hosted and active',
    await page.evaluate(() => document.fonts.check('600 16px "Clash Display"') && document.fonts.check('16px "Geist Mono"')),
  )
  {
    const s0 = await worldState(page)
    check('tier is full', s0.tier === 'full')
    check('composer active on full tier', s0.composer === true)
    check('transmission core active on full tier', s0.transmission === true)
  }

  // rest frame: camera exactly at the hero waypoint, world lit
  let s = await worldState(page)
  check('rest: engine at hero waypoint', s.waypoint === 'hero', s.waypoint)
  check('rest: DOM data-active agrees', s.activeDom === 'hero', String(s.activeDom))
  check(
    'rest: camera == f(rest) ground truth',
    dist3(s.cam, s.truth.cam) < 0.02,
    `cam=${s.cam.map((v) => v.toFixed(2))} truth=${s.truth.cam.map((v) => v.toFixed(2))}`,
  )
  let smp = await page.evaluate(() => window.__world.sample())
  check('rest: world visibly lit in readback', smp.lit > 60, JSON.stringify(smp))
  // measured 1253/1600 at rest — threshold at ~60% of measured
  check('rest: smoked-glass world in readback', smp.glassy > 750, JSON.stringify(smp))
  check('rest: draw calls within budget (≤120)', s.calls <= 120, `calls=${s.calls}`)
  check('rest: triangle budget (≤500k desktop)', s.tris <= 500000, `tris=${s.tris}`)

  // ── the seam proof: one full loop is an identical image ────────────
  {
    const a = pngOf(await page.evaluate(() => window.__world.renderAt(0, 480, 300)))
    const b = pngOf(await page.evaluate(() => window.__world.renderAt(1 - 1e-6, 480, 300)))
    const half = pngOf(await page.evaluate(() => window.__world.renderAt(0.5, 480, 300)))
    const seam = deltaPct(a, b)
    check(`loop is seamless — frame(1⁻) == frame(0) (Δ ${seam.toFixed(3)}% < 0.3%)`, seam < 0.3)
    const travel = deltaPct(a, half)
    check(`world actually travels — half-loop differs (Δ ${travel.toFixed(1)}% > 5%)`, travel > 5)
    await sleep(200)
  }

  // ── poster vs live rest frame (≤ 2.5% pixel delta — grain differs) ──
  // DOM copy is hidden on BOTH sides: this compares the WORLD, not the text.
  {
    await setP(page, rest)
    await sleep(200)
    // NOTE: no `clip` — puppeteer clips are DOCUMENT-relative and the rest
    // frame sits scrolled past the void spacer; a {0,0} clip would capture
    // the document top, not the viewport. Full-viewport screenshots only.
    await page.evaluate(() => {
      document.querySelectorAll('main, header, footer, .world-loader').forEach((el) => (el.style.visibility = 'hidden'))
    })
    await sleep(80)
    const liveShot = PNG.sync.read(Buffer.from(await page.screenshot()))
    await page.evaluate(async () => {
      const img = document.createElement('img')
      img.id = 'poster-cmp'
      img.src = '/world-poster.webp'
      Object.assign(img.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', objectFit: 'cover', zIndex: '60', background: '#050708' })
      document.body.appendChild(img)
      await img.decode()
    })
    await sleep(120)
    const posterShot = PNG.sync.read(Buffer.from(await page.screenshot()))
    await page.evaluate(() => {
      document.getElementById('poster-cmp').remove()
      document.querySelectorAll('main, header, footer, .world-loader').forEach((el) => (el.style.visibility = ''))
    })
    let diff = 0
    const total = liveShot.width * liveShot.height
    for (let i = 0; i < total * 4; i += 4) {
      const d =
        Math.abs(liveShot.data[i] - posterShot.data[i]) +
        Math.abs(liveShot.data[i + 1] - posterShot.data[i + 1]) +
        Math.abs(liveShot.data[i + 2] - posterShot.data[i + 2])
      if (d > 60) diff++
    }
    const ratio = diff / total
    if (ratio > 0.025 && process.env.KW_OUT) {
      const { writeFileSync } = await import('node:fs')
      writeFileSync(`${process.env.KW_OUT}/vfy-live.png`, PNG.sync.write(liveShot))
      writeFileSync(`${process.env.KW_OUT}/vfy-poster.png`, PNG.sync.write(posterShot))
    }
    check(`live rest frame matches baked poster (Δ ${(ratio * 100).toFixed(2)}% ≤ 2.5%)`, ratio <= 0.025)
  }

  check(
    'loader line faded once live',
    await page.evaluate(() => {
      const l = document.querySelector('.world-loader')
      return !!l && l.classList.contains('done') && getComputedStyle(l).opacity === '0'
    }),
  )

  // the sweep — engine waypoint, DOM active, camera truth in lockstep
  console.log('  — sweep')
  const visited = new Set()
  for (const p of [0, 0.15, 0.3, 0.5, 0.7, 0.85, 0.999]) {
    await setP(page, p)
    s = await worldState(page)
    visited.add(s.waypoint)
    check(
      `p=${p}: engine(${s.waypoint}) == DOM(${s.activeDom}) · camΔ ok`,
      s.waypoint === s.activeDom && dist3(s.cam, s.truth.cam) < 0.02,
      `camΔ=${dist3(s.cam, s.truth.cam).toFixed(4)}`,
    )
  }

  // fine sweep: every waypoint must be visited (the camera actually flies
  // the whole path, no dead segments)
  for (let p = 0; p <= 1.0001; p += 0.02) {
    await page.evaluate((pp) => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo({ top: Math.min(1, pp) * max, behavior: 'instant' })
    }, p)
    await sleep(25)
    visited.add((await page.evaluate(() => window.__world.state().waypoint)))
  }
  check('fine sweep visits all 7 waypoints', visited.size === 7, [...visited].join(','))

  // reversal — nothing latches
  await setP(page, 0.999)
  await setP(page, 0.3)
  s = await worldState(page)
  check(
    'scroll-back: state reverses to f(p) exactly',
    s.waypoint === s.activeDom && dist3(s.cam, s.truth.cam) < 0.02,
    `wp=${s.waypoint} dom=${s.activeDom} camΔ=${dist3(s.cam, s.truth.cam).toFixed(4)}`,
  )

  // growth is monotone in p across its ramp (core anchor → growth anchor)
  const anchors = (await worldState(page)).anchors
  const g = []
  for (const k of [0, 0.33, 0.67, 1]) {
    await setP(page, anchors[3] + (anchors[4] - anchors[3]) * k)
    g.push((await worldState(page)).fx.growth)
  }
  check('fx.growth monotone with p', g.every((v, i) => i === 0 || v >= g[i - 1] - 1e-6), g.map((v) => v.toFixed(2)).join('→'))

  // ignition: the world reads more cyan at the signal waypoint than at rest
  await setP(page, anchors[5])
  const smpSignal = await page.evaluate(() => window.__world.sample())
  check('signal: ignited world reads strongly cyan', smpSignal.cyanish > smp.cyanish, `rest=${smp.cyanish} signal=${smpSignal.cyanish}`)

  // hard-wrap behavior (?nosmooth): both directions land on the far side
  {
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await sleep(250)
    const yFwd = await page.evaluate(() => window.scrollY)
    check('hard-wrap forward: end teleports to top', yFwd < 50, `y=${yFwd}`)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await sleep(250)
    const yBack = await page.evaluate(() => ({ y: window.scrollY, max: document.documentElement.scrollHeight - window.innerHeight }))
    check('hard-wrap backward: top teleports to end', yBack.y > yBack.max - 50, `y=${yBack.y}`)
    await setP(page, rest)
  }

  // vault dwell: the vault copy emphasis follows localP
  check(
    'vault monuments emphasis wired (one lit border)',
    await page.evaluate(async () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const el = document.querySelector('[data-world="vault"]')
      const top = window.scrollY + el.getBoundingClientRect().top
      window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * 0.9, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 300))
      return document.querySelectorAll('#vault .border-signal').length === 1
    }),
  )

  // reveals never leave content at opacity 0 / stuck transforms
  const op0 = await page.evaluate(
    () => Array.from(document.querySelectorAll('.rv')).filter((el) => getComputedStyle(el).opacity === '0').length,
  )
  check('no .rv element stuck at opacity 0', op0 === 0, `${op0} stuck`)

  check('zero console errors', errs.length === 0, errs.slice(0, 4).join(' | '))
  check('no external (CDN) requests — fully self-hosted', external.length === 0, external.slice(0, 4).join(' | '))
  await page.close()
}

/* ════ 2. DEEP LINK — #vault lands framed, synchronously ═════════════ */
console.log('\n[2] deep link #vault')
{
  const { page, errs } = await newPage({ width: 1600, height: 1000, deviceScaleFactor: 1 })
  await page.goto(BASE + '/?nosmooth&nodamp#vault', { waitUntil: 'networkidle2', timeout: 30000 })
  await page.waitForFunction(() => window.__world && window.__world.drawn, { timeout: 15000 })
  await sleep(300)
  const s = await worldState(page)
  check('lands at/near vault waypoint', s.waypoint === 'vault' || s.waypoint === 'descent', s.waypoint)
  check('camera == f(p) on first frame', dist3(s.cam, s.truth.cam) < 0.02)
  check('zero console errors', errs.length === 0, errs.slice(0, 3).join(' | '))
  await page.close()
}

/* ════ 3. MOBILE 390px — lite tier ═══════════════════════════════════ */
console.log('\n[3] mobile 390×844 · lite tier')
{
  const { page, errs, external } = await newPage({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.goto(URL_, { waitUntil: 'networkidle2', timeout: 30000 })
  await page.waitForFunction(() => window.__world && window.__world.drawn, { timeout: 15000 })
  await sleep(300)
  const s = await worldState(page)
  check('tier is lite', s.tier === 'lite', s.tier)
  check('one WebGL context', s.gl === 1)
  check('composer off on lite', s.composer === false)
  check('no transmission on lite', s.transmission === false)
  check(
    'all copy present in DOM',
    await page.evaluate(() =>
      ['hero', 'descent', 'vault', 'core', 'growth', 'signal'].every(
        (id) => (document.querySelector(`#${id}`)?.textContent ?? '').length > 40,
      ),
    ),
  )
  check(
    'no horizontal scroll',
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    await page.evaluate(() => `scrollWidth=${document.documentElement.scrollWidth}`),
  )
  check('zero console errors', errs.length === 0, errs.slice(0, 4).join(' | '))
  check('no external requests', external.length === 0)
  await page.close()
}

/* ════ 4. REDUCED MOTION — static tier, engine never downloaded ══════ */
console.log('\n[4] prefers-reduced-motion · static tier')
{
  const { page, errs } = await newPage(
    { width: 1600, height: 1000, deviceScaleFactor: 1 },
    [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  )
  await page.goto(URL_, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(700)
  check(
    'engine not imported / no canvas',
    await page.evaluate(() => typeof window.__three_loaded === 'undefined' && document.querySelectorAll('canvas').length === 0),
  )
  check(
    'engine chunk never requested',
    await page.evaluate(() =>
      performance.getEntriesByType('resource').every((r) => !r.name.includes('engine-')),
    ),
  )
  check(
    'all copy present in DOM',
    await page.evaluate(() =>
      ['hero', 'descent', 'vault', 'core', 'growth', 'signal'].every(
        (id) => (document.querySelector(`#${id}`)?.textContent ?? '').length > 40,
      ),
    ),
  )
  check(
    'reveals static (no transform pending)',
    await page.evaluate(() => Array.from(document.querySelectorAll('.rv')).every((el) => getComputedStyle(el).transform === 'none')),
  )
  check(
    'world poster visible under the page',
    await page.evaluate(() => {
      const img = document.querySelector('img.world-poster')
      return !!img && img.naturalWidth > 0 && getComputedStyle(img).opacity === '1'
    }),
  )
  check('no void spacers on static tier', await page.evaluate(() => document.querySelectorAll('.void-span').length === 0))
  check('no loop publisher on static tier', await page.evaluate(() => typeof window.__worldScroll === 'undefined'))
  // the page must simply END — no wrap yank for reduced-motion users
  {
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await sleep(400)
    const st = await page.evaluate(() => ({ y: window.scrollY, max: document.documentElement.scrollHeight - window.innerHeight }))
    check('static tier: no wrap — bottom stays bottom', st.y > st.max - 50, `y=${st.y} max=${st.max}`)
  }
  check('zero console errors', errs.length === 0, errs.slice(0, 4).join(' | '))
  await page.close()
}

await browser.close()

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) {
  console.log('FAILURES:\n - ' + failures.join('\n - '))
  process.exit(1)
}
