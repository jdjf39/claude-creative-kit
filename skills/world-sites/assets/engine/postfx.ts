/**
 * The post chain — pmndrs `postprocessing`, ONE merged EffectPass:
 * mipmap bloom + speed-reactive chromatic aberration + frost displacement +
 * vignette + grain + SMAA. Full tier only; lite renders straight.
 */
import * as THREE from 'three'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  NoiseEffect,
  BlendFunction,
  Effect,
} from 'postprocessing'

/** Frost — crystalline UV displacement + cold lift that creeps in with
 *  travel speed (the scene-transition effect, scroll-deterministic). */
class FrostEffect extends Effect {
  constructor() {
    super(
      'FrostEffect',
      /* glsl */ `
        uniform float uFrost;
        float fhash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
        float fnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(fhash(i), fhash(i + vec2(1, 0)), f.x), mix(fhash(i + vec2(0, 1)), fhash(i + vec2(1, 1)), f.x), f.y);
        }
        void mainUv(inout vec2 uv) {
          // edge-weighted crystalline shatter of the sample position
          vec2 c = uv - 0.5;
          float edge = smoothstep(0.18, 0.72, length(c));
          float n = fnoise(uv * 42.0) - 0.5;
          float n2 = fnoise(uv.yx * 23.0 + 7.3) - 0.5;
          uv += vec2(n, n2) * 0.028 * uFrost * edge;
        }
        void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
          vec2 c = uv - 0.5;
          float edge = smoothstep(0.2, 0.75, length(c));
          // cold lift toward the cavern's cyan at the frosted edges
          vec3 frosted = mix(inputColor.rgb, inputColor.rgb * 0.7 + vec3(0.10, 0.22, 0.24), edge * uFrost * 0.8);
          outputColor = vec4(frosted, inputColor.a);
        }
      `,
      { uniforms: new Map<string, THREE.Uniform>([['uFrost', new THREE.Uniform(0)]]) },
    )
  }
  get frost(): number {
    return this.uniforms.get('uFrost')!.value as number
  }
  set frost(v: number) {
    this.uniforms.get('uFrost')!.value = v
  }
}

export type PostFx = {
  composer: EffectComposer
  /** apply the fx rack — bloom/ca/frost as pure f(p, travel) */
  apply: (fx: { bloom: number; ca: number }, travel: number) => void
  /** still mode: grain off, so offscreen stills are byte-reproducible */
  setStill: (on: boolean) => void
  setSize: (w: number, h: number) => void
  dispose: () => void
}

export function buildPostFx(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): PostFx {
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType, // ACES + bloom needs HDR headroom
  })
  composer.addPass(new RenderPass(scene, camera))

  const bloom = new BloomEffect({
    mipmapBlur: true,
    luminanceThreshold: 0.72,
    luminanceSmoothing: 0.18,
    intensity: 0.9,
    radius: 0.72,
  })
  const ca = new ChromaticAberrationEffect({
    offset: new THREE.Vector2(0, 0),
    radialModulation: true,
    modulationOffset: 0.28,
  })
  const frost = new FrostEffect()
  const vignette = new VignetteEffect({ darkness: 0.52, offset: 0.28 })
  const grain = new NoiseEffect({ blendFunction: BlendFunction.COLOR_DODGE })
  grain.blendMode.opacity.value = 0.045

  // pmndrs merge rules: convolution effects (CA) can't share a pass with
  // UV-transforming effects (frost). Two merged passes; no SMAA — DPR-2 +
  // grain carry the edges on this dark scene.
  composer.addPass(new EffectPass(camera, frost, bloom, vignette, grain))
  composer.addPass(new EffectPass(camera, ca))

  const grainOpacity = grain.blendMode.opacity.value
  return {
    composer,
    setStill(on) {
      grain.blendMode.opacity.value = on ? 0 : grainOpacity
    },
    apply(fx, travel) {
      bloom.intensity = 0.35 + 1.35 * fx.bloom
      const off = fx.ca * 0.0035 * (0.35 + 0.65 * travel)
      ca.offset.set(off, off * 0.6)
      // subtle — at full strength the whole frame goes milky
      frost.frost = Math.min(0.45, travel * 0.55)
    },
    setSize(w, h) {
      composer.setSize(w, h)
    },
    dispose() {
      composer.dispose()
    },
  }
}
