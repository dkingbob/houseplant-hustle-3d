// ================================================================
// phases.js — Camera path, overlay management, per-phase logic
// ================================================================
import * as THREE from 'three';
import { camera, renderer, deskGroup, deskItems, lampLight } from './scene.js';
import {
    setPotOpacity, updateSoilPhase,
    updateSketch, hideSketch,
    updateScanLine, enableOrbit, disableOrbit, tickOrbit
} from './effects.js';

// ── Camera keyframes ─────────────────────────────────────────────
const CAM = {
    topPos:    new THREE.Vector3(0, 15, 0.6),
    topLook:   new THREE.Vector3(0, 0, 0),
    frontPos:  new THREE.Vector3(0, 2.5, 7),
    frontLook: new THREE.Vector3(0, 1.5, 0),
};
const _pos  = new THREE.Vector3();
const _look = new THREE.Vector3();

function eio(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2; }

// ── Desk item fade ───────────────────────────────────────────────
deskItems.forEach(m => {
    if (m.material) { m.material = m.material.clone(); m.material.transparent = true; }
});

function fadeDeskItems(opacity) {
    deskItems.forEach(m => {
        if (m === lampLight) { m.intensity = opacity * 3.5; return; }
        if (m.material)      { m.material.opacity = opacity; m.visible = opacity > 0.008; }
    });
}

// ── Overlay management ───────────────────────────────────────────
const OV = {};
[1,3,4,5,6,7,8].forEach(id => { OV[id] = document.getElementById(`phase-${id}`); });
const fadeEl = document.getElementById('fade-overlay');

function show(id, opacity) {
    const el = OV[id]; if (!el) return;
    const op = Math.max(0, Math.min(1, opacity));
    el.style.opacity = op;
    el.classList.toggle('hidden', op < 0.01);
    el.style.pointerEvents = op > 0.1 ? '' : 'none';
}
function hideAll() { [1,3,4,5,6,7,8].forEach(id => show(id, 0)); }

// ── Mouse parallax offset ────────────────────────────────────────
const parallax = new THREE.Vector3();

// ── Loop reset flag (read + cleared by main.js) ──────────────────
export let shouldResetLoop = false;
export function clearResetFlag() { shouldResetLoop = false; }
let _loopPending = false;

// ── Phase state tracking ─────────────────────────────────────────
let prevPhase = -1;

// ── Main phase update — called every frame ────────────────────────
export function updatePhase(vs, mnx, mny) {
    const vh    = window.innerHeight * 1.5;            // 150vh per phase
    const phase = Math.min(8, Math.floor(vs / vh));    // 0-8
    const rawT  = (vs % vh) / vh;                      // 0-1
    const t     = eio(rawT);

    // ── Camera ──────────────────────────────────────────────────
    if (phase === 7) {
        // Phase 8: OrbitControls
        enableOrbit();
        tickOrbit();
    } else {
        disableOrbit();

        if (phase === 0) {
            // Phase 1: top-down + mouse parallax
            parallax.x += (mnx * 1.6 - parallax.x) * 0.07;
            parallax.z += (mny * 0.9 - parallax.z) * 0.07;
            _pos.set(CAM.topPos.x + parallax.x, CAM.topPos.y, CAM.topPos.z + parallax.z);
            _look.copy(CAM.topLook);

        } else if (phase === 1) {
            // Phase 2: transition top-down → front
            _pos.lerpVectors(CAM.topPos, CAM.frontPos, t);
            _look.lerpVectors(CAM.topLook, CAM.frontLook, t);

        } else if (phase <= 6) {
            // Phases 3–7: front view
            _pos.copy(CAM.frontPos);
            _look.copy(CAM.frontLook);

        } else if (phase === 8) {
            // Phase 9: camera returns to top-down (behind fade overlay)
            if (prevPhase !== 8) {
                // Snap to front-view start so lerp is correct
                camera.position.copy(CAM.frontPos);
            }
            _pos.lerpVectors(CAM.frontPos, CAM.topPos, eio(rawT));
            _look.lerpVectors(CAM.frontLook, CAM.topLook, eio(rawT));
        }

        camera.position.copy(_pos);
        camera.lookAt(_look);
    }

    // ── Desk items ──────────────────────────────────────────────
    if (phase === 0)      fadeDeskItems(1);
    else if (phase === 1) fadeDeskItems(1 - t);
    else                  fadeDeskItems(0);

    // ── Phase overlays ──────────────────────────────────────────

    // Phase 1
    show(1, phase === 0 ? Math.max(0, 1 - rawT * 2.2) : 0);

    // Phase 3: front view info
    if (phase === 2)      show(3, Math.min(1, t * 2));
    else if (phase === 3) show(3, 1);
    else                  show(3, 0);

    // Phase 4: pot glass + overlay
    if (phase === 3)     { setPotOpacity(t);  show(4, Math.min(1, t * 2)); }
    else if (phase < 3)  { setPotOpacity(0);  show(4, 0); }
    else                 { setPotOpacity(1);  show(4, 0); }  // keep glass, hide overlay

    // Phase 5: soil falls + overlay
    if (phase === 4)      { updateSoilPhase(t);    show(5, Math.min(1, t * 2)); }
    else if (phase === 5) { updateSoilPhase(1);    show(5, 1); }
    else if (phase < 4)   { updateSoilPhase(0);    show(5, 0); }
    else                  { updateSoilPhase(1);    show(5, 0); }

    // Phase 6: sketch overlay (hover = mouse near plant center in screen)
    const sketchHover = Math.abs(mnx) < 0.45 && Math.abs(mny) < 0.5;
    if (phase === 5)      { updateSketch(t, sketchHover);    show(6, Math.min(1, t * 2)); }
    else if (phase === 6) { updateSketch(1, sketchHover);    show(6, 1); }
    else                  { hideSketch();                     show(6, 0); }

    // Phase 7: scan + modes — scroll-driven sweep
    if (phase === 6) {
        show(7, Math.min(1, t * 2));
        updateScanLine(Math.round(rawT * window.innerHeight), true);
    } else if (phase === 7) {
        show(7, Math.max(0, 1 - t * 2));
        updateScanLine(window.innerHeight, false);
    } else {
        show(7, 0);
        updateScanLine(0, false);
    }

    // Phase 8: free rotation
    if (phase === 7)      show(8, Math.min(1, t * 2));
    else                  show(8, 0);

    // Phase 9: loop transition
    if (phase === 8) {
        const fadeAmt = Math.min(1, rawT * 2.5);
        if (fadeEl) fadeEl.style.opacity = fadeAmt;
        if (rawT > 0.88 && !_loopPending) {
            _loopPending = true;
            shouldResetLoop = true;
            setTimeout(() => {
                if (fadeEl) {
                    fadeEl.style.transition = 'opacity 1s ease';
                    fadeEl.style.opacity = '0';
                }
                setTimeout(() => {
                    if (fadeEl) fadeEl.style.transition = '';
                    _loopPending = false;
                }, 1100);
            }, 600);
        }
    } else if (!_loopPending) {
        if (fadeEl) fadeEl.style.opacity = 0;
    }

    prevPhase = phase;
}
