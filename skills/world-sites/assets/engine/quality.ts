/**
 * Every expensive knob in one place. Tier comes from lib/env (decided before
 * the engine chunk is even downloaded); this maps it to concrete budgets.
 * Flipping mobile from lite to static is a config change, not a refactor.
 */
import type { Tier } from '../lib/env'

export type Quality = {
  dpr: number
  antialias: boolean
  particleCount: number
  shardMult: number // multiplier on instanced shard counts
  composer: boolean // pmndrs post chain (P4)
  transmission: boolean // the ONE real-transmission core mesh (P4)
  texSize: '2k' | '1k' // PBR texture resolution
  hdri: boolean // real HDRI env (full only — lite keeps procedural PMREM)
  scannedRocks: boolean // photoscanned GLB set-dressing (full only)
  /** real transmission on the CRYSTAL materials (one extra scene render/frame) */
  glassCrystals: boolean
}

export function qualityFor(tier: Tier): Quality {
  if (tier === 'lite') {
    return {
      dpr: Math.min(window.devicePixelRatio || 1, 1.3),
      antialias: true, // no composer on lite — MSAA is the only smoothing
      particleCount: 2600,
      shardMult: 0.55,
      composer: false,
      transmission: false,
      texSize: '1k',
      hdri: false,
      scannedRocks: false,
      glassCrystals: false,
    }
  }
  return {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    antialias: false, // composer path: grain+DPR2 carry edges; MSAA wasted on targets
    particleCount: 9000,
    shardMult: 1,
    composer: true,
    transmission: true,
    texSize: '2k',
    hdri: true,
    scannedRocks: true,
    glassCrystals: true,
  }
}
