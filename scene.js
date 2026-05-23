// ================================================================
// scene.js — Three.js core: renderer, scene, camera, all meshes
// ================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── Renderer ────────────────────────────────────────────────────
export const canvas = document.getElementById('canvas');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

// ── Scene ───────────────────────────────────────────────────────
export const scene = new THREE.Scene();
scene.background = new THREE.Color('#18100A');
scene.fog = new THREE.Fog('#18100A', 22, 40);

// ── Camera ──────────────────────────────────────────────────────
export const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 15, 0.6);
camera.lookAt(0, 0, 0);

// ── Lights ──────────────────────────────────────────────────────
export const ambientLight = new THREE.AmbientLight('#ffd0a0', 0.52);
scene.add(ambientLight);

export const keyLight = new THREE.DirectionalLight('#ffb347', 2.2);
keyLight.position.set(7, 12, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 40;
keyLight.shadow.camera.left = keyLight.shadow.camera.bottom = -10;
keyLight.shadow.camera.right = keyLight.shadow.camera.top   =  10;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight('#8090ff', 0.28);
fillLight.position.set(-6, 6, -4);
scene.add(fillLight);

// Plant glow light (used in Phase 6 sketch hover)
export const plantGlow = new THREE.PointLight('#3DBA5E', 0, 5, 2);
plantGlow.position.set(0, 2, 0);
scene.add(plantGlow);

// ── Desk group ──────────────────────────────────────────────────
export const deskGroup = new THREE.Group();
scene.add(deskGroup);
export const deskItems = [];   // tracked for Phase 2 fade-out

function box(w, h, d, color, x, y, z, ry = 0) {
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.04 })
    );
    m.position.set(x, y, z); m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true;
    deskGroup.add(m); return m;
}
function cyl(rt, rb, h, seg, color, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(
        new THREE.CylinderGeometry(rt, rb, h, seg),
        new THREE.MeshStandardMaterial({ color, roughness: 0.62 })
    );
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.castShadow = true; m.receiveShadow = true;
    deskGroup.add(m); return m;
}
function item(mesh) { deskItems.push(mesh); return mesh; }

// Desk surface — always visible
box(18, 0.22, 14, '#2A1A0E', 0, -0.11, 0);

// Coffee mug
item(cyl(0.44, 0.38, 1.0, 20, '#C95C14', -2.5, 0.5,  1.8));
item(cyl(0.36, 0.36, 0.82,20, '#F08040', -2.5, 0.5,  1.8));
item(box(0.09, 0.44, 0.09,   '#C95C14', -2.07,0.5,  1.8));
item(cyl(0.34, 0.34, 0.02,16, '#1C0A02', -2.5, 1.01, 1.8));
// Notebook
item(box(2.4, 0.07,  1.75, '#1E3EA0', 2.75, 0.035, 0.5, 0.08));
item(box(0.07,0.09,  1.75, '#152D80', 1.57, 0.035, 0.5, 0.08));
item(box(2.25,0.01,  0.03, '#ffffff', 2.75, 0.075, 0.5, 0.08));
// Pen
item(cyl(0.055,0.055,2.1,10,'#F2C220',2.55, 0.07,1.45, Math.PI/2,0,0.3));
item(cyl(0.068,0.068,0.28,10,'#1C1C1C',1.52, 0.07,1.68, Math.PI/2,0,0.3));
// Papers
item(box(2.1, 0.014, 1.55, '#EDE6D2', -0.4, 0.007,-2.0, -0.12));
item(box(2.0, 0.014, 1.45, '#E8E0CC',  0.2, 0.022,-2.15, 0.18));
item(box(1.75,0.014, 1.3,  '#F0E8D5', -0.7, 0.038,-1.78, 0.38));
// Phone
item(box(0.72,0.056, 1.48, '#1A5234', -3.0, 0.028,-1.0,  0.08));
item(box(0.60,0.01,  1.22, '#1FD06A', -3.0, 0.061,-1.0,  0.08));
// Lamp
item(cyl(0.36,0.44,0.1,  20,'#C4893A', 3.9, 0.05,-2.6));
item(cyl(0.07,0.07,2.0,  10,'#9A6820', 3.9, 1.1, -2.6));
item(cyl(0.58,0.22,0.48, 20,'#EEC840', 3.9, 2.1, -2.6));
export const lampLight = new THREE.PointLight('#FFF5B0', 3.5, 8, 2);
lampLight.position.set(3.9, 2.6, -2.6);
scene.add(lampLight);
deskItems.push(lampLight);

// ── Pot & soil ──────────────────────────────────────────────────
export const potMat = new THREE.MeshStandardMaterial({ color: '#B54010', roughness: 0.88 });
export const potMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.44, 0.88, 24), potMat);
potMesh.position.set(0, 0.44, 0); potMesh.castShadow = true; potMesh.receiveShadow = true;
deskGroup.add(potMesh);
cyl(0.62, 0.60, 0.08, 24, '#A03808', 0, 0.88, 0);          // pot rim
export const soilMesh = cyl(0.55, 0.55, 0.06, 20, '#1E0C04', 0, 0.91, 0);

// ── Soil particle system ─────────────────────────────────────────
const N = 360;
export const pInitPos  = new Float32Array(N * 3);
export const pVelocities = [];
const _pPos = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
    const r = Math.random() * 0.52, a = Math.random() * Math.PI * 2;
    _pPos[i*3]   = pInitPos[i*3]   = Math.cos(a) * r;
    _pPos[i*3+1] = pInitPos[i*3+1] = 0.91 + Math.random() * 0.06;
    _pPos[i*3+2] = pInitPos[i*3+2] = Math.sin(a) * r;
    pVelocities.push({
        x: (Math.random()-0.5)*0.18,
        y: -(0.12 + Math.random()*0.28),
        z: (Math.random()-0.5)*0.18
    });
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(_pPos, 3));
export const soilParticles = new THREE.Points(pGeo,
    new THREE.PointsMaterial({ color: '#3A1C08', size: 0.05, sizeAttenuation: true }));
soilParticles.visible = false;
deskGroup.add(soilParticles);

// ── Plant GLB ───────────────────────────────────────────────────
export const plantMeshes = [];        // filled after GLB loads
export const plantBounds  = new THREE.Box3();
let _plantCb = null;
export function onPlantLoad(cb) { _plantCb = cb; }

new GLTFLoader().load('./assets/plant.glb', (gltf) => {
    const model = gltf.scene;
    const b = new THREE.Box3().setFromObject(model);
    const s = b.getSize(new THREE.Vector3());
    const d = Math.max(s.x, s.y, s.z);
    if (d > 0) model.scale.setScalar(3.0 / d);
    const b2 = new THREE.Box3().setFromObject(model);
    const c  = b2.getCenter(new THREE.Vector3());
    model.position.set(0, 0.94 - b2.min.y, 0);
    model.traverse(ch => {
        if (!ch.isMesh) return;
        ch.castShadow = true; ch.receiveShadow = true;
        plantMeshes.push(ch);
    });
    deskGroup.add(model);
    plantBounds.setFromObject(model);
    if (_plantCb) _plantCb(model);
}, undefined, e => console.warn('GLB load error:', e));

// ── Render & resize ─────────────────────────────────────────────
export function renderFrame() { renderer.render(scene, camera); }

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
