# Gotchas (each one cost real time)

| Symptom | Cause | Fix |
|---|---|---|
| Blender crashes: NSException in MetalKernelPipeline::compile | Bash sandbox blocks the Metal kernel cache write | run blender with the sandbox disabled; `kernel_optimization_level="OFF"` does NOT help |
| Whole Mac crashed | 5 concurrent Cycles renders wired ~20 GB of 24 GB | `bl.sh` 2-slot queue; builders use it too |
| Animation render stops mid-shot | GPU pressure / Metal "Insufficient Memory" | `use_overwrite=False` + a retry loop resumes; for heavy shots (shape keys + image sequences) turn persistent data OFF |
| Lime/brand colour looks pastel | AgX desaturates bright saturated colours | Khronos PBR Neutral view transform |
| Ghost copy of UI text on a glass panel | decal casts a shadow / reflects inside the glass | decal: visible_shadow = glossy = transmission = False; sit it ON the face (z = t/2 + 0.006), not inside |
| Laptop screen faces the wall | lid local +z orientation | screen plane at lid z = +0.0115; hinge rotation NEGATIVE to lean back |
| Curve-filled star 14× too big | 2D curve fill + extrude/bevel mis-scales POLY outlines | build the outline as a bmesh mesh |
| Star looks like a flat cutout | bevel on thin concave arms collapses | inflated lens mesh: rings with z = h·√(1−f²) |
| Camera swings off target mid-move | euler rotation keys interpolate badly | Track-To constraint on an aim empty; key locations only |
| Burst cards invisible | they land outside the FOV close to the lens | place landing spots in screen space within the visible half-width at that depth |
| Light band missing | occluder opening misplaced | render a wide top-down diagnostic (z=9, 24 mm) to see where the band falls, then move the rig; mind image vs world axes |
| Bundled riser.mp3 "10 s build" | actually peaks at 4 s then goes silent | measure peaks yourself; never trust manifest durations |
| ffmpeg crop with a time expression fails | crop output size can't change per frame | wipe with a sliding white cover overlay instead |
| zsh `$n:l` in filter strings | zsh modifier lowercases | use `${n}` |
| NSException in MetalKernelPipeline::compile even with the sandbox OFF (Blender 5.2.2) | background kernel specialization | `prefs.kernel_optimization_level = "OFF"` before `get_devices()` fixed it (2026-10-09, acme-you wave plate) |
