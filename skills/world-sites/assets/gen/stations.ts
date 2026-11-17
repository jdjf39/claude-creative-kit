/**
 * The other two service stations: the front-desk BELL (the missed call,
 * recovered) and the AUTOMATION gear train (integer turns per loop —
 * seam-exact, frozen at rest). Plus plinths and dark glass floor discs.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Classic counter bell on a slab. One merged geometry. */
export function bellGeometry(scale = 1.8): THREE.BufferGeometry {
  const profile: THREE.Vector2[] = [
    new THREE.Vector2(0.5, 0),
    new THREE.Vector2(0.5, 0.05),
    new THREE.Vector2(0.42, 0.07),
    new THREE.Vector2(0.4, 0.1),
    new THREE.Vector2(0.36, 0.26),
    new THREE.Vector2(0.22, 0.4),
    new THREE.Vector2(0.09, 0.48),
    new THREE.Vector2(0.06, 0.54),
    new THREE.Vector2(0.1, 0.6),
    new THREE.Vector2(0.001, 0.66),
  ]
  const bell = new THREE.LatheGeometry(profile, 64)
  bell.scale(scale, scale, scale)
  const counter = new THREE.BoxGeometry(1.6, 0.9, 1.1)
  counter.translate(0, -0.45, 0)
  const geo = mergeGeometries([bell, counter], false)!
  bell.dispose()
  counter.dispose()
  return geo
}

/** A 12-tooth gear as an extruded 2D shape. */
export function gearGeometry(outerR: number, teeth = 12, depth = 0.16): THREE.BufferGeometry {
  const rootR = outerR * 0.8
  const holeR = outerR * 0.28
  const shape = new THREE.Shape()
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step
    const a1 = a0 + step * 0.35
    const a2 = a0 + step * 0.5
    const a3 = a0 + step * 0.85
    if (i === 0) shape.moveTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR)
    else shape.lineTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR)
    shape.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR)
    shape.lineTo(Math.cos(a2) * rootR, Math.sin(a2) * rootR)
    shape.lineTo(Math.cos(a3) * rootR, Math.sin(a3) * rootR)
  }
  shape.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, 0, holeR, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 })
  geo.translate(0, 0, -depth / 2)
  return geo
}

/** Floating glass "app panes". */
export function paneGeometry(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(0.9, 1.4, 0.06)
}

export function plinthGeometry(w = 2.2, h = 0.5, d = 2.2): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d)
  g.translate(0, -h / 2, 0)
  return g
}

export function floorDisc(r: number, segments = 48): THREE.BufferGeometry {
  const g = new THREE.CircleGeometry(r, segments)
  g.rotateX(-Math.PI / 2)
  return g
}
