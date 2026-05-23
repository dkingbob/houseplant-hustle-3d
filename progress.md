# Houseplant Hustle 3D — Progress

## Overview
Satirical product page for an AI-optimized houseplant. Persistent 3D scene (Three.js) always visible behind all overlays. Scroll drives the entire experience through 9 phases. Reference: oryzo.ai.

## Effects Used
- **Virtual smooth scroll** — lerp + requestAnimationFrame, scroll.current follows scroll.target at 9.5% per frame
- **Camera parallax** — mouse position shifts camera X/Z subtly; lookAt(0,0,0) keeps focus on plant
- **Rubber text** — spring simulation (stiffness 0.09, damping 0.76) on hero headline; translates + skews toward cursor
- **Paint blobs** — 2D canvas overlay; orange radial-gradient ellipses emitted on mousemove over text; fade via quadratic curve over 680ms
- **Mask reveal** — headline uses overflow:hidden wrapper + translateY slide-up reveal
- **Staggered reveal** — eyebrow, headline, subline, tagline, scroll-hint all fade/slide in with increasing delays

## Design Style
- Warm desk lighting: amber directional key light + cool fill + lamp point light
- Dark walnut desk surface, colorful objects (orange mug, cobalt notebook, gold pen, cream papers, emerald phone, amber lamp)
- Terracotta pot with dark soil top
- Hero text left-aligned, white on dark, orange accent color (#E87722), green accent (#3DBA5E)
- Background: deep warm dark #18100A

## Storyboard Phases
1. **DESK TOP-DOWN** — Camera above dark wooden desk; plant + colored primitives; hero text overlay; mouse parallax ✅
2. **CAMERA TRANSITION** — Scroll rotates camera from top-down to front-facing; desk items fade
3. **FRONT VIEW + INFO** — Plant as viewport hero; info stat overlays slide in
4. **POT DISSOLVES** — Terracotta pot becomes glass-like; roots/soil visible
5. **SOIL FALLS AWAY** — Pot gone; particle soil crumble; floating roots
6. **SKETCH OVERLAY** — Brown/tan pencil sketch behind plant; hover turns green + glows (drafting table effect)
7. **SCAN & MODES** — Vertical scan line follows mouse; Standard/Thermal/X-Ray/Wireframe toggles
8. **FREE ROTATION** — OrbitControls; CTA button + testimonials
9. **LOOP TRANSITION** — Spiral/fade back to Phase 1

## Technical Rules
- Three.js r160 via CDN (importmap)
- No HTML sections — 3D canvas always the background (position: fixed, z-index 1)
- Text/UI as CSS overlays (z-index 10), paint canvas on top (z-index 20)
- Only transform and opacity animated — no layout reflows
- GLB auto-scaled to 3 world units max dimension; centered on pot
- Shadow map: 2048×2048 PCF soft; ACES filmic tone mapping
- will-change: transform on all animated elements

## Current Status
**Phase 1 complete.** All files written and committed. Vercel deployment triggered.
