/**
 * Inside the Line — braided fiber strands twisting down the tunnel path,
 * with data pulses racing along them. combMaterial() is the shared pulse
 * shader (the exchange threads reuse it): an emissive comb whose phase is
 * an INTEGER frequency of p — pulses race seamlessly across the loop wrap,
 * brightness rides travel (speed-reactive), color leans cyan only at speed.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { makeNoise3 } from './noise'

export type CombUniforms = {
  uP: { value: number }
  uTravel: { value: number }
  uIgnite: { value: number }
}

export function combMaterial(direction = 1, pulses = 6): {
  mat: THREE.ShaderMaterial
  uniforms: CombUniforms
} {
  const uniforms: CombUniforms = { uP: { value: 0 }, uTravel: { value: 0 }, uIgnite: { value: 0 } }
  const mat = new THREE.ShaderMaterial({
    uniforms,
    defines: { K_DIR: direction.toFixed(1), K_PULSES: pulses.toFixed(1) },
    vertexShader: /* glsl */ `
      attribute float aAlong;
      attribute float aStrand;
      varying float vAlong;
      varying float vStrand;
      varying vec3 vN;
      varying vec3 vWp;
      void main() {
        vAlong = aAlong;
        vStrand = aStrand;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWp = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uP;
      uniform float uTravel;
      uniform float uIgnite;
      varying float vAlong;
      varying float vStrand;
      varying vec3 vN;
      varying vec3 vWp;
      void main() {
        vec3 V = normalize(cameraPosition - vWp);
        float fres = pow(1.0 - abs(dot(V, normalize(vN))), 2.0);
        // dark sheathed strand with a faint standby core
        vec3 base = vec3(0.02, 0.045, 0.055) + fres * vec3(0.05, 0.12, 0.13);
        // the data pulse comb — integer K=8 in p: seam-exact
        float phase = fract(vAlong * K_PULSES + K_DIR * uP * 8.0 + vStrand);
        float pulse = smoothstep(0.955, 0.995, phase) * (1.0 - smoothstep(0.995, 1.0, phase));
        float amp = 0.35 + 0.65 * uTravel;
        vec3 pcol = mix(vec3(0.07, 0.5, 0.5), vec3(0.18, 0.94, 0.94), clamp(uTravel * 1.3 + uIgnite, 0.0, 1.0));
        gl_FragColor = vec4(base + pcol * pulse * amp * 2.2, 1.0);
      }
    `,
  })
  return { mat, uniforms }
}

/** 7 braided strands twisting around the tunnel path, merged into one
 *  geometry carrying aAlong (arc 0..1) + aStrand (k/7). */
export function braidedStrands(
  seed: number,
  path: THREE.Curve<THREE.Vector3>,
  strands = 7,
  radius = 2.6,
  end = 1, // stop before 1.0 so the braid never invades the next chamber
  turns = 2.5,
  tubeR = 0.09,
): THREE.BufferGeometry {
  const { fbm } = makeNoise3(seed)
  const parts: THREE.BufferGeometry[] = []
  const pos = new THREE.Vector3()
  const tan = new THREE.Vector3()
  const nrm = new THREE.Vector3()
  const bin = new THREE.Vector3()
  for (let k = 0; k < strands; k++) {
    const pts: THREE.Vector3[] = []
    const N = 90
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * end
      path.getPointAt(t, pos)
      path.getTangentAt(t, tan)
      nrm.set(1, 0, 0).cross(tan)
      if (nrm.lengthSq() < 0.01) nrm.set(0, 0, 1).cross(tan)
      nrm.normalize()
      bin.crossVectors(tan, nrm).normalize()
      const a = (k / strands) * Math.PI * 2 + (t / Math.max(end, 0.0001)) * turns * Math.PI * 2
      const r = radius * (1 + (fbm(pos.x * 0.4, pos.y * 0.4, k * 3.7) - 0.5) * 0.12)
      pts.push(pos.clone().addScaledVector(nrm, Math.cos(a) * r).addScaledVector(bin, Math.sin(a) * r))
    }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, tubeR, 8, false)
    // aAlong from the tube's own u coordinate (uv.x runs along the length)
    const uv = tube.getAttribute('uv')
    const along = new Float32Array(uv.count)
    const strand = new Float32Array(uv.count)
    for (let i = 0; i < uv.count; i++) {
      along[i] = uv.getX(i)
      strand[i] = k / strands
    }
    tube.setAttribute('aAlong', new THREE.BufferAttribute(along, 1))
    tube.setAttribute('aStrand', new THREE.BufferAttribute(strand, 1))
    parts.push(tube)
  }
  const geo = mergeGeometries(parts, false)!
  parts.forEach((p) => p.dispose())
  return geo
}

/** Repeater collars along the line — the parallax speed cue. */
export function collarMatrices(path: THREE.Curve<THREE.Vector3>, count = 16, radius = 3.0, end = 1): THREE.Matrix4[] {
  const out: THREE.Matrix4[] = []
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const pos = new THREE.Vector3()
  const tan = new THREE.Vector3()
  const Z = new THREE.Vector3(0, 0, 1)
  const s = new THREE.Vector3(radius / 3.0, radius / 3.0, 1)
  for (let i = 0; i < count; i++) {
    const t = ((i + 0.5) / count) * end
    path.getPointAt(t, pos)
    path.getTangentAt(t, tan)
    q.setFromUnitVectors(Z, tan)
    m.compose(pos, q, s)
    out.push(m.clone())
  }
  return out
}
