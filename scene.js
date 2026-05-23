// ================================================================
// scene.js — Three.js desk scene for Houseplant Hustle™
// ================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── Renderer ────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

// ── Scene ───────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color('#18100A');
scene.fog = new THREE.Fog('#18100A', 22, 40);

// ── Camera (top-down, slightly off-center to avoid gimbal) ──────
const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 100);
const CAM_BASE = new THREE.Vector3(0, 15, 0.6);
camera.position.copy(CAM_BASE);
camera.lookAt(0, 0, 0);

// ── Lights ──────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight('#ffd0a0', 0.52);
scene.add(ambient);

// Warm key light from top-right — casts visible shadows on desk
const keyLight = new THREE.DirectionalLight('#ffb347', 2.2);
keyLight.position.set(7, 12, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near   = 0.5;
keyLight.shadow.camera.far    = 40;
keyLight.shadow.camera.left   = keyLight.shadow.camera.bottom = -10;
keyLight.shadow.camera.right  = keyLight.shadow.camera.top   =  10;
scene.add(keyLight);

// Cool fill from opposite side for color contrast
const fillLight = new THREE.DirectionalLight('#8090ff', 0.28);
fillLight.position.set(-6, 6, -4);
scene.add(fillLight);

// ── Desk group (camera parallax tilts this group) ───────────────
const deskGroup = new THREE.Group();
scene.add(deskGroup);

// ── Primitive helpers ───────────────────────────────────────────
function makeBox(w, h, d, color, x, y, z, ry = 0) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.04 })
    );
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    deskGroup.add(mesh);
    return mesh;
}

function makeCyl(rt, rb, h, segs, color, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rt, rb, h, segs),
        new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.0 })
    );
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    deskGroup.add(mesh);
    return mesh;
}

// ── Desk surface — dark walnut ──────────────────────────────────
makeBox(18, 0.22, 14, '#2A1A0E', 0, -0.11, 0);

// ── Coffee mug — orange terracotta tones ────────────────────────
makeCyl(0.44, 0.38, 1.0, 20, '#C95C14', -2.5, 0.5, 1.8);   // body
makeCyl(0.36, 0.36, 0.82, 20, '#F08040', -2.5, 0.5, 1.8);  // inner lighter ring
makeBox(0.09, 0.44, 0.09, '#C95C14', -2.07, 0.5, 1.8);      // handle

// Steaming coffee surface (dark brown disk inside)
makeCyl(0.34, 0.34, 0.02, 16, '#1C0A02', -2.5, 1.01, 1.8);

// ── Notebook — cobalt blue ──────────────────────────────────────
makeBox(2.4, 0.07, 1.75, '#1E3EA0', 2.75, 0.035, 0.5, 0.08);    // body
makeBox(0.07, 0.09, 1.75, '#152D80', 1.57, 0.035, 0.5, 0.08);   // spine
makeBox(2.25, 0.01, 0.03, '#ffffff', 2.75, 0.075, 0.5, 0.08);   // ruled line top

// ── Pen — golden yellow, lying across notebook edge ─────────────
makeCyl(0.055, 0.055, 2.1, 10, '#F2C220', 2.55, 0.07, 1.45, Math.PI / 2, 0, 0.3);
makeCyl(0.068, 0.068, 0.28, 10, '#1C1C1C', 1.52, 0.07, 1.68, Math.PI / 2, 0, 0.3);  // cap

// ── Loose papers — warm cream, scattered ───────────────────────
makeBox(2.1, 0.014, 1.55, '#EDE6D2', -0.4, 0.007, -2.0, -0.12);
makeBox(2.0, 0.014, 1.45, '#E8E0CC', 0.2, 0.022, -2.15, 0.18);
makeBox(1.75, 0.014, 1.3, '#F0E8D5', -0.7, 0.038, -1.78, 0.38);

// ── Phone — dark emerald green with bright screen ───────────────
makeBox(0.72, 0.056, 1.48, '#1A5234', -3.0, 0.028, -1.0, 0.08);
makeBox(0.60, 0.01, 1.22, '#1FD06A', -3.0, 0.061, -1.0, 0.08);  // screen glow

// ── Desk lamp — amber and warm ──────────────────────────────────
makeCyl(0.36, 0.44, 0.1, 20, '#C4893A', 3.9, 0.05, -2.6);       // base
makeCyl(0.07, 0.07, 2.0, 10, '#9A6820', 3.9, 1.1, -2.6);         // stem
makeCyl(0.58, 0.22, 0.48, 20, '#EEC840', 3.9, 2.1, -2.6);        // shade cone

// Lamp point light — illuminates nearby desk area
const lampGlow = new THREE.PointLight('#FFF5B0', 3.5, 8, 2);
lampGlow.position.set(3.9, 2.6, -2.6);
scene.add(lampGlow);

// ── Terracotta pot ──────────────────────────────────────────────
export const potMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.44, 0.88, 24),
    new THREE.MeshStandardMaterial({ color: '#B54010', roughness: 0.88, metalness: 0.0 })
);
potMesh.position.set(0, 0.44, 0);
potMesh.castShadow = true;
potMesh.receiveShadow = true;
deskGroup.add(potMesh);

// Pot rim
makeCyl(0.62, 0.60, 0.08, 24, '#A03808', 0, 0.88, 0);

// Soil top — dark and moist
makeCyl(0.55, 0.55, 0.06, 20, '#1E0C04', 0, 0.91, 0);

// ── Plant GLB ───────────────────────────────────────────────────
const loader = new GLTFLoader();
loader.load(
    './assets/plant.glb',
    (gltf) => {
        const model = gltf.scene;

        // Auto-scale so the plant's tallest dimension = 3 units
        const box3 = new THREE.Box3().setFromObject(model);
        const size = box3.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) model.scale.setScalar(3.0 / maxDim);

        // Re-compute after scale, center X/Z, seat bottom on soil
        const box3b = new THREE.Box3().setFromObject(model);
        const center = box3b.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.z = -center.z;
        model.position.y = 0.94 - box3b.min.y;  // sit on soil top

        model.traverse((child) => {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
        });

        deskGroup.add(model);
    },
    undefined,
    (err) => console.warn('plant.glb failed to load:', err)
);

// ── Camera parallax ─────────────────────────────────────────────
const camOffset = new THREE.Vector3();

export function updateCameraParallax(nx, ny) {
    // nx, ny: normalized mouse position -1..1
    camOffset.x += (nx * 1.6 - camOffset.x) * 0.07;
    camOffset.z += (ny * 0.9 - camOffset.z) * 0.07;
    camera.position.set(
        CAM_BASE.x + camOffset.x,
        CAM_BASE.y,
        CAM_BASE.z + camOffset.z
    );
    camera.lookAt(0, 0, 0);
}

// ── Render ──────────────────────────────────────────────────────
export function renderFrame() {
    renderer.render(scene, camera);
}

// ── Resize ──────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
