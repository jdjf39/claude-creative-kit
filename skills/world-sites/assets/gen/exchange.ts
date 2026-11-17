/**
 * The Exchange — switchboard filament threads sagging into (and routed out
 * of) the glass core. Two merged tube geometries carrying aAlong + aStrand,
 * driven by the shared combMaterial: incoming pulses flow toward the orb,
 * outgoing pulses flow away — the routing sequence emerges from the
 * per-thread phase offsets, all pure f(p).
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32, range } from './rng'

function threadTube(from: THREE.Vector3, to: THREE.Vector3, sag: number, k: number, total: number): THREE.BufferGeometry {
  const mid = from.clone().lerp(to, 0.5)
  mid.y -= sag
  const curve = new THREE.CatmullRomCurve3([from, mid, to])
  const tube = new THREE.TubeGeometry(curve, 64, 0.035, 6, false)
  const uv = tube.getAttribute('uv')
  const along = new Float32Array(uv.count)
  const strand = new Float32Array(uv.count)
  for (let i = 0; i < uv.count; i++) {
    along[i] = uv.getX(i)
    strand[i] = k / total
  }
  tube.setAttribute('aAlong', new THREE.BufferAttribute(along, 1))
  tube.setAttribute('aStrand', new THREE.BufferAttribute(strand, 1))
  return tube
}

export function exchangeThreads(
  seed: number,
  core: THREE.Vector3,
): { incoming: THREE.BufferGeometry; outgoing: THREE.BufferGeometry } {
  const rng = mulberry32(seed)
  const inc: THREE.BufferGeometry[] = []
  const out: THREE.BufferGeometry[] = []

  // 8 incoming — from the vault side / above, sagging into the orb
  for (let i = 0; i < 8; i++) {
    const a = range(rng, -1.4, 1.4)
    const r = range(rng, 6, 9.5)
    const from = new THREE.Vector3(core.x + Math.sin(a) * r, core.y + range(rng, 2.5, 5.5), core.z + Math.cos(a) * r * 0.8 + 2)
    const to = core.clone().add(new THREE.Vector3(range(rng, -0.9, 0.9), range(rng, -0.4, 0.9), range(rng, -0.9, 0.9)).normalize().multiplyScalar(1.28))
    inc.push(threadTube(from, to, range(rng, 0.8, 2.2), i, 13))
  }
  // 5 outgoing — toward the calendar (deeper, lower) and one rising home
  for (let i = 0; i < 5; i++) {
    const rising = i === 4
    const from = core.clone().add(new THREE.Vector3(range(rng, -0.9, 0.9), range(rng, -0.6, 0.6), range(rng, -0.9, 0.9)).normalize().multiplyScalar(1.28))
    const to = rising
      ? new THREE.Vector3(range(rng, 1, 3), core.y + 9, core.z + 6)
      : new THREE.Vector3(core.x + range(rng, -4, 4) - 0.5, core.y - range(rng, 4.5, 6.5), core.z - range(rng, 4, 7))
    out.push(threadTube(from, to, rising ? -1.5 : range(rng, 0.6, 1.6), 8 + i, 13))
  }

  const incoming = mergeGeometries(inc, false)!
  const outgoing = mergeGeometries(out, false)!
  inc.forEach((g) => g.dispose())
  out.forEach((g) => g.dispose())
  return { incoming, outgoing }
}
