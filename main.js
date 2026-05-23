// ================================================================
// main.js — RAF loop, virtual scroll, rubber text, paint blobs
// ================================================================
import { renderFrame } from './scene.js';
import { setMode }     from './effects.js';
import { updatePhase, shouldResetLoop, clearResetFlag } from './phases.js';

// ── Scroll state (exported so phases.js loop-reset can read it) ──
const scroll = { current: 0, target: 0 };
const mouse  = { x: 0, y: 0, nx: 0, ny: 0 };

window.addEventListener('scroll', () => { scroll.target = window.scrollY; }, { passive: true });

window.addEventListener('mousemove', (e) => {
    mouse.x  = e.clientX; mouse.y  = e.clientY;
    mouse.nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.ny = (e.clientY / window.innerHeight - 0.5) * 2;
    trackPaint(e);
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

// ── Paint blobs ─────────────────────────────────────────────────
const paintCanvas = document.getElementById('paint-canvas');
const pCtx = paintCanvas.getContext('2d');
function sizePaint() { paintCanvas.width = window.innerWidth; paintCanvas.height = window.innerHeight; }
sizePaint();
window.addEventListener('resize', sizePaint);

const BLOB_LIFE = 680;
const blobs = [];
let lastEmit = 0, lastMX = 0, lastMY = 0, overText = false;

document.querySelectorAll(
    '.eyebrow,.headline,.subline,.tagline,.phase-title,.phase-body,.phase-label,.stat-val,.stat-key'
).forEach(el => {
    el.addEventListener('mouseenter', () => { overText = true; });
    el.addEventListener('mouseleave', () => { overText = false; });
});

function emitBlob(x, y, vx, vy) {
    const spd = Math.sqrt(vx * vx + vy * vy);
    const r   = 16 + Math.random() * 26;
    blobs.push({
        x, y,
        rx: r * (1 + spd * 0.04), ry: r * 0.55,
        angle: Math.atan2(vy, vx),
        peak:  0.65 + Math.random() * 0.35,
        birth: performance.now()
    });
}

function trackPaint(e) {
    if (!overText) return;
    const now = performance.now();
    if (now - lastEmit < 38) return;
    const vx = e.clientX - lastMX, vy = e.clientY - lastMY;
    if (Math.abs(vx) + Math.abs(vy) < 2) return;
    emitBlob(e.clientX, e.clientY, vx, vy);
    lastEmit = now; lastMX = e.clientX; lastMY = e.clientY;
}

function drawBlobs(now) {
    pCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i], age = now - b.birth;
        if (age >= BLOB_LIFE) { blobs.splice(i, 1); continue; }
        const t = age / BLOB_LIFE;
        const alpha = b.peak * (t < 0.15 ? t / 0.15 : 1 - ((t - 0.15) / 0.85) ** 1.6);
        pCtx.save();
        pCtx.translate(b.x, b.y); pCtx.rotate(b.angle);
        const g = pCtx.createRadialGradient(0, 0, 0, 0, 0, b.rx);
        g.addColorStop(0,   `rgba(232,119,34,${alpha})`);
        g.addColorStop(0.5, `rgba(210,90,15,${alpha * 0.7})`);
        g.addColorStop(1,   'rgba(190,60,0,0)');
        pCtx.fillStyle = g;
        pCtx.beginPath(); pCtx.ellipse(0, 0, b.rx, b.ry, 0, 0, Math.PI * 2); pCtx.fill();
        pCtx.restore();
    }
}

// ── Mode buttons ─────────────────────────────────────────────────
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setMode(btn.dataset.mode);
    });
});

// ── Phase 1 reveal ──────────────────────────────────────────────
const revealEls = document.querySelectorAll('.eyebrow,.headline,.subline,.tagline,.scroll-hint');
let revealed = false;

function revealPhase1() {
    if (revealed) return; revealed = true;
    revealEls.forEach(el => el.classList.add('in'));
    setTimeout(() => {
        if (headline) { headline.classList.add('rubber-ready'); rubberReady = true; }
    }, 860);
}

// ── RAF loop ────────────────────────────────────────────────────
function tick(now) {
    requestAnimationFrame(tick);

    // Lerp virtual scroll
    scroll.current += (scroll.target - scroll.current) * 0.095;

    // Handle loop-back from Phase 9
    if (shouldResetLoop) {
        clearResetFlag();
        window.scrollTo({ top: 0, behavior: 'instant' });
        scroll.current = 0;
        scroll.target  = 0;
    }

    // Phase update — handles camera, overlays, effects each frame
    updatePhase(scroll.current, mouse.nx, mouse.ny, mouse.y);

    // Rubber text (Phase 1 only)
    const phase = Math.min(8, Math.floor(scroll.current / window.innerHeight));
    if (phase === 0) stepRubber();

    // Paint blobs
    drawBlobs(now);

    // Render Three.js
    renderFrame();
}

// ── Boot ────────────────────────────────────────────────────────
setTimeout(revealPhase1, 750);
requestAnimationFrame(tick);
