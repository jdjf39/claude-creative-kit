/**
 * Photoscanned CC0 models (PolyHaven, fetched at build time) — real-life
 * geometry with real photographed surfaces. Loaded async alongside the
 * texture sets; failure or timeout just means fewer rocks, never a broken
 * site. Full tier only (quality.scannedRocks).
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const TIMEOUT = 8000

const withTimeout = <T,>(p: Promise<T>): Promise<T | null> =>
  Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT))]).catch(() => null)

export type ScannedRocks = {
  /** source meshes, base-normalized to ~unit size, ready to clone */
  rocks: THREE.Mesh[]
  dispose: () => void
}

export async function loadScannedRocks(): Promise<ScannedRocks> {
  const loader = new GLTFLoader()
  const slugs = ['moon_rock_01', 'moon_rock_04']
  const disposables: { dispose(): void }[] = []
  const rocks: THREE.Mesh[] = []

  await Promise.all(
    slugs.map(async (slug) => {
      const gltf = await withTimeout(loader.loadAsync(`/models/${slug}/${slug}_1k.gltf`))
      if (!gltf) return
      gltf.scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const mesh = o as THREE.Mesh
          // normalize to unit max-dimension so placement scales are sane
          const box = new THREE.Box3().setFromObject(mesh)
          const size = new THREE.Vector3()
          box.getSize(size)
          const s = 1 / Math.max(size.x, size.y, size.z, 0.001)
          mesh.geometry.scale(s, s, s)
          mesh.geometry.computeBoundingBox()
          const mat = mesh.material as THREE.MeshStandardMaterial
          // cool the scans into the cave's light: slight blue cast + frost dust
          mat.color.multiply(new THREE.Color('#e2ecef'))
          mat.envMapIntensity = 0.75
          disposables.push(mesh.geometry, mat)
          if (mat.map) disposables.push(mat.map)
          if (mat.normalMap) disposables.push(mat.normalMap)
          if (mat.roughnessMap) disposables.push(mat.roughnessMap)
          rocks.push(mesh)
        }
      })
    }),
  )

  return {
    rocks,
    dispose: () => disposables.forEach((d) => d.dispose()),
  }
}
