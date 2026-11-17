/**
 * The Booking — a calendar wall of glass slots that CRYSTALLIZES via the
 * existing growth scrub (uGrowth + per-slot aDelay: fills day by day as
 * fx.growth ramps). Booked slots carry bright aTint (glow teal, cyan under
 * ignite); empty slots stay dark glass. Label rails are one CanvasTexture
 * atlas drawn with the self-hosted mono font AFTER fonts.ready — the
 * promise must join world.ready so the poster never bakes blank rails.
 */
import * as THREE from 'three'
import { mulberry32 } from './rng'
import type { InstanceSpec } from './crystals'

export const CAL = { cols: 7, rows: 6, pitchX: 0.72, pitchY: 0.5, slotW: 0.62, slotH: 0.4, slotD: 0.1 }

export function calendarSpec(seed: number, base: THREE.Vector3, yaw: number): InstanceSpec {
  const rng = mulberry32(seed)
  const spec: InstanceSpec = { matrices: [], delays: [], tints: [] }
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0))
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
  const m = new THREE.Matrix4()
  const p = new THREE.Vector3()
  const s = new THREE.Vector3(1, 1, 1)
  const w = (CAL.cols - 1) * CAL.pitchX
  for (let c = 0; c < CAL.cols; c++)
    for (let r = 0; r < CAL.rows; r++) {
      p.copy(base)
        .addScaledVector(right, c * CAL.pitchX - w / 2)
        .add(new THREE.Vector3(0, (CAL.rows - 1 - r) * CAL.pitchY, 0))
      m.compose(p, q, s)
      spec.matrices.push(m.clone())
      // fills day by day, morning down
      spec.delays.push(((c * CAL.rows + r) / (CAL.cols * CAL.rows)) * 0.85)
      // ~60% booked, denser later in the week — the calendar filling itself
      const booked = rng() < 0.42 + 0.3 * (c / (CAL.cols - 1))
      spec.tints.push(booked ? 0.88 + rng() * 0.12 : 0.14 + rng() * 0.08)
    }
  return spec
}

/** Slot geometry — base at y=0 so the growth scrub grows it upward. */
export function slotGeometry(): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(CAL.slotW, CAL.slotH, CAL.slotD)
  g.translate(0, CAL.slotH / 2, 0)
  return g
}

/** Day/time label rails — canvas atlas, drawn after fonts.ready. */
export function calendarRails(
  base: THREE.Vector3,
  yaw: number,
): { group: THREE.Group; ready: Promise<void>; dispose: () => void } {
  const cv = document.createElement('canvas')
  cv.width = 1024
  cv.height = 256
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace

  const draw = () => {
    const ctx = cv.getContext('2d')!
    ctx.clearRect(0, 0, 1024, 256)
    ctx.fillStyle = 'rgba(159, 212, 216, 0.9)'
    ctx.font = '600 44px "Geist Mono", monospace'
    ctx.textAlign = 'center'
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    days.forEach((d, i) => ctx.fillText(d, 74 + i * 146, 90))
    ctx.font = '400 34px "Geist Mono", monospace'
    ctx.fillText('BOOKED WHILE YOU SLEPT', 512, 200)
    tex.needsUpdate = true
  }
  const ready = (document.fonts?.ready ?? Promise.resolve()).then(draw).catch(draw)

  const w = CAL.cols * CAL.pitchX
  const geo = new THREE.PlaneGeometry(w, w / 4)
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.75, depthWrite: false })
  const rail = new THREE.Mesh(geo, mat)
  const group = new THREE.Group()
  rail.position.copy(base).add(new THREE.Vector3(0, CAL.rows * CAL.pitchY + 0.05, 0))
  rail.rotation.y = yaw
  group.add(rail)

  return {
    group,
    ready,
    dispose: () => {
      geo.dispose()
      mat.dispose()
      tex.dispose()
    },
  }
}
