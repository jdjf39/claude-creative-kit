/**
 * Quality tier — decided once, before any three.js code is imported.
 * `static` paths must never mount (or even download) the world engine.
 *
 *   full   — fine pointer, wide, WebGL: everything on (composer, transmission)
 *   lite   — WebGL but touch/narrow: lower DPR, no composer, fake ice, fewer shards
 *   static — reduced motion or no WebGL: poster + plain scrolling page
 */
export type Tier = 'full' | 'lite' | 'static'

export type Caps = {
  tier: Tier
  reducedMotion: boolean
  finePointer: boolean
  wide: boolean
  webgl: boolean
}

export function detectCaps(): Caps {
  const reducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer =
    typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches
  const wide = typeof window !== 'undefined' && window.innerWidth >= 900

  let webgl = false
  if (!reducedMotion) {
    try {
      // Detached probe canvas — deliberately not counted as the page's
      // single live context (census counts connected canvases only).
      const c = document.createElement('canvas')
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      webgl = false
    }
  }

  const tier: Tier = !webgl || reducedMotion ? 'static' : finePointer && wide ? 'full' : 'lite'
  return { tier, reducedMotion, finePointer, wide, webgl }
}
