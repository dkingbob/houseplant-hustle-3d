// ================================================================
// main.js — RAF loop, virtual scroll, rubber text, paint blobs
// ================================================================
import { renderFrame, updateCameraParallax } from './scene.js';

// ── State ───────────────────────────────────────────────────────
const scroll = { current: 0, target: 0 };
const mouse  = { x: 0, y: 0, nx: 0, ny: 0 };

// ── Virtual scroll ──────────────────────────────────────────────
window.addEventListener('scroll', () => {
    scroll.target = window.scrollY;
}, { passive: true });

// ── Mouse tracking ──────────────────────────────────────────────
window.addEventListener('mousemove', (e) => {
    mouse.x  = e.clientX;
    mouse.y  = e.clientY;
    mouse.nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.ny = (e.clientY / window.innerHeight - 0.5) * 2;
    trackPaint(e);
});

// ── Phase 1 overlay ─────────────────────────────────────────────
const phase1El = document.getElementById('phase-1');

function setPhase1Opacity(t) {
    if (!phase1El) return;
    const clamped = Math.max(0, Math.min(1, t));
    phase1El.style.opacity = 1 - clamped;
    phase1El.style.pointerEvents = clamped > 0.96 ? 'none' : '';
}

// ── Rubber text — spring simulation ─────────────────────────────
const headline = document.getElementById('js-rubber');
let rubberReady = false;
const spring = { x: 0, y: 0, vx: 0, vy: 0 };
const STIFFNESS = 0.09;
const DAMPING   = 0.76;

function stepRubber() {
    if (!headline || !rubberReady) return;

    const rect = headline.getBoundingClientRect();
    const cx = rect.left + rect.width  * 0.5;
    const cy = rect.top  + rect.height * 0.5;

    const tx = (mouse.x - cx) * 0.032;
    const ty = (mouse.y - cy) * 0.022;

    spring.vx = (spring.vx + (tx - spring.x) * STIFFNESS) * DAMPING;
    spring.vy = (spring.vy + (ty - spring.y) * STIFFNESS) * DAMPING;
    spring.x  += spring.vx;
    spring.y  += spring.vy;

    headline.style.transform =
        `translate(${spring.x.toFixed(2)}px, ${spring.y.toFixed(2)}px)` +
        ` skewX(${(spring.x * 0.22).toFixed(2)}deg)`;
}

// ── Paint blobs ─────────────────────────────────────────────────
const paintCanvas = document.getElementById('paint-canvas');
const pCtx = paintCanvas.getContext('2d');

function resizePaintCanvas() {
    paintCanvas.width  = window.innerWidth;
    paintCanvas.height = window.innerHeight;
}
resizePaintCanvas();
window.addEventListener('resize', resizePaintCanvas);

const BLOB_LIFE = 680;  // ms each blob lives
const blobs = [];

let lastEmit = 0;
let lastMX   = 0;
let lastMY   = 0;
let overText = false;

// Listen for hover on all text elements in the hero block
document.querySelectorAll('.eyebrow, .headline, .subline, .tagline').forEach(el => {
    el.addEventListener('mouseenter', () => { overText = true; });
    el.addEventListener('mouseleave', () => { overText = false; });
});

function emitBlob(x, y, vx, vy) {
    const speed  = Math.sqrt(vx * vx + vy * vy);
    const angle  = Math.atan2(vy, vx);
    const radius = 18 + Math.random() * 26;
    blobs.push({
        x, y,
        rx: radius * (1 + speed * 0.04),   // stretch in direction of motion
        ry: radius * 0.55,
        angle,
        peak: 0.7 + Math.random() * 0.3,
        birth: performance.now()
    });
}

function trackPaint(e) {
    if (!overText) return;
    const now = performance.now();
    if (now - lastEmit < 38) return;

    const vx = e.clientX - lastMX;
    const vy = e.clientY - lastMY;
    if (Math.abs(vx) + Math.abs(vy) < 2) return;

    emitBlob(e.clientX, e.clientY, vx, vy);
    lastEmit = now;
    lastMX = e.clientX;
    lastMY = e.clientY;
}

function drawBlobs(now) {
    pCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);

    for (let i = blobs.length - 1; i >= 0; i--) {
        const b   = blobs[i];
        const age = now - b.birth;
        if (age >= BLOB_LIFE) { blobs.splice(i, 1); continue; }

        const t     = age / BLOB_LIFE;
        // Fast rise, slow fade
        const alpha = b.peak * (t < 0.15 ? t / 0.15 : 1 - ((t - 0.15) / 0.85) ** 1.6);

        pCtx.save();
        pCtx.translate(b.x, b.y);
        pCtx.rotate(b.angle);

        const grad = pCtx.createRadialGradient(0, 0, 0, 0, 0, b.rx);
        grad.addColorStop(0,    `rgba(232, 119, 34, ${alpha})`);
        grad.addColorStop(0.5,  `rgba(210,  90, 15, ${alpha * 0.7})`);
        grad.addColorStop(1,    `rgba(190,  60,  0, 0)`);

        pCtx.fillStyle = grad;
        pCtx.beginPath();
        pCtx.ellipse(0, 0, b.rx, b.ry, 0, 0, Math.PI * 2);
        pCtx.fill();

        pCtx.restore();
    }
}

// ── Phase 1 reveal ──────────────────────────────────────────────
const revealEls = document.querySelectorAll('.eyebrow, .headline, .subline, .tagline, .scroll-hint');
let revealed = false;

function revealPhase1() {
    if (revealed) return;
    revealed = true;
    revealEls.forEach(el => el.classList.add('in'));
    // Let headline's CSS transition finish, then hand off to JS rubber
    setTimeout(() => {
        if (headline) {
            headline.classList.add('rubber-ready');
            rubberReady = true;
        }
    }, 850);
}

// ── Main RAF loop ───────────────────────────────────────────────
function tick(now) {
    requestAnimationFrame(tick);

    // Lerp virtual scroll
    scroll.current += (scroll.target - scroll.current) * 0.095;

    // Parallax camera shift
    updateCameraParallax(mouse.nx, mouse.ny);

    // Fade phase-1 overlay as user scrolls (fade over first 60vh)
    const fadeT = Math.min(scroll.current / (window.innerHeight * 0.6), 1);
    setPhase1Opacity(fadeT);

    // Rubber spring update
    stepRubber();

    // Paint blobs
    drawBlobs(now);

    // Render Three.js scene
    renderFrame();
}

// ── Boot ────────────────────────────────────────────────────────
setTimeout(revealPhase1, 750);
requestAnimationFrame(tick);
