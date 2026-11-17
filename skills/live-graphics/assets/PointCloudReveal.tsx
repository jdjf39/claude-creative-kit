import { useEffect, useRef } from 'react'

/* ============================================================================
   PointCloudReveal — scroll-assembled point cloud (drop-in template).

   A pinned section where ~N brand-tint points scatter as dust, converge into a
   SHAPE as you scroll through, hold, then disperse on the way out. Raw WebGL,
   zero deps, no art assets — the shape is rasterized from a <canvas> draw.

   Make it yours:
   - Pass a `draw(ctx, W, H)` that fills white on a WxH canvas (default: a
     pickup). Swap it for an SUV, a logo path, or ctx.fillText('BRAND', …).
     The sampling + morph are shape-agnostic.
   - Pass kicker/title/body — these render as REAL DOM (SEO + a11y), not points.
   - Swap BRAND for your accent (linear rgb 0..1).

   Doctrine (see references/doctrine.md):
   - Static default is the ASSEMBLED shape (progress=1) + preserveDrawingBuffer,
     so a paused/hidden tab shows the payoff, not dust.
   - Scroll progress from getBoundingClientRect (fires in hidden tabs); render
     via rAF. Reduced-motion → one assembled frame. DPR cap, count scales, pause
     on hide, size-to-width at true proportion on any viewport.
   ==========================================================================*/

const BRAND = 'vec3(0.18, 0.42, 1.0)' // ← your accent (sapphire #2E6BFF)
const SHAPE_W = 1200, SHAPE_H = 460    // shape canvas; aspect ≈ 2.6:1

type Props = {
  id?: string
  kicker?: string
  title?: string
  body?: string
  count?: number                                   // desktop point count
  draw?: (ctx: CanvasRenderingContext2D, W: number, H: number) => void
}

// Default shape: a crew-cab pickup, facing right, filled white.
function drawTruck(g: CanvasRenderingContext2D) {
  g.clearRect(0, 0, SHAPE_W, SHAPE_H); g.fillStyle = '#fff'
  const FWx = 336, RWx = 936, Wy = 322, WR = 62
  g.beginPath()
  g.moveTo(138,306); g.lineTo(138,258); g.lineTo(180,246); g.lineTo(470,238)
  g.lineTo(556,170); g.lineTo(762,167); g.lineTo(796,238); g.lineTo(1078,238)
  g.lineTo(1084,306); g.closePath(); g.fill()
  g.beginPath(); g.arc(FWx,Wy,WR,0,Math.PI*2); g.fill()
  g.beginPath(); g.arc(RWx,Wy,WR,0,Math.PI*2); g.fill()
  g.globalCompositeOperation = 'destination-out'
  g.beginPath(); g.moveTo(566,182); g.lineTo(650,182); g.lineTo(650,230); g.lineTo(520,230); g.closePath(); g.fill()
  g.beginPath(); g.moveTo(668,182); g.lineTo(752,182); g.lineTo(752,230); g.lineTo(668,230); g.closePath(); g.fill()
  g.beginPath(); g.arc(FWx,306,76,Math.PI,Math.PI*2); g.fill()
  g.beginPath(); g.arc(RWx,306,76,Math.PI,Math.PI*2); g.fill()
  g.globalCompositeOperation = 'source-over'
  g.lineWidth = 22; g.strokeStyle = '#fff'
  g.beginPath(); g.arc(FWx,Wy,50,0,Math.PI*2); g.stroke()
  g.beginPath(); g.arc(RWx,Wy,50,0,Math.PI*2); g.stroke()
}

const VERT = `
attribute vec2 aScatter; attribute vec2 aShape; attribute vec3 aRnd;
uniform float uProgress, uTime, uAspect, uScale, uDpr; uniform vec2 uMouse;
varying float vA;
vec2 flow(vec2 p, float t){
  return vec2(sin(p.y*3.0+t)*0.5+sin(p.x*1.7-t*0.6)*0.3, cos(p.x*2.3-t*0.8)*0.5+sin(p.y*1.3+t*0.4)*0.3);
}
void main(){
  float m = uProgress;
  float tw = 0.55 + 0.45*sin(uTime*aRnd.y*2.0 + aRnd.z*3.0);
  vec2 sc = aScatter + flow(aScatter*1.4, uTime*0.12)*0.05;
  vec2 sh = aShape; sh.x /= uAspect; sh *= uScale;
  sh += vec2(sin(uTime*aRnd.y+aRnd.z), cos(uTime*aRnd.y*0.9+aRnd.z))*0.003;
  vec2 p = mix(sc, sh, m);
  vec2 d = p - uMouse; float mm = clamp(1.0 - length(d)/0.28, 0.0, 1.0);
  p += normalize(d+0.0001)*mm*mm*0.05;
  vA = mix(0.10+0.20*tw, 0.55+0.40*tw, m) + mm*0.30;
  gl_PointSize = (1.0 + 1.7*aRnd.x + m*0.7) * uDpr;
  gl_Position = vec4(p, 0.0, 1.0);
}`

const FRAG = `
precision mediump float; varying float vA;
void main(){
  float dd = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5,0.0,dd)*vA;
  vec3 col = mix(${BRAND}, vec3(0.74,0.85,1.0), smoothstep(0.32,0.0,dd));
  gl_FragColor = vec4(col*a, a);
}`

