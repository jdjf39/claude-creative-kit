/**
 * The living voice waveform — 48 glass bars whose heights are a pure
 * function of (position, p) with INTEGER p-frequencies: the voice "speaks"
 * while you scroll and freezes into a sculpture at rest (deterministic
 * stills). CPU matrix recompute per update — 48 composes, negligible.
 */
import * as THREE from 'three'

export type Waveform = {
  mesh: THREE.InstancedMesh
  update: (p: number) => void
  dispose: () => void
}

export function buildWaveform(mat: THREE.Material, center: THREE.Vector3, right: THREE.Vector3, bars = 48): Waveform {
  const geo = new THREE.BoxGeometry(0.16, 1, 0.16)
  geo.translate(0, 0.5, 0) // base at y=0 — scales grow upward
  // per-instance tint variation for the ice shader
  const tints = new Float32Array(bars)
  const delays = new Float32Array(bars)
  for (let i = 0; i < bars; i++) {
    tints[i] = 0.35 + 0.6 * Math.abs(Math.sin(i * 1.7))
    delays[i] = 0
  }
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 1))
  geo.setAttribute('aDelay', new THREE.InstancedBufferAttribute(delays, 1))

  const mesh = new THREE.InstancedMesh(geo, mat, bars)
  mesh.frustumCulled = false

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const v = new THREE.Vector3()
  const s = new THREE.Vector3()
  right = right.clone().setY(0).normalize()

  const SPAN = 3.4
  function update(p: number) {
    for (let i = 0; i < bars; i++) {
      const x = (i / (bars - 1) - 0.5) * SPAN
      const phi = 1.7 * x + 0.9 * Math.sin(3.1 * x)
      const psi = 2.6 * x
      // integer K = 12 and 20 — periodic over the loop, frozen at rest
      const h =
        0.5 +
        1.1 *
          (0.5 + 0.5 * Math.sin(phi + Math.PI * 2 * 12 * p)) *
          (0.6 + 0.4 * Math.sin(psi + Math.PI * 2 * 20 * p))
      v.copy(center).addScaledVector(right, x)
      s.set(1, h, 1)
      m.compose(v, q, s)
      mesh.setMatrixAt(i, m)
    }
    mesh.instanceMatrix.needsUpdate = true
  }
  update(0)

  return {
    mesh,
    update,
    dispose: () => geo.dispose(),
  }
}
