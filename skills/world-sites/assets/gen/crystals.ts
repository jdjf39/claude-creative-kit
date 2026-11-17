/**
 * The procedural crystal system — igloo's signature, in code instead of
 * Houdini. One shared shard geometry; clusters, tunnels and fields are
 * InstancedMesh transforms with per-instance growth delay + tint, so the
 * whole cavern is a handful of draw calls.
 */
import * as THREE from 'three'
import { mulberry32, range, type Rng } from './rng'

/**
 * A single crystal shard: irregular hexagonal column with a beveled tip,
 * base at y=0 growing up +Y (the growth scrub scales local Y). Flat-shaded
 * facets via non-indexed + computed normals.
 */
export function shardGeometry(seed = 7, sides = 6): THREE.BufferGeometry {
  const rng = mulberry32(seed)
  const h = 1 // unit height — instances scale
  const rBase = 0.16
  const shoulderY = 0.72
  const rShoulder = rBase * range(rng, 0.7, 0.9)

  const base: number[][] = []
  const shoulder: number[][] = []
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + range(rng, -0.12, 0.12)
    const jb = range(rng, 0.75, 1.2)
    const js = range(rng, 0.75, 1.15)
    base.push([Math.cos(a) * rBase * jb, 0, Math.sin(a) * rBase * jb])
    shoulder.push([Math.cos(a) * rShoulder * js, shoulderY * range(rng, 0.92, 1.05), Math.sin(a) * rShoulder * js])
  }
  const tip = [range(rng, -0.03, 0.03), h, range(rng, -0.03, 0.03)]
  const bottom = [0, 0, 0]

  const pos: number[] = []
  const tri = (a: number[], b: number[], c: number[]) => pos.push(...a, ...b, ...c)
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides
    // side quad
    tri(base[i], shoulder[i], base[j])
    tri(base[j], shoulder[i], shoulder[j])
    // tip facet
    tri(shoulder[i], tip, shoulder[j])
    // base cap (facing down)
    tri(base[i], base[j], bottom)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.computeVertexNormals() // non-indexed → true flat facets

  // Per-facet planar UVs so PBR maps sample without stretching: project
  // each flat triangle onto its own plane basis at world scale. Non-indexed
  // geometry makes this seam-free per facet. Normal mapping uses three's
  // derivative-based TBN (no tangent attribute — computeTangents would
  // fight flatShading and is deliberately skipped).
  const UV_SCALE = 0.9
  const uv = new Float32Array((pos.length / 3) * 2)
  const nrm = geo.getAttribute('normal')
  const v0 = new THREE.Vector3()
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  const e1 = new THREE.Vector3()
  const e2 = new THREE.Vector3()
  for (let tri = 0; tri < pos.length / 9; tri++) {
    const i0 = tri * 3
    v0.fromArray(pos, i0 * 3)
    n.set(nrm.getX(i0), nrm.getY(i0), nrm.getZ(i0))
    v.fromArray(pos, (i0 + 1) * 3)
    e1.subVectors(v, v0).normalize()
    e2.crossVectors(n, e1)
    for (let k = 0; k < 3; k++) {
      v.fromArray(pos, (i0 + k) * 3).sub(v0)
      uv[(i0 + k) * 2] = v.dot(e1) * UV_SCALE
      uv[(i0 + k) * 2 + 1] = v.dot(e2) * UV_SCALE
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geo
}

export type InstanceSpec = {
  matrices: THREE.Matrix4[]
  delays: number[] // growth stagger ∈ [0,1)
  tints: number[] // rim variation ∈ [0,1]
}

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)

function place(spec: InstanceSpec, rng: Rng, pos: THREE.Vector3, dir: THREE.Vector3, len: number, thick: number) {
  _q.setFromUnitVectors(_up, dir.normalize())
  // roll around own axis so facets never repeat
  const roll = new THREE.Quaternion().setFromAxisAngle(dir, rng() * Math.PI * 2)
  _q.premultiply(roll)
  _s.set(thick, len, thick)
  _m.compose(pos, _q, _s)
  spec.matrices.push(_m.clone())
  spec.delays.push(rng() * 0.85)
  spec.tints.push(rng())
}

