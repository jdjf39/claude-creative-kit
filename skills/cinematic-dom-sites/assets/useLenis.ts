import { useEffect } from 'react'
import Lenis from 'lenis' // npm i lenis

/* ============================================================================
   useLenis — momentum smooth-scroll (drop-in). Call once at the app root.

   Resilience: Lenis drives scroll from a rAF loop, which is paused in hidden /
   headless tabs — there it would swallow wheel events and FREEZE the page. So we
   run Lenis only while the document is visible and fully destroy it when hidden
   (restoring native scrolling). Real browsers get the momentum; background /
   headless renders keep plain, working native scroll. It also smooth-scrolls
   in-page anchor links through whichever scroller is active.
   ==========================================================================*/

const reduce = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function useLenis() {
  useEffect(() => {
    if (reduce()) return
    let lenis: Lenis | null = null
    let raf = 0

    const start = () => {
      if (lenis) return
      lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      })
      const loop = (time: number) => { lenis?.raf(time); raf = requestAnimationFrame(loop) }
      raf = requestAnimationFrame(loop)
    }
    const stop = () => { cancelAnimationFrame(raf); lenis?.destroy(); lenis = null }
    const onVisibility = () => { if (document.hidden) stop(); else start() }

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      const id = a.getAttribute('href')
      if (!id || id === '#') return
      const el = document.querySelector(id)
      if (!el) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -72 })
      else (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('click', onClick)
      stop()
    }
  }, [])
}
