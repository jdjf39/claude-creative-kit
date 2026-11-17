/**
 * The shared timeline — the hybrid contract between the DOM page and the
 * 3D world. Deliberately THREE-FREE so the DOM side can import it without
 * pulling the engine chunk.
 *
 * v2: the page is an ENDLESS LOOP. p ∈ [0,1) wraps (fract of the virtual
 * scroll), the camera path is a closed circuit, and the final "wrap
 * segment" (return → hero) is fx-continuous so frame(1⁻) ≡ frame(0).
 * NOTE: p=0 is MID-WRAP, not the hero — the rest frame is p = restP(anchors)
 * (the hero anchor, which sits after the top void spacer).
 */

export const SECTION_IDS = ['hero', 'descent', 'vault', 'core', 'growth', 'signal', 'return'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export type Fx = {
  bloom: number
  ca: number // chromatic aberration amount
  fog: number // fog density multiplier
  growth: number // crystal eruption scrub
  ignite: number // teal→cyan world ignition
  exposure: number
}

export type Waypoint = {
  id: SectionId
  cam: [number, number, number]
  look: [number, number, number]
  fov: number
  fx: Fx
}

const fx = (o: Partial<Fx>): Fx => ({
  bloom: 0.5,
  ca: 0.06,
  fog: 0.8,
  growth: 0,
  ignite: 0,
  exposure: 1,
  ...o,
})

/**
 * A closed circuit — THE LIFE OF A CALL: ringing handset → dive into the
 * line → the voice agent answers → the exchange routes → the calendar
 * books → the network ignites → the next call arrives → wrap to the
 * handset. The wrap segment lands every fx channel exactly on hero's
 * values as p → 1⁻. Camera positions are the verified v2/v3 flight.
 */
export const WAYPOINTS: Waypoint[] = [
  { id: 'hero',    cam: [0, 0.35, 6.4],       look: [0, 0.1, 0],          fov: 40, fx: fx({ bloom: 0.6, ca: 0.05, fog: 0.5 }) },
  { id: 'descent', cam: [0, -5.6, 1.2],       look: [0, -11.5, -3.6],     fov: 55, fx: fx({ bloom: 0.55, ca: 0.3, fog: 1.0, exposure: 0.9 }) },
  { id: 'vault',   cam: [0, -14.9, -2.2],     look: [0, -16.6, -8.2],     fov: 48, fx: fx({ bloom: 0.5, ca: 0.08, fog: 0.8 }) },
  { id: 'core',    cam: [3.6, -17.6, -8.9],   look: [0, -18.5, -14],      fov: 44, fx: fx({ bloom: 0.85, ca: 0.12, fog: 0.65 }) },
  { id: 'growth',  cam: [-2.4, -21.2, -16.6], look: [0.6, -23.4, -20.6],  fov: 50, fx: fx({ bloom: 0.6, ca: 0.1, fog: 0.75, growth: 1 }) },
  { id: 'signal',  cam: [0, -11.6, 5.6],      look: [0, -18.8, -11.8],    fov: 52, fx: fx({ bloom: 1, ca: 0.15, fog: 0.4, growth: 1, ignite: 1, exposure: 1.05 }) },
  { id: 'return',  cam: [0, -4.2, 6.2],       look: [0, -0.6, 0.3],       fov: 46, fx: fx({ bloom: 0.5, ca: 0.06, fog: 1.2, growth: 1, ignite: 0.25, exposure: 0.85 }) },
]

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const fract = (v: number) => v - Math.floor(v)

/** smootherstep — zero 1st AND 2nd derivative at both ends: real dwell
 *  plateaus at every waypoint while copy is on screen. */
export const plateau = (t: number) => {
  const x = clamp01(t)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

const vh = () => window.innerHeight || document.documentElement.clientHeight || 1

/**
 * Loop progress. When a loop mode is live, useWorldLoop publishes the
 * virtual scroll on window.__worldScroll and p wraps via fract. When no
 * publisher exists (static tier / reduced motion) the page is a plain
 * clamped document that simply ends — that absence IS the tier switch.
 */
export function loopProgress(): number {
  const ws = (window as unknown as { __worldScroll?: { v: number; limit: number } }).__worldScroll
  if (ws && ws.limit > 1) return fract(ws.v / ws.limit)
  const limit = document.documentElement.scrollHeight - vh()
  if (limit <= 4) return 0
  return Math.min((window.scrollY || window.pageYOffset || 0) / limit, 0.9999)
}

/**
 * Anchor table: the p at which the camera sits exactly AT each waypoint —
 * the midpoint of each section's sticky dwell zone. NOT forced to 0/1
 * anymore: hero sits after the top void spacer (a₀ ≈ 0.06) and the wrap
 * segment covers [a_last, 1) ∪ [0, a₀).
 */
export type Anchors = number[]

export const restP = (anchors: Anchors) => anchors[0]

/** Document-absolute top — offsetTop is relative to the nearest positioned
 *  ancestor (main is position:relative), which shifts everything once the
 *  void spacer sits before it. Rect + scrollY is offsetParent-proof. */
export function docTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0)
}