const compile = (gl: WebGLRenderingContext, t: number, src: string) => {
  const s = gl.createShader(t)!; gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('PointCloudReveal:', gl.getShaderInfoLog(s)); return null }
  return s
}
const ease = (t: number) => { t = Math.min(1, Math.max(0, t)); return t*t*t*(t*(t*6-15)+10) }

export function PointCloudReveal({
  id = 'brand',
  kicker = 'Built from the ground up',
  title = 'Every detail, examined to the last point.',
  body = 'Scroll — watch it come together.',
  count = 8500,
  draw = drawTruck,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current, track = trackRef.current
    if (!canvas || !track) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true })
    if (!gl) return
    const vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return
    const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    // rasterize shape → sample opaque pixels into targets (nudged up for caption room)
    const off = document.createElement('canvas'); off.width = SHAPE_W; off.height = SHAPE_H
    const g2 = off.getContext('2d')!; draw(g2, SHAPE_W, SHAPE_H)
    const img = g2.getImageData(0, 0, SHAPE_W, SHAPE_H).data; const pool: number[] = []
    for (let y = 0; y < SHAPE_H; y += 2) for (let x = 0; x < SHAPE_W; x += 2)
      if (img[(y*SHAPE_W+x)*4+3] > 128) pool.push((x/SHAPE_W)*2-1, -((y/SHAPE_H)*2-1)*(SHAPE_H/SHAPE_W) + 0.16)

    const coarse = window.matchMedia('(pointer: coarse)').matches
    const COUNT = coarse ? Math.round(count * 0.45) : count
    const scatter = new Float32Array(COUNT*2), shape = new Float32Array(COUNT*2), rnd = new Float32Array(COUNT*3)
    const pairs = pool.length/2
    for (let i = 0; i < COUNT; i++) {
      const s = Math.floor(Math.random()*pairs)*2
      shape[i*2] = pool[s]; shape[i*2+1] = pool[s+1]
      const ang = Math.random()*Math.PI*2, rad = 0.4+Math.random()*0.9
      scatter[i*2] = Math.cos(ang)*rad; scatter[i*2+1] = Math.sin(ang)*rad*0.7
      rnd[i*3] = Math.random(); rnd[i*3+1] = 0.2+Math.random()*1.1; rnd[i*3+2] = Math.random()*6.283
    }
    const bind = (data: Float32Array, name: string, size: number) => {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); return b
    }
    const bA = bind(scatter,'aScatter',2), bB = bind(shape,'aShape',2), bR = bind(rnd,'aRnd',3)
    const U = (n: string) => gl.getUniformLocation(prog, n)
    const uProgress = U('uProgress'), uTime = U('uTime'), uAspect = U('uAspect'), uScale = U('uScale'), uDpr = U('uDpr'), uMouse = U('uMouse')
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth || window.innerWidth || 1, h = canvas.clientHeight || window.innerHeight || 1
      canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(uDpr, dpr); gl.uniform1f(uAspect, w/h)
      gl.uniform1f(uScale, Math.min(1.45, Math.max(0.34, 0.82 * (w/h)))) // ~82% width, true proportion, any viewport
    }
    resize(); window.addEventListener('resize', resize)

    const mouse = { x: -2, y: -2, tx: -2, ty: -2 }
    const onMove = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); mouse.tx = ((e.clientX-r.left)/r.width)*2-1; mouse.ty = -(((e.clientY-r.top)/r.height)*2-1) }
    if (!coarse) window.addEventListener('pointermove', onMove, { passive: true })

    let progress = 1 // assembled by default (static / no-JS safe)
    const readScroll = () => {
      const r = track.getBoundingClientRect(); const scrollable = r.height - window.innerHeight
      const p = scrollable > 4 ? Math.min(Math.max(-r.top/scrollable, 0), 1) : 1
      progress = p < 0.42 ? ease(p/0.42) : p < 0.68 ? 1 : 1 - ease((p-0.68)/0.28) // dust → truck → dust
    }
    const drawFrame = (t: number) => {
      mouse.x += (mouse.tx-mouse.x)*0.09; mouse.y += (mouse.ty-mouse.y)*0.09
      gl.uniform1f(uProgress, progress); gl.uniform1f(uTime, t); gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.POINTS, 0, COUNT)
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      progress = 1; drawFrame(0)
      return () => { window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove) }
    }
    let raf = 0, running = true; const start = performance.now()
    const loop = () => { if (!running) return; readScroll(); drawFrame((performance.now()-start)/1000); raf = requestAnimationFrame(loop) }
    readScroll(); drawFrame(0)
    const onScroll = () => readScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    raf = requestAnimationFrame(loop)
    const onVis = () => { if (document.hidden){running=false;cancelAnimationFrame(raf)} else if(!running){running=true;raf=requestAnimationFrame(loop)} }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      running = false; cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis)
      gl.deleteBuffer(bA); gl.deleteBuffer(bB); gl.deleteBuffer(bR); gl.deleteProgram(prog)
    }
  }, [draw])

  return (
    <section id={id} ref={trackRef} className="relative h-[230vh]">
      <div className="sticky top-0 h-[100svh] min-h-[600px] overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(6,8,12,0.4),#06080c_78%)]" />
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-[7%] mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          {kicker && <p className="mb-4 font-mono text-xs uppercase tracking-wider text-white/50">{kicker}</p>}
          {title && <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">{title}</h2>}
          {body && <p className="mt-5 max-w-md text-white/70">{body}</p>}
        </div>
      </div>
    </section>
  )
}
