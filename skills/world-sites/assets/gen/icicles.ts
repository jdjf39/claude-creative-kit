/**
 * Real icicle / ice-stalagmite geometry — the thing that makes the world
 * read as ICE instead of "low-poly shapes". Smooth indexed surface (soft
 * normals), organic profile: tapering lathe with melt ripples, asymmetric
 * cross-section, and a gentle bow. Cylindrical UVs so the ice PBR maps
 * wrap naturally. Base at y=0 growing +Y — drop-in compatible with the
 * cluster/tunnel/field placers and the growth scrub.
 */
import * as THREE from 'three'
import { mulberry32, range } from './rng'

export function icicleGeometry(seed = 9, radialSegs = 10, heightSegs = 16): THREE.BufferGeometry {
  const rng = mulberry32(seed)
  const ph1 = rng() * Math.PI * 2
  const ph2 = rng() * Math.PI * 2
  const bendX = range(rng, -0.14, 0.14)
  const bendZ = range(rng, -0.14, 0.14)
  const lobes = 2 + Math.floor(rng() * 3) // cross-section asymmetry order

  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []

  // rings from base (t=0) to just below the tip
  for (let iy = 0; iy <= heightSegs; iy++) {
    const t = iy / heightSegs
    // profile: thick base, needle tip, melt ripples along the length
    const rProfile =
      (0.16 * Math.pow(1 - t, 0.72) + 0.006) *
      (1 + 0.09 * Math.sin(t * 9 + ph2) * (1 - t))
    const cx = bendX * t * t
    const cz = bendZ * t * t
    for (let ix = 0; ix <= radialSegs; ix++) {
      const a = (ix / radialSegs) * Math.PI * 2
      // asymmetric cross-section — real ice is never a perfect circle
      const r = rProfile * (1 + 0.1 * Math.sin(lobes * a + ph1) + 0.05 * Math.sin(7 * a + ph2))
      pos.push(cx + Math.cos(a) * r, t, cz + Math.sin(a) * r)
      uv.push(ix / radialSegs, t * 2) // wrap the ice texture twice along the length
    }
  }
  const row = radialSegs + 1
  for (let iy = 0; iy < heightSegs; iy++)
    for (let ix = 0; ix < radialSegs; ix++) {
      const a = iy * row + ix
      const b = a + row
      idx.push(a, b, a + 1, a + 1, b, b + 1)
    }

  // tip point
  const tipIdx = pos.length / 3
  pos.push(bendX + range(rng, -0.02, 0.02), 1.015, bendZ + range(rng, -0.02, 0.02))
  uv.push(0.5, 2.05)
  const topRow = heightSegs * row
  for (let ix = 0; ix < radialSegs; ix++) idx.push(topRow + ix, tipIdx, topRow + ix + 1)

  // base cap (flat, facing down)
  const baseIdx = pos.length / 3
  pos.push(0, 0, 0)
  uv.push(0.5, 0)
  for (let ix = 0; ix < radialSegs; ix++) idx.push(ix + 1, baseIdx, ix)

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals() // indexed → SMOOTH normals: glassy melted ice
  return geo
}
