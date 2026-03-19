/**
 * MONI 3D Workspace — Office Scene
 * Three.js scene: floor, desks, avatars, lighting, interaction
 * Decoupled via EventBus & RenderPipeline
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
let raycaster, mouse;
let selectedAgentId = null;

// ── Public: Initialize scene ─────────────────────────────────
export function initScene(canvas) {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.SCENE.BG_COLOR);
  scene.fog = new THREE.FogExp2(CONFIG.SCENE.BG_COLOR, CONFIG.SCENE.FOG_DENSITY);

  // Camera
  const [cx, cy, cz] = CONFIG.CAMERA.DEFAULT_POSITION;
  const [tx, ty, tz] = CONFIG.CAMERA.DEFAULT_TARGET;
  camera = new THREE.PerspectiveCamera(
    CONFIG.CAMERA.FOV,
    window.innerWidth / window.innerHeight,
    CONFIG.CAMERA.NEAR,
    CONFIG.CAMERA.FAR
  );
  camera.position.set(cx, cy, cz);
  camera.lookAt(tx, ty, tz);

  // Renderer (via pipeline)
  renderPipeline.init(canvas, scene, camera);

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = CONFIG.CAMERA.DAMPING_FACTOR;
  controls.maxPolarAngle = CONFIG.CAMERA.MAX_POLAR_ANGLE;
  controls.minDistance = CONFIG.CAMERA.MIN_DISTANCE;
  controls.maxDistance = CONFIG.CAMERA.MAX_DISTANCE;
  controls.target.set(tx, ty, tz);
  controls.update();

  // Build
  buildFloor();
  buildLighting();
  buildWalls();
  buildWorkstations();
  buildDecorations();

  // Interaction
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mousemove', onCanvasHover);

  // Register frame callback
  renderPipeline.onFrame(onFrame);

  // Listen for events
  bus.on(EVENTS.AGENT_SELECT, (data) => focusAgent(data.id));
  bus.on(EVENTS.CAMERA_RESET, () => resetCamera());
  bus.on(EVENTS.AGENT_STATUS_CHANGE, (data) => updateAvatarStatus(data.id));

  // Start rendering
  renderPipeline.start();

  bus.emit(EVENTS.SCENE_READY, { agentCount: registry.count });

  return { scene, camera, controls };
}

// ── Floor ────────────────────────────────────────────────────
function buildFloor() {
  const S = CONFIG.SCENE.FLOOR_SIZE;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(S, S),
    new THREE.MeshStandardMaterial({ color: 0x1a0f2e, roughness: 0.85, metalness: 0.15 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  // Fine grid
  const grid = new THREE.GridHelper(S, CONFIG.SCENE.GRID_DIVISIONS, CONFIG.COLORS.neonHex, CONFIG.COLORS.purpleHex);
  grid.material.opacity = 0.15;
  grid.material.transparent = true;
  scene.add(grid);

  // Accent grid
  const accent = new THREE.GridHelper(S, CONFIG.SCENE.GRID_ACCENT_DIVISIONS, CONFIG.COLORS.neonHex, CONFIG.COLORS.neonHex);
  accent.material.opacity = 0.08;
  accent.material.transparent = true;
  accent.position.y = 0.01;
  scene.add(accent);
}

// ── Lighting ─────────────────────────────────────────────────
function buildLighting() {
  const L = CONFIG.LIGHTING;

  scene.add(new THREE.AmbientLight(0x1a0a2e, L.AMBIENT_INTENSITY));

  const main = new THREE.DirectionalLight(CONFIG.COLORS.tealHex, L.MAIN_INTENSITY);
  main.position.set(5, 15, 8);
  main.castShadow = true;
  main.shadow.mapSize.set(L.SHADOW_MAP_SIZE, L.SHADOW_MAP_SIZE);
  main.shadow.camera.near = 0.5;
  main.shadow.camera.far = 40;
  main.shadow.camera.left = main.shadow.camera.bottom = -20;
  main.shadow.camera.right = main.shadow.camera.top = 20;
  scene.add(main);

  const fill = new THREE.DirectionalLight(CONFIG.COLORS.neonHex, L.FILL_INTENSITY);
  fill.position.set(-8, 10, -5);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x8b5cf6, L.RIM_INTENSITY);
  rim.position.set(0, 5, -15);
  scene.add(rim);

  // Executive spotlight
  const spot = new THREE.SpotLight(CONFIG.COLORS.neonHex, L.SPOT_INTENSITY, 12, Math.PI / 8, 0.5);
  spot.position.set(0, 10, 2);
  spot.target.position.set(0, 0, 0);
  spot.castShadow = true;
  scene.add(spot);
  scene.add(spot.target);

  // Corner point lights
  const colors = [0x00ff9f, 0x4ecdc4, 0xff6b6b, 0xcc5de8];
  const positions = [[-12, 6, 3], [12, 6, 3], [-12, 6, -14], [12, 6, -14]];
  positions.forEach((pos, i) => {
    const p = new THREE.PointLight(colors[i], 0.4, 15);
    p.position.set(...pos);
    scene.add(p);
  });
}

// ── Walls ────────────────────────────────────────────────────
function buildWalls() {
  const S = CONFIG.SCENE.FLOOR_SIZE;
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x150d26, roughness: 0.9, metalness: 0.1, transparent: true, opacity: 0.6,
  });

  // Back
  const back = new THREE.Mesh(new THREE.BoxGeometry(S, 6, 0.2), wallMat);
  back.position.set(0, 3, -S / 2);
  scene.add(back);

  // Sides
  [-1, 1].forEach(side => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6, S), wallMat);
    w.position.set(side * S / 2, 3, 0);
    scene.add(w);
  });

  // Neon trim
  const trimMat = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.tealHex, transparent: true, opacity: 0.3 });
  const trim = new THREE.Mesh(new THREE.BoxGeometry(S, 0.05, 0.25), trimMat);
  trim.position.set(0, 0.5, -S / 2 + 0.1);
  scene.add(trim);
}

// ── Workstations ─────────────────────────────────────────────
function buildWorkstations() {
  const agents = registry.all();
  agents.forEach((agent, idx) => {
    const group = new THREE.Group();
    group.position.set(agent.position.x, agent.position.y, agent.position.z);
    group.userData.agentId = agent.id;

    group.add(createDesk(agent));
    group.add(createMonitor(agent));

    const avatar = createAvatar(agent, idx);
    group.add(avatar);
    agentMeshes.set(agent.id, avatar);

    const ring = createGlowRing(agent);
    group.add(ring);
    glowRings.set(agent.id, ring);

    const particles = createParticles(agent);
    group.add(particles);
    particleSystems.set(agent.id, particles);

    group.add(createNameplate(agent));
    scene.add(group);
  });

  // Tier divider lines
  [3, -3.5, -9.5].forEach(z => {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.01, 0.02),
      new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.tealHex, transparent: true, opacity: 0.2 })
    );
    line.position.set(0, 0.01, z);
    scene.add(line);
  });
}

function createDesk(agent) {
  const g = new THREE.Group();
  const { w, d } = agent.deskSize;
  const D = CONFIG.DESK;

  // Surface
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(w, D.SURFACE_THICKNESS, d),
    new THREE.MeshStandardMaterial({ color: D.COLOR, roughness: 0.6, metalness: 0.4 })
  );
  top.position.y = D.HEIGHT;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  // Neon edges
  const edgeMat = new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.7 });
  const edgeGeo = new THREE.BoxGeometry(w + 0.06, 0.02, 0.04);
  [d / 2, -d / 2].forEach(zOff => {
    const e = new THREE.Mesh(edgeGeo, edgeMat);
    e.position.set(0, D.HEIGHT + 0.01, zOff);
    g.add(e);
  });

  // Legs
  const legGeo = new THREE.CylinderGeometry(D.LEG_RADIUS, D.LEG_RADIUS, D.HEIGHT, 6);
  const legMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.purpleHex, metalness: 0.6, roughness: 0.4 });
  [
    [-w / 2 + 0.15, D.HEIGHT / 2, -d / 2 + 0.1],
    [w / 2 - 0.15, D.HEIGHT / 2, -d / 2 + 0.1],
    [-w / 2 + 0.15, D.HEIGHT / 2, d / 2 - 0.1],
    [w / 2 - 0.15, D.HEIGHT / 2, d / 2 - 0.1],
  ].forEach(pos => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(...pos);
    leg.castShadow = true;
    g.add(leg);
  });

  return g;
}

function createMonitor(agent) {
  const g = new THREE.Group();
  const isExec = agent.tier === TIER.EXECUTIVE;
  const s = isExec ? 1.0 : 0.7;
  const zPos = -agent.deskSize.d / 2 + 0.2;

  // Screen
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(1.0 * s, 0.6 * s, 0.03),
    new THREE.MeshBasicMaterial({ color: 0x0a0612 })
  );
  screen.position.set(0, 1.4, zPos);
  g.add(screen);

  // Border glow
  const border = new THREE.Mesh(
    new THREE.BoxGeometry(1.04 * s, 0.64 * s, 0.02),
    new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.4 })
  );
  border.position.set(0, 1.4, zPos - 0.01);
  g.add(border);

  // Stand
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.04, 0.3, 6),
    new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.purpleHex, metalness: 0.7 })
  );
  stand.position.set(0, 1.0, zPos);
  g.add(stand);

  return g;
}

function createAvatar(agent, index) {
  const radius = CONFIG.AVATAR.RADIUS[agent.tier] || CONFIG.AVATAR.RADIUS.lead;

  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 2),
    new THREE.MeshPhysicalMaterial({
      color: agent.color,
      emissive: agent.color,
      emissiveIntensity: 0.4 * agent.glowIntensity,
      roughness: 0.2,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.9,
    })
  );
  mesh.position.y = 2.0;
  mesh.castShadow = true;
  mesh.userData = { agentId: agent.id, type: 'avatar', index };

  // Wireframe glow shell
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius * CONFIG.AVATAR.GLOW_SHELL_SCALE, 1),
    new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.08, wireframe: true })
  );
  mesh.add(shell);

  return mesh;
}

function createGlowRing(agent) {
  const r = { [TIER.EXECUTIVE]: 1.0, [TIER.DIRECTOR]: 0.75, [TIER.LEAD]: 0.6 }[agent.tier];
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(r, r + 0.04, 32),
    new THREE.MeshBasicMaterial({
      color: agent.color, transparent: true,
      opacity: agent.status === STATUS.ALERT ? 0.5 : 0.2,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  return ring;
}

function createParticles(agent) {
  const count = CONFIG.AVATAR.PARTICLE_COUNT[agent.tier] || 12;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = 0.5 + Math.random() * 0.8;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = 1.5 + Math.random() * 1.5;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: agent.color, size: 0.06, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
}

function createNameplate(agent) {
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(agent.deskSize.w * 0.6, 0.03, 0.15),
    new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.5 })
  );
  plate.position.set(0, 0.01, agent.deskSize.d / 2 + 0.3);
  return plate;
}

// ── Decorations ──────────────────────────────────────────────
function buildDecorations() {
  const S = CONFIG.SCENE.FLOOR_SIZE;

  // Corner pillars
  const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, 8, 8);
  const pillarMat = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.neonHex, transparent: true, opacity: 0.06, wireframe: true });
  const baseGeo = new THREE.CircleGeometry(0.3, 16);
  const baseMat = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.tealHex, transparent: true, opacity: 0.1, side: THREE.DoubleSide });

  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const p = new THREE.Mesh(pillarGeo, pillarMat);
    p.position.set(sx * (S / 2 - 1), 4, sz * (S / 2 - 1));
    scene.add(p);

    const b = new THREE.Mesh(baseGeo, baseMat);
    b.rotation.x = -Math.PI / 2;
    b.position.set(sx * (S / 2 - 1), 0.02, sz * (S / 2 - 1));
    scene.add(b);
  });

  // Floating data rings
  const ringGeo = new THREE.TorusGeometry(3, 0.015, 8, 64);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(ringGeo,
      new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.neonHex, transparent: true, opacity: 0.12 })
    );
    ring.position.set(0, 5 + i * 0.5, 0);
    ring.rotation.x = Math.PI / 2 + i * 0.15;
    ring.rotation.z = i * 0.3;
    ring.userData._floatRing = i;
    scene.add(ring);
  }
}

// ── Per-frame animation ──────────────────────────────────────
function onFrame(delta, elapsed) {
  const agents = registry.all();

  agentMeshes.forEach((mesh, id) => {
    const agent = registry.get(id);
    if (!agent) return;
    const idx = mesh.userData.index;

    // Float
    mesh.position.y = 2.0 + Math.sin(elapsed * CONFIG.AVATAR.FLOAT_SPEED + idx * 0.7) * CONFIG.AVATAR.FLOAT_AMPLITUDE;
    mesh.rotation.y = elapsed * CONFIG.AVATAR.ROTATION_SPEED + idx * 0.5;
    mesh.rotation.x = Math.sin(elapsed * 0.3) * 0.1;

    // Status-based emissive pulse
    const mat = mesh.material;
    if (agent.status === STATUS.PROCESSING) {
      mat.emissiveIntensity = 0.3 + Math.sin(elapsed * 4) * 0.3;
    } else if (agent.status === STATUS.ALERT) {
      mat.emissiveIntensity = 0.3 + Math.abs(Math.sin(elapsed * 6)) * 0.5;
    } else if (agent.status === STATUS.IDLE) {
      mat.emissiveIntensity = 0.15 + Math.sin(elapsed * 0.8) * 0.1;
    } else {
      mat.emissiveIntensity = 0.4 * (agent.glowIntensity || 1.0);
    }

    // Selected highlight
    if (selectedAgentId === id) {
      mat.emissiveIntensity = 0.6 + Math.sin(elapsed * 3) * 0.2;
      mesh.scale.setScalar(1.0 + Math.sin(elapsed * 2) * 0.05);
    } else {
      mesh.scale.setScalar(1.0);
    }
  });

  // Glow rings
  glowRings.forEach((ring, id) => {
    ring.rotation.z = elapsed * 0.3;
    const agent = registry.get(id);
    if (agent?.status === STATUS.ALERT) {
      ring.material.opacity = 0.3 + Math.sin(elapsed * 5) * 0.2;
    }
  });

  // Particles
  particleSystems.forEach(points => {
    const pos = points.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += Math.sin(elapsed * 2 + i) * 0.003;
      if (pos[i + 1] > 3.5) pos[i + 1] = 1.5;
    }
    points.geometry.attributes.position.needsUpdate = true;
    points.rotation.y = elapsed * 0.2;
  });

  // Data rings
  scene.traverse(obj => {
    if (obj.userData._floatRing !== undefined) {
      const i = obj.userData._floatRing;
      obj.rotation.z = elapsed * (0.1 + i * 0.05);
      obj.position.y = 5 + i * 0.5 + Math.sin(elapsed * 0.5 + i) * 0.2;
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
    if (target?.userData.agentId) {
      bus.emit(EVENTS.AGENT_HOVER, { id: target.userData.agentId });
    }
  }
}

function updateMouse(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// ── Camera Control ───────────────────────────────────────────
function focusAgent(agentId) {
  selectedAgentId = agentId;
  const agent = registry.get(agentId);
  if (!agent) return;

  animateCamera(
    new THREE.Vector3(agent.position.x, CONFIG.CAMERA.FOCUS_OFFSET_Y, agent.position.z + CONFIG.CAMERA.FOCUS_OFFSET_Z),
    new THREE.Vector3(agent.position.x, 1.5, agent.position.z)
  );
}

function resetCamera() {
  selectedAgentId = null;
  const [cx, cy, cz] = CONFIG.CAMERA.DEFAULT_POSITION;
  const [tx, ty, tz] = CONFIG.CAMERA.DEFAULT_TARGET;
  animateCamera(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(tx, ty, tz));
}

function animateCamera(toPos, toTarget) {
  const fromPos = camera.position.clone();
  const fromTarget = controls.target.clone();
  const dur = CONFIG.CAMERA.FLY_DURATION;
  const start = performance.now();

  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(fromPos, toPos, e);
    controls.target.lerpVectors(fromTarget, toTarget, e);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateAvatarStatus(agentId) {
  const agent = registry.get(agentId);
  const ring = glowRings.get(agentId);
  if (agent && ring) {
    ring.material.opacity = agent.status === STATUS.ALERT ? 0.5 : 0.2;
  }
}

// ── Exports ──────────────────────────────────────────────────
export function getScene() { return scene; }
export function getCamera() { return camera; }
