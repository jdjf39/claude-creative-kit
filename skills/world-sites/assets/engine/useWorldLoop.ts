import { useEffect } from 'react'
import Lenis from 'lenis'
import { docTop } from '../world/timeline'
import type { Tier } from './env'

/**
 * The endless loop. Publishes the virtual scroll on `window.__worldScroll`
 * (single source of truth — engine + DOM sync both read loopProgress()).
 *
 * Modes:
 *  - full, smooth:   Lenis { infinite: true } wraps the scroll at the limit.
 *  - full ?nosmooth / lite: native scroll + manual hard-wrap between the
 *    two identical void spacers (teleport lands in empty frames).
 *  - static / reduced-motion: DOES NOTHING — no publisher, no wrap yank;
 *    loopProgress() clamps and the page simply ends. That's the a11y rule.
 */
export function useWorldLoop(tier: Tier) {
  useEffect(() => {
    if (tier === 'static') return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root = document.documentElement
    const limit = () => Math.max(1, root.scrollHeight - window.innerHeight)

    try {
      history.scrollRestoration = 'manual'
    } catch {
      /* older browsers */
    }

    // Land on the hero's dwell midpoint (initial p ≡ restP ≡ the poster
    // frame) — or on a deep-linked section. Never the top void.
    const landing = () => {
      const hash = location.hash && document.querySelector<HTMLElement>(location.hash)
      const el = hash || document.querySelector<HTMLElement>('[data-world="hero"]')
      if (!el) return 0
      const dwell = Math.max(0, el.offsetHeight - window.innerHeight)
      return docTop(el) + dwell / 2
    }

    const publish = (v: number) => {
      ;(window as unknown as Record<string, unknown>).__worldScroll = { v, limit: limit() }
    }
    root.classList.add('w-loop')
    publish(window.scrollY)

    const noSmooth = location.search.includes('nosmooth')

    if (tier !== 'full' || noSmooth) {
      // native scroll + hard-wrap between the identical void spans
      window.scrollTo({ top: landing(), behavior: 'instant' as ScrollBehavior })
      publish(window.scrollY)
      const onScroll = () => {
        const max = limit()
        const y = window.scrollY
        if (y >= max - 1) window.scrollTo({ top: 1, behavior: 'instant' as ScrollBehavior })
        else if (y <= 0) window.scrollTo({ top: max - 2, behavior: 'instant' as ScrollBehavior })
        publish(window.scrollY)
      }
      const onResize = () => publish(window.scrollY)
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
        root.classList.remove('w-loop')
        delete (window as unknown as Record<string, unknown>).__worldScroll
      }
    }

    const lenis = new Lenis({ lerp: 0.1, infinite: true, wheelMultiplier: 0.9 })
    lenis.scrollTo(landing(), { immediate: true })
    publish(landing())
    lenis.on('scroll', ({ animatedScroll }: { animatedScroll: number }) => publish(animatedScroll))

    let raf = 0
    const loop = (t: number) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const onResize = () => publish(lenis.animatedScroll)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      lenis.destroy()
      root.classList.remove('w-loop')
      delete (window as unknown as Record<string, unknown>).__worldScroll
    }
  }, [tier])
}
