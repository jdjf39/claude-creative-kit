import { useEffect, useRef, useState } from 'react'
import { localP } from '../world/timeline'

/**
 * DOM-side hook onto the shared timeline: is my section the active waypoint,
 * and how far through its dwell are we? Rect-derived on scroll — works
 * identically with or without the engine (static tier included).
 */
export function useWaypoint(id: string) {
  const ref = useRef<HTMLElement | null>(null)
  const [state, setState] = useState({ active: false, lp: 0 })

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-world="${id}"]`)
    ref.current = el
    if (!el) return
    let raf = 0
    let last = { active: false, lp: -1 }
    const read = () => {
      raf = 0
      const active = el.dataset.active === 'true'
      const lp = Math.round(localP(el) * 200) / 200
      if (active !== last.active || lp !== last.lp) {
        last = { active, lp }
        setState(last)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    // observe data-active flips from the WorldSync attribute writer too
    const mo = new MutationObserver(onScroll)
    mo.observe(el, { attributes: true, attributeFilter: ['data-active'] })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    read()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      mo.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [id])

  return state
}