export function measureAnchors(): Anchors {
  const scrollable = Math.max(1, document.documentElement.scrollHeight - vh())
  const a: number[] = WAYPOINTS.map((w, i) => {
    const el = document.querySelector<HTMLElement>(`[data-world="${w.id}"]`)
    if (!el) return (i + 0.5) / WAYPOINTS.length
    const dwell = Math.max(0, el.offsetHeight - vh())
    const mid = docTop(el) + dwell / 2
    return clamp01(mid / scrollable)
  })
  a[0] = Math.max(a[0], 0.005)
  a[a.length - 1] = Math.min(a[a.length - 1], 0.995)
  // strictly increasing guard — collapsed sections must not fold the path back
  for (let i = 1; i < a.length; i++) if (a[i] <= a[i - 1]) a[i] = a[i - 1] + 0.0001
  return a
}

/**
 * Which segment p falls in, and the plateau-eased t within it.
 * Segments 0..N-2 span [aᵢ, aᵢ₊₁); segment N-1 is the WRAP segment
 * spanning [a_{N-1}, 1) ∪ [0, a₀). fract(1) ≡ 0 collapses the exact-wrap
 * edge, so frame(1⁻) ≡ frame(0) by construction.
 */
export function segmentAt(p: number, anchors: Anchors): { i: number; t: number } {
  const N = anchors.length
  const pp = fract(p)
  if (pp < anchors[0] || pp >= anchors[N - 1]) {
    const span = 1 - anchors[N - 1] + anchors[0]
    const d = pp >= anchors[N - 1] ? pp - anchors[N - 1] : pp + 1 - anchors[N - 1]
    return { i: N - 1, t: plateau(span <= 0 ? 1 : d / span) }
  }
  let i = 0
  while (i < N - 2 && pp >= anchors[i + 1]) i++
  const span = anchors[i + 1] - anchors[i]
  const t = span <= 0 ? 1 : plateau((pp - anchors[i]) / span)
  return { i, t }
}

/** Active waypoint id — nearest anchor, wrap-aware. On the wrap segment the
 *  second half (top void + hero approach) reports hero: correct (the camera
 *  is framing the seed) and invisible (nothing is on screen in the void). */
export function activeIndexAt(p: number, anchors: Anchors): number {
  const { i, t } = segmentAt(p, anchors)
  return (t < 0.5 ? i : i + 1) % anchors.length
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** The fx rack as a pure function of p — wrap-continuous. */
export function fxAt(p: number, anchors: Anchors): Fx {
  const { i, t } = segmentAt(p, anchors)
  const a = WAYPOINTS[i].fx
  const b = WAYPOINTS[(i + 1) % WAYPOINTS.length].fx
  return {
    bloom: lerp(a.bloom, b.bloom, t),
    ca: lerp(a.ca, b.ca, t),
    fog: lerp(a.fog, b.fog, t),
    growth: lerp(a.growth, b.growth, t),
    ignite: lerp(a.ignite, b.ignite, t),
    exposure: lerp(a.exposure, b.exposure, t),
  }
}

/** Travel speed proxy |du/dp| ∈ [0,1] — drives speed-reactive CA/particles.
 *  Peaks mid-segment, zero at every dwell plateau; continuous across the
 *  wrap (x(1⁻) = x(0) on the wrap segment). */
export function travelAt(p: number, anchors: Anchors): number {
  const N = anchors.length
  const pp = fract(p)
  let x: number
  if (pp < anchors[0] || pp >= anchors[N - 1]) {
    const span = 1 - anchors[N - 1] + anchors[0]
    const d = pp >= anchors[N - 1] ? pp - anchors[N - 1] : pp + 1 - anchors[N - 1]
    x = span <= 0 ? 0 : clamp01(d / span)
  } else {
    let i = 0
    while (i < N - 2 && pp >= anchors[i + 1]) i++
    const span = anchors[i + 1] - anchors[i]
    x = span <= 0 ? 0 : clamp01((pp - anchors[i]) / span)
  }
  // derivative of smootherstep, normalized to peak 1 at x=0.5
  return (30 * x * x * (1 - x) * (1 - x)) / 1.875
}

/** Per-section local progress through the sticky dwell — rect-based. */
export function localP(el: HTMLElement): number {
  const r = el.getBoundingClientRect()
  const scrollable = r.height - vh()
  if (scrollable <= 4) return r.top < 0 ? 1 : 0
  return clamp01(-r.top / scrollable)
}
