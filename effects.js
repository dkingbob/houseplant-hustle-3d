// ================================================================
// effects.js — Sketch overlay, material modes, scan line, OrbitControls
// ================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
    camera, renderer, scene, deskGroup,
    potMat, potMesh, soilMesh, soilParticles,
    pInitPos, pVelocities, plantMeshes, plantGlow,
    onPlantLoad
} from './scene.js';

// ── Soil particles (scroll-driven physics) ────────────────────────
export function updateSoilPhase(t) {
    soilMesh.visible  = t < 0.12;
    potMesh.visible   = t < 0.04;
    if (t < 0.04) { soilParticles.visible = false; return; }

    soilParticles.visible = true;
    const simT  = t * 2.8;        // map 0-1 progress to 0-2.8s simulation
    const g     = 0.22;
    const posArr = soilParticles.geometry.attributes.position.array;
    for (let i = 0; i < pVelocities.length; i++) {
        const v = pVelocities[i], idx = i * 3;
        posArr[idx]     = pInitPos[idx]     + v.x * simT;
        posArr[idx + 1] = pInitPos[idx + 1] + v.y * simT - g * simT * simT;
        posArr[idx + 2] = pInitPos[idx + 2] + v.z * simT;
    }
    soilParticles.geometry.attributes.position.needsUpdate = true;
}

// ── Pot glass effect ─────────────────────────────────────────────
export function setPotOpacity(t) {
    const opacity = 1 - t * 0.85;
    potMat.transparent = opacity < 0.99;
    potMat.opacity     = opacity;
    potMat.roughness   = Math.max(0.04, 0.88 - t * 0.84);
    potMesh.visible    = true;
}

// ── Sketch overlay ────────────────────────────────────────────────
let sketchLines = null;  // THREE.LineSegments
const sketchMat = new THREE.LineBasicMaterial({
    color: '#7A5A1A', transparent: true, opacity: 0.0
});
const sketchMatHover = new THREE.LineBasicMaterial({
    color: '#3DBA5E', transparent: true, opacity: 0.0
});
let _sketchBuilt = false;
let _sketchHovering = false;

function buildSketch(model) {
    if (_sketchBuilt || !plantMeshes.length) return;
    _sketchBuilt = true;

    // Ensure world matrices are current
    deskGroup.updateWorldMatrix(true, true);

    const geos = [];
    plantMeshes.forEach(mesh => {
        try {
            const g = mesh.geometry.clone();
            g.applyMatrix4(mesh.matrixWorld);
            geos.push(g);
        } catch (_) {}
    });
    if (!geos.length) return;

    let merged;
    try { merged = mergeGeometries(geos); }
    catch (_) { merged = geos[0]; }

    // Offset slightly forward in world space so it sits just behind the plant
    // (camera is at z=7 looking toward z=0, so z=-0.4 is "behind" the plant)
    const edges = new THREE.EdgesGeometry(merged, 20);
    sketchLines = new THREE.LineSegments(edges, sketchMat);
    // Place sketch 0.4 units behind the plant (camera is at z=7, plant at z≈0)
    sketchLines.position.z = -0.4;
    sketchLines.visible = false;
    scene.add(sketchLines);
}

export function updateSketch(t, hovered) {
    if (!_sketchBuilt) return;
    if (!sketchLines) return;

    sketchLines.visible = t > 0.02;
    const targetOpacity = t * 0.72;
    sketchMat.opacity += (targetOpacity - sketchMat.opacity) * 0.07;

    if (hovered !== _sketchHovering) {
        _sketchHovering = hovered;
    }
    if (hovered) {
        sketchLines.material = sketchMatHover;
        sketchMatHover.opacity = sketchMat.opacity;
        sketchMatHover.color.lerp(new THREE.Color('#3DBA5E'), 0.12);
        plantGlow.intensity += (1.8 - plantGlow.intensity) * 0.08;
    } else {
        sketchLines.material = sketchMat;
        sketchMat.color.lerp(new THREE.Color('#7A5A1A'), 0.08);
        plantGlow.intensity += (0 - plantGlow.intensity) * 0.06;
    }
}

export function hideSketch() {
    if (sketchLines) {
        sketchLines.visible = false;
        sketchMat.opacity = 0;
    }
    plantGlow.intensity = 0;
}

// ── Mode switching ────────────────────────────────────────────────
const originalMats = new Map();
const thermalMats  = new Map();
const wireMats     = new Map();
let modesReady = false;
export let activeMode = 'standard';

