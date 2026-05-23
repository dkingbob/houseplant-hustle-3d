# Houseplant Hustle 3D — Progress

## Overview
Satirical product page for an AI-optimized houseplant. Persistent 3D scene (Three.js) always behind all overlays. Scroll drives 9 phases. Reference: oryzo.ai.

## Files
- `index.html` — HTML: canvas, phase overlays (1, 3-8), scan line, fade overlay, importmap
- `styles.css` — All CSS: overlays, stats, mode buttons, CTA, testimonials
- `scene.js` — Three.js core: renderer, scene, camera, desk primitives, GLB, soil particles
- `effects.js` — Visual FX: sketch overlay, material modes (thermal/xray/wireframe), OrbitControls, soil physics
- `phases.js` — Phase logic: camera paths, overlay management, all phase transitions
- `main.js` — RAF loop, virtual scroll, rubber text, paint blobs, loop reset

## Effects Used
- **Virtual smooth scroll** — lerp (9.5%/frame) via scroll phantom
- **Camera parallax** — mouse shifts camera X/Z in Phase 1
- **Camera path** — top-down → front-view transition driven by Phase 2 scroll
- **Rubber text** — spring simulation on hero headline (Phase 1)
- **Paint blobs** — orange radial-gradient ellipses on mousemove over text (all phases)
- **Desk item fade** — deskItems[] opacity → 0 through Phase 2
- **Pot glass** — MeshStandardMaterial opacity/roughness lerp in Phase 4
- **Soil particle physics** — THREE.Points, scroll-driven deterministic gravity (Phase 5)
- **Pencil sketch overlay** — EdgesGeometry(merged, 20°) + LineBasicMaterial, brown→green on hover (Phase 6)
- **Plant glow** — PointLight at plant center activates on sketch hover
- **Material modes** — Standard / Thermal (height-based ShaderMaterial) / X-Ray (transparent emissive) / Wireframe (MeshBasicMaterial) in Phase 7
- **Scan line** — CSS div with green gradient, transforms with mouseY (Phase 7)
- **OrbitControls** — Three.js addon, Phase 8 only
- **Loop transition** — Fade overlay (Phase 9) + scroll reset to 0 + CSS fade-out

## Design Style
- Warm desk: amber key light + cool fill + lamp PointLight; dark walnut desk
- Colored desk items: orange mug, cobalt notebook, gold pen, cream papers, emerald phone, amber lamp
- Terracotta pot, dark soil top
- Phase 1: warm overall, hero text left-aligned
- Phase 3+: dark background, text overlays left or right of plant
- Orange (#E87722) and green (#3DBA5E) as accent colors

## Storyboard Phases
1. **DESK TOP-DOWN** — Camera above desk, plant + primitives, hero text, mouse parallax ✅
2. **CAMERA TRANSITION** — Top-down → front-view, desk fades ✅
3. **FRONT VIEW + INFO** — Plant hero, stat grid overlay (left) ✅
4. **POT DISSOLVES** — Pot becomes glass, overlay right ✅
5. **SOIL FALLS AWAY** — Particles, bare roots, overlay left ✅
6. **SKETCH OVERLAY** — EdgesGeometry sketch behind plant, hover = green glow, overlay right ✅
7. **SCAN & MODES** — Green scan line follows mouseY, mode buttons ✅
8. **FREE ROTATION** — OrbitControls, CTA + testimonials right ✅
9. **LOOP TRANSITION** — Fade to dark, scroll reset, fade-in reveals Phase 1 ✅

## Technical Rules
- Three.js r160 via CDN importmap (GLTFLoader, OrbitControls, BufferGeometryUtils)
- Canvas: position fixed, z-index 1; overlays: z-index 10; paint canvas: z-index 20; fade: z-index 50
- Only transform + opacity animated; no layout reflows
- GLB auto-scaled to 3 world units max; seated on soil top
- Shadow map 2048×2048 PCF soft; ACES filmic tonemapping
- Soil particles: deterministic scroll-driven physics (position = init + vel*t - g*t²)
- Material clones per mesh for safe mode-switching

## Recent Changes
- **Plant positioning fix** — Removed bounding-box X/Z centering; plant now uses GLB's own origin (stem at 0,0), keeping Y seating at soil level (0.94 - b2.min.y)
- **Orange trail removed** — Deleted all paint-blob code (paintCanvas, emitBlob, trackPaint, drawBlobs), removed `#paint-canvas` from HTML
- **Text animations restored** — Added Google Fonts (Syne + DM Sans). Hero headline uses `.lw span` curtain-reveal (slide-up per line). All body/label text uses `.rv` (fade+translateY) or `.rf` (opacity-only). Staggered via JS setTimeout. Phase overlays 3–8 all use same pattern, triggered on first scroll-arrival.
- **Font upgrade** — Syne for all headlines and stat values; DM Sans for body copy
- **Hover effect** — Text elements use `filter: brightness(1.2)` on hover instead of glow

## Pending
- Scroll-driven scan line (Phase 7) — currently mouse-Y driven; should sweep via scroll progress
- Site pacing — increase scroll distance per phase (currently 100vh each; consider 150–200vh)
- Overall polish pass

## Current Status
**All 9 phases implemented + polish round 1 applied.** Commit and deploy when ready.
