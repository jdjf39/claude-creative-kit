/**
 * The Network — a field of storefront-suggestive blocks around the machine
 * that sit dark until fx.ignite lights them cyan (existing registry ramp),
 * plus hub connection lines whose opacity rides ignite.
 */
import * as THREE from 'three'
import { mulberry32, range } from './rng'
import type { InstanceSpec } from './crystals'

export function nodeSpec(seed: number, count: number): InstanceSpec {
  const rng = mulberry32(seed)
  const spec: InstanceSpec = { matrices: [], delays: [], tints: [] }
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const p = new THREE.Vector3()
  const s = new THREE.Vector3()
  const bands = [
    { y: -24.5, r0: 9, r1: 24 },
    { y: -18, r0: 11, r1: 24 },
    { y: -12, r0: 12, r1: 26 },
  ]
  for (let i = 0; i < count; i++) {
    const band = bands[i % bands.length]
    let x = 0
    let z = 0
    do {
      const a = rng() * Math.PI * 2
      const r = range(rng, band.r0, band.r1)
      x = Math.cos(a) * r
      z = Math.sin(a) * r - 8
    } while (z > 2) // stay out of the camera corridor
    p.set(x, band.y + range(rng, -1.2, 1.2), z)
    e.set(0, rng() * Math.PI, 0)
    q.setFromEuler(e)
    s.set(1, range(rng, 0.7, 2.2), 1)
    m.compose(p, q, s)
    spec.matrices.push(m.clone())
    spec.delays.push(0)
    spec.tints.push(0.55 + rng() * 0.45)
  }
  return spec
}

/** Connection lines node→nearest hub; opacity set to 0.22·ignite per frame. */
export function networkLines(spec: InstanceSpec): {
  lines: THREE.LineSegments
  setIgnite: (v: number) => void
  dispose: () => void
} {
  const hubs = [
    new THREE.Vector3(0, -18.4, -14), // the exchange
    new THREE.Vector3(0, -10, -6),
    new THREE.Vector3(8, -20, -16),
    new THREE.Vector3(-9, -16, -12),
    new THREE.Vector3(3, -24, -22),
  ]
  const pos: number[] = []
  const v = new THREE.Vector3()
  for (const m of spec.matrices) {
    v.setFromMatrixPosition(m)
    let best = hubs[0]
    let bd = Infinity
    for (const h of hubs) {
      const d = v.distanceToSquared(h)
      if (d < bd) {
        bd = d
        best = h
      }
    }
    pos.push(v.x, v.y, v.z, best.x, best.y, best.z)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color('#2EF0F0'),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const lines = new THREE.LineSegments(geo, mat)
  lines.frustumCulled = false
  return {
    lines,
    setIgnite: (v2: number) => {
      mat.opacity = 0.22 * v2
      lines.visible = v2 > 0.01
    },
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}
