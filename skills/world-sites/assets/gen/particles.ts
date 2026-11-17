/**
 * The dust of the cavern — additive GPU points whose drift, brightness and
 * hue are pure functions of (p, travel, ignite). At any dwell the field is
 * perfectly still (deterministic rest frames for poster/diff verification);
 * during camera flight it swirls and leans cyan — igloo's speed-reactive
 * particles, made scroll-deterministic.
 */
import * as THREE from 'three'
import { mulberry32 } from './rng'

const VERT = /* glsl */ `
  attribute float aSeed;
  uniform float uP;
  uniform float uTravel;
  uniform float uSize;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float ph = aSeed * 6.2831853;
    // drift is f(p) scaled by travel — still at every dwell, alive in flight.
    // Phases are INTEGER multiples of 2π in p so the field is periodic in
    // the loop: drift(p=1) == drift(p=0), or the seam diff breaks.
    vec3 drift = vec3(
      sin(ph + uP * 6.2831853 + p.y * 0.35),
      cos(ph * 1.7 + uP * 6.2831853 + p.x * 0.3),
      sin(ph * 2.3 + uP * 12.566371 + p.z * 0.3)
    ) * (0.35 + 0.65 * fract(aSeed * 7.31)) * uTravel * 1.6;
    vec4 mv = modelViewMatrix * vec4(p + drift, 1.0);
    float size = uSize * (0.55 + fract(aSeed * 3.7)) * (1.0 + uTravel * 0.45);
    gl_PointSize = size * (120.0 / max(1.0, -mv.z));
    // additive field: keep peak alpha low — dense overlap blows to white
    vAlpha = mix(0.18, 0.5, fract(aSeed * 5.13)) * (0.55 + 0.45 * uTravel);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform float uTravel;
  uniform float uIgnite;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d) * vAlpha;
    if (a < 0.003) discard;
    vec3 teal = vec3(0.055, 0.435, 0.435);
    vec3 cyan = vec3(0.18, 0.94, 0.94);
    vec3 col = mix(teal, cyan, clamp(uTravel * 1.2 + uIgnite, 0.0, 1.0));
    // additive: alpha rides in the color
    gl_FragColor = vec4(col * a, a);
  }
`

export function buildParticles(count: number): {
  points: THREE.Points
  uniforms: { uP: { value: number }; uTravel: { value: number }; uIgnite: { value: number }; uSize: { value: number } }
  dispose: () => void
} {
  const rng = mulberry32(1337)
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  // one column of dust covering the whole descent, denser near the path
  for (let i = 0; i < count; i++) {
    const y = -rng() * 32 + 3
    const spread = 4 + rng() * rng() * 11
    const a = rng() * Math.PI * 2
    pos[i * 3] = Math.cos(a) * spread * (0.6 + rng())
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = Math.sin(a) * spread * (0.6 + rng()) - 6 - (y < -14 ? 6 : 0)
    seed[i] = rng()
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))

  const uniforms = {
    uP: { value: 0 },
    uTravel: { value: 0 },
    uIgnite: { value: 0 },
    uSize: { value: 1.7 },
  }
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  return {
    points,
    uniforms,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}
