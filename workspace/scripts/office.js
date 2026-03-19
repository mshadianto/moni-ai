/**
 * MONI 3D Workspace — LEGO Edition
 * Everything is made of LEGO bricks, studs, and minifig-style agents
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { bus, EVENTS } from './events.js';
import { CONFIG } from './config.js';
import { registry, TIER, STATUS } from './agents.js';
import { renderPipeline } from './renderer.js';

// ── State ────────────────────────────────────────────────────
let scene, camera, controls;
const agentMeshes = new Map();
const minifigHeads = new Map();
let raycaster, mouse;
let selectedAgentId = null;

// LEGO unit = 1 stud width
const STUD = 0.8;
const PLATE_H = 0.32;
const BRICK_H = 0.96;
const STUD_R = 0.24;
const STUD_H = 0.17;

// LEGO plastic material cache
const matCache = new Map();

// ── LEGO Plastic Material ────────────────────────────────────
function legoMat(color, opts = {}) {
  const key = `${color}-${JSON.stringify(opts)}`;
  if (matCache.has(key)) return matCache.get(key).clone();

  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.25,
    metalness: 0.0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    reflectivity: 0.5,
    ...opts,
  });
  matCache.set(key, mat);
  return mat;
}

// ── LEGO Stud ────────────────────────────────────────────────
function createStud(color) {
  const geo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 16);
  return new THREE.Mesh(geo, legoMat(color));
}

// ── LEGO Brick ───────────────────────────────────────────────
function createBrick(widthStuds, depthStuds, heightPlates, color) {
  const group = new THREE.Group();
  const w = widthStuds * STUD;
  const d = depthStuds * STUD;
  const h = heightPlates * PLATE_H;

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    legoMat(color)
  );
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Studs on top
  for (let sx = 0; sx < widthStuds; sx++) {
    for (let sz = 0; sz < depthStuds; sz++) {
      const stud = createStud(color);
      stud.position.set(
        -w / 2 + STUD / 2 + sx * STUD,
        h + STUD_H / 2,
        -d / 2 + STUD / 2 + sz * STUD
      );
      stud.castShadow = true;
      group.add(stud);
    }
  }

  return group;
}

// ── LEGO Minifig ─────────────────────────────────────────────
function createMinifig(agent, index) {
  const group = new THREE.Group();
  const c = agent.color;

  // Legs — 2x1 brick
  const legs = createBrick(2, 1, 2, 0x1a1a2e);
  group.add(legs);

  // Torso — 2x1 brick, colored
  const torso = createBrick(2, 1, 3, c);
  torso.position.y = PLATE_H * 2 + STUD_H;
  group.add(torso);

  // Arms — small bricks on sides
  [-1, 1].forEach(side => {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(STUD * 0.4, PLATE_H * 2.5, STUD * 0.5),
      legoMat(c)
    );
    arm.position.set(
      side * (STUD * 1.2),
      PLATE_H * 2 + STUD_H + PLATE_H * 1.5,
      0
    );
    arm.castShadow = true;
    group.add(arm);
  });

  // Head — yellow cylinder (classic LEGO)
  const headGeo = new THREE.CylinderGeometry(STUD * 0.7, STUD * 0.7, STUD * 1.0, 16);
  const headMat = legoMat(0xffcc00);
  const head = new THREE.Mesh(headGeo, headMat);
  const headY = PLATE_H * 2 + STUD_H + PLATE_H * 3 + STUD_H + STUD * 0.5;
  head.position.y = headY;
  head.castShadow = true;
  group.add(head);

  // Head stud (the classic bump on top)
  const headStud = createStud(0xffcc00);
  headStud.position.y = headY + STUD * 0.5 + STUD_H / 2;
  group.add(headStud);

  // Face — simple dots for eyes and smile
  const eyeGeo = new THREE.CircleGeometry(0.06, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide });
  [-0.15, 0.15].forEach(xOff => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(xOff, headY + 0.08, STUD * 0.701);
    group.add(eye);
  });

  // Smile — arc
  const smileShape = new THREE.Shape();
  smileShape.absarc(0, 0, 0.12, Math.PI * 0.15, Math.PI * 0.85, false);
  const smileGeo = new THREE.ShapeGeometry(smileShape);
  const smile = new THREE.Mesh(smileGeo, eyeMat);
  smile.position.set(0, headY - 0.1, STUD * 0.701);
  smile.rotation.z = Math.PI;
  group.add(smile);

  // Agent color badge on torso — small colored plate
  const badge = new THREE.Mesh(
    new THREE.BoxGeometry(STUD * 0.6, STUD * 0.4, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  badge.position.set(0, PLATE_H * 2 + STUD_H + PLATE_H * 1.5, STUD * 0.52);
  group.add(badge);

  // Store reference for interaction
  group.userData = { agentId: agent.id, type: 'avatar', index };

  // Make the whole group clickable via the head
  head.userData = { agentId: agent.id, type: 'avatar', index };

  return group;
}

// ── LEGO Desk ────────────────────────────────────────────────
function createLegoDesk(agent) {
  const group = new THREE.Group();
  const isExec = agent.tier === TIER.EXECUTIVE;

  // Desk colors — playful palette
  const deskColors = {
    [TIER.EXECUTIVE]: 0xcc3333, // red
    [TIER.DIRECTOR]: 0x0055bf,  // blue
    [TIER.LEAD]: 0x00852b,      // green
  };
  const deskColor = deskColors[agent.tier] || 0x0055bf;

  const dw = isExec ? 6 : 4;
  const dd = isExec ? 3 : 2;

  // Desktop — flat plate
  const desktop = createBrick(dw, dd, 1, deskColor);
  desktop.position.y = BRICK_H * 2;
  group.add(desktop);

  // Legs — 1x1 brick columns (2 bricks tall)
  const legPositions = [
    [-(dw / 2 - 0.5) * STUD, 0, -(dd / 2 - 0.5) * STUD],
    [(dw / 2 - 0.5) * STUD, 0, -(dd / 2 - 0.5) * STUD],
    [-(dw / 2 - 0.5) * STUD, 0, (dd / 2 - 0.5) * STUD],
    [(dw / 2 - 0.5) * STUD, 0, (dd / 2 - 0.5) * STUD],
  ];
  legPositions.forEach(pos => {
    const leg = createBrick(1, 1, 3, deskColor);
    leg.position.set(...pos);
    group.add(leg);
  });

  // Monitor — small LEGO screen
  const monW = isExec ? 3 : 2;
  const monitor = createBrick(monW, 1, 2, 0x1a1a2e);
  monitor.position.set(0, BRICK_H * 2 + PLATE_H + STUD_H, -(dd / 2) * STUD + STUD * 0.5);
  group.add(monitor);

  // Screen face — bright colored panel
  const screenFace = new THREE.Mesh(
    new THREE.PlaneGeometry(monW * STUD * 0.85, PLATE_H * 1.5),
    legoMat(agent.color, { emissive: agent.color, emissiveIntensity: 0.3 })
  );
  screenFace.position.set(
    0,
    BRICK_H * 2 + PLATE_H + STUD_H + PLATE_H,
    -(dd / 2) * STUD + STUD * 0.5 + STUD * 0.51
  );
  group.add(screenFace);

  // Keyboard — thin flat plate
  const keyboard = createBrick(2, 1, 1, 0x8a8a8a);
  keyboard.position.set(0, BRICK_H * 2 + PLATE_H + STUD_H, STUD * 0.3);
  keyboard.scale.y = 0.3;
  group.add(keyboard);

  // Coffee mug — tiny cylinder
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(STUD * 0.25, STUD * 0.25, STUD * 0.5, 8),
    legoMat(isExec ? 0xff0000 : 0xffffff)
  );
  mug.position.set(dw / 2 * STUD - STUD, BRICK_H * 2 + PLATE_H + STUD_H + STUD * 0.25, STUD * 0.5);
  mug.castShadow = true;
  group.add(mug);

  return group;
}

// ── LEGO Baseplate Floor ─────────────────────────────────────
function buildBaseplate() {
  const SIZE = 40;
  const group = new THREE.Group();

  // Main baseplate — classic green
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(SIZE, PLATE_H, SIZE),
    legoMat(0x00852b)
  );
  plate.position.y = -PLATE_H / 2;
  plate.receiveShadow = true;
  group.add(plate);

  // Studs on baseplate — sparse for performance
  const studSpacing = 4;
  const halfSize = SIZE / 2;
  for (let x = -halfSize + STUD; x < halfSize; x += STUD * studSpacing) {
    for (let z = -halfSize + STUD; z < halfSize; z += STUD * studSpacing) {
      const stud = createStud(0x00852b);
      stud.position.set(x, STUD_H / 2, z);
      group.add(stud);
    }
  }

  // Road/path — gray plates connecting tiers
  const roadColor = 0x8a8a8a;
  const roadW = 3;

  // Main road (vertical)
  const mainRoad = new THREE.Mesh(
    new THREE.BoxGeometry(roadW * STUD, PLATE_H * 0.5, 18),
    legoMat(roadColor)
  );
  mainRoad.position.set(0, PLATE_H * 0.25, -6);
  group.add(mainRoad);

  // Cross roads
  [-6, -12].forEach(z => {
    const cross = new THREE.Mesh(
      new THREE.BoxGeometry(22, PLATE_H * 0.5, roadW * STUD * 0.6),
      legoMat(roadColor)
    );
    cross.position.set(0, PLATE_H * 0.25, z);
    group.add(cross);
  });

  scene.add(group);
}

// ── LEGO Walls ───────────────────────────────────────────────
function buildWalls() {
  const SIZE = 40;

  // Back wall — multi-colored brick wall
  const wallColors = [0xcc3333, 0x0055bf, 0xffcc00, 0xff6600, 0x00852b, 0xffffff];

  for (let x = -SIZE / 2; x < SIZE / 2; x += STUD * 2) {
    const layers = 3 + Math.floor(Math.random() * 2);
    for (let y = 0; y < layers; y++) {
      const color = wallColors[Math.floor(Math.random() * wallColors.length)];
      const brick = createBrick(2, 1, 3, color);
      brick.position.set(x + STUD, y * (BRICK_H + STUD_H), -SIZE / 2 + STUD / 2);
      scene.add(brick);
    }
  }

  // Side accents — smaller walls
  [-1, 1].forEach(side => {
    for (let z = -SIZE / 2; z < -SIZE / 2 + STUD * 8; z += STUD * 2) {
      const layers = 2 + Math.floor(Math.random() * 2);
      for (let y = 0; y < layers; y++) {
        const color = wallColors[Math.floor(Math.random() * wallColors.length)];
        const brick = createBrick(1, 2, 3, color);
        brick.position.set(side * (SIZE / 2 - STUD / 2), y * (BRICK_H + STUD_H), z + STUD);
        brick.rotation.y = Math.PI / 2;
        scene.add(brick);
      }
    }
  });
}

// ── LEGO Decorations ─────────────────────────────────────────
function buildDecorations() {
  // Trees — green cylinder + brown trunk
  const treePositions = [
    [-14, 0, 6], [14, 0, 6], [-14, 0, -16], [14, 0, -16],
    [-10, 0, 8], [10, 0, 8],
  ];
  treePositions.forEach(pos => {
    const tree = new THREE.Group();

    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(STUD * 0.3, STUD * 0.4, BRICK_H * 2, 8),
      legoMat(0x6b3a1f)
    );
    trunk.position.y = BRICK_H;
    trunk.castShadow = true;
    tree.add(trunk);

    // Foliage — stacked cylinders (LEGO tree style)
    const foliageColors = [0x00852b, 0x237841, 0x00652b];
    [2.0, 2.8, 3.4].forEach((h, i) => {
      const r = (1.2 - i * 0.3) * STUD;
      const foliage = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.6, r, STUD * 0.8, 8),
        legoMat(foliageColors[i % foliageColors.length])
      );
      foliage.position.y = BRICK_H * h;
      foliage.castShadow = true;
      tree.add(foliage);
    });

    tree.position.set(...pos);
    scene.add(tree);
  });

  // Flowers — tiny colored studs
  for (let i = 0; i < 20; i++) {
    const flowerColors = [0xff0000, 0xffcc00, 0xff69b4, 0xff6600, 0xcc33ff];
    const flower = createStud(flowerColors[i % flowerColors.length]);
    const angle = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * 6;
    flower.position.set(
      Math.cos(angle) * dist,
      STUD_H / 2,
      Math.sin(angle) * dist
    );
    scene.add(flower);
  }

  // Tier signs — small brick plates with colored indicators
  [
    { text: 'EXEC', z: 3, color: 0xcc3333 },
    { text: 'DIR', z: -3.5, color: 0x0055bf },
    { text: 'LEAD', z: -9.5, color: 0x00852b },
  ].forEach(({ z, color }) => {
    const sign = createBrick(4, 1, 1, color);
    sign.position.set(-12, 0, z);
    scene.add(sign);
  });

  // Flag pole at center
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 6, 8),
    legoMat(0x8a8a8a)
  );
  pole.position.set(0, 3, 6);
  pole.castShadow = true;
  scene.add(pole);

  // Flag — MONI banner
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 1.2),
    legoMat(0xcc3333, { side: THREE.DoubleSide })
  );
  flag.position.set(1, 5.2, 6);
  scene.add(flag);

  // Flag accent stripe
  const stripe = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 0.3),
    legoMat(0xffcc00, { side: THREE.DoubleSide })
  );
  stripe.position.set(1, 5.2, 6.001);
  scene.add(stripe);
}

// ── Lighting (toy photography style) ─────────────────────────
function buildLighting() {
  // Bright ambient — well-lit like a toy store
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  // Key light — warm white, high angle
  const key = new THREE.DirectionalLight(0xfff5e6, 1.0);
  key.position.set(10, 20, 15);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 50;
  key.shadow.camera.left = key.shadow.camera.bottom = -25;
  key.shadow.camera.right = key.shadow.camera.top = 25;
  key.shadow.bias = -0.001;
  key.shadow.radius = 3;
  scene.add(key);

  // Fill light — softer, from other side
  const fill = new THREE.DirectionalLight(0xe6f0ff, 0.4);
  fill.position.set(-10, 12, 8);
  scene.add(fill);

  // Backlight — rim separation
  const back = new THREE.DirectionalLight(0xffe0c0, 0.3);
  back.position.set(0, 8, -15);
  scene.add(back);

  // Bottom fill — reduce harsh shadows
  const bottom = new THREE.DirectionalLight(0xffffff, 0.15);
  bottom.position.set(0, -5, 0);
  scene.add(bottom);

  // Hemisphere light — sky/ground
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x00852b, 0.3);
  scene.add(hemi);
}

// ── Initialize ───────────────────────────────────────────────
export function initScene(canvas) {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Scene — bright sky blue background
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 30, 60);

  // Camera — toy photography angle
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(3, 16, 26);
  camera.lookAt(0, 2, -4);

  // Renderer
  const renderer = renderPipeline.init(canvas, scene, camera);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 5;
  controls.maxDistance = 40;
  controls.target.set(0, 2, -4);
  controls.update();

  // Build LEGO world
  buildLighting();
  buildBaseplate();
  buildWalls();
  buildWorkstations();
  buildDecorations();

  // Interaction
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mousemove', onCanvasHover);

  // Frame callback
  renderPipeline.onFrame(onFrame);

  // Events
  bus.on(EVENTS.AGENT_SELECT, (data) => focusAgent(data.id));
  bus.on(EVENTS.CAMERA_RESET, () => resetCamera());

  renderPipeline.start();
  bus.emit(EVENTS.SCENE_READY, { agentCount: registry.count });

  return { scene, camera, controls };
}

// ── Workstations ─────────────────────────────────────────────
function buildWorkstations() {
  const agents = registry.all();
  agents.forEach((agent, idx) => {
    const group = new THREE.Group();
    group.position.set(agent.position.x, 0, agent.position.z);

    // LEGO desk
    group.add(createLegoDesk(agent));

    // LEGO minifig
    const minifig = createMinifig(agent, idx);
    minifig.position.set(0, 0, agent.deskSize.d / 2 + STUD);
    group.add(minifig);
    agentMeshes.set(agent.id, minifig);

    // Nameplate — small colored brick in front
    const nameplate = createBrick(3, 1, 1, agent.color);
    nameplate.position.set(0, 0, agent.deskSize.d / 2 + STUD * 2.5);
    group.add(nameplate);

    scene.add(group);
  });
}

// ── Per-frame Animation ──────────────────────────────────────
function onFrame(delta, elapsed) {
  agentMeshes.forEach((group, id) => {
    const agent = registry.get(id);
    if (!agent) return;
    const idx = group.userData.index;

    // Gentle bobbing — like someone picked up the minifig
    group.position.y = Math.sin(elapsed * 1.5 + idx * 0.7) * 0.05;

    // Slight rotation — looking around
    group.rotation.y = Math.sin(elapsed * 0.5 + idx * 0.9) * 0.15;

    // Processing status — faster wobble
    if (agent.status === STATUS.PROCESSING) {
      group.rotation.y = Math.sin(elapsed * 2 + idx) * 0.25;
    }

    // Alert status — bouncing
    if (agent.status === STATUS.ALERT) {
      group.position.y = Math.abs(Math.sin(elapsed * 4 + idx)) * 0.15;
    }

    // Selected — pop up and spin
    if (selectedAgentId === id) {
      group.position.y = 0.3 + Math.sin(elapsed * 2) * 0.1;
      group.rotation.y = elapsed * 1.5;
    }
  });

  controls.update();
}

// ── Interaction ──────────────────────────────────────────────
function onCanvasClick(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);
  const objects = [];
  agentMeshes.forEach(g => g.traverse(child => { if (child.isMesh) objects.push(child); }));
  const hit = raycaster.intersectObjects(objects, false);
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
  const objects = [];
  agentMeshes.forEach(g => g.traverse(child => { if (child.isMesh) objects.push(child); }));
  const hit = raycaster.intersectObjects(objects, false);
  document.body.style.cursor = hit.length > 0 ? 'pointer' : 'default';
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
  animateCamera(
    new THREE.Vector3(agent.position.x + 2, 6, agent.position.z + 7),
    new THREE.Vector3(agent.position.x, 2, agent.position.z)
  );
}

function resetCamera() {
  selectedAgentId = null;
  animateCamera(
    new THREE.Vector3(3, 16, 26),
    new THREE.Vector3(0, 2, -4)
  );
}

function animateCamera(toPos, toTarget) {
  const fromPos = camera.position.clone();
  const fromTarget = controls.target.clone();
  const dur = 1200;
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

export function getScene() { return scene; }
export function getCamera() { return camera; }
