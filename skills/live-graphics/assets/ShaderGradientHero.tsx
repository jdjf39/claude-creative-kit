import { useEffect, useRef } from 'react'

/* ============================================================================
   ShaderGradientHero — flowing fragment-shader gradient (drop-in template).

   A full-bleed animated gradient: domain-warped fbm noise mixing 2–3 brand
   colors, drifting on time, with a gentle mouse parallax. The real version of a
   CSS @keyframes aurora — no video, no image, loads instantly. Raw WebGL,
   zero deps. Put your DOM hero content (headline, CTAs) in a `relative z-10`
   layer ON TOP of this.

   Make it yours: edit COL_A / COL_B / COL_C (linear rgb 0..1).

   Doctrine (see references/doctrine.md):
   - Frame 0 already draws a calm gradient (visible-by-default) and
     preserveDrawingBuffer keeps it when rAF is paused.
   - prefers-reduced-motion → one static frame. DPR capped (fill-rate is the
     only cost here — geometry is a single triangle). Pauses on tab hide.
   ==========================================================================*/

const COL_A = 'vec3(0.02, 0.03, 0.06)'  // deep ink
const COL_B = 'vec3(0.11, 0.28, 0.85)'  // brand mid (sapphire)
const COL_C = 'vec3(0.36, 0.55, 1.00)'  // brand light

const VERT = `
attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos*0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime, uAspect; uniform vec2 uMouse;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y);
}
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }
void main(){
  vec2 uv = vUv; uv.x *= uAspect;
  float t = uTime * 0.05;
  vec2 mo = (uMouse * 0.5 + 0.5) * 0.25;
  // domain warp: fbm of fbm gives smooth, organic flow
  vec2 q = vec2(fbm(uv*2.0 + t + mo), fbm(uv*2.0 + vec2(5.2,1.3) - t));
  float n = fbm(uv*3.0 + q*1.6);
  vec3 col = mix(${COL_A}, ${COL_B}, smoothstep(0.15, 0.85, n));
  col = mix(col, ${COL_C}, smoothstep(0.55, 1.0, fbm(uv*1.5 - t + q)) * 0.55);
  // vignette so edges settle into the ink
  float d = distance(vUv, vec2(0.5));
  col *= smoothstep(0.95, 0.35, d) * 0.85 + 0.15;
  gl_FragColor = vec4(col, 1.0);
}`

const compile = (gl: WebGLRenderingContext, t: number, src: string) => {
  const s = gl.createShader(t)!; gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('ShaderGradientHero:', gl.getShaderInfoLog(s)); return null }
  return s
}

export function ShaderGradientHero({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, preserveDrawingBuffer: true })
    if (!gl) return
    const vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return
    const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    // fullscreen triangle
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    const uTime = gl.getUniformLocation(prog, 'uTime'), uAspect = gl.getUniformLocation(prog, 'uAspect'), uMouse = gl.getUniformLocation(prog, 'uMouse')

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth || window.innerWidth || 1, h = canvas.clientHeight || window.innerHeight || 1
      canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr)
      gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform1f(uAspect, w/h)
    }
    resize(); window.addEventListener('resize', resize)

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); mouse.tx = ((e.clientX-r.left)/r.width)*2-1; mouse.ty = -(((e.clientY-r.top)/r.height)*2-1) }
    window.addEventListener('pointermove', onMove, { passive: true })

    const draw = (t: number) => {
      mouse.x += (mouse.tx-mouse.x)*0.05; mouse.y += (mouse.ty-mouse.y)*0.05
      gl.uniform1f(uTime, t); gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(0); return () => { window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove) }
    }
    let raf = 0, running = true; const start = performance.now()
    const loop = () => { if (!running) return; draw((performance.now()-start)/1000); raf = requestAnimationFrame(loop) }
    draw(0); raf = requestAnimationFrame(loop)
    const onVis = () => { if (document.hidden){running=false;cancelAnimationFrame(raf)} else if(!running){running=true;raf=requestAnimationFrame(loop)} }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      running = false; cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', onVis)
      gl.deleteBuffer(buf); gl.deleteProgram(prog)
    }
  }, [])
  return <canvas ref={ref} aria-hidden className={`absolute inset-0 h-full w-full ${className}`} />
}
