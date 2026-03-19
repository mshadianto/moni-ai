/**
 * MONI 3D Workspace — Cinematic Office Scene
 * Dramatic lighting, volumetric atmosphere, reflective surfaces, particle fields
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { bus, EVENTS } from './events.js';
import { CONFIG } from './config.js';
import { registry, TIER, STATUS } from './agents.js';
import { renderPipeline } from './renderer.js';

// ── Module state ─────────────────────────────────────────────
let scene, camera, controls;
const agentMeshes = new Map();
const glowRings = new Map();
const particleSystems = new Map();
const hologramShells = new Map();
let raycaster, mouse;
let selectedAgentId = null;

// Cinematic elements
let ambientParticles, volumetricRays, floorMirror;
let haloRings = [];
let dataStreams = [];
let lightPulse = { phase: 0 };

// ── Public: Initialize scene ─────────────────────────────────
export function initScene(canvas) {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030108);
  scene.fog = new THREE.FogExp2(0x030108, 0.012);

  // Camera — cinematic low angle
  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(2, 14, 28);
  camera.lookAt(0, 1, -4);

  // Renderer
  const renderer = renderPipeline.init(canvas, scene, camera);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minDistance = 4;
  controls.maxDistance = 40;
  controls.target.set(0, 1, -4);
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.8;
  controls.update();

  // Build cinematic scene
  buildEnvironment();
  buildCinematicLighting();
  buildWorkstations();
  buildAtmosphericEffects();
  buildDataStreams();

  // Interaction
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mousemove', onCanvasHover);

  // Frame callback
  renderPipeline.onFrame(onFrame);

  // Event listeners
  bus.on(EVENTS.AGENT_SELECT, (data) => focusAgent(data.id));
  bus.on(EVENTS.CAMERA_RESET, () => resetCamera());
  bus.on(EVENTS.AGENT_STATUS_CHANGE, (data) => updateAvatarStatus(data.id));

  renderPipeline.start();
  bus.emit(EVENTS.SCENE_READY, { agentCount: registry.count });

  return { scene, camera, controls };
}

// ── Environment ──────────────────────────────────────────────
function buildEnvironment() {
  const S = 50;

  // Reflective floor
  const floorGeo = new THREE.PlaneGeometry(S, S);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0418,
    roughness: 0.15,
    metalness: 0.85,
    envMapIntensity: 0.8,
  });
  floorMirror = new THREE.Mesh(floorGeo, floorMat);
  floorMirror.rotation.x = -Math.PI / 2;
  floorMirror.receiveShadow = true;
  scene.add(floorMirror);

  // Subtle grid — ultra-thin neon lines
  const grid1 = new THREE.GridHelper(S, 60, 0x00ff9f, 0x0a0520);
  grid1.material.opacity = 0.07;
  grid1.material.transparent = true;
  grid1.position.y = 0.005;
  scene.add(grid1);

  // Accent grid
  const grid2 = new THREE.GridHelper(S, 10, 0x4ecdc4, 0x4ecdc4);
  grid2.material.opacity = 0.04;
  grid2.material.transparent = true;
  grid2.position.y = 0.01;
  scene.add(grid2);

  // Boundary walls — dark glass
  const wallMat = new THREE.MeshPhysicalMaterial({
    color: 0x080318,
    roughness: 0.1,
    metalness: 0.5,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(S, 10), wallMat);
  backWall.position.set(0, 5, -S / 2);
  scene.add(backWall);

  [-1, 1].forEach(side => {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(S, 10), wallMat.clone());
    w.position.set(side * S / 2, 5, 0);
    w.rotation.y = side * Math.PI / 2;
    scene.add(w);
  });

  // Neon trim strips on walls
  const trimGeo = new THREE.PlaneGeometry(S, 0.03);
  [0.3, 3, 6].forEach(h => {
    const trimMat = new THREE.MeshBasicMaterial({
      color: h < 1 ? 0x00ff9f : 0x4ecdc4,
      transparent: true,
      opacity: h < 1 ? 0.4 : 0.15,
      side: THREE.DoubleSide,
    });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, h, -S / 2 + 0.01);
    scene.add(trim);
  });

  // Ceiling — dark void with faint structure
  const ceilGeo = new THREE.PlaneGeometry(S, S);
  const ceilMat = new THREE.MeshBasicMaterial({
    color: 0x020010,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 10;
  scene.add(ceil);
}

// ── Cinematic Lighting ───────────────────────────────────────
function buildCinematicLighting() {
  // Deep ambient — very low, moody
  scene.add(new THREE.AmbientLight(0x0a0520, 0.3));

  // Hero key light — dramatic angle, warm teal
  const key = new THREE.DirectionalLight(0x4ecdc4, 0.7);
  key.position.set(8, 20, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 50;
  key.shadow.camera.left = key.shadow.camera.bottom = -25;
  key.shadow.camera.right = key.shadow.camera.top = 25;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  scene.add(key);

  // Backlight — rim separation, purple
  const back = new THREE.DirectionalLight(0x8b5cf6, 0.5);
  back.position.set(-5, 8, -20);
  scene.add(back);

  // Fill — subtle green from below
  const fill = new THREE.DirectionalLight(0x00ff9f, 0.15);
  fill.position.set(-10, 2, 5);
  scene.add(fill);

  // Executive hero spotlight — dramatic pool of light
  const heroSpot = new THREE.SpotLight(0x00ff9f, 3.0, 18, Math.PI / 10, 0.6, 1.5);
  heroSpot.position.set(0, 14, 3);
  heroSpot.target.position.set(0, 0, 0);
  heroSpot.castShadow = true;
  heroSpot.shadow.mapSize.set(1024, 1024);
  scene.add(heroSpot);
  scene.add(heroSpot.target);

  // Side accent spots — cinematic color splash
  const spotLeft = new THREE.SpotLight(0x4ecdc4, 1.5, 20, Math.PI / 7, 0.7, 1.5);
  spotLeft.position.set(-12, 10, -4);
  spotLeft.target.position.set(-6, 0, 0);
  scene.add(spotLeft);
  scene.add(spotLeft.target);

  const spotRight = new THREE.SpotLight(0xff6b6b, 1.0, 20, Math.PI / 7, 0.7, 1.5);
  spotRight.position.set(12, 10, -4);
  spotRight.target.position.set(6, 0, 0);
  scene.add(spotRight);
  scene.add(spotRight.target);

  // Director row accent
  const dirSpot = new THREE.SpotLight(0x8b5cf6, 0.8, 16, Math.PI / 6, 0.5, 1.5);
  dirSpot.position.set(0, 12, -4);
  dirSpot.target.position.set(0, 0, -6);
  scene.add(dirSpot);
  scene.add(dirSpot.target);

  // Atmospheric point lights — color pools on floor
  const pools = [
    { pos: [-10, 4, 2], color: 0x00ff9f, intensity: 0.6 },
    { pos: [10, 4, 2], color: 0xff6b6b, intensity: 0.4 },
    { pos: [-10, 4, -10], color: 0x4ecdc4, intensity: 0.5 },
    { pos: [10, 4, -10], color: 0xcc5de8, intensity: 0.4 },
    { pos: [0, 3, -16], color: 0x8b5cf6, intensity: 0.3 },
    { pos: [0, 6, 6], color: 0x00ff9f, intensity: 0.3 },
  ];
  pools.forEach(({ pos, color, intensity }) => {
    const p = new THREE.PointLight(color, intensity, 14, 2);
    p.position.set(...pos);
    scene.add(p);
  });
}

// ── Workstations ─────────────────────────────────────────────
function buildWorkstations() {
  const agents = registry.all();
  agents.forEach((agent, idx) => {
    const group = new THREE.Group();
    group.position.set(agent.position.x, agent.position.y, agent.position.z);
    group.userData.agentId = agent.id;

    group.add(createCinematicDesk(agent));
    group.add(createHolographicMonitor(agent));

    const avatar = createCinematicAvatar(agent, idx);
    group.add(avatar);
    agentMeshes.set(agent.id, avatar);

    const ring = createFloorGlow(agent);
    group.add(ring);
    glowRings.set(agent.id, ring);

    const particles = createAuraParticles(agent);
    group.add(particles);
    particleSystems.set(agent.id, particles);

    const holo = createHologramShell(agent, idx);
    group.add(holo);
    hologramShells.set(agent.id, holo);

    group.add(createFloorBeam(agent));

    scene.add(group);
  });
}

function createCinematicDesk(agent) {
  const g = new THREE.Group();
  const { w, d } = agent.deskSize;

  // Glass desktop
  const topMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0520,
    roughness: 0.05,
    metalness: 0.9,
    transparent: true,
    opacity: 0.7,
    reflectivity: 0.9,
  });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), topMat);
  top.position.y = 0.8;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  // Neon edge — brighter, thicker
  const edgeMat = new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.8 });
  const edgeGeo = new THREE.BoxGeometry(w + 0.1, 0.015, 0.025);
  [d / 2, -d / 2].forEach(zOff => {
    const e = new THREE.Mesh(edgeGeo, edgeMat);
    e.position.set(0, 0.81, zOff);
    g.add(e);
  });
  // Side edges
  const sideGeo = new THREE.BoxGeometry(0.025, 0.015, d + 0.1);
  [-w / 2, w / 2].forEach(xOff => {
    const e = new THREE.Mesh(sideGeo, edgeMat.clone());
    e.material.opacity = 0.4;
    e.position.set(xOff, 0.81, 0);
    g.add(e);
  });

  // Glowing legs — thin pillars of light
  const legGeo = new THREE.CylinderGeometry(0.015, 0.025, 0.8, 8);
  const legMat = new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.25 });
  [
    [-w / 2 + 0.1, 0.4, -d / 2 + 0.08],
    [w / 2 - 0.1, 0.4, -d / 2 + 0.08],
    [-w / 2 + 0.1, 0.4, d / 2 - 0.08],
    [w / 2 - 0.1, 0.4, d / 2 - 0.08],
  ].forEach(pos => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(...pos);
    g.add(leg);
  });

  // Under-desk glow
  const underGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.8, d * 0.8),
    new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.04, side: THREE.DoubleSide })
  );
  underGlow.rotation.x = -Math.PI / 2;
  underGlow.position.y = 0.02;
  g.add(underGlow);

  return g;
}

function createHolographicMonitor(agent) {
  const g = new THREE.Group();
  const isExec = agent.tier === TIER.EXECUTIVE;
  const s = isExec ? 1.2 : 0.8;
  const zPos = -agent.deskSize.d / 2 + 0.15;

  // Holographic screen — transparent glowing panel
  const screenMat = new THREE.MeshBasicMaterial({
    color: agent.color,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.1 * s, 0.65 * s), screenMat);
  screen.position.set(0, 1.5, zPos);
  g.add(screen);

  // Screen border glow
  const borderPoints = [
    new THREE.Vector3(-0.55 * s, -0.325 * s, 0),
    new THREE.Vector3(0.55 * s, -0.325 * s, 0),
    new THREE.Vector3(0.55 * s, 0.325 * s, 0),
    new THREE.Vector3(-0.55 * s, 0.325 * s, 0),
    new THREE.Vector3(-0.55 * s, -0.325 * s, 0),
  ];
  const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
  const borderLine = new THREE.Line(borderGeo,
    new THREE.LineBasicMaterial({ color: agent.color, transparent: true, opacity: 0.5 })
  );
  borderLine.position.set(0, 1.5, zPos + 0.001);
  g.add(borderLine);

  // Scan line effect — thin moving bar
  const scanBar = new THREE.Mesh(
    new THREE.PlaneGeometry(1.08 * s, 0.008),
    new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  );
  scanBar.position.set(0, 1.5, zPos + 0.002);
  scanBar.userData._scanLine = true;
  g.add(scanBar);

  return g;
}

function createCinematicAvatar(agent, index) {
  const radius = {
    [TIER.EXECUTIVE]: 0.65,
    [TIER.DIRECTOR]: 0.48,
    [TIER.LEAD]: 0.38,
  }[agent.tier];

  // Core orb — glass-like with strong emission
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 3),
    new THREE.MeshPhysicalMaterial({
      color: agent.color,
      emissive: agent.color,
      emissiveIntensity: 0.6 * agent.glowIntensity,
      roughness: 0.05,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.85,
      reflectivity: 1.0,
    })
  );
  mesh.position.y = 2.2;
  mesh.castShadow = true;
  mesh.userData = { agentId: agent.id, type: 'avatar', index };

  // Inner energy core
  const coreMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius * 0.5, 2),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
    })
  );
  mesh.add(coreMesh);

  // Wireframe outer shell
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius * 1.5, 1),
    new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.06, wireframe: true })
  );
  mesh.add(shell);

  // Point light inside avatar — makes it actually glow
  const glow = new THREE.PointLight(agent.color, agent.glowIntensity * 0.8, 5, 2);
  glow.position.y = 0;
  mesh.add(glow);

  return mesh;
}

function createHologramShell(agent, index) {
  const radius = {
    [TIER.EXECUTIVE]: 1.2,
    [TIER.DIRECTOR]: 0.9,
    [TIER.LEAD]: 0.75,
  }[agent.tier];

  // Rotating holographic ring around avatar
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.01, 8, 48),
    new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.2 })
  );
  ring.position.y = 2.2;
  ring.rotation.x = Math.PI / 3;
  ring.userData._holoIndex = index;

  // Second ring — perpendicular
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.85, 0.008, 8, 48),
    new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.12 })
  );
  ring2.rotation.x = Math.PI / 2;
  ring.add(ring2);

  return ring;
}

function createFloorGlow(agent) {
  const r = { [TIER.EXECUTIVE]: 1.8, [TIER.DIRECTOR]: 1.3, [TIER.LEAD]: 1.0 }[agent.tier];

  const group = new THREE.Group();

  // Soft circular glow on floor
  const glowMat = new THREE.MeshBasicMaterial({
    color: agent.color,
    transparent: true,
    opacity: agent.status === STATUS.ALERT ? 0.15 : 0.06,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(new THREE.CircleGeometry(r, 32), glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.02;
  group.add(glow);

  // Ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(r - 0.03, r, 48),
    new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.025;
  group.add(ring);

  return group;
}

function createFloorBeam(agent) {
  // Vertical light beam from floor to avatar
  const h = 2.2;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.08, h, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
  );
  beam.position.y = h / 2;
  return beam;
}

function createAuraParticles(agent) {
  const count = agent.tier === TIER.EXECUTIVE ? 40 : agent.tier === TIER.DIRECTOR ? 24 : 16;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color(agent.color);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = 0.3 + Math.random() * 1.2;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = 1.0 + Math.random() * 2.5;
    positions[i * 3 + 2] = Math.sin(angle) * r;

    const brightness = 0.5 + Math.random() * 0.5;
    colors[i * 3] = color.r * brightness;
    colors[i * 3 + 1] = color.g * brightness;
    colors[i * 3 + 2] = color.b * brightness;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.05,
    transparent: true,
    opacity: 0.7,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
}

// ── Atmospheric Effects ──────────────────────────────────────
function buildAtmosphericEffects() {
  // Floating dust/particle field — cinematic atmosphere
  const dustCount = 600;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustColors = new Float32Array(dustCount * 3);

  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 50;
    dustPositions[i * 3 + 1] = Math.random() * 10;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;

    const c = Math.random() > 0.7 ? new THREE.Color(0x00ff9f) : new THREE.Color(0x4ecdc4);
    const b = 0.2 + Math.random() * 0.3;
    dustColors[i * 3] = c.r * b;
    dustColors[i * 3 + 1] = c.g * b;
    dustColors[i * 3 + 2] = c.b * b;
  }

  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

  ambientParticles = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.04,
    transparent: true,
    opacity: 0.5,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  scene.add(ambientParticles);

  // Overhead halo rings — massive, slowly rotating
  const haloColors = [0x00ff9f, 0x4ecdc4, 0x8b5cf6];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(5 + i * 2, 0.008, 6, 96),
      new THREE.MeshBasicMaterial({ color: haloColors[i], transparent: true, opacity: 0.08 - i * 0.015 })
    );
    ring.position.set(0, 7 + i * 0.8, -2);
    ring.rotation.x = Math.PI / 2 + i * 0.1;
    haloRings.push(ring);
    scene.add(ring);
  }

  // Volumetric light cones — fake god rays
  const coneGeo = new THREE.CylinderGeometry(0.5, 3, 14, 16, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x00ff9f,
    transparent: true,
    opacity: 0.015,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const cone1 = new THREE.Mesh(coneGeo, coneMat);
  cone1.position.set(0, 7, 0);
  scene.add(cone1);

  const cone2 = new THREE.Mesh(coneGeo, coneMat.clone());
  cone2.material.color = new THREE.Color(0x4ecdc4);
  cone2.material.opacity = 0.01;
  cone2.position.set(-8, 7, -6);
  cone2.rotation.z = 0.15;
  scene.add(cone2);

  const cone3 = new THREE.Mesh(coneGeo, coneMat.clone());
  cone3.material.color = new THREE.Color(0x8b5cf6);
  cone3.material.opacity = 0.01;
  cone3.position.set(8, 7, -6);
  cone3.rotation.z = -0.15;
  scene.add(cone3);
}

// ── Data Streams ─────────────────────────────────────────────
function buildDataStreams() {
  // Vertical data stream pillars between tiers
  const streamPositions = [
    { x: -4.5, z: -3, color: 0x00ff9f },
    { x: 4.5, z: -3, color: 0x4ecdc4 },
    { x: -4.5, z: -9, color: 0x8b5cf6 },
    { x: 4.5, z: -9, color: 0xcc5de8 },
  ];

  streamPositions.forEach(({ x, z, color }) => {
    const count = 30;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = x + (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({
      color, size: 0.04, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    points.userData._dataStream = true;
    dataStreams.push(points);
    scene.add(points);
  });
}

// ── Per-frame Animation ──────────────────────────────────────
function onFrame(delta, elapsed) {
  lightPulse.phase = elapsed;

  // Avatars
  agentMeshes.forEach((mesh, id) => {
    const agent = registry.get(id);
    if (!agent) return;
    const idx = mesh.userData.index;

    // Smooth float
    mesh.position.y = 2.2 + Math.sin(elapsed * 1.2 + idx * 0.8) * 0.2;

    // Gentle multi-axis rotation
    mesh.rotation.y = elapsed * 0.4 + idx * 0.5;
    mesh.rotation.x = Math.sin(elapsed * 0.25 + idx) * 0.08;

    // Inner core pulse
    const core = mesh.children[0];
    if (core) {
      core.rotation.y = -elapsed * 0.8;
      core.rotation.x = elapsed * 0.3;
      core.material.opacity = 0.2 + Math.sin(elapsed * 2 + idx) * 0.1;
    }

    // Emissive pulse by status
    const mat = mesh.material;
    switch (agent.status) {
      case STATUS.PROCESSING:
        mat.emissiveIntensity = 0.4 + Math.sin(elapsed * 3.5) * 0.35;
        break;
      case STATUS.ALERT:
        mat.emissiveIntensity = 0.3 + Math.abs(Math.sin(elapsed * 5)) * 0.6;
        break;
      case STATUS.IDLE:
        mat.emissiveIntensity = 0.15 + Math.sin(elapsed * 0.6) * 0.08;
        break;
      default:
        mat.emissiveIntensity = 0.5 * agent.glowIntensity;
    }

    // Point light inside — pulse intensity
    const light = mesh.children[2];
    if (light) {
      light.intensity = agent.glowIntensity * (0.5 + Math.sin(elapsed * 1.5 + idx) * 0.3);
    }

    // Selected highlight
    if (selectedAgentId === id) {
      mat.emissiveIntensity = 0.7 + Math.sin(elapsed * 2.5) * 0.2;
      mesh.scale.setScalar(1.0 + Math.sin(elapsed * 1.8) * 0.06);
    } else {
      mesh.scale.setScalar(1.0);
    }
  });

  // Hologram shells
  hologramShells.forEach((ring, id) => {
    const idx = ring.userData._holoIndex || 0;
    ring.rotation.y = elapsed * 0.6 + idx * 0.4;
    ring.rotation.z = Math.sin(elapsed * 0.3 + idx) * 0.3;
    ring.material.opacity = 0.12 + Math.sin(elapsed * 1.5 + idx) * 0.06;
  });

  // Floor glows
  glowRings.forEach((group, id) => {
    group.rotation.y = elapsed * 0.15;
    const agent = registry.get(id);
    if (agent?.status === STATUS.ALERT) {
      group.children[0].material.opacity = 0.08 + Math.sin(elapsed * 4) * 0.06;
    }
  });

  // Aura particles
  particleSystems.forEach(points => {
    const pos = points.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += Math.sin(elapsed * 1.5 + i) * 0.004;
      if (pos[i + 1] > 4.0) pos[i + 1] = 1.0;
    }
    points.geometry.attributes.position.needsUpdate = true;
    points.rotation.y = elapsed * 0.15;
  });

  // Ambient dust
  if (ambientParticles) {
    const pos = ambientParticles.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] += Math.sin(elapsed * 0.2 + i * 0.1) * 0.003;
      pos[i + 1] += 0.002;
      pos[i + 2] += Math.cos(elapsed * 0.15 + i * 0.1) * 0.002;
      if (pos[i + 1] > 10) pos[i + 1] = 0;
    }
    ambientParticles.geometry.attributes.position.needsUpdate = true;
  }

  // Halo rings
  haloRings.forEach((ring, i) => {
    ring.rotation.z = elapsed * (0.03 + i * 0.02);
    ring.position.y = 7 + i * 0.8 + Math.sin(elapsed * 0.3 + i) * 0.3;
    ring.material.opacity = 0.05 + Math.sin(elapsed * 0.5 + i * 1.5) * 0.02;
  });

  // Data streams — rising particles
  dataStreams.forEach(stream => {
    const pos = stream.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += 0.03;
      if (pos[i + 1] > 8) pos[i + 1] = 0;
    }
    stream.geometry.attributes.position.needsUpdate = true;
  });

  // Scan lines on monitors
  scene.traverse(obj => {
    if (obj.userData._scanLine) {
      const parent = obj.parent;
      if (parent) {
        const range = 0.3;
        obj.position.y = parent.children[0].position.y + Math.sin(elapsed * 2) * range;
      }
    }
  });

  controls.update();
}

// ── Interaction ──────────────────────────────────────────────
function onCanvasClick(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(Array.from(agentMeshes.values()), true);
  if (hit.length > 0) {
    let target = hit[0].object;
    while (target && !target.userData.agentId) target = target.parent;
    if (target?.userData.agentId) {
      bus.emit(EVENTS.AGENT_SELECT, { id: target.userData.agentId });
    }
  }
}

function onCanvasHover(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(Array.from(agentMeshes.values()), true);
  document.body.style.cursor = hit.length > 0 ? 'pointer' : 'default';
  if (hit.length > 0) {
    let target = hit[0].object;
    while (target && !target.userData.agentId) target = target.parent;
    if (target?.userData.agentId) bus.emit(EVENTS.AGENT_HOVER, { id: target.userData.agentId });
  }
}

function updateMouse(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// ── Camera ───────────────────────────────────────────────────
function focusAgent(agentId) {
  selectedAgentId = agentId;
  const agent = registry.get(agentId);
  if (!agent) return;

  // Cinematic close-up angle
  const offset = agent.tier === TIER.EXECUTIVE ? 6 : 5;
  animateCamera(
    new THREE.Vector3(agent.position.x + 1.5, 4, agent.position.z + offset),
    new THREE.Vector3(agent.position.x, 2, agent.position.z)
  );
}

function resetCamera() {
  selectedAgentId = null;
  animateCamera(
    new THREE.Vector3(2, 14, 28),
    new THREE.Vector3(0, 1, -4)
  );
}

function animateCamera(toPos, toTarget) {
  const fromPos = camera.position.clone();
  const fromTarget = controls.target.clone();
  const dur = 1500; // slower = more cinematic
  const start = performance.now();

  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    // Cinematic ease — smooth start and end
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    camera.position.lerpVectors(fromPos, toPos, e);
    controls.target.lerpVectors(fromTarget, toTarget, e);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateAvatarStatus(agentId) {
  const agent = registry.get(agentId);
  const group = glowRings.get(agentId);
  if (agent && group) {
    group.children[0].material.opacity = agent.status === STATUS.ALERT ? 0.15 : 0.06;
  }
}

// ── Exports ──────────────────────────────────────────────────
export function getScene() { return scene; }
export function getCamera() { return camera; }
