/**
 * The iPhone — flat-rail aluminum body, glass front with the story screen,
 * matte back with a triple-lens camera island. Built from primitives,
 * grounded and recognizable; sits on a turntable group the world rotates
 * as f(p) (exactly one revolution per loop).
 */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

export function buildDevice(screenTex: THREE.Texture): {
  group: THREE.Group
  dispose: () => void
} {
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(d: T): T => {
    disposables.push(d)
    return d
  }

  const group = new THREE.Group()

  const W = 1.5
  const H = 3.05
  const D = 0.155
  // small corner radius on depth → flat iPhone-15-style rails
  const bodyGeo = track(new RoundedBoxGeometry(W, H, D, 4, 0.07))
  const railMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#1a232b',
      metalness: 0.95,
      roughness: 0.28,
      clearcoat: 0.8,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.25,
    }),
  )
  group.add(new THREE.Mesh(bodyGeo, railMat))

  // front screen
  const screenGeo = track(new THREE.PlaneGeometry(W - 0.1, H - 0.1))
  const screenMat = track(new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }))
  const screen = new THREE.Mesh(screenGeo, screenMat)
  screen.position.z = D / 2 + 0.002
  group.add(screen)
  // cover glass sheen
  const glassGeo = track(new THREE.PlaneGeometry(W - 0.06, H - 0.06))
  const glassMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#0a1216',
      transparent: true,
      opacity: 0.14,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.7,
    }),
  )
  const glass = new THREE.Mesh(glassGeo, glassMat)
  glass.position.z = D / 2 + 0.01
  group.add(glass)

  // matte glass back
  const backGeo = track(new THREE.PlaneGeometry(W - 0.08, H - 0.08))
  const backMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#141d24',
      metalness: 0.2,
      roughness: 0.55,
      clearcoat: 0.35,
      envMapIntensity: 0.9,
    }),
  )
  const back = new THREE.Mesh(backGeo, backMat)
  back.position.z = -D / 2 - 0.002
  back.rotation.y = Math.PI
  group.add(back)

  // camera island (top-left of the back) + triple lens triangle
  const islandGeo = track(new RoundedBoxGeometry(0.52, 0.52, 0.05, 3, 0.14))
  const island = new THREE.Mesh(islandGeo, railMat)
  island.position.set(W / 2 - 0.37, H / 2 - 0.4, -D / 2 - 0.02) // back-left when viewed from behind
  group.add(island)
  const lensGeo = track(new THREE.CylinderGeometry(0.095, 0.095, 0.05, 24))
  const lensMat = track(
    new THREE.MeshPhysicalMaterial({ color: '#04070a', roughness: 0.08, clearcoat: 1, envMapIntensity: 1.5 }),
  )
  const ringGeo = track(new THREE.TorusGeometry(0.1, 0.014, 8, 28))
  for (const [lx, ly] of [
    [-0.11, 0.12],
    [-0.11, -0.13],
    [0.12, -0.005],
  ] as const) {
    const lens = new THREE.Mesh(lensGeo, lensMat)
    lens.rotation.x = Math.PI / 2
    lens.position.set(island.position.x + lx, island.position.y + ly, -D / 2 - 0.05)
    group.add(lens)
    const ring = new THREE.Mesh(ringGeo, railMat)
    ring.position.copy(lens.position)
    group.add(ring)
  }

  // side buttons
  const btnGeo = track(new RoundedBoxGeometry(0.035, 0.34, 0.08, 2, 0.015))
  for (const [side, by, sc] of [
    [-1, 0.95, 0.65], // action
    [-1, 0.55, 1], // vol up
    [-1, 0.15, 1], // vol down
    [1, 0.72, 1.15], // power
  ] as const) {
    const btn = new THREE.Mesh(btnGeo, railMat)
    btn.scale.y = sc
    btn.position.set(side * (W / 2 + 0.012), by, 0)
    group.add(btn)
  }

  return {
    group,
    dispose: () => disposables.forEach((d) => d.dispose()),
  }
}
