/**
 * The Next Call — one glowing mote riding a CLOSED spine through the whole
 * machine: handset → cord → line → vault → exchange → calendar → back up.
 * Position = spine(fract(p + PHASE)) with K=1: exactly one traversal per
 * loop, seam-exact by construction. It arrives at the handset just as the
 * visitor wraps back to the hero.
 */
import * as THREE from 'three'

const PHASE = 0.945

export function callMote(): {
  mesh: THREE.Mesh
  update: (p: number) => void
  dispose: () => void
} {
  const spine = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0.9, 0.2, 0.3), // at the handset
      new THREE.Vector3(0.4, -2.6, 0.5), // down the cord
      new THREE.Vector3(0, -5.6, 0.4), // into the line
      new THREE.Vector3(0.2, -9, -1.2),
      new THREE.Vector3(-0.2, -12.5, -4), // through the tunnel
      new THREE.Vector3(-1.5, -16.4, -7.4), // sweeping past the stations
      new THREE.Vector3(1.8, -17.6, -10.5),
      new THREE.Vector3(0, -18.4, -14), // through the exchange
      new THREE.Vector3(0.4, -21.5, -18.5),
      new THREE.Vector3(0.6, -23.6, -20.6), // touches the calendar
      new THREE.Vector3(4.5, -18, -16), // rises up the +z side
      new THREE.Vector3(5.5, -10, -6),
      new THREE.Vector3(3.5, -3, 2.5),
      new THREE.Vector3(1.8, 0.6, 1.6), // approaching the handset again
    ],
    true,
    'centripetal',
    0.5,
  )

  const geo = new THREE.SphereGeometry(0.09, 12, 12)
  const mat = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vWp;
      void main() {
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position * 2.4, 1.0);
        vWp = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vWp;
      void main() {
        vec3 V = normalize(cameraPosition - vWp);
        float core = pow(max(dot(V, normalize(vN)), 0.0), 2.0);
        vec3 col = mix(vec3(0.09, 0.5, 0.5), vec3(0.75, 1.0, 1.0), core);
        gl_FragColor = vec4(col * (0.25 + core), core * 0.9);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.frustumCulled = false

  function update(p: number) {
    spine.getPointAt((((p + PHASE) % 1) + 1) % 1, mesh.position)
  }
  update(0)

  return {
    mesh,
    update,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}
