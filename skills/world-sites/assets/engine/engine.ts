/**
 * The world engine. ONE renderer / canvas / context, full-viewport, under
 * the DOM. The camera flies a spline through a persistent 3D world; scroll
 * is the only clock. All state is rect-derived and bidirectional; rAF only
 * paints (and settles the cosmetic p-damp), it never accumulates truth.
 */
import * as THREE from 'three'
import {
  WAYPOINTS,
  measureAnchors,
  loopProgress,
  activeIndexAt,
  fxAt,
  travelAt,
  fract,
  restP,
  type Anchors,
  type Fx,
} from './timeline'
import { createRig, newPose } from './cameraRig'
import { qualityFor, type Quality } from './quality'
import { buildWorld, type World } from './scene/buildWorld'
import { buildPostFx, type PostFx } from './postfx'
import type { Tier } from '../lib/env'

// marker for the verify suite: this module must never load on static tier
;(window as unknown as Record<string, unknown>).__three_loaded = true

export type EngineApi = {
  dispose: () => void
  capturePoster: (w: number, h: number) => string
}

const VOID = 0x0a1216 // deep blue-grey — glacial depth, not pure black
const FOG_BASE = 0.03
const EXPOSURE_BASE = 1.0 // HDRI env adds energy

export function createEngine(
  canvas: HTMLCanvasElement,
  tier: Tier,
  onDrawn?: () => void,
): EngineApi {
  const q: Quality = qualityFor(tier)

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: q.antialias,
      alpha: false,
      preserveDrawingBuffer: true, // paused tabs keep the last frame; poster capture
      powerPreference: 'high-performance',
    })
  } catch {
    // No usable context after all — the poster stays, nothing else mounts.
    return { dispose: () => {}, capturePoster: () => '' }
  }

  renderer.setPixelRatio(q.dpr)
  renderer.setClearColor(VOID, 1)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = EXPOSURE_BASE

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(VOID)
  const fog = new THREE.FogExp2(VOID, FOG_BASE)
  scene.fog = fog

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120)
  const rig = createRig()
  const pose = newPose()

  const world: World = buildWorld(scene, q, renderer)

  let postfx: PostFx | null = null
  if (q.composer) {
    try {
      postfx = buildPostFx(renderer, scene, camera)
    } catch (e) {
      // the straight render path is always a valid fallback
      console.error('[world] post chain failed, rendering direct', e)
      postfx = null
    }
  }

  /* ── state: p is the only truth; damping is cosmetic ─────────────── */
  const nodamp = location.search.includes('nodamp')
  let anchors: Anchors = [0, 1]
  let pTarget = 0
  let pCurrent = 0
  let fxNow: Fx = fxAt(0, anchors)
  let drawn = false
  let disposed = false
  let needsRender = true
  // the reveal waits for textures/HDRI (world.ready) — no pop-in; the
  // poster carries the page until the fully-dressed frame exists
  let assetsReady = false
  world.ready.then(() => {
    assetsReady = true
    needsRender = true
  })

  function measure() {
    anchors = measureAnchors()
    pTarget = loopProgress()
    if (nodamp) pCurrent = pTarget
    needsRender = true
  }

  /* ── the state application — everything is f(p) ──────────────────── */
  function applyState(p: number) {
    rig.poseAt(p, anchors, pose)
    camera.position.copy(pose.cam)
    camera.lookAt(pose.look)
    if (Math.abs(camera.fov - pose.fov) > 0.01) {
      camera.fov = pose.fov
      camera.updateProjectionMatrix()
    }
    fxNow = fxAt(p, anchors)
    const travel = travelAt(p, anchors)
    fog.density = FOG_BASE * fxNow.fog
    renderer.toneMappingExposure = EXPOSURE_BASE * fxNow.exposure
    world.update(p, fxNow, travel)
    postfx?.apply(fxNow, travel)
  }

  /* ── painting ────────────────────────────────────────────────────── */
  function renderFrame() {
    if (disposed) return
    const box = canvas.getBoundingClientRect()
    const w = Math.round(box.width) || window.innerWidth
    const h = Math.round(box.height) || window.innerHeight
    if (w === 0 || h === 0) return // frozen preview — the poster carries the page
    const size = renderer.getSize(new THREE.Vector2())
    if (size.x !== w || size.y !== h) {
      renderer.setSize(w, h, false)
      postfx?.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    applyState(pCurrent)
    if (postfx) postfx.composer.render()
    else renderer.render(scene, camera)
    if (!drawn && assetsReady) {
      drawn = true
      document.documentElement.classList.add('w-live')
      canvas.classList.add('on')
      onDrawn?.()
    }
  }

  /* ── loop: reads the (possibly wrapping) progress every frame; damping
        takes the shortest way around the circle ───────────────────────── */
  let raf = 0
  function loop() {
    raf = requestAnimationFrame(loop)
    pTarget = loopProgress()
    let d = pTarget - pCurrent
    if (d > 0.5) d -= 1
    else if (d < -0.5) d += 1
    if (Math.abs(d) > 0.00012) {
      pCurrent = fract(nodamp ? pTarget : pCurrent + d * 0.11)
      // convergence test in wrapped space
      if (Math.abs(fract(pTarget - pCurrent + 1.5) - 0.5) <= 0.00012) pCurrent = pTarget
      needsRender = true
    }
    if (needsRender) {
      needsRender = false
      renderFrame()
    }
  }

  /* ── events ──────────────────────────────────────────────────────── */
  const onResize = () => measure()
  const onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf)
      raf = 0
    } else if (!raf && !disposed) {
      needsRender = true
      loop()
    }
  }
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVis)

  /* ── stills: deterministic offscreen renders ─────────────────────── */
  function renderStill(p: number, w: number, h: number, mime: string, quality?: number, grainOff = true): string {
    const prevP = pCurrent
    renderer.setPixelRatio(1)
    renderer.setSize(w, h, false)
    postfx?.setSize(w, h)
    if (grainOff) postfx?.setStill(true) // seam stills must be reproducible
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    applyState(fract(p))
    if (postfx) postfx.composer.render()
    else renderer.render(scene, camera)
    const url = canvas.toDataURL(mime, quality)
    if (grainOff) postfx?.setStill(false)
    renderer.setPixelRatio(q.dpr)
    pCurrent = prevP
    needsRender = true
    renderFrame()
    return url
  }

  /** The poster is the REST frame — the hero anchor, not p=0 (p=0 is
   *  mid-wrap on the loop). Grain stays ON: the poster must match the
   *  real live frame (pmndrs grain is a static pattern, so it diffs 0). */
  function capturePoster(w: number, h: number): string {
    return renderStill(restP(anchors), w, h, 'image/webp', 0.92, false)
  }

  /* ── verify hooks ────────────────────────────────────────────────── */
  function sample(): { total: number; lit: number; cyanish: number; glassy: number } {
    const gl = renderer.getContext()
    const out = { total: 0, lit: 0, cyanish: 0, glassy: 0 }
    const px = new Uint8Array(4)
    const W = gl.drawingBufferWidth
    const H = gl.drawingBufferHeight
    const N = 40
    for (let sy = 0; sy < N; sy++)
      for (let sx = 0; sx < N; sx++) {
        const cx = Math.floor(((sx + 0.5) / N) * W)
        const cy = Math.floor(((sy + 0.5) / N) * H)
        gl.readPixels(cx, cy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
        out.total++
        // lit = meaningfully brighter than the void clear color
        if (px[0] + px[1] + px[2] > 36) out.lit++
        // cyanish = the saturated signal accent (green/blue >> red)
        if (px[1] > 90 && px[2] > 90 && px[1] - px[0] > 25) out.cyanish++
        // glassy = the cool smoked-glass world (dim but cool-leaning)
        if (px[0] + px[1] + px[2] > 60 && px[2] >= px[0] && px[1] >= px[0]) out.glassy++
      }
    return out
  }

  const groundPose = newPose()
  ;(window as unknown as Record<string, unknown>).__world = {
    get drawn() {
      return drawn
    },
    state: () => ({
      tier,
      p: pCurrent,
      pTarget,
      anchors: [...anchors],
      waypoint: WAYPOINTS[activeIndexAt(pCurrent, anchors)].id,
      cam: camera.position.toArray(),
      fov: camera.fov,
      fx: { ...fxNow },
      composer: !!postfx,
      transmission: q.transmission,
      calls: renderer.info.render.calls,
      tris: renderer.info.render.triangles,
    }),
    // ground truth f(p) — verify compares live camera against this
    poseAt: (p: number) => {
      rig.poseAt(fract(p), anchors, groundPose)
      return {
        cam: groundPose.cam.toArray(),
        look: groundPose.look.toArray(),
        fov: groundPose.fov,
      }
    },
    restP: () => restP(anchors),
    // debug access for tooling — never used by the site itself
    scene,
    camera,
    // deterministic still at any p — the seam proof renders through this
    renderAt: (p: number, w: number, h: number) => renderStill(p, w, h, 'image/png'),
    sample,
    capturePoster,
  }

  /* ── boot: one synchronous render — deep links land on the right
        frame with zero rAF ──────────────────────────────────────────── */
  measure()
  pCurrent = pTarget // first frame is always exact, damp only smooths changes
  renderFrame()
  loop()

  return {
    capturePoster,
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      delete (window as unknown as Record<string, unknown>).__world
      world.dispose()
      postfx?.dispose()
      renderer.dispose()
      document.documentElement.classList.remove('w-live')
    },
  }
}
// (scroll events are not listened to directly: the loop reads loopProgress()
// every frame, which follows the useWorldLoop publisher or native scroll)
