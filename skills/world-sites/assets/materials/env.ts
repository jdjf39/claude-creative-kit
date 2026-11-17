/**
 * Procedural environment — a canvas-painted equirect of the cavern's own
 * light: void above, a teal horizon band, and a few hard cyan glints so
 * glass and ice have something sharp to reflect. No HDR file, no request.
 */
import * as THREE from 'three'

export function buildEnvironment(renderer: THREE.WebGLRenderer): {
  texture: THREE.Texture
  dispose: () => void
} {
  const W = 512
  const H = 256
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!

  // v2 GLACIAL: pale overcast-cavern light — placeholder until the real
  // HDRI lands (and the permanent env on lite tier)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#3a4a52')
  g.addColorStop(0.4, '#22323a')
  g.addColorStop(0.55, '#2b444c')
  g.addColorStop(0.65, '#182630')
  g.addColorStop(1, '#0a1216')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  const blob = (x: number, y: number, r: number, c0: string, c1: string) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, c0)
    rg.addColorStop(1, c1)
    ctx.fillStyle = rg
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // cold sky key + a pale horizon band; the cavern's light is white-blue now
  blob(W * 0.5, H * 0.08, 110, 'rgba(226,240,244,0.85)', 'rgba(226,240,244,0)')
  blob(W * 0.24, H * 0.52, 60, 'rgba(190,220,226,0.6)', 'rgba(190,220,226,0)')
  blob(W * 0.7, H * 0.5, 44, 'rgba(160,205,214,0.5)', 'rgba(160,205,214,0)')
  blob(W * 0.88, H * 0.58, 20, 'rgba(228,248,250,0.7)', 'rgba(46,240,240,0)')

  const tex = new THREE.CanvasTexture(cv)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace

  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromEquirectangular(tex)
  tex.dispose()
  pmrem.dispose()

  return {
    texture: envRT.texture,
    dispose: () => envRT.dispose(),
  }
}
