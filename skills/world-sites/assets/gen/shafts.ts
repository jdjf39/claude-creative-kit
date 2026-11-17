/**
 * Light shafts — additive translucent cones falling from above, the
 * "sunlight through the glacier" atmosphere. Static geometry, alpha fades
 * along the length and at the silhouette (fresnel), deterministic.
 */
import * as THREE from 'three'

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWPos;
  varying vec3 vWNormal;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWPos = wp.xyz;
    vWNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec2 vUv;
  varying vec3 vWPos;
  varying vec3 vWNormal;
  void main() {
    vec3 V = normalize(cameraPosition - vWPos);
    // edge fade: shafts are volume fakes — kill the silhouette
    float edge = abs(dot(V, normalize(vWNormal)));
    edge = smoothstep(0.55, 0.0, edge);
    // fade down the length + at both caps
    float len = smoothstep(0.02, 0.25, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
    float a = edge * len * uStrength;
    gl_FragColor = vec4(uColor * a, a);
  }
`

export function lightShaft(
  color: THREE.ColorRepresentation,
  strength: number,
  topR: number,
  botR: number,
  h: number,
): { mesh: THREE.Mesh; uStrength: { value: number }; baseStrength: number; dispose: () => void } {
  const geo = new THREE.CylinderGeometry(topR, botR, h, 18, 1, true)
  const uStrength = { value: strength }
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uStrength,
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.frustumCulled = false
  return {
    mesh,
    uStrength,
    baseStrength: strength,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}
