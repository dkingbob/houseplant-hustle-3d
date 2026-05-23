// ================================================================
// main.js — RAF loop, virtual scroll, rubber text, phase reveals
// ================================================================
import { renderFrame } from './scene.js';
import { setMode }     from './effects.js';
import { updatePhase, shouldResetLoop, clearResetFlag } from './phases.js';

// ── Scroll state ─────────────────────────────────────────────────
const scroll = { current: 0, target: 0 };
const mouse  = { x: 0, y: 0, nx: 0, ny: 0 };

window.addEventListener('scroll', () => { scroll.target = window.scrollY; }, { passive: true });

window.addEventListener('mousemove', (e) => {
    mouse.x  = e.clientX; mouse.y  = e.clientY;
    mouse.nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.ny = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ── Rubber text spring ───────────────────────────────────────────
const headline = document.getElementById('js-rubber');
let rubberReady = false;
const sp = { x: 0, y: 0, vx: 0, vy: 0 };

function stepRubber() {
    if (!headline || !rubberReady) return;
    const r  = headline.getBoundingClientRect();
    const cx = r.left + r.width * 0.5, cy = r.top + r.height * 0.5;
    const tx = (mouse.x - cx) * 0.032, ty = (mouse.y - cy) * 0.022;
    sp.vx = (sp.vx + (tx - sp.x) * 0.09) * 0.76;
    sp.vy = (sp.vy + (ty - sp.y) * 0.09) * 0.76;
    sp.x += sp.vx; sp.y += sp.vy;
    headline.style.transform =
        `translate(${sp.x.toFixed(2)}px,${sp.y.toFixed(2)}px) skewX(${(sp.x * 0.22).toFixed(2)}deg)`;
}

// ── Mode buttons ─────────────────────────────────────────────────
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setMode(btn.dataset.mode);
    });
});

// ── Phase reveal system ───────────────────────────────────────────
const revealedPhases = new Set();

function triggerReveal(container) {
    if (!container) return;
    const spans = container.querySelectorAll('.lw > span');
    const rvs   = container.querySelectorAll('.rv, .rf');
    spans.forEach((s, i) => setTimeout(() => s.classList.add('in'), i * 120));
    rvs.forEach((r, i)   => setTimeout(() => r.classList.add('in'), spans.length * 120 + i * 100));
}

function phaseReveal(overlayId) {
    if (revealedPhases.has(overlayId)) return;
    revealedPhases.add(overlayId);
    triggerReveal(document.getElementById(`phase-${overlayId}`));
}

// ── Phase 1 reveal ──────────────────────────────────────────────
let revealed = false;

function revealPhase1() {
    if (revealed) return; revealed = true;
    triggerReveal(document.getElementById('phase-1'));
    // Enable rubber spring after intro animation completes
    setTimeout(() => { rubberReady = true; }, 900);
}

// ── RAF loop ────────────────────────────────────────────────────
function tick(now) {
    requestAnimationFrame(tick);

    scroll.current += (scroll.target - scroll.current) * 0.095;

    if (shouldResetLoop) {
        clearResetFlag();
        window.scrollTo({ top: 0, behavior: 'instant' });
        scroll.current = 0;
        scroll.target  = 0;
    }

    updatePhase(scroll.current, mouse.nx, mouse.ny, mouse.y);

    const ph = Math.min(8, Math.floor(scroll.current / window.innerHeight));
    if (ph === 0) stepRubber();

    // Trigger per-phase reveals on first arrival
    if (ph >= 2) phaseReveal(3);
    if (ph >= 3) phaseReveal(4);
    if (ph >= 4) phaseReveal(5);
    if (ph >= 5) phaseReveal(6);
    if (ph >= 7) phaseReveal(8);

    renderFrame();
}

// ── Boot ────────────────────────────────────────────────────────
setTimeout(revealPhase1, 750);
requestAnimationFrame(tick);
