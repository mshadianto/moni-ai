/**
 * MONI 3D Workspace — GTA Realistic 4K Edition
 * Photorealistic open-world office compound with cinematic GTA atmosphere
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { bus, EVENTS } from './events.js';
import { CONFIG } from './config.js';
import { registry, TIER, STATUS } from './agents.js';
import { renderPipeline } from './renderer.js';

let scene, camera, controls;
const agentMeshes = new Map();
let raycaster, mouse;
let selectedAgentId = null;

// GTA color palette
const CONCRETE = 0x8c8c8c;
const ASPHALT = 0x2a2a2a;
const DARK_GLASS = 0x1a2a3a;
const STEEL = 0x6a6a72;
const GOLD_ACCENT = 0xc9a94e;
const NEON_BLUE = 0x00a8ff;
const NEON_PURPLE = 0x9b59b6;
const NEON_RED = 0xff2d55;
const SUNSET_ORANGE = 0xff6b35;
const PALM_GREEN = 0x1a5c1a;
const PALM_TRUNK = 0x5c3a1a;
const WATER_BLUE = 0x1a3d5c;
const SKY_TOP = 0x0a0a1e;
const SKY_HORIZON = 0x1a0a2e;

// ── Initialize ───────────────────────────────────────────────
export function initScene(canvas) {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  scene = new THREE.Scene();

  // GTA golden hour sky gradient — bright & warm
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2;
  skyCanvas.height = 512;
  const ctx = skyCanvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#4a90d9');
  grad.addColorStop(0.2, '#6db3f2');
  grad.addColorStop(0.4, '#87ceeb');
  grad.addColorStop(0.55, '#b8d4e8');
  grad.addColorStop(0.7, '#f0c987');
  grad.addColorStop(0.82, '#f5a623');
  grad.addColorStop(0.9, '#ff7043');
  grad.addColorStop(0.95, '#ff5722');
  grad.addColorStop(1.0, '#e64a19');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 512);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.magFilter = THREE.LinearFilter;
  scene.background = skyTex;

  scene.fog = new THREE.Fog(0xc8a882, 45, 80);

  // Cinematic camera
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(8, 20, 35);
  camera.lookAt(0, 3, -4);

  const renderer = renderPipeline.init(canvas, scene, camera);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 5;
  controls.maxDistance = 50;
  controls.target.set(0, 3, -4);
  controls.rotateSpeed = 0.4;
  controls.zoomSpeed = 0.6;
  controls.update();

  buildLighting();
  buildGround();
  buildMainBuilding();
  buildWorkstations();
  buildPalmTrees();
  buildVehicles();
  buildNeonSigns();
  buildStreetProps();
  buildStars();
  buildDistantSkyline();

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mousemove', onCanvasHover);
  renderPipeline.onFrame(onFrame);

  bus.on(EVENTS.AGENT_SELECT, (data) => focusAgent(data.id));
  bus.on(EVENTS.CAMERA_RESET, () => resetCamera());

  renderPipeline.start();
  bus.emit(EVENTS.SCENE_READY, { agentCount: registry.count });
  return { scene, camera, controls };
}

// ── GTA Lighting (sunset/night cinematic) ────────────────────
function buildLighting() {
  scene.add(new THREE.AmbientLight(0xfff0d6, 0.5));

  // Golden hour sun — warm bright low angle
  const sunset = new THREE.DirectionalLight(0xffcc80, 1.0);
  sunset.position.set(-20, 8, 15);
  sunset.castShadow = true;
  sunset.shadow.mapSize.set(2048, 2048);
  sunset.shadow.camera.near = 0.5;
  sunset.shadow.camera.far = 60;
  sunset.shadow.camera.left = sunset.shadow.camera.bottom = -30;
  sunset.shadow.camera.right = sunset.shadow.camera.top = 30;
  sunset.shadow.bias = -0.0003;
  sunset.shadow.radius = 3;
  scene.add(sunset);

  // Sky fill from opposite side — soft blue
  const blueFill = new THREE.DirectionalLight(0x87ceeb, 0.35);
  blueFill.position.set(15, 15, -10);
  scene.add(blueFill);

  // Overhead sky light — bright
  const skyLight = new THREE.DirectionalLight(0xffffff, 0.3);
  skyLight.position.set(0, 30, -5);
  scene.add(skyLight);

  // Hemisphere — sky blue / warm ground bounce
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0xd4a06a, 0.4);
  scene.add(hemi);

  // Neon pools on ground
  const neonLights = [
    { pos: [-10, 3, 5], color: NEON_BLUE, intensity: 0.8 },
    { pos: [10, 3, 5], color: NEON_PURPLE, intensity: 0.6 },
    { pos: [-10, 3, -10], color: NEON_RED, intensity: 0.5 },
    { pos: [10, 3, -10], color: NEON_BLUE, intensity: 0.6 },
    { pos: [0, 4, 8], color: GOLD_ACCENT, intensity: 0.4 },
    { pos: [0, 3, -16], color: NEON_PURPLE, intensity: 0.4 },
  ];
  neonLights.forEach(({ pos, color, intensity }) => {
    const pl = new THREE.PointLight(color, intensity, 12, 2);
    pl.position.set(...pos);
    scene.add(pl);
  });
}

// ── Ground (GTA streets) ─────────────────────────────────────
function buildGround() {
  // Main ground — dark concrete compound
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x4a6a3a, roughness: 0.9, metalness: 0.05 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Parking lot / compound floor — smooth concrete
  const compound = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 35),
    new THREE.MeshStandardMaterial({ color: 0x8a8a82, roughness: 0.75, metalness: 0.1 })
  );
  compound.rotation.x = -Math.PI / 2;
  compound.position.set(0, 0.01, -2);
  scene.add(compound);

  // Road in front
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 10),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.85, metalness: 0.05 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 18);
  scene.add(road);

  // Lane markings
  for (let x = -35; x < 35; x += 5) {
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 0.15),
      new THREE.MeshBasicMaterial({ color: 0xcccccc })
    );
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(x, 0.03, 18);
    scene.add(mark);
  }

  // Double yellow center line
  [-0.2, 0.2].forEach(off => {
    const yellow = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xccaa00 })
    );
    yellow.rotation.x = -Math.PI / 2;
    yellow.position.set(0, 0.03, 18 + off);
    scene.add(yellow);
  });

  // Curbs
  [-1, 1].forEach(side => {
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(80, 0.2, 0.4),
      new THREE.MeshStandardMaterial({ color: CONCRETE, roughness: 0.7 })
    );
    curb.position.set(0, 0.1, 18 + side * 5.2);
    scene.add(curb);
  });

  // Parking lines in compound
  for (let x = -16; x <= 16; x += 3) {
    const pLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 3),
      new THREE.MeshBasicMaterial({ color: 0x666666 })
    );
    pLine.rotation.x = -Math.PI / 2;
    pLine.position.set(x, 0.02, 10);
    scene.add(pLine);
  }
}

// ── Main Building (GTA corporate HQ) ─────────────────────────
function buildMainBuilding() {
  const g = new THREE.Group();

  // Main tower — dark glass skyscraper style
  const towerMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a4a5a,
    roughness: 0.05,
    metalness: 0.85,
    transparent: true,
    opacity: 0.8,
    reflectivity: 1.0,
  });
  const tower = new THREE.Mesh(new THREE.BoxGeometry(28, 14, 16), towerMat);
  tower.position.set(0, 7, -14);
  tower.castShadow = true;
  tower.receiveShadow = true;
  g.add(tower);

  // Glass floor lines (horizontal)
  for (let y = 1.5; y < 14; y += 2.5) {
    const floorLine = new THREE.Mesh(
      new THREE.BoxGeometry(28.1, 0.06, 16.1),
      new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.3, metalness: 0.8 })
    );
    floorLine.position.set(0, y, -14);
    g.add(floorLine);
  }

  // Vertical mullions
  for (let x = -12; x <= 12; x += 3) {
    const mullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 14, 0.08),
      new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.3, metalness: 0.8 })
    );
    mullion.position.set(x, 7, -5.95);
    g.add(mullion);
  }

  // Penthouse top — setback glass box
  const penthouse = new THREE.Mesh(
    new THREE.BoxGeometry(20, 4, 12),
    towerMat.clone()
  );
  penthouse.material.opacity = 0.7;
  penthouse.position.set(0, 16, -14);
  penthouse.castShadow = true;
  g.add(penthouse);

  // Rooftop helipad
  const helipad = new THREE.Mesh(
    new THREE.CircleGeometry(3, 32),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 })
  );
  helipad.rotation.x = -Math.PI / 2;
  helipad.position.set(0, 18.01, -14);
  g.add(helipad);

  // Helipad circle
  const heliCircle = new THREE.Mesh(
    new THREE.RingGeometry(2.5, 2.7, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  heliCircle.rotation.x = -Math.PI / 2;
  heliCircle.position.set(0, 18.02, -14);
  g.add(heliCircle);

  // H marking
  const hBar1 = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  hBar1.rotation.x = -Math.PI / 2;
  hBar1.position.set(-0.5, 18.03, -14);
  g.add(hBar1);
  const hBar2 = hBar1.clone();
  hBar2.position.x = 0.5;
  g.add(hBar2);
  const hBar3 = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  hBar3.rotation.x = -Math.PI / 2;
  hBar3.position.set(0, 18.03, -14);
  g.add(hBar3);

  // Entrance canopy — glass + steel
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.15, 5),
    new THREE.MeshPhysicalMaterial({ color: 0x1a2a3a, transparent: true, opacity: 0.5, roughness: 0.05, metalness: 0.8 })
  );
  canopy.position.set(0, 4, -3.5);
  canopy.castShadow = true;
  g.add(canopy);

  // Canopy support columns
  [-4, 4].forEach(x => {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 4, 12),
      new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.2, metalness: 0.9 })
    );
    col.position.set(x, 2, -1.5);
    col.castShadow = true;
    g.add(col);
  });

  // Lobby entrance glass — lit from inside
  const lobby = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 3.5),
    new THREE.MeshBasicMaterial({ color: NEON_BLUE, transparent: true, opacity: 0.08 })
  );
  lobby.position.set(0, 1.75, -5.95);
  g.add(lobby);

  // Interior warm glow visible through windows
  for (let y = 3; y < 14; y += 2.5) {
    for (let x = -12; x <= 12; x += 3) {
      if (Math.random() > 0.35) {
        const glow = new THREE.Mesh(
          new THREE.PlaneGeometry(2.5, 2),
          new THREE.MeshBasicMaterial({
            color: Math.random() > 0.6 ? 0xffcc80 : 0xc8e8ff,
            transparent: true,
            opacity: 0.04 + Math.random() * 0.05,
          })
        );
        glow.position.set(x, y + 0.5, -5.94);
        g.add(glow);
      }
    }
  }

  scene.add(g);
}

// ── GTA Characters ───────────────────────────────────────────
function createGTACharacter(agent, index) {
  const group = new THREE.Group();

  const skinTone = [0xc68642, 0x8d5524, 0xf1c27d, 0xe0ac69, 0xc68642, 0xf1c27d][index % 6];
  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6, metalness: 0.05 });

  // Shoes
  [-0.12, 0.12].forEach(xOff => {
    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.1, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.2 })
    );
    shoe.position.set(xOff, 0.05, 0.03);
    group.add(shoe);
  });

  // Legs — suit pants
  const pantColor = agent.tier === TIER.EXECUTIVE ? 0x1a1a2e : agent.tier === TIER.DIRECTOR ? 0x2a2a3e : 0x333340;
  [-0.12, 0.12].forEach(xOff => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: pantColor, roughness: 0.5, metalness: 0.1 })
    );
    leg.position.set(xOff, 0.5, 0);
    leg.castShadow = true;
    group.add(leg);
  });

  // Torso — suit jacket
  const jacketColor = agent.tier === TIER.EXECUTIVE ? 0x0a0a1e : 0x1a1a2e;
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 0.9, 10),
    new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.45, metalness: 0.15 })
  );
  torso.position.y = 1.35;
  torso.castShadow = true;
  group.add(torso);

  // Shirt/tie area
  const shirt = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7, side: THREE.DoubleSide })
  );
  shirt.position.set(0, 1.4, 0.23);
  group.add(shirt);

  // Tie — agent color
  const tie = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.4),
    new THREE.MeshBasicMaterial({ color: agent.color, side: THREE.DoubleSide })
  );
  tie.position.set(0, 1.3, 0.235);
  group.add(tie);

  // Arms
  [-1, 1].forEach(side => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 0.75, 8),
      new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.45, metalness: 0.15 })
    );
    arm.position.set(side * 0.35, 1.3, 0);
    arm.rotation.z = side * 0.12;
    group.add(arm);

    // Hand
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      skinMat
    );
    hand.position.set(side * 0.4, 0.88, 0);
    group.add(hand);
  });

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8),
    skinMat.clone()
  );
  neck.position.y = 1.87;
  group.add(neck);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 14, 12),
    skinMat.clone()
  );
  head.position.y = 2.15;
  head.scale.set(1, 1.1, 0.95);
  head.castShadow = true;
  head.userData = { agentId: agent.id, type: 'avatar', index };
  group.add(head);

  // Hair
  const hairStyle = index % 3;
  if (hairStyle === 0) {
    // Short buzz
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 })
    );
    hair.position.y = 2.18;
    hair.scale.set(1, 1.1, 0.95);
    group.add(hair);
  } else if (hairStyle === 1) {
    // Slicked back
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.3, metalness: 0.2 })
    );
    hair.position.set(0, 2.2, -0.02);
    hair.scale.set(1, 1.05, 1.1);
    group.add(hair);
  } else {
    // Faded sides
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.12, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.7 })
    );
    hair.position.set(0, 2.4, -0.02);
    group.add(hair);
  }

  // Sunglasses (for executives)
  if (agent.tier === TIER.EXECUTIVE) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.05, metalness: 0.8, transparent: true, opacity: 0.9 });
    [-0.08, 0.08].forEach(xOff => {
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.02), glassMat);
      lens.position.set(xOff, 2.17, 0.24);
      group.add(lens);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.02), glassMat);
    bridge.position.set(0, 2.17, 0.24);
    group.add(bridge);
  }

  // Earpiece (for directors)
  if (agent.tier === TIER.DIRECTOR) {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    ear.position.set(0.26, 2.12, 0);
    group.add(ear);
  }

  // Watch — gold for execs
  const watch = new THREE.Mesh(
    new THREE.TorusGeometry(0.04, 0.01, 6, 12),
    new THREE.MeshStandardMaterial({
      color: agent.tier === TIER.EXECUTIVE ? GOLD_ACCENT : STEEL,
      roughness: 0.15, metalness: 0.9
    })
  );
  watch.position.set(-0.4, 0.95, 0);
  watch.rotation.y = Math.PI / 2;
  group.add(watch);

  group.userData = { agentId: agent.id, type: 'avatar', index };
  torso.userData = { agentId: agent.id, type: 'avatar', index };

  return group;
}

// ── GTA Executive Desk ───────────────────────────────────────
function createGTADesk(agent) {
  const g = new THREE.Group();
  const isExec = agent.tier === TIER.EXECUTIVE;
  const w = isExec ? 3.8 : 2.8;
  const d = isExec ? 2.2 : 1.6;

  // Desk — dark wood / glass
  const deskMat = new THREE.MeshStandardMaterial({
    color: isExec ? 0x1a0a05 : 0x2a1a10,
    roughness: 0.25,
    metalness: 0.15,
  });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), deskMat);
  top.position.y = 0.82;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  // Chrome edge
  const edgeMat = new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.1, metalness: 0.9 });
  [d/2, -d/2].forEach(z => {
    const e = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.02, 0.02), edgeMat);
    e.position.set(0, 0.83, z);
    g.add(e);
  });

  // Legs — chrome
  [[-w/2+0.1, -d/2+0.1], [w/2-0.1, -d/2+0.1], [-w/2+0.1, d/2-0.1], [w/2-0.1, d/2-0.1]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.82, 8),
      edgeMat.clone()
    );
    leg.position.set(x, 0.41, z);
    g.add(leg);
  });

  // Monitor — ultrawide curved (flat approx)
  const monW = isExec ? 1.6 : 1.0;
  const monH = isExec ? 0.5 : 0.35;
  const monitorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.1, metalness: 0.5 });
  const monitor = new THREE.Mesh(new THREE.BoxGeometry(monW, monH, 0.04), monitorMat);
  monitor.position.set(0, 1.2, -d/2 + 0.3);
  g.add(monitor);

  // Screen glow
  const screenMat = new THREE.MeshBasicMaterial({ color: agent.color, transparent: true, opacity: 0.12 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(monW - 0.08, monH - 0.05), screenMat);
  screen.position.set(0, 1.2, -d/2 + 0.325);
  g.add(screen);

  // Monitor stand
  const mStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, 0.3, 8),
    edgeMat.clone()
  );
  mStand.position.set(0, 0.97, -d/2 + 0.3);
  g.add(mStand);

  // Keyboard — slim
  const kb = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.015, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.3 })
  );
  kb.position.set(0, 0.85, 0.15);
  g.add(kb);

  // Coffee cup — stainless
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.04, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.1, metalness: 0.9 })
  );
  cup.position.set(w/2 - 0.25, 0.91, 0.3);
  g.add(cup);

  // Phone
  const phone = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.01, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.1, metalness: 0.3 })
  );
  phone.position.set(-w/2 + 0.3, 0.85, 0.25);
  g.add(phone);

  // Executive: whiskey glass
  if (isExec) {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.035, 0.08, 12),
      new THREE.MeshPhysicalMaterial({ color: 0x3a2a0a, transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.1 })
    );
    glass.position.set(w/2 - 0.5, 0.89, 0.4);
    g.add(glass);
  }

  return g;
}

// ── Executive Chair ──────────────────────────────────────────
function createChair(agent) {
  const g = new THREE.Group();
  const isExec = agent.tier === TIER.EXECUTIVE;
  const chairMat = new THREE.MeshStandardMaterial({
    color: isExec ? 0x0a0a0a : 0x1a1a1a,
    roughness: 0.3,
    metalness: 0.15,
  });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), chairMat);
  seat.position.y = 0.5;
  g.add(seat);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, isExec ? 0.8 : 0.5, 0.06),
    chairMat
  );
  back.position.set(0, isExec ? 0.94 : 0.79, -0.22);
  g.add(back);

  // Armrests for exec
  if (isExec) {
    [-1, 1].forEach(side => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), chairMat);
      arm.position.set(side * 0.27, 0.65, -0.05);
      g.add(arm);
    });
  }

  // Chrome base
  const baseMat = new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.1, metalness: 0.9 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), baseMat);
  pole.position.y = 0.23;
  g.add(pole);

  // Star base
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.3), baseMat);
    arm.position.set(Math.cos(a) * 0.15, 0.02, Math.sin(a) * 0.15);
    arm.rotation.y = -a;
    g.add(arm);
  }

  return g;
}

// ── Palm Trees ───────────────────────────────────────────────
function buildPalmTrees() {
  const positions = [
    [-18, 0, 8], [18, 0, 8], [-18, 0, -2], [18, 0, -2],
    [-22, 0, 14], [22, 0, 14], [-14, 0, 14], [14, 0, 14],
  ];
  positions.forEach(pos => {
    const tree = new THREE.Group();

    // Trunk — slightly curved
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 8, 8);
    const trunk = new THREE.Mesh(trunkGeo,
      new THREE.MeshStandardMaterial({ color: PALM_TRUNK, roughness: 0.8 })
    );
    trunk.position.y = 4;
    trunk.rotation.z = (Math.random() - 0.5) * 0.08;
    trunk.castShadow = true;
    tree.add(trunk);

    // Fronds
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const frond = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 3.5, 4),
        new THREE.MeshStandardMaterial({ color: PALM_GREEN, roughness: 0.6, side: THREE.DoubleSide })
      );
      frond.position.set(Math.cos(angle) * 0.5, 8.5, Math.sin(angle) * 0.5);
      frond.rotation.set(0.8, angle, 0);
      frond.castShadow = true;
      tree.add(frond);
    }

    tree.position.set(...pos);
    scene.add(tree);
  });
}

// ── Vehicles ─────────────────────────────────────────────────
function buildVehicles() {
  const carColors = [0x0a0a0a, 0xcc0000, 0x1a1a4e, 0xffffff, 0x2a2a2a];

  const carData = [
    { x: -7, z: 10, rot: 0 },
    { x: 3, z: 10, rot: 0 },
    { x: 10, z: 11.5, rot: Math.PI },
    { x: -14, z: 11.5, rot: Math.PI },
  ];

  carData.forEach(({ x, z, rot }, i) => {
    const car = new THREE.Group();
    const color = carColors[i % carColors.length];
    const carMat = new THREE.MeshStandardMaterial({ color, roughness: 0.15, metalness: 0.6 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 1.1), carMat);
    body.position.y = 0.5;
    body.castShadow = true;
    car.add(body);

    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.5, 1.0),
      new THREE.MeshPhysicalMaterial({ color: DARK_GLASS, transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.5 })
    );
    cabin.position.set(-0.1, 1.05, 0);
    car.add(cabin);

    // Wheels
    [[-0.7, -0.5], [-0.7, 0.5], [0.7, -0.5], [0.7, 0.5]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.3 })
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.2, wz);
      car.add(wheel);
    });

    // Headlights
    [[-0.5], [0.5]].forEach(([wz]) => {
      const light = new THREE.Mesh(
        new THREE.CircleGeometry(0.06, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffcc })
      );
      light.position.set(1.11, 0.5, wz);
      light.rotation.y = Math.PI / 2;
      car.add(light);
    });

    // Taillights
    [[-0.5], [0.5]].forEach(([wz]) => {
      const tl = new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 8),
        new THREE.MeshBasicMaterial({ color: NEON_RED })
      );
      tl.position.set(-1.11, 0.5, wz);
      tl.rotation.y = -Math.PI / 2;
      car.add(tl);
    });

    car.rotation.y = rot;
    car.position.set(x, 0, z);
    scene.add(car);
  });
}

// ── Neon Signs ───────────────────────────────────────────────
function buildNeonSigns() {
  // "MONI HQ" neon on building
  const signBack = new THREE.Mesh(
    new THREE.BoxGeometry(8, 1.5, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.3, metalness: 0.5 })
  );
  signBack.position.set(0, 15, -5.8);
  scene.add(signBack);

  // Neon text glow
  const neonGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 1),
    new THREE.MeshBasicMaterial({ color: NEON_BLUE, transparent: true, opacity: 0.15 })
  );
  neonGlow.position.set(0, 15, -5.69);
  scene.add(neonGlow);

  // Neon point light
  const neonLight = new THREE.PointLight(NEON_BLUE, 1.0, 8, 2);
  neonLight.position.set(0, 15, -4);
  scene.add(neonLight);

  // Side neon strips on building
  [[-14.05, NEON_PURPLE], [14.05, NEON_BLUE]].forEach(([x, color]) => {
    for (let y = 0; y < 14; y += 2.5) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 2, 0.06),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 })
      );
      strip.position.set(x, y + 1.5, -14);
      scene.add(strip);
    }
    const sLight = new THREE.PointLight(color, 0.3, 6, 2);
    sLight.position.set(x > 0 ? 15 : -15, 7, -14);
    scene.add(sLight);
  });

  // Ground-level neon accent strip along building front
  const frontNeon = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.08, 0.08),
    new THREE.MeshBasicMaterial({ color: NEON_BLUE, transparent: true, opacity: 0.6 })
  );
  frontNeon.position.set(0, 0.1, -6);
  scene.add(frontNeon);
}

// ── Street Props ─────────────────────────────────────────────
function buildStreetProps() {
  // Street lights
  [-12, -4, 4, 12].forEach(x => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.6 })
    );
    post.position.set(x, 3, 13);
    post.castShadow = true;
    scene.add(post);

    // Lamp head
    const lHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.1, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.7 })
    );
    lHead.position.set(x, 6.1, 13);
    scene.add(lHead);

    // Light
    const sl = new THREE.PointLight(0xffa060, 0.6, 10, 2);
    sl.position.set(x, 5.8, 13);
    scene.add(sl);

    // Glow surface
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xffa060, transparent: true, opacity: 0.5 })
    );
    glow.rotation.x = Math.PI / 2;
    glow.position.set(x, 6.0, 13);
    scene.add(glow);
  });

  // Fire hydrant
  const hydrant = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 })
  );
  hydrant.position.set(-8, 0.25, 12.5);
  scene.add(hydrant);

  // Dumpster
  const dumpster = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.7, metalness: 0.2 })
  );
  dumpster.position.set(16, 0.5, -5);
  dumpster.castShadow = true;
  scene.add(dumpster);
}

// ── Stars ────────────────────────────────────────────────────
function buildStars() {
  const count = 300;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.4;
    const r = 60 + Math.random() * 20;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) + 10;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.15, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(stars);
}

// ── Distant Skyline ──────────────────────────────────────────
function buildDistantSkyline() {
  const buildingData = [
    { x: -35, z: -30, w: 4, h: 20, d: 4, color: 0x6a7a8a },
    { x: -28, z: -35, w: 5, h: 28, d: 5, color: 0x5a6a7a },
    { x: -20, z: -32, w: 3, h: 15, d: 3, color: 0x7a8a9a },
    { x: 20, z: -32, w: 4, h: 22, d: 4, color: 0x5a6a7a },
    { x: 28, z: -35, w: 5, h: 32, d: 5, color: 0x6a7a8a },
    { x: 35, z: -30, w: 3, h: 18, d: 3, color: 0x7a8a9a },
    { x: -32, z: -38, w: 6, h: 25, d: 6, color: 0x4a5a6a },
    { x: 32, z: -38, w: 6, h: 20, d: 6, color: 0x4a5a6a },
    { x: 0, z: -40, w: 4, h: 35, d: 4, color: 0x5a6a7a },
    { x: -10, z: -38, w: 5, h: 24, d: 4, color: 0x6a7888 },
    { x: 10, z: -38, w: 5, h: 27, d: 4, color: 0x6a7888 },
  ];

  buildingData.forEach(({ x, z, w, h, d, color }) => {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 })
    );
    b.position.set(x, h / 2, z);
    scene.add(b);

    // Random lit windows
    for (let wy = 2; wy < h - 1; wy += 2) {
      for (let wx = -w/2 + 0.8; wx < w/2; wx += 1.5) {
        if (Math.random() > 0.5) {
          const win = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.8),
            new THREE.MeshBasicMaterial({
              color: Math.random() > 0.5 ? 0xffe8c0 : 0xa0d0ff,
              transparent: true,
              opacity: 0.08 + Math.random() * 0.08,
            })
          );
          win.position.set(x + wx, wy, z + d/2 + 0.01);
          scene.add(win);
        }
      }
    }

    // Rooftop light
    if (Math.random() > 0.5) {
      const rl = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 6),
        new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? NEON_RED : 0xffffff })
      );
      rl.position.set(x, h + 0.2, z);
      scene.add(rl);
    }
  });
}

// ── Workstations ─────────────────────────────────────────────
function buildWorkstations() {
  registry.all().forEach((agent, idx) => {
    const group = new THREE.Group();
    group.position.set(agent.position.x, 0, agent.position.z);

    group.add(createGTADesk(agent));

    const chair = createChair(agent);
    chair.position.set(0, 0, agent.deskSize.d / 2 + 0.6);
    group.add(chair);

    const character = createGTACharacter(agent, idx);
    character.position.set(0, 0, agent.deskSize.d / 2 + 0.6);
    group.add(character);
    agentMeshes.set(agent.id, character);

    scene.add(group);
  });
}

// ── Animation ────────────────────────────────────────────────
function onFrame(delta, elapsed) {
  agentMeshes.forEach((group, id) => {
    const agent = registry.get(id);
    if (!agent) return;
    const idx = group.userData.index;

    // Subtle breathing
    group.position.y = Math.sin(elapsed * 0.8 + idx * 0.6) * 0.01;

    // Slight head turn
    group.rotation.y = Math.sin(elapsed * 0.3 + idx * 1.2) * 0.08;

    if (agent.status === STATUS.PROCESSING) {
      // Typing — slight forward lean and head bob
      group.rotation.x = Math.sin(elapsed * 3 + idx) * 0.02;
    }

    if (agent.status === STATUS.ALERT) {
      // Tense — sharp head movements
      group.rotation.y = Math.sin(elapsed * 4 + idx) * 0.2;
      group.position.y = Math.sin(elapsed * 6) * 0.02;
    }

    if (selectedAgentId === id) {
      group.position.y = 0.05;
      group.rotation.y = Math.sin(elapsed * 0.8) * 0.15;
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
    if (target?.userData.agentId) bus.emit(EVENTS.AGENT_SELECT, { id: target.userData.agentId });
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

function focusAgent(agentId) {
  selectedAgentId = agentId;
  const agent = registry.get(agentId);
  if (!agent) return;
  animateCamera(
    new THREE.Vector3(agent.position.x + 2, 4, agent.position.z + 5),
    new THREE.Vector3(agent.position.x, 1.5, agent.position.z)
  );
}

function resetCamera() {
  selectedAgentId = null;
  animateCamera(new THREE.Vector3(8, 20, 35), new THREE.Vector3(0, 3, -4));
}

function animateCamera(toPos, toTarget) {
  const fromPos = camera.position.clone();
  const fromTarget = controls.target.clone();
  const dur = 1800;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    camera.position.lerpVectors(fromPos, toPos, e);
    controls.target.lerpVectors(fromTarget, toTarget, e);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function getScene() { return scene; }
export function getCamera() { return camera; }
