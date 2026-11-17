/**
 * The Ringing Phone — a recognizable telephone handset, fully procedural:
 * curved bridge, two lathe receiver cups tilted inward, hex grille dots,
 * and a coiled cord that feeds the descent tunnel mouth. Plus ringRipple():
 * expanding sound rings whose phase is an INTEGER frequency of p (seam-safe,
 * frozen-at-rest — the poster shows staggered rings).
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export function handsetGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []

  // bridge — the curved bar between the two cups
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.95, 0, 0),
    new THREE.Vector3(-0.5, 0.3, 0),
    new THREE.Vector3(0, 0.42, 0),
    new THREE.Vector3(0.5, 0.3, 0),
    new THREE.Vector3(0.95, 0, 0),
  ])
  parts.push(new THREE.TubeGeometry(bridgeCurve, 48, 0.13, 20, false))

  // receiver cups — classic rounded profile, flat face down-inward
  const profile: THREE.Vector2[] = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.3, 0.02),
    new THREE.Vector2(0.36, 0.1),
    new THREE.Vector2(0.34, 0.2),
    new THREE.Vector2(0.2, 0.32),
    new THREE.Vector2(0.08, 0.38),
    new THREE.Vector2(0.001, 0.4),
  ]
  for (const side of [-1, 1]) {
    const cup = new THREE.LatheGeometry(profile, 48)
    // lathe grows +y; flip so the flat speaker face points down, then tilt
    // 25° inward toward the bridge center
    cup.rotateX(Math.PI)
    cup.rotateZ(side * -0.44)
    cup.translate(side * 0.98, 0.06, 0)
    parts.push(cup)
  }

  const geo = mergeGeometries(parts, false)!
  parts.forEach((p) => p.dispose())
  return geo
}

/** Speaker-grille dots — instanced shallow cylinders hex-packed on each
 *  cup face. Returned as InstanceSpec-style matrices for a dark mesh. */
export function grilleMatrices(): THREE.Matrix4[] {
  const out: THREE.Matrix4[] = []
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const eul = new THREE.Euler()
  for (const side of [-1, 1]) {
    // hex pack: center + 6 ring
    const spots: [number, number][] = [[0, 0]]
    for (let i = 0; i < 6; i++) spots.push([Math.cos((i / 6) * Math.PI * 2) * 0.14, Math.sin((i / 6) * Math.PI * 2) * 0.14])
    for (const [gx, gz] of spots) {
      // cup face center after the transforms in handsetGeometry
      eul.set(0, 0, side * -0.44)
      q.setFromEuler(eul)
      const local = new THREE.Vector3(gx, -0.02, gz).applyQuaternion(q)
      m.compose(
        new THREE.Vector3(side * 0.98 + local.x, 0.06 + local.y, local.z),
        q,
        new THREE.Vector3(1, 1, 1),
      )
      out.push(m.clone())
    }
  }
  return out
}

/** The coiled cord — spirals from the right cup down into the line. */
export function cordGeometry(from: THREE.Vector3, to: THREE.Vector3): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = []
  const N = 60
  const TURNS = 9
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const a = t * TURNS * Math.PI * 2
    const coilR = 0.22 - 0.12 * t
    const cx = from.x + (to.x - from.x) * t
    const cy = from.y + (to.y - from.y) * t
    const cz = from.z + (to.z - from.z) * t
    pts.push(new THREE.Vector3(cx + Math.cos(a) * coilR, cy, cz + Math.sin(a) * coilR))
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.055, 10, false)
}

/**
 * Expanding sound rings. K=36 integer p-frequency: seam-safe, deterministic
 * still at rest. One InstancedMesh of thin tori; per-instance aIndex staggers
 * the phase so the rings read as a continuous ripple train.
 */
export function ringRipple(count = 4, baseRadius = 1.0): {
  mesh: THREE.InstancedMesh
  uniforms: { uP: { value: number } }
  dispose: () => void
} {
  const geo = new THREE.TorusGeometry(baseRadius, 0.014, 8, 96)
  const idx = new Float32Array(count)
  for (let i = 0; i < count; i++) idx[i] = i / count
  geo.setAttribute('aIndex', new THREE.InstancedBufferAttribute(idx, 1))

  const uniforms = { uP: { value: 0 } }
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute float aIndex;
      uniform float uP;
      varying float vT;
      void main() {
        float t = fract(uP * 36.0 + aIndex);
        vT = t;
        vec3 p = position * (1.0 + 3.2 * t);
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vT;
      void main() {
        // fade IN at birth as well as out at death: alpha(0) == alpha(1) == 0,
        // so the ring train is periodic over the loop (seam-exact)
        float a = smoothstep(0.0, 0.12, vT) * (1.0 - vT) * (1.0 - vT) * 0.34;
        if (a < 0.004) discard;
        // teal body, cyan crest right after emission
        vec3 col = mix(vec3(0.09, 0.44, 0.44), vec3(0.18, 0.94, 0.94), smoothstep(0.35, 0.05, vT));
        gl_FragColor = vec4(col * a, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.InstancedMesh(geo, mat, count)
  const m = new THREE.Matrix4()
  for (let i = 0; i < count; i++) mesh.setMatrixAt(i, m) // identity — shader scales
  mesh.frustumCulled = false
  return {
    mesh,
    uniforms,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}
