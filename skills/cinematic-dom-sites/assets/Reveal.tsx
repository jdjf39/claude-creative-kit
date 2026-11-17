import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

/* ============================================================================
   Reveal — entrance animation that is VISIBLE BY DEFAULT (drop-in).

   Driven by IntersectionObserver + a setTimeout safety net — both fire in
   hidden / headless / frozen-preview tabs, unlike requestAnimationFrame. So a
   paused render never ships a blank section; the entrance is enhancement only.

   Pair with the reveal CSS in theme.css. Vary `variant` across the page so it
   doesn't enter every block the same way (uniform fade-up is the templated tell):
     <Reveal>…</Reveal>                       // fade-up (default)
     <Reveal variant="wipe">…</Reveal>        // left→right clip wipe
     <Reveal variant="rise" delay={0.08}>…</Reveal>  // rise + slight scale
   For headlines, use the .line-mask CSS (see theme.css) with per-line stagger.
   ==========================================================================*/

const reduce = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

interface RevealProps {
  children: ReactNode
  as?: ElementType
  className?: string
  delay?: number
  y?: number
  blur?: number
  once?: boolean
  variant?: 'fade' | 'wipe' | 'rise'
  style?: CSSProperties
}

const VARIANT_CLASS = { fade: 'reveal', wipe: 'reveal-wipe', rise: 'reveal-rise' } as const

export function Reveal({ children, as, className = '', delay = 0, y = 28, blur = 0, once = true, variant = 'fade', style }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || reduce()) { setShown(true); return }
    let done = false
    const show = () => { if (done) return; done = true; setShown(true) }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { show(); if (once) io.disconnect() }
          else if (!once) setShown(false)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    const t = window.setTimeout(show, 1100) // safety net: fires even if IO never does (hidden tab)
    return () => { io.disconnect(); window.clearTimeout(t) }
  }, [once])

  return (
    <Tag
      ref={ref as never}
      data-shown={shown ? 'true' : 'false'}
      className={`${VARIANT_CLASS[variant]} ${className}`}
      style={{
        ['--reveal-delay' as string]: `${delay}s`,
        ['--reveal-y' as string]: `${y}px`,
        ['--reveal-blur' as string]: `${blur}px`,
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}
