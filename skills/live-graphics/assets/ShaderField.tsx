import { useEffect, useRef } from 'react'

/* ============================================================================
   ShaderField — ambient GPU particle field (drop-in template).

   A fixed, full-bleed field of faint brand-tint motes drifting on a curl-noise
   flow, parting around the cursor. Sits BEHIND content (z-0, under your page at
   z-10) and shows only through dark negative space. Raw WebGL, zero deps.

   Usage:
   - Render <ShaderField /> once near the top of your app, with page content in
     a `relative z-10` wrapper above it.
   - Swap BRAND for your accent color (linear-space rgb, 0..1).
   - Keep it faint — it should never fight text.

   Doctrine (see the skill's references/doctrine.md):
   - Frame 0 is a full CPU-seeded field, so a paused/hidden tab isn't blank.
   - preserveDrawingBuffer keeps that frame on screen when rAF is paused.
   - prefers-reduced-motion → one static frame. DPR capped, count scales to
     viewport, halves on coarse pointers, pauses on tab hide.
   ==========================================================================*/

const BRAND = 'vec3(0.18, 0.42, 1.0)' // ← your accent in linear rgb (here: sapphire #2E6BFF)

const VERT = `
attribute vec2 aPos;      // seeded clip-space home
attribute vec3 aRnd;      // speed, freq, phase
uniform float uTime, uDpr;
uniform vec2 uMouse;
varying float vA;
vec2 flow(vec2 p, float t){
  return vec2(sin(p.y*3.0+t)*0.5 + sin(p.x*1.7-t*0.6)*0.3,
              cos(p.x*2.3-t*0.8)*0.5 + sin(p.y*1.3+t*0.4)*0.3);
}
void main(){
  float speed=aRnd.x, freq=aRnd.y, phase=aRnd.z;
  vec2 p = aPos;
  p.y += uTime*speed*0.05;
  p.x += sin(uTime*freq+phase)*0.03;
  p += flow(aPos*1.5, uTime*0.15)*0.03;
  p = mod(p+1.0, 2.0) - 1.0;
  vec2 d = p - uMouse;
  float m = clamp(1.0 - length(d)/0.35, 0.0, 1.0);
  p += normalize(d+0.0001) * m*m * 0.06;
  float tw = 0.55 + 0.45*sin(uTime*freq*2.0 + phase*3.0);
  vA = (0.12 + 0.30*tw) + m*0.35;
  gl_PointSize = (1.0 + 1.6*freq + m*2.0) * uDpr;
  gl_Position = vec4(p, 0.0, 1.0);
}`

const FRAG = `
precision mediump float;
varying float vA;
void main(){
  float dd = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, dd) * vA;
  vec3 col = mix(${BRAND}, vec3(0.72,0.84,1.0), smoothstep(0.32,0.0,dd));
  gl_FragColor = vec4(col*a, a);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('ShaderField:', gl.getShaderInfoLog(s)); return null }
  return s
}

export function ShaderField() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true })
    if (!gl) return
    const vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return
    const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const coarse = window.matchMedia('(pointer: coarse)').matches
    const area = window.innerWidth * window.innerHeight
    const COUNT = Math.min(coarse ? 2000 : 5000, Math.round(area / (coarse ? 900 : 460)))
    const pos = new Float32Array(COUNT * 2), rnd = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      pos[i*2] = Math.random()*2-1; pos[i*2+1] = Math.random()*2-1
      rnd[i*3] = 0.3+Math.random()*1.4; rnd[i*3+1] = 0.2+Math.random()*1.1; rnd[i*3+2] = Math.random()*6.283
    }
    const bind = (data: Float32Array, name: string, size: number) => {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); return b
    }
    const bPos = bind(pos, 'aPos', 2), bRnd = bind(rnd, 'aRnd', 3)
    const uTime = gl.getUniformLocation(prog, 'uTime'), uDpr = gl.getUniformLocation(prog, 'uDpr'), uMouse = gl.getUniformLocation(prog, 'uMouse')
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor((window.innerWidth || 1) * dpr); canvas.height = Math.floor((window.innerHeight || 1) * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform1f(uDpr, dpr)
    }
    resize(); window.addEventListener('resize', resize)

    const mouse = { x: -2, y: -2, tx: -2, ty: -2 }
    const onMove = (e: PointerEvent) => { mouse.tx = (e.clientX/window.innerWidth)*2-1; mouse.ty = -((e.clientY/window.innerHeight)*2-1) }
    if (!coarse) window.addEventListener('pointermove', onMove, { passive: true })

    const draw = (t: number) => {
      mouse.x += (mouse.tx-mouse.x)*0.08; mouse.y += (mouse.ty-mouse.y)*0.08
      gl.uniform1f(uTime, t); gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.POINTS, 0, COUNT)
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { draw(0); return () => { window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove) } }

    let raf = 0, running = true; const start = performance.now()
    const loop = () => { if (!running) return; draw((performance.now()-start)/1000); raf = requestAnimationFrame(loop) }
    draw(0); raf = requestAnimationFrame(loop)
    const onVis = () => { if (document.hidden){running=false;cancelAnimationFrame(raf)} else if(!running){running=true;raf=requestAnimationFrame(loop)} }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      running = false; cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', onVis)
      gl.deleteBuffer(bPos); gl.deleteBuffer(bRnd); gl.deleteProgram(prog)
    }
  }, [])
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
}
