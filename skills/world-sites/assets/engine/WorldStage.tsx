import { useEffect, useRef, useState } from 'react'
import type { EngineApi } from './engine'
import type { Tier } from '../lib/env'

/**
 * Mounts the single world canvas and lazy-imports the engine. Rendered ONLY
 * when the tier gate passes — static tier never reaches this component, so
 * three.js is never even downloaded there.
 *
 * The loader line is cosmetic and non-blocking: the DOM page is readable
 * and scrollable the whole time; the world fades in over the poster when
 * its first real frame lands (shaders compiled behind an opacity-0 canvas).
 */
export default function WorldStage({ tier }: { tier: Tier }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'loading' | 'compiling' | 'live'>('loading')

  useEffect(() => {
    let api: EngineApi | null = null
    let dead = false
    // fonts first — layout (and therefore the anchor table) must be final
    // before the engine measures the sections
    Promise.all([import('./engine'), document.fonts.ready]).then(([{ createEngine }]) => {
      if (dead || !ref.current) return
      setPhase('compiling')
      try {
        api = createEngine(ref.current, tier, () => {
          if (!dead) setPhase('live')
        })
      } catch (e) {
        // engine boot must never take the page down — the poster carries it
        console.error('[world] engine boot failed', e)
      }
    })
    return () => {
      dead = true
      api?.dispose()
    }
  }, [tier])

  return (
    <>
      <canvas ref={ref} className="world-stage" aria-hidden="true" />
      <div className={`world-loader ${phase === 'live' ? 'done' : ''}`} aria-hidden="true">
        <span className="world-loader-bar" />
        <span>{phase === 'compiling' ? 'CUTTING FACETS' : 'WAKING THE WORLD'}</span>
      </div>
    </>
  )
}
