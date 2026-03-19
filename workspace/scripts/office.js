/**
 * MONI 3D Workspace — Office Scene
 * Three.js scene with grid floor, desks, agent avatars, and lighting
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { agents, AGENT_TIERS, AGENT_STATUS } from './agents.js';

// ── Scene state ──────────────────────────────────────────────
let scene, camera, renderer, controls;
let agentMeshes = new Map();
let deskMeshes = new Map();
let glowMeshes = new Map();
let particleSystems = new Map();
let raycaster, mouse;
let clock;
let selectedAgent = null;
let onAgentSelect = null;
let onAgentHover = null;

// ── Constants ────────────────────────────────────────────────
const COLORS = {
  bg: 0x0a0612,
  floor: 0x1a0f2e,
  gridMain: 0x2d1b4e,
  gridAccent: 0x00ff9f,
  ambient: 0x1a0a2e,
  desk: 0x1e1433,
  deskEdge: 0x2d1b4e,
  monitor: 0x0a0612
};

const FLOOR_SIZE = 40;
const AVATAR_RADIUS_EXEC = 0.6;
const AVATAR_RADIUS_DIR = 0.45;
const AVATAR_RADIUS_LEAD = 0.35;

// ── Initialize ───────────────────────────────────────────────
export function initScene(canvas) {
  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bg);
  scene.fog = new THREE.FogExp2(COLORS.bg, 0.018);

  // Camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 18, 22);
  camera.lookAt(0, 0, -4);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2.15;
  controls.minDistance = 5;
  controls.maxDistance = 35;
  controls.target.set(0, 0, -4);
  controls.update();

  // Build the office
  createFloor();
  createLighting();
  createWalls();
  createAgentWorkstations();
  createDecorations();

  // Events
  window.addEventListener('resize', onResize);
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mousemove', onCanvasHover);

  // Start render loop
  animate();

  return { scene, camera, renderer, controls };
}

// ── Floor ────────────────────────────────────────────────────
function createFloor() {
  // Main floor plane
  const floorGeo = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);
  const floorMat = new THREE.MeshStandardMaterial({
    color: COLORS.floor,
    roughness: 0.85,
    metalness: 0.15,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  // Neon grid
  const gridHelper = new THREE.GridHelper(FLOOR_SIZE, 40, COLORS.gridAccent, COLORS.gridMain);
  gridHelper.material.opacity = 0.15;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  // Glowing grid lines (brighter accent lines)
  const accentGrid = new THREE.GridHelper(FLOOR_SIZE, 8, COLORS.gridAccent, COLORS.gridAccent);
  accentGrid.material.opacity = 0.08;
  accentGrid.material.transparent = true;
  accentGrid.position.y = 0.01;
  scene.add(accentGrid);
}

// ── Lighting ─────────────────────────────────────────────────
function createLighting() {
  // Ambient
  const ambient = new THREE.AmbientLight(COLORS.ambient, 0.4);
  scene.add(ambient);

  // Main overhead — warm teal
  const mainLight = new THREE.DirectionalLight(0x4ecdc4, 0.6);
  mainLight.position.set(5, 15, 8);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 40;
  mainLight.shadow.camera.left = -20;
  mainLight.shadow.camera.right = 20;
  mainLight.shadow.camera.top = 20;
  mainLight.shadow.camera.bottom = -20;
  scene.add(mainLight);

  // Fill light — neon green
  const fillLight = new THREE.DirectionalLight(0x00ff9f, 0.2);
  fillLight.position.set(-8, 10, -5);
  scene.add(fillLight);

  // Rim light — purple
  const rimLight = new THREE.DirectionalLight(0x8b5cf6, 0.3);
  rimLight.position.set(0, 5, -15);
  scene.add(rimLight);

  // Executive spotlight
  const spotMoni = new THREE.SpotLight(0x00ff9f, 1.5, 12, Math.PI / 8, 0.5);
  spotMoni.position.set(0, 10, 2);
  spotMoni.target.position.set(0, 0, 0);
  spotMoni.castShadow = true;
  scene.add(spotMoni);
  scene.add(spotMoni.target);

  // Point lights for atmosphere
  const pointColors = [0x00ff9f, 0x4ecdc4, 0xff6b6b, 0xcc5de8];
  const pointPositions = [
    [-12, 6, 3], [12, 6, 3], [-12, 6, -14], [12, 6, -14]
  ];
  pointPositions.forEach((pos, i) => {
    const light = new THREE.PointLight(pointColors[i], 0.4, 15);
    light.position.set(...pos);
    scene.add(light);
  });
}

// ── Walls (low-poly boundary) ────────────────────────────────
function createWalls() {
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x150d26,
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: 0.6
  });

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(FLOOR_SIZE, 6, 0.2),
    wallMat
  );
  backWall.position.set(0, 3, -FLOOR_SIZE / 2);
  scene.add(backWall);

  // Side walls
  [-1, 1].forEach(side => {
    const sideWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 6, FLOOR_SIZE),
      wallMat
    );
    sideWall.position.set(side * FLOOR_SIZE / 2, 3, 0);
    scene.add(sideWall);
  });

  // Neon trim on walls
  const trimMat = new THREE.MeshBasicMaterial({ color: 0x4ecdc4, transparent: true, opacity: 0.3 });
  const backTrim = new THREE.Mesh(new THREE.BoxGeometry(FLOOR_SIZE, 0.05, 0.25), trimMat);
  backTrim.position.set(0, 0.5, -FLOOR_SIZE / 2 + 0.1);
  scene.add(backTrim);
}

// ── Agent Workstations ───────────────────────────────────────
function createAgentWorkstations() {
  agents.forEach(agent => {
    const group = new THREE.Group();
    group.position.set(agent.position.x, agent.position.y, agent.position.z);

    // Desk
    const desk = createDesk(agent);
    group.add(desk);
    deskMeshes.set(agent.id, desk);

    // Monitor on desk
    const monitor = createMonitor(agent);
    group.add(monitor);

    // Agent avatar (glowing sphere)
    const avatar = createAvatar(agent);
    group.add(avatar);
    agentMeshes.set(agent.id, avatar);

    // Glow ring
    const glow = createGlowRing(agent);
    group.add(glow);
    glowMeshes.set(agent.id, glow);

    // Particle system
    const particles = createParticles(agent);
    group.add(particles);
    particleSystems.set(agent.id, particles);

    // Nameplate
    const nameplate = createNameplate(agent);
    group.add(nameplate);

    // Tier label on floor
    if (agent.id === 'moni') {
      const label = createFloorLabel('EXECUTIVE FLOOR', 0, 3);
      scene.add(label);
    }
    if (agent.id === 'takwa') {
      const label = createFloorLabel('DIRECTOR ROW', 0, -3.5);
      scene.add(label);
    }
    if (agent.id === 'rais') {
      const label = createFloorLabel('TEAM LEADS', 0, -9.5);
      scene.add(label);
    }

    scene.add(group);
  });
}

function createDesk(agent) {
  const group = new THREE.Group();
  const { w, d } = agent.deskSize;
  const color = new THREE.Color(agent.color);

  // Desktop surface
  const topGeo = new THREE.BoxGeometry(w, 0.08, d);
  const topMat = new THREE.MeshStandardMaterial({
    color: COLORS.desk,
    roughness: 0.6,
    metalness: 0.4,
  });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = 0.8;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Neon edge strip
  const edgeGeo = new THREE.BoxGeometry(w + 0.06, 0.02, 0.04);
  const edgeMat = new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.7 });
  const frontEdge = new THREE.Mesh(edgeGeo, edgeMat);
  frontEdge.position.set(0, 0.81, d / 2);
  group.add(frontEdge);

  const backEdge = new THREE.Mesh(edgeGeo, edgeMat);
  backEdge.position.set(0, 0.81, -d / 2);
  group.add(backEdge);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2d1b4e, metalness: 0.6, roughness: 0.4 });
  const legOffsets = [
    [-w / 2 + 0.15, 0.4, -d / 2 + 0.1],
    [w / 2 - 0.15, 0.4, -d / 2 + 0.1],
    [-w / 2 + 0.15, 0.4, d / 2 - 0.1],
    [w / 2 - 0.15, 0.4, d / 2 - 0.1]
  ];
  legOffsets.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(...pos);
    leg.castShadow = true;
    group.add(leg);
  });

  return group;
}

function createMonitor(agent) {
  const group = new THREE.Group();
  const isExec = agent.tier === AGENT_TIERS.EXECUTIVE;
  const scale = isExec ? 1.0 : 0.7;

  // Screen
  const screenGeo = new THREE.BoxGeometry(1.0 * scale, 0.6 * scale, 0.03);
  const screenMat = new THREE.MeshBasicMaterial({ color: COLORS.monitor });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 1.4, -agent.deskSize.d / 2 + 0.2);
  group.add(screen);

  // Screen glow border
  const borderGeo = new THREE.BoxGeometry(1.04 * scale, 0.64 * scale, 0.02);
  const borderMat = new THREE.MeshBasicMaterial({
    color: agent.color,
    transparent: true,
    opacity: 0.4
  });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.set(0, 1.4, -agent.deskSize.d / 2 + 0.19);
  group.add(border);

  // Stand
  const standGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.3, 6);
  const standMat = new THREE.MeshStandardMaterial({ color: 0x2d1b4e, metalness: 0.7 });
  const stand = new THREE.Mesh(standGeo, standMat);
  stand.position.set(0, 1.0, -agent.deskSize.d / 2 + 0.2);
  group.add(stand);

  return group;
}

function createAvatar(agent) {
  const radiusMap = {
    [AGENT_TIERS.EXECUTIVE]: AVATAR_RADIUS_EXEC,
    [AGENT_TIERS.DIRECTOR]: AVATAR_RADIUS_DIR,
    [AGENT_TIERS.LEAD]: AVATAR_RADIUS_LEAD
  };
  const radius = radiusMap[agent.tier] || AVATAR_RADIUS_LEAD;

  // Inner sphere (core)
  const geo = new THREE.IcosahedronGeometry(radius, 2);
  const mat = new THREE.MeshPhysicalMaterial({
    color: agent.color,
    emissive: agent.color,
    emissiveIntensity: 0.4 * agent.glowIntensity,
    roughness: 0.2,
    metalness: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.9
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 2.0;
  mesh.castShadow = true;
  mesh.userData = { agentId: agent.id, type: 'avatar' };

  // Outer glow shell
  const glowGeo = new THREE.IcosahedronGeometry(radius * 1.4, 1);
  const glowMat = new THREE.MeshBasicMaterial({
    color: agent.color,
    transparent: true,
    opacity: 0.08,
    wireframe: true
  });
  const glowShell = new THREE.Mesh(glowGeo, glowMat);
  glowShell.position.y = 2.0;
  mesh.add(glowShell);

  return mesh;
}

function createGlowRing(agent) {
  const radiusMap = {
    [AGENT_TIERS.EXECUTIVE]: 1.0,
    [AGENT_TIERS.DIRECTOR]: 0.75,
    [AGENT_TIERS.LEAD]: 0.6
  };
  const radius = radiusMap[agent.tier];

  const ringGeo = new THREE.RingGeometry(radius, radius + 0.04, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: agent.color,
    transparent: true,
    opacity: agent.status === AGENT_STATUS.ALERT ? 0.5 : 0.2,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  return ring;
}

function createParticles(agent) {
  const count = agent.tier === AGENT_TIERS.EXECUTIVE ? 24 : 12;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = 0.5 + Math.random() * 0.8;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = 1.5 + Math.random() * 1.5;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: agent.color,
    size: 0.06,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geo, mat);
}

function createNameplate(agent) {
  // Simple colored bar under the desk as nameplate indicator
  const geo = new THREE.BoxGeometry(agent.deskSize.w * 0.6, 0.03, 0.15);
  const mat = new THREE.MeshBasicMaterial({
    color: agent.color,
    transparent: true,
    opacity: 0.5
  });
  const plate = new THREE.Mesh(geo, mat);
  plate.position.set(0, 0.01, agent.deskSize.d / 2 + 0.3);
  return plate;
}

function createFloorLabel(text, x, z) {
  // Simple line marker
  const geo = new THREE.BoxGeometry(6, 0.01, 0.02);
  const mat = new THREE.MeshBasicMaterial({ color: 0x4ecdc4, transparent: true, opacity: 0.2 });
  const line = new THREE.Mesh(geo, mat);
  line.position.set(x, 0.01, z);
  return line;
}

// ── Decorations ──────────────────────────────────────────────
function createDecorations() {
  // Holographic center pillar
  const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, 8, 8);
  const pillarMat = new THREE.MeshBasicMaterial({
    color: 0x00ff9f,
    transparent: true,
    opacity: 0.06,
    wireframe: true
  });

  // Corner pillars
  const corners = [
    [-FLOOR_SIZE / 2 + 1, 4, -FLOOR_SIZE / 2 + 1],
    [FLOOR_SIZE / 2 - 1, 4, -FLOOR_SIZE / 2 + 1],
    [-FLOOR_SIZE / 2 + 1, 4, FLOOR_SIZE / 2 - 1],
    [FLOOR_SIZE / 2 - 1, 4, FLOOR_SIZE / 2 - 1]
  ];
  corners.forEach(pos => {
    const p = new THREE.Mesh(pillarGeo, pillarMat);
    p.position.set(...pos);
    scene.add(p);

    // Pillar base glow
    const baseGeo = new THREE.CircleGeometry(0.3, 16);
    const baseMat = new THREE.MeshBasicMaterial({
      color: 0x4ecdc4,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.rotation.x = -Math.PI / 2;
    base.position.set(pos[0], 0.02, pos[2]);
    scene.add(base);
  });

  // Floating data rings above executive area
  const dataRingGeo = new THREE.TorusGeometry(3, 0.015, 8, 64);
  const dataRingMat = new THREE.MeshBasicMaterial({
    color: 0x00ff9f,
    transparent: true,
    opacity: 0.12
  });
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(dataRingGeo, dataRingMat.clone());
    ring.position.set(0, 5 + i * 0.5, 0);
    ring.rotation.x = Math.PI / 2 + (i * 0.15);
    ring.rotation.z = i * 0.3;
    ring.userData.floatRing = true;
    ring.userData.ringIndex = i;
    scene.add(ring);
  }
}

// ── Animation ────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const delta = clock.getDelta();

  // Animate agent avatars
  agentMeshes.forEach((mesh, id) => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;

    // Floating bob
    mesh.position.y = 2.0 + Math.sin(elapsed * 1.5 + agents.indexOf(agent) * 0.7) * 0.15;

    // Slow rotation
    mesh.rotation.y = elapsed * 0.5 + agents.indexOf(agent) * 0.5;
    mesh.rotation.x = Math.sin(elapsed * 0.3) * 0.1;

    // Pulse emissive based on status
    if (agent.status === AGENT_STATUS.PROCESSING) {
      mesh.material.emissiveIntensity = 0.3 + Math.sin(elapsed * 4) * 0.3;
    } else if (agent.status === AGENT_STATUS.ALERT) {
      mesh.material.emissiveIntensity = 0.3 + Math.abs(Math.sin(elapsed * 6)) * 0.5;
    } else if (agent.status === AGENT_STATUS.IDLE) {
      mesh.material.emissiveIntensity = 0.15 + Math.sin(elapsed * 0.8) * 0.1;
    }

    // Selected agent highlight
    if (selectedAgent === id) {
      mesh.material.emissiveIntensity = 0.6 + Math.sin(elapsed * 3) * 0.2;
      mesh.scale.setScalar(1.0 + Math.sin(elapsed * 2) * 0.05);
    } else {
      mesh.scale.setScalar(1.0);
    }
  });

  // Animate glow rings
  glowMeshes.forEach((mesh, id) => {
    mesh.rotation.z = elapsed * 0.3;
    const agent = agents.find(a => a.id === id);
    if (agent?.status === AGENT_STATUS.ALERT) {
      mesh.material.opacity = 0.3 + Math.sin(elapsed * 5) * 0.2;
    }
  });

  // Animate particles
  particleSystems.forEach((points, id) => {
    const positions = points.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(elapsed * 2 + i) * 0.003;
      if (positions[i + 1] > 3.5) positions[i + 1] = 1.5;
    }
    points.geometry.attributes.position.needsUpdate = true;
    points.rotation.y = elapsed * 0.2;
  });

  // Animate floating data rings
  scene.traverse(obj => {
    if (obj.userData.floatRing) {
      const i = obj.userData.ringIndex;
      obj.rotation.z = elapsed * (0.1 + i * 0.05);
      obj.position.y = 5 + i * 0.5 + Math.sin(elapsed * 0.5 + i) * 0.2;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

// ── Interaction ──────────────────────────────────────────────
function onCanvasClick(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);

  const avatarArray = Array.from(agentMeshes.values());
  const intersects = raycaster.intersectObjects(avatarArray, true);

  if (intersects.length > 0) {
    let target = intersects[0].object;
    while (target && !target.userData.agentId) {
      target = target.parent;
    }
    if (target?.userData.agentId) {
      selectAgent(target.userData.agentId);
    }
  }
}

function onCanvasHover(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);

  const avatarArray = Array.from(agentMeshes.values());
  const intersects = raycaster.intersectObjects(avatarArray, true);

  document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';

  if (intersects.length > 0 && onAgentHover) {
    let target = intersects[0].object;
    while (target && !target.userData.agentId) target = target.parent;
    if (target?.userData.agentId) {
      onAgentHover(target.userData.agentId);
    }
  }
}

function updateMouse(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ── Public API ───────────────────────────────────────────────
export function selectAgent(agentId) {
  selectedAgent = agentId;
  const agent = agents.find(a => a.id === agentId);
  if (!agent) return;

  // Animate camera to agent
  const targetPos = new THREE.Vector3(
    agent.position.x,
    3,
    agent.position.z + 5
  );
  const lookAt = new THREE.Vector3(
    agent.position.x,
    1.5,
    agent.position.z
  );

  animateCamera(targetPos, lookAt);

  if (onAgentSelect) {
    onAgentSelect(agent);
  }
}

export function resetCamera() {
  selectedAgent = null;
  const targetPos = new THREE.Vector3(0, 18, 22);
  const lookAt = new THREE.Vector3(0, 0, -4);
  animateCamera(targetPos, lookAt);
}

function animateCamera(targetPos, lookAt) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const duration = 1200;
  const startTime = performance.now();

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(startPos, targetPos, ease);
    controls.target.lerpVectors(startTarget, lookAt, ease);
    controls.update();

    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function setOnAgentSelect(callback) {
  onAgentSelect = callback;
}

export function setOnAgentHover(callback) {
  onAgentHover = callback;
}

export function updateAgentStatus(agentId, status) {
  const agent = agents.find(a => a.id === agentId);
  if (agent) {
    agent.status = status;
  }
}

export function getScene() { return scene; }
export function getCamera() { return camera; }
