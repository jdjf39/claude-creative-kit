/**
 * Self-hosted PBR texture sets (PolyHaven CC0, fetched at build time by
 * scripts/fetch-tex.sh — runtime makes zero external requests).
 *
 * Everything loads async AFTER the world is built: materials start pale and
 * untextured, maps are assigned on resolve, and the engine holds the reveal
 * until then — so there is no pop-in and the site still ships if a file is
 * missing (Promise.allSettled + timeout → untextured pale fallback).
 */
import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

export type PbrSet = {
  map?: THREE.Texture
  normalMap?: THREE.Texture
  roughnessMap?: THREE.Texture
}

export type WorldMaps = {
  ice: PbrSet
  wall: PbrSet
  snow: PbrSet
  hdri: THREE.DataTexture | null
}

const TIMEOUT = 6000

function withTimeout<T>(p: Promise<T>): Promise<T | null> {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT))]).catch(() => null)
}

export function loadWorldTextures(
  renderer: THREE.WebGLRenderer,
  texSize: '2k' | '1k',
  wantHdri: boolean,
): Promise<WorldMaps> {
  const loader = new THREE.TextureLoader()
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())

  const tex = (file: string, srgb: boolean) =>
    withTimeout(
      loader.loadAsync(`/tex/${texSize}/${file}`).then((t) => {
        if (srgb) t.colorSpace = THREE.SRGBColorSpace
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.anisotropy = aniso
        return t
      }),
    )

  const set = async (prefix: string): Promise<PbrSet> => {
    const [map, normalMap, roughnessMap] = await Promise.all([
      tex(`${prefix}_color.jpg`, true),
      tex(`${prefix}_normal.jpg`, false),
      tex(`${prefix}_rough.jpg`, false),
    ])
    return {
      map: map ?? undefined,
      normalMap: normalMap ?? undefined,
      roughnessMap: roughnessMap ?? undefined,
    }
  }

  const hdri = wantHdri
    ? withTimeout(new RGBELoader().loadAsync('/tex/winter_1k.hdr'))
    : Promise.resolve(null)

  return Promise.all([set('ice'), set('wall'), set('snow'), hdri]).then(([ice, wall, snow, hdr]) => ({
    ice,
    wall,
    snow,
    hdri: hdr as THREE.DataTexture | null,
  }))
}

/** Assign a PBR set onto an existing material — three recompiles with the
 *  right defines on the next render (behind the still-hidden canvas). */
export function applySet(mat: THREE.MeshPhysicalMaterial, s: PbrSet, normalScale = 0.8, repeat = 1) {
  if (s.map) {
    mat.map = s.map.clone()
    mat.map.repeat.setScalar(repeat)
  }
  if (s.normalMap) {
    mat.normalMap = s.normalMap.clone()
    mat.normalMap.repeat.setScalar(repeat)
    mat.normalScale = new THREE.Vector2(normalScale, normalScale)
  }
  if (s.roughnessMap) {
    mat.roughnessMap = s.roughnessMap.clone()
    mat.roughnessMap.repeat.setScalar(repeat)
  }
  mat.needsUpdate = true
}