function makeThermalMat(minY, maxY) {
    return new THREE.ShaderMaterial({
        uniforms: { uMin: { value: minY }, uMax: { value: maxY } },
        vertexShader: `
            varying float vH;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vH = wp.y;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: `
            uniform float uMin; uniform float uMax;
            varying float vH;
            vec3 tc(float t) {
                t = clamp(t, 0.0, 1.0);
                if (t < 0.25) return mix(vec3(0.0,0.15,0.9), vec3(0.0,0.85,0.9),  t * 4.0);
                if (t < 0.50) return mix(vec3(0.0,0.85,0.9), vec3(0.1,0.9,0.1),   (t-0.25)*4.0);
                if (t < 0.75) return mix(vec3(0.1,0.9,0.1),  vec3(1.0,0.9,0.0),   (t-0.50)*4.0);
                              return mix(vec3(1.0,0.9,0.0),   vec3(1.0,0.05,0.05), (t-0.75)*4.0);
            }
            void main() {
                float t = (vH - uMin) / max(uMax - uMin, 0.001);
                gl_FragColor = vec4(tc(t), 1.0);
            }`
    });
}

function initModes() {
    if (modesReady) return;
    modesReady = true;
    deskGroup.updateWorldMatrix(true, true);

    plantMeshes.forEach(mesh => {
        originalMats.set(mesh.uuid, mesh.material);

        const b = new THREE.Box3().setFromObject(mesh);
        thermalMats.set(mesh.uuid, makeThermalMat(b.min.y, b.max.y));

        wireMats.set(mesh.uuid, new THREE.MeshBasicMaterial({
            color: '#00FF55', wireframe: true
        }));
    });
}

export function setMode(mode) {
    if (!modesReady) return;
    activeMode = mode;

    plantMeshes.forEach(mesh => {
        const orig = originalMats.get(mesh.uuid);
        switch (mode) {
            case 'standard':
                mesh.material = orig;
                if (orig) { orig.transparent = false; orig.opacity = 1; orig.wireframe = false; }
                break;
            case 'thermal':
                mesh.material = thermalMats.get(mesh.uuid) || orig;
                break;
            case 'xray':
                if (orig) {
                    const x = orig.clone();
                    x.transparent = true; x.opacity = 0.22; x.wireframe = false;
                    x.emissive = new THREE.Color('#88ffaa'); x.emissiveIntensity = 0.4;
                    mesh.material = x;
                }
                break;
            case 'wireframe':
                mesh.material = wireMats.get(mesh.uuid) || orig;
                break;
        }
    });

    const info = {
        standard:  { label: 'Standard Mode',     desc: 'The plant, as nature intended. With better lighting.' },
        thermal:   { label: 'Thermal Imaging',    desc: 'Heat map of leaf temperature gradients. Blues are cold. Red means thriving.' },
        xray:      { label: 'X-Ray Analysis',     desc: 'Structural integrity scan. 847 leaves accounted for. AI is relieved.' },
        wireframe: { label: 'Wireframe Debug',    desc: '23,412 vertices. Zero excuses. Full geometric accountability.' },
    };
    const d = info[mode] || info.standard;
    const lbl = document.getElementById('mode-label');
    const dsc = document.getElementById('mode-desc');
    if (lbl) lbl.textContent = d.label;
    if (dsc) dsc.textContent = d.desc;
}

// ── Scan line ─────────────────────────────────────────────────────
const scanEl = document.getElementById('scan-line');
export function updateScanLine(mouseY, visible) {
    if (!scanEl) return;
    if (visible) {
        scanEl.style.display = 'block';
        scanEl.style.transform = `translateY(${mouseY}px)`;
    } else {
        scanEl.style.display = 'none';
    }
}

// ── OrbitControls ─────────────────────────────────────────────────
let orbit = null;
export function enableOrbit() {
    if (!orbit) {
        orbit = new OrbitControls(camera, renderer.domElement);
        orbit.enablePan   = false;
        orbit.minDistance = 3;
        orbit.maxDistance = 12;
        orbit.target.set(0, 1.5, 0);
        orbit.enableDamping  = true;
        orbit.dampingFactor  = 0.08;
    }
    orbit.enabled = true;
}
export function disableOrbit() {
    if (orbit) orbit.enabled = false;
}
export function tickOrbit() {
    if (orbit && orbit.enabled) orbit.update();
}

// ── Init (called once plant loads) ───────────────────────────────
onPlantLoad((model) => {
    buildSketch(model);
    initModes();
});
