/**
 * Fetch photoscanned CC0 models (PolyHaven) — real-life geometry for the
 * cave floors. Downloads each model's glTF + bin + textures preserving
 * relative paths into public/models/<slug>/. Build-time only.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SLUGS = ['moon_rock_01', 'moon_rock_04', 'boulder_01']
const RES = '1k' // fallback 2k

const get = async (url) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return Buffer.from(await r.arrayBuffer())
}

for (const slug of SLUGS) {
  try {
    const files = await (await fetch(`https://api.polyhaven.com/files/${slug}`)).json()
    const entry = files.gltf?.[RES] ?? files.gltf?.['2k']
    if (!entry) {
      console.log(`✗ ${slug}: no gltf`)
      continue
    }
    const g = entry.gltf
    const outDir = join(process.cwd(), 'public/models', slug)
    mkdirSync(outDir, { recursive: true })
    const gltfName = g.url.split('/').pop()
    writeFileSync(join(outDir, gltfName), await get(g.url))
    let bytes = g.size
    for (const [rel, inc] of Object.entries(g.include ?? {})) {
      const p = join(outDir, rel)
      mkdirSync(dirname(p), { recursive: true })
      writeFileSync(p, await get(inc.url))
      bytes += inc.size
    }
    console.log(`✓ ${slug} (${gltfName}, ${Math.round(bytes / 1024)}KB)`)
  } catch (e) {
    console.log(`✗ ${slug}: ${e.message}`)
  }
}
