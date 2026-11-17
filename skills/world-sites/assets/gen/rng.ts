/**
 * Seeded RNG — the world must be byte-identical every load so poster
 * compares and screenshot diffs are meaningful. mulberry32.
 */
export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const range = (rng: Rng, min: number, max: number) => min + rng() * (max - min)
