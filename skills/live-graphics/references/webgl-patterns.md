# Raw-WebGL building blocks

The reusable primitives behind the `assets/` components, written out so you can
compose new effects without a framework. Raw WebGL keeps the client bundle lean
(zero new deps); reach for `three` only for real 3D scenes. Every snippet assumes
you've read `doctrine.md` — the guardrails there are not optional.

## Context setup

```js
const gl = canvas.getContext('webgl', {
  alpha: true,            // composite over the DOM behind it
  antialias: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: true, // keep frame 0 visible when rAF is paused (doctrine §2)
})
if (!gl) return // no WebGL → render nothing; never break the page
```

## Compile + link (with a warning, not a throw)

```js
function mkShader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null }
  return s
}
// link, then check gl.getProgramParameter(prog, gl.LINK_STATUS) before using
```

Return early on failure so a shader typo degrades to "no effect," never a blank
site.

## Attribute buffers

```js
function bind(gl, prog, data, name, size) {
  const b = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, name)
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
  return b
}
```

Per-particle randoms (`aRnd = [size, freq, phase]`) give each point its own
speed, twinkle rate, and offset — cheap variety that reads as "alive."

## Additive glow, soft round sprite

```js
gl.disable(gl.DEPTH_TEST)
gl.enable(gl.BLEND)
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA) // premultiplied; glows on dark ink
```
```glsl
// fragment: soft disc with a hot core, premultiplied for the ONE blend
float dd = length(gl_PointCoord - 0.5);
float a = smoothstep(0.5, 0.0, dd) * vA;
vec3 col = mix(BRAND, vec3(0.74,0.85,1.0), smoothstep(0.32, 0.0, dd));
gl_FragColor = vec4(col * a, a);
```
Keep `vA` (per-point alpha) low — additive overlaps sum toward white
(additive-blowout). Color the points so accumulation stays on-brand.

## Curl-ish drift (cheap, divergence-free-feeling)

```glsl
vec2 flow(vec2 p, float t) {
  return vec2(sin(p.y*3.0+t)*0.5 + sin(p.x*1.7-t*0.6)*0.3,
              cos(p.x*2.3-t*0.8)*0.5 + sin(p.y*1.3+t*0.4)*0.3);
}
// pos += flow(pos*1.4, uTime*0.12) * amp;  // curls instead of sliding straight
```

## Cursor wake

```glsl
vec2 d = p - uMouse;                          // uMouse in clip space
float m = clamp(1.0 - length(d)/0.3, 0.0, 1.0);
p += normalize(d + 0.0001) * m*m * 0.05;      // ease points away from the pointer
// also brighten near the cursor: vA += m * 0.3;
```
On the JS side, lerp the mouse toward its target each frame (`mouse.x += (tx-mouse.x)*0.08`)
for a smooth trail, and park it far offscreen until the first `pointermove`.
Disable pointer tracking on coarse pointers.

## Morph between two position sets (reveal)

Store `aScatter` and `aShape` (both clip-space). The shape comes from
rasterizing a `<canvas>` draw and alpha-sampling opaque pixels:

```js
const g = off.getContext('2d'); drawShape(g)            // fill white on 1200×460
const data = g.getImageData(0,0,W,H).data, pool = []
for (let y=0;y<H;y+=2) for (let x=0;x<W;x+=2)
  if (data[(y*W+x)*4+3] > 128) pool.push((x/W)*2-1, -((y/H)*2-1)*(H/W)) // aspect-preserved
```
```glsl
vec2 sh = aShape; sh.x /= uAspect; sh *= uScale;   // keep proportion on wide screens
vec2 p = mix(aScatter + drift, sh, uProgress);      // uProgress 0→1 = dust→shape
```

## Resize & aspect-fit

```js
const resize = () => {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight
  canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr)
  gl.viewport(0,0,canvas.width,canvas.height)
  gl.uniform1f(uDpr, dpr); gl.uniform1f(uAspect, w/h)
  // aspect-independent shape sizing: fills ~82% width at true proportion, any viewport
  gl.uniform1f(uScale, Math.min(1.45, Math.max(0.34, 0.82 * (w/h))))
}
```
Guard against `0` dimensions (`|| innerWidth`) so the frozen preview pane can't
produce a `0×0` buffer that silently draws nothing.

## Loop, pause, cleanup

```js
let raf = 0, running = true
const start = performance.now()
const loop = () => { if (!running) return; readScroll(); draw((performance.now()-start)/1000); raf = requestAnimationFrame(loop) }
draw(0); raf = requestAnimationFrame(loop)                 // draw frame 0 immediately
const onVis = () => { if (document.hidden){running=false;cancelAnimationFrame(raf)} else if(!running){running=true;raf=requestAnimationFrame(loop)} }
document.addEventListener('visibilitychange', onVis)
// prefers-reduced-motion → draw(0) once and return (no loop)
return () => { running=false; cancelAnimationFrame(raf); /* remove listeners; delete buffers + program */ }
```
React StrictMode double-invokes effects in dev (mount → cleanup → mount); the
cleanup above must fully tear down or you leak WebGL contexts (browsers cap ~16).
