import { useEffect, useRef, useState, type ReactNode } from 'react'

/* ============================================================================
   ScrubHero — scroll-scrubbed video hero (drop-in).

   Desktop + fine-pointer: scrolling through a tall track scrubs the hero video
   forward (the vehicle rolls, the product turns). Mobile / reduced-motion: a
   perfectly framed static poster — no video download, instant load.

   Usage:
     <ScrubHero src="/hero.mp4" poster="/hero.webp" alt="…">
       {/* your headline / CTAs, in real DOM */}
     </ScrubHero>

   Doctrine: progress is read from getBoundingClientRect (fires in hidden tabs);
   the seek + content fade are enhancement. Poster is the visible-by-default
   fallback, so a frozen/no-JS render still shows a framed hero.
   ==========================================================================*/

const reduce = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

type Mode = 'scrub' | 'still'
const detectMode = (): Mode => {
  if (typeof window === 'undefined') return 'scrub'
  if (reduce()) return 'still'
  return window.matchMedia('(min-width: 1024px)').matches ? 'scrub' : 'still'
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)

export function ScrubHero({
  src, poster, alt, children, trackClass = 'h-[230vh]',
}: { src: string; poster: string; alt: string; children?: ReactNode; trackClass?: string }) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<Mode>(detectMode)

  useEffect(() => {
    const onResize = () => setMode(detectMode())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (mode !== 'scrub') return
    const track = trackRef.current, video = videoRef.current
    if (!track || !video) return
    // Prime so Safari will seek: play() then immediately pause().
    const prime = () => { const p = video.play(); if (p?.then) p.then(() => video.pause()).catch(() => {}) }
    video.addEventListener('loadeddata', prime, { once: true })

    const update = () => {
      const scrollable = track.offsetHeight - window.innerHeight
      const scrolled = clamp(-track.getBoundingClientRect().top, 0, Math.max(scrollable, 1))
      const p = scrollable > 4 ? scrolled / scrollable : 0
      if (video.duration) {
        const t = p * (video.duration - 0.05)
        if (Number.isFinite(t)) { try { video.currentTime = t } catch { /* seek not ready */ } }
      }
      if (contentRef.current) contentRef.current.style.opacity = String(p < 0.66 ? 1 : clamp(1 - (p - 0.66) / 0.3, 0, 1))
    }
    const onScroll = () => update()
    window.addEventListener('scroll', onScroll, { passive: true })
    video.addEventListener('loadedmetadata', update)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      video.removeEventListener('loadedmetadata', update)
      video.removeEventListener('loadeddata', prime)
    }
  }, [mode])

  const mediaClass = 'absolute inset-0 -z-10 h-full w-full object-cover'

  return (
    <div id="top" ref={trackRef} className={`relative ${mode === 'scrub' ? trackClass : 'h-[100svh]'}`}>
      <div className="sticky top-0 h-[100svh] min-h-[600px] overflow-hidden">
        {mode === 'scrub'
          ? <video ref={videoRef} className={mediaClass} src={src} poster={poster} muted playsInline preload="metadata" aria-hidden />
          : <img className={mediaClass} src={poster} alt={alt} />}

        {/* Legibility grade — darken where text sits, deepen the bottom. Tune per layout. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#06080c_0%,rgba(6,8,12,0.72)_38%,rgba(6,8,12,0.15)_70%,rgba(6,8,12,0.45)_100%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,#06080c_2%,transparent_44%)]" />

        <div ref={contentRef} className="relative flex h-full flex-col justify-end pb-16 sm:pb-20">
          <div className="mx-auto w-full max-w-[84rem] px-5 md:px-10">{children}</div>
        </div>
      </div>
    </div>
  )
}