/** A crystal cluster: shards radiating from a center, biased along `up`. */
export function growCluster(
  seed: number,
  center: THREE.Vector3,
  opts: { count: number; radius?: number; up?: THREE.Vector3; upBias?: number; len?: [number, number]; thick?: [number, number] } ,
): InstanceSpec {
  const rng = mulberry32(seed)
  const spec: InstanceSpec = { matrices: [], delays: [], tints: [] }
  const up = (opts.up ?? _up).clone().normalize()
  const upBias = opts.upBias ?? 0.55
  const radius = opts.radius ?? 0.6
  const [l0, l1] = opts.len ?? [0.8, 2.6]
  const [t0, t1] = opts.thick ?? [0.6, 1.4]
  const p = new THREE.Vector3()
  const d = new THREE.Vector3()
  for (let i = 0; i < opts.count; i++) {
    // random direction, pulled toward `up`
    d.set(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize().lerp(up, upBias).normalize()
    p.copy(center).addScaledVector(d, range(rng, 0, radius))
    // root slightly below the surface so bases never float
    p.addScaledVector(d, -0.1)
    place(spec, rng, p, d.clone(), range(rng, l0, l1), range(rng, t0, t1))
  }
  return spec
}

/** A crystalline throat around a curve — shards pointing inward. */
export function tunnelFrom(
  seed: number,
  curve: THREE.Curve<THREE.Vector3>,
  opts: { rings: number; perRing: number; radius: number; len?: [number, number]; thick?: [number, number] },
): InstanceSpec {
  const rng = mulberry32(seed)
  const spec: InstanceSpec = { matrices: [], delays: [], tints: [] }
  const [l0, l1] = opts.len ?? [0.9, 2.2]
  const [t0, t1] = opts.thick ?? [0.9, 1.8]
  const pos = new THREE.Vector3()
  const tan = new THREE.Vector3()
  const nrm = new THREE.Vector3()
  const bin = new THREE.Vector3()
  const p = new THREE.Vector3()
  const inward = new THREE.Vector3()
  for (let r = 0; r < opts.rings; r++) {
    const t = r / (opts.rings - 1)
    curve.getPointAt(t, pos)
    curve.getTangentAt(t, tan)
    // stable frame
    nrm.set(1, 0, 0).cross(tan)
    if (nrm.lengthSq() < 0.01) nrm.set(0, 0, 1).cross(tan)
    nrm.normalize()
    bin.crossVectors(tan, nrm).normalize()
    for (let i = 0; i < opts.perRing; i++) {
      const a = (i / opts.perRing) * Math.PI * 2 + range(rng, -0.3, 0.3) + r * 0.47
      const rad = opts.radius * range(rng, 0.86, 1.25)
      p.copy(pos).addScaledVector(nrm, Math.cos(a) * rad).addScaledVector(bin, Math.sin(a) * rad)
      // point inward with jitter, leaning along travel
      inward.copy(pos).sub(p).normalize()
      inward.addScaledVector(tan, range(rng, -0.25, 0.45)).normalize()
      place(spec, rng, p, inward, range(rng, l0, l1), range(rng, t0, t1))
    }
  }
  return spec
}

/** Scattered floating shard debris in a box volume. */
export function debrisField(
  seed: number,
  center: THREE.Vector3,
  size: THREE.Vector3,
  count: number,
): InstanceSpec {
  const rng = mulberry32(seed)
  const spec: InstanceSpec = { matrices: [], delays: [], tints: [] }
  const p = new THREE.Vector3()
  const d = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    p.set(
      center.x + (rng() - 0.5) * size.x,
      center.y + (rng() - 0.5) * size.y,
      center.z + (rng() - 0.5) * size.z,
    )
    d.set(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1)
    if (d.lengthSq() < 0.01) d.set(0, 1, 0)
    place(spec, rng, p, d, range(rng, 0.3, 1.1), range(rng, 0.5, 1.2))
  }
  return spec
}

/** Bake an InstanceSpec into an InstancedMesh with growth/tint attributes.
 *  Clones the geometry — instance attributes are per-geometry and counts
 *  differ per mesh (the position/normal arrays are tiny). */
export function bakeInstances(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  spec: InstanceSpec,
): THREE.InstancedMesh {
  const g = geo.clone()
  g.setAttribute('aDelay', new THREE.InstancedBufferAttribute(new Float32Array(spec.delays), 1))
  g.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(spec.tints), 1))
  const mesh = new THREE.InstancedMesh(g, mat, spec.matrices.length)
  spec.matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
  mesh.instanceMatrix.needsUpdate = true
  mesh.frustumCulled = false // instances span volumes; camera flies inside them
  return mesh
}
