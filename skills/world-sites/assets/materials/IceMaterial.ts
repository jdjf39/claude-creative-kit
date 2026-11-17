/**
 * The glass/ice vocabulary. Fake-first: a dark MeshPhysicalMaterial with a
 * shader-injected fresnel rim, triplanar frost sparkle, and a fake interior
 * scatter — no transmission pass, so it can dress the whole cavern.
 * `iceReal()` is the ONE sanctioned true-transmission preset (P4, desktop
 * tier, exactly one mesh).
 *
 * All injected uniforms live in material.userData.u so the world can ramp
 * rim/scatter with fx.ignite — teal standby → cyan ignition.
 */
import * as THREE from 'three'

export type IceUniforms = {
  uRimColor: { value: THREE.Color }
  uRimStrength: { value: number }
  uScatterColor: { value: THREE.Color }
  uScatterStrength: { value: number }
  uTriScale: { value: number }
  uGrowth: { value: number }
}

export type IceMaterial = THREE.MeshPhysicalMaterial & { userData: { u: IceUniforms } }

const GLSL_NOISE = /* glsl */ `
  float khash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float kvnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(khash(i), khash(i + vec3(1,0,0)), f.x),
          mix(khash(i + vec3(0,1,0)), khash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(khash(i + vec3(0,0,1)), khash(i + vec3(1,0,1)), f.x),
          mix(khash(i + vec3(0,1,1)), khash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  // triplanar-ish frost detail: two octaves, blended by the normal
  float ktri(vec3 p, vec3 n) {
    vec3 an = abs(n) + 0.001;
    an /= (an.x + an.y + an.z);
    float nx = kvnoise(p.yzx);
    float ny = kvnoise(p.zxy);
    float nz = kvnoise(p.xyz);
    float base = nx * an.x + ny * an.y + nz * an.z;
    return base * 0.65 + kvnoise(p * 2.7) * 0.35;
  }
`

type IceOpts = {
  base?: THREE.ColorRepresentation
  rim?: THREE.ColorRepresentation
  rimStrength?: number
  scatter?: THREE.ColorRepresentation
  scatterStrength?: number
  triScale?: number
  roughness?: number
  envMapIntensity?: number
  flatShading?: boolean
  /** per-instance aTint rim variation (requires bakeInstances attributes) */
  instanced?: boolean
  /** per-instance growth scrub from uGrowth − aDelay (implies instanced) */
  growth?: boolean
}

export function iceFake(opts: IceOpts = {}): IceMaterial {
  // v2 defaults: PALE GLACIAL — real ice reads white-blue; saturated cyan
  // exists only in the ignition accents (rim/scatter ramp toward it).
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(opts.base ?? '#c9d8dd'),
    roughness: opts.roughness ?? 0.32,
    metalness: 0,
    envMapIntensity: opts.envMapIntensity ?? 1.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.32,
    iridescence: 0.15,
    iridescenceIOR: 1.3,
    flatShading: opts.flatShading ?? true, // facets ARE the crystal look
  }) as IceMaterial

  const u: IceUniforms = {
    uRimColor: { value: new THREE.Color(opts.rim ?? '#9fd4d8') },
    uRimStrength: { value: opts.rimStrength ?? 0.55 },
    uScatterColor: { value: new THREE.Color(opts.scatter ?? '#8fc3cd') },
    uScatterStrength: { value: opts.scatterStrength ?? 0.3 },
    uTriScale: { value: opts.triScale ?? 1.4 },
    uGrowth: { value: 1 },
  }
  mat.userData.u = u

  const instanced = !!(opts.instanced || opts.growth)
  const growth = !!opts.growth

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vKWPos;
         varying vec3 vKWNormal;
         varying float vKTint;
         ${instanced ? 'attribute float aTint;' : ''}
         ${growth ? 'attribute float aDelay;\nuniform float uGrowth;' : ''}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vKTint = ${instanced ? 'aTint' : '0.5'};
         ${
           growth
             ? `float kG = smoothstep(aDelay, aDelay + 0.35, uGrowth);
                transformed.y *= kG;
                transformed.xz *= mix(0.7, 1.0, kG);`
             : ''
         }`,
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vKWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vKWNormal = normalize(mat3(modelMatrix) * objectNormal);`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vKWPos;
         varying vec3 vKWNormal;
         varying float vKTint;
         uniform vec3 uRimColor;
         uniform float uRimStrength;
         uniform vec3 uScatterColor;
         uniform float uScatterStrength;
         uniform float uTriScale;
         ${GLSL_NOISE}`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         {
           vec3 kV = normalize(cameraPosition - vKWPos);
           vec3 kN = normalize(vKWNormal);
           float kFacing = clamp(dot(kV, kN), 0.0, 1.0);
           float kTri = ktri(vKWPos * uTriScale, kN);
           float kVar = mix(0.65, 1.35, vKTint);
           // fresnel rim — the cold edge light every shard carries
           float kFres = pow(1.0 - kFacing, 2.6);
           totalEmissiveRadiance += uRimColor * uRimStrength * kVar * kFres * (0.7 + 0.6 * kTri);
           // fake interior scatter — glow rises where you look INTO the mass
           totalEmissiveRadiance += uScatterColor * uScatterStrength * kVar * pow(kFacing, 1.7) * (0.35 + 0.65 * kTri);
         }`,
      )
  }
  // uniforms are shared refs — no per-frame recompile, mutate freely.
  // NOTE: instanced meshes get USE_INSTANCING defines from the renderer, so
  // the cache key must split on our variant flags only.
  mat.customProgramCacheKey = () => `k-ice-${instanced ? 'i' : ''}${growth ? 'g' : ''}`
  return mat
}

/** The ONE true-transmission material — P4 wires it onto a single core
 *  mesh, desktop tier only. Same rim/scatter injection so it ignites in
 *  step with the fakes. */
export function iceReal(opts: IceOpts = {}): IceMaterial {
  const mat = iceFake({
    base: opts.base ?? '#dfeef2',
    roughness: opts.roughness ?? 0.08,
    envMapIntensity: opts.envMapIntensity ?? 1.1,
    rim: opts.rim,
    rimStrength: opts.rimStrength,
    scatter: opts.scatter,
    scatterStrength: opts.scatterStrength ?? 0.3,
    triScale: opts.triScale,
    flatShading: opts.flatShading ?? true,
  })
  mat.transmission = 1
  mat.thickness = 1.6
  mat.ior = 1.31 // ice
  mat.attenuationColor = new THREE.Color('#9fd8e0')
  mat.attenuationDistance = 3.0
  mat.customProgramCacheKey = () => 'k-ice-real'
  return mat
}
