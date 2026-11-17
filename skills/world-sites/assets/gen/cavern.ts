/**
 * The cavern enclosure — real surfaces so the world is a PLACE, not shapes
 * floating in a void. All displaced at build time (seeded, deterministic),
 * rendered from the inside (BackSide), textured with the wall/snow PBR sets.
 */
import * as THREE from 'three'
import { makeNoise3 } from './noise'

/** An icy throat around the descent path — displaced tube, inside faces. */
export function tunnelTube(seed: number, path: THREE.Curve<THREE.Vector3>, radius = 4.6): THREE.BufferGeometry {
  const geo = new THREE.TubeGeometry(path, 96, radius, 24, false)
  const { fbm } = makeNoise3(seed)
  const pos = geo.getAttribute('position')
  const nrm = geo.getAttribute('normal')
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    n.fromBufferAttribute(nrm, i) // tube normals point outward from the axis
    const d = (fbm(v.x * 0.55, v.y * 0.55, v.z * 0.55) - 0.45) * 1.8
    v.addScaledVector(n, d)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  // repeat the wall texture around/along the tube
  const uv = geo.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6, uv.getY(i) * 2)
  return geo
}

/** A chamber wall — displaced sphere rendered from inside. */
export function chamberDome(seed: number, radius: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, 48, 32)
  const { fbm } = makeNoise3(seed)
  const pos = geo.getAttribute('position')
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const d = 1 + (fbm(v.x * 0.18, v.y * 0.18, v.z * 0.18) - 0.45) * (2.4 / radius) * 2
    v.multiplyScalar(d)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  const uv = geo.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 5, uv.getY(i) * 3)
  return geo
}

/** A snow bed — gently displaced plane, laid flat. */
export function snowFloor(seed: number, w: number, d: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(w, d, 48, 34)
  const { fbm } = makeNoise3(seed)
  const pos = geo.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    pos.setZ(i, fbm(x * 0.22, y * 0.22, 0.5) * 1.1)
  }
  geo.rotateX(-Math.PI / 2)
  geo.computeVertexNormals()
  const uv = geo.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * 3)
  return geo
}
