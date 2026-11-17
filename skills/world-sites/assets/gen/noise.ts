/**
 * Seeded CPU value-noise + fbm for build-time displacement. Deterministic —
 * the cavern must be byte-identical every load (poster + seam diffs).
 */
import { mulberry32 } from './rng'

export function makeNoise3(seed: number) {
  // gradient-free value noise over a hashed integer lattice
  const rng = mulberry32(seed)
  const perm = new Uint8Array(512)
  const base = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255]

  const vals = new Float32Array(256)
  for (let i = 0; i < 256; i++) vals[i] = rng()

  const lat = (x: number, y: number, z: number) => vals[perm[(perm[(perm[x & 255] + y) & 255] + z) & 255]]
  const sm = (t: number) => t * t * (3 - 2 * t)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  function noise(x: number, y: number, z: number): number {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const zi = Math.floor(z)
    const xf = sm(x - xi)
    const yf = sm(y - yi)
    const zf = sm(z - zi)
    const c000 = lat(xi, yi, zi)
    const c100 = lat(xi + 1, yi, zi)
    const c010 = lat(xi, yi + 1, zi)
    const c110 = lat(xi + 1, yi + 1, zi)
    const c001 = lat(xi, yi, zi + 1)
    const c101 = lat(xi + 1, yi, zi + 1)
    const c011 = lat(xi, yi + 1, zi + 1)
    const c111 = lat(xi + 1, yi + 1, zi + 1)
    return lerp(
      lerp(lerp(c000, c100, xf), lerp(c010, c110, xf), yf),
      lerp(lerp(c001, c101, xf), lerp(c011, c111, xf), yf),
      zf,
    )
  }

  function fbm(x: number, y: number, z: number, octaves = 3): number {
    let amp = 0.5
    let freq = 1
    let sum = 0
    for (let o = 0; o < octaves; o++) {
      sum += amp * noise(x * freq, y * freq, z * freq)
      amp *= 0.5
      freq *= 2.1
    }
    return sum // ~[0, 1)
  }

  return { noise, fbm }
}
