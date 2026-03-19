/**
 * MONI 3D Workspace — The Simpsons x Indonesia Edition
 * Springfield-style office with Indonesian flags, batik patterns, and yellow characters
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
let raycaster, mouse;
let selectedAgentId = null;

// Simpsons palette
const YELLOW_SKIN = 0xffd90f;
const YELLOW_DARK = 0xe6c200;
const SPRINGFIELD_SKY = 0x7ec8e3;
const GRASS_GREEN = 0x4a8c3f;
const SIDEWALK = 0xc4b59d;
const ROAD_GRAY = 0x555555;
const BUILDING_PINK = 0xe8a0bf;
const BUILDING_BLUE = 0x6baed6;
const BUILDING_BEIGE = 0xdec9a0;
const DONUT_PINK = 0xff69b4;
const MERAH = 0xff0000;    // Indonesian red
const PUTIH = 0xffffff;    // Indonesian white
const GARUDA_GOLD = 0xd4a017;

// ── Materials ────────────────────────────────────────────────
function cartoonMat(color, opts = {}) {
  return new THREE.MeshPhongMaterial({
    color,
    shininess: 30,
    flatShading: false,
    ...opts,
  });
}

// ── Initialize ───────────────────────────────────────────────
export function initScene(canvas) {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(SPRINGFIELD_SKY);
  scene.fog = new THREE.Fog(SPRINGFIELD_SKY, 40, 70);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(5, 18, 30);
  camera.lookAt(0, 2, -4);

  const renderer = renderPipeline.init(canvas, scene, camera);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 5;
  controls.maxDistance = 45;
  controls.target.set(0, 2, -4);
  controls.update();

  buildLighting();
  buildGround();
  buildSpringfieldOffice();
  buildIndonesianFlags();
  buildWorkstations();
  buildSpringfieldDecorations();
  buildClouds();

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mousemove', onCanvasHover);

  renderPipeline.onFrame(onFrame);

  bus.on(EVENTS.AGENT_SELECT, (data) => focusAgent(data.id));
  bus.on(EVENTS.CAMERA_RESET, () => resetCamera());

  renderPipeline.start();
  bus.emit(EVENTS.SCENE_READY, { agentCount: registry.count });

  return { scene, camera, controls };
}

// ── Lighting (bright cartoon style) ──────────────────────────
function buildLighting() {
  scene.add(new THREE.AmbientLight(0xfff8e1, 0.65));

  const sun = new THREE.DirectionalLight(0xfff5d6, 1.1);
  sun.position.set(12, 25, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -30;
  sun.shadow.camera.right = sun.shadow.camera.top = 30;
  sun.shadow.bias = -0.001;
  sun.shadow.radius = 2;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xc4e0ff, 0.3);
  fill.position.set(-10, 10, 8);
  scene.add(fill);

  const hemi = new THREE.HemisphereLight(SPRINGFIELD_SKY, GRASS_GREEN, 0.4);
  scene.add(hemi);
}

// ── Ground ───────────────────────────────────────────────────
function buildGround() {
  // Grass
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    cartoonMat(GRASS_GREEN)
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  // Main road
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 50),
    cartoonMat(ROAD_GRAY)
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.01, -5);
  scene.add(road);

  // Road center line
  for (let z = -25; z < 20; z += 3) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 1.5),
      cartoonMat(0xffcc00)
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.02, z);
    scene.add(line);
  }

  // Sidewalks
  [-1, 1].forEach(side => {
    const sidewalk = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 50),
      cartoonMat(SIDEWALK)
    );
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(side * 5.5, 0.015, -5);
    scene.add(sidewalk);
  });

  // Curb edges
  [-1, 1].forEach(side => {
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.15, 50),
      cartoonMat(0xaaa48c)
    );
    curb.position.set(side * 4, 0.075, -5);
    scene.add(curb);
  });
}

// ── Springfield Office Building ──────────────────────────────
function buildSpringfieldOffice() {
  const g = new THREE.Group();

  // Main building — Springfield Nuclear style but as office
  const mainBody = new THREE.Mesh(
    new THREE.BoxGeometry(30, 8, 18),
    cartoonMat(BUILDING_BEIGE)
  );
  mainBody.position.set(0, 4, -14);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  g.add(mainBody);

  // Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(31, 0.5, 19),
    cartoonMat(0x8b4513)
  );
  roof.position.set(0, 8.25, -14);
  g.add(roof);

  // Roof edge trim — red & white (Indonesian colors)
  const roofTrimRed = new THREE.Mesh(
    new THREE.BoxGeometry(31.5, 0.3, 0.3),
    cartoonMat(MERAH)
  );
  roofTrimRed.position.set(0, 8.55, -5.1);
  g.add(roofTrimRed);

  const roofTrimWhite = new THREE.Mesh(
    new THREE.BoxGeometry(31.5, 0.3, 0.3),
    cartoonMat(PUTIH)
  );
  roofTrimWhite.position.set(0, 8.85, -5.1);
  g.add(roofTrimWhite);

  // Windows
  for (let x = -12; x <= 12; x += 4) {
    for (let y = 0; y < 2; y++) {
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2.5),
        cartoonMat(0x87ceeb, { transparent: true, opacity: 0.6 })
      );
      win.position.set(x, 3 + y * 3.2, -4.95);
      g.add(win);

      // Window frame
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(2.3, 2.8),
        cartoonMat(PUTIH)
      );
      frame.position.set(x, 3 + y * 3.2, -4.96);
      g.add(frame);
    }
  }

  // Entrance door
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 4),
    cartoonMat(0x8b4513)
  );
  door.position.set(0, 2, -4.94);
  g.add(door);

  // Door arch
  const arch = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 16, 0, Math.PI),
    cartoonMat(0x8b4513)
  );
  arch.position.set(0, 4, -4.93);
  g.add(arch);

  // Sign: "MONI KANTOR" (MONI Office)
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(10, 2, 0.3),
    cartoonMat(PUTIH)
  );
  signBoard.position.set(0, 9.5, -5);
  g.add(signBoard);

  // Sign border — red
  const signBorder = new THREE.Mesh(
    new THREE.BoxGeometry(10.4, 2.4, 0.2),
    cartoonMat(MERAH)
  );
  signBorder.position.set(0, 9.5, -5.05);
  g.add(signBorder);

  scene.add(g);
}

// ── Indonesian Flags ─────────────────────────────────────────
function buildIndonesianFlags() {
  const flagPositions = [
    { x: -16, z: -2 },
    { x: 16, z: -2 },
    { x: -10, z: 8 },
    { x: 10, z: 8 },
    { x: 0, z: 10 },
  ];

  flagPositions.forEach(({ x, z }, i) => {
    const g = new THREE.Group();

    // Pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 8, 8),
      cartoonMat(0xc0c0c0)
    );
    pole.position.y = 4;
    g.add(pole);

    // Pole cap — gold (Garuda)
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      cartoonMat(GARUDA_GOLD)
    );
    cap.position.y = 8.1;
    g.add(cap);

    // Bendera Merah Putih — Red stripe
    const merah = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 1),
      cartoonMat(MERAH, { side: THREE.DoubleSide })
    );
    merah.position.set(1.5, 7.3, 0);
    merah.userData._flag = true;
    merah.userData._flagIndex = i;
    g.add(merah);

    // White stripe
    const putih = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 1),
      cartoonMat(PUTIH, { side: THREE.DoubleSide })
    );
    putih.position.set(1.5, 6.3, 0);
    putih.userData._flag = true;
    putih.userData._flagIndex = i;
    g.add(putih);

    // Pole base — concrete
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.3, 0.8),
      cartoonMat(0x999999)
    );
    base.position.y = 0.15;
    g.add(base);

    g.position.set(x, 0, z);
    scene.add(g);
  });

  // Giant Garuda emblem behind the building — gold relief
  const garudaBody = new THREE.Mesh(
    new THREE.CircleGeometry(2.5, 32),
    cartoonMat(GARUDA_GOLD)
  );
  garudaBody.position.set(0, 6, -22.9);
  scene.add(garudaBody);

  // Garuda wings — simplified triangles
  [-1, 1].forEach(side => {
    const wing = new THREE.Mesh(
      new THREE.ConeGeometry(2, 3, 4),
      cartoonMat(GARUDA_GOLD)
    );
    wing.position.set(side * 3, 6.5, -22.8);
    wing.rotation.z = side * 0.5;
    scene.add(wing);
  });

  // Bhinneka Tunggal Ika banner — ribbon below Garuda
  const ribbon = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.6, 0.2),
    cartoonMat(PUTIH)
  );
  ribbon.position.set(0, 3.3, -22.9);
  scene.add(ribbon);
}

// ── Simpsons-style Character (yellow skin) ───────────────────
function createSimpsonsCharacter(agent, index) {
  const group = new THREE.Group();
  const c = new THREE.Color(agent.color);

  // Body/torso — agent colored
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.5, 1.4, 12),
    cartoonMat(agent.color)
  );
  body.position.y = 1.3;
  body.castShadow = true;
  group.add(body);

  // Belly roundness
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    cartoonMat(agent.color)
  );
  belly.position.y = 0.9;
  belly.rotation.x = Math.PI;
  group.add(belly);

  // Legs — short cylinders
  [-0.2, 0.2].forEach(xOff => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8),
      cartoonMat(0x3366cc)  // blue pants like Homer
    );
    leg.position.set(xOff, 0.3, 0);
    leg.castShadow = true;
    group.add(leg);

    // Shoes
    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.12, 0.35),
      cartoonMat(0x333333)
    );
    shoe.position.set(xOff, 0.06, 0.05);
    group.add(shoe);
  });

  // Arms — cylinders
  [-1, 1].forEach(side => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8),
      cartoonMat(YELLOW_SKIN)
    );
    arm.position.set(side * 0.55, 1.5, 0);
    arm.rotation.z = side * 0.2;
    group.add(arm);

    // Hand — small yellow sphere
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      cartoonMat(YELLOW_SKIN)
    );
    hand.position.set(side * 0.65, 1.0, 0);
    group.add(hand);
  });

  // HEAD — the iconic Simpsons yellow
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 12),
    cartoonMat(YELLOW_SKIN)
  );
  head.position.y = 2.5;
  head.scale.set(1, 1.15, 0.95);
  head.castShadow = true;
  group.add(head);

  // Eyes — big white circles with black pupils (Simpsons signature)
  [-0.18, 0.18].forEach((xOff, i) => {
    // Eye white
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 8),
      cartoonMat(PUTIH)
    );
    eyeWhite.position.set(xOff, 2.6, 0.4);
    eyeWhite.scale.set(0.8, 1, 0.5);
    group.add(eyeWhite);

    // Pupil — black dot
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      cartoonMat(0x111111)
    );
    pupil.position.set(xOff, 2.58, 0.52);
    group.add(pupil);
  });

  // Mouth — simple smile line
  const mouthCurve = new THREE.EllipseCurve(0, 0, 0.2, 0.08, 0, Math.PI, false);
  const mouthPoints = mouthCurve.getPoints(16);
  const mouthGeo = new THREE.BufferGeometry().setFromPoints(
    mouthPoints.map(p => new THREE.Vector3(p.x, p.y, 0))
  );
  const mouth = new THREE.Line(mouthGeo,
    new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 })
  );
  mouth.position.set(0, 2.3, 0.52);
  group.add(mouth);

  // Hair/head accessory varies by tier
  if (agent.tier === TIER.EXECUTIVE) {
    // Crown/peci (Indonesian cap) for executives
    const peci = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 0.3, 16),
      cartoonMat(0x1a1a1a) // black peci
    );
    peci.position.y = 3.05;
    group.add(peci);
  } else if (agent.tier === TIER.DIRECTOR) {
    // Hard hat style
    const hat = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      cartoonMat(agent.color)
    );
    hat.position.y = 2.95;
    group.add(hat);
  } else {
    // Simple hair tuft
    const hair = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.3, 6),
      cartoonMat(0x333333)
    );
    hair.position.set(0, 3.1, 0);
    group.add(hair);
  }

  // Collar — agent color accent
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.06, 8, 16),
    cartoonMat(PUTIH)
  );
  collar.position.y = 1.95;
  collar.rotation.x = Math.PI / 2;
  group.add(collar);

  // Name badge
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.2),
    cartoonMat(PUTIH, { side: THREE.DoubleSide })
  );
  badge.position.set(0.2, 1.6, 0.46);
  group.add(badge);

  group.userData = { agentId: agent.id, type: 'avatar', index };
  // Make head clickable
  head.userData = { agentId: agent.id, type: 'avatar', index };
  body.userData = { agentId: agent.id, type: 'avatar', index };

  return group;
}

// ── Springfield-style Desk ───────────────────────────────────
function createSpringfieldDesk(agent) {
  const g = new THREE.Group();
  const isExec = agent.tier === TIER.EXECUTIVE;
  const w = isExec ? 3.5 : 2.5;
  const d = isExec ? 2 : 1.5;

  // Desk top — wood
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.12, d),
    cartoonMat(0xa0522d)  // brown wood
  );
  top.position.y = 0.8;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  // Desk panel front
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.65, 0.08),
    cartoonMat(0x8b4513)
  );
  panel.position.set(0, 0.45, d / 2);
  g.add(panel);

  // Legs
  [[-w/2+0.1, -d/2+0.1], [w/2-0.1, -d/2+0.1], [-w/2+0.1, d/2-0.1], [w/2-0.1, d/2-0.1]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.8, 0.12),
      cartoonMat(0x8b4513)
    );
    leg.position.set(x, 0.4, z);
    g.add(leg);
  });

  // Computer monitor — boxy CRT style (like Springfield)
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.7, 0.7),
    cartoonMat(0xd4d4d4)
  );
  monitor.position.set(0, 1.2, -d/2 + 0.5);
  g.add(monitor);

  // Screen
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 0.45),
    cartoonMat(agent.color, { emissive: agent.color, emissiveIntensity: 0.2 })
  );
  screen.position.set(0, 1.25, -d/2 + 0.86);
  g.add(screen);

  // Keyboard
  const kb = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.04, 0.25),
    cartoonMat(0xd4d4d4)
  );
  kb.position.set(0, 0.88, 0.1);
  g.add(kb);

  // Coffee mug — Simpsons style
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8),
    cartoonMat(DONUT_PINK)
  );
  mug.position.set(w/2 - 0.3, 0.96, 0.3);
  g.add(mug);

  // Coffee inside
  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.09, 8),
    cartoonMat(0x3e1f0a)
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.set(w/2 - 0.3, 1.06, 0.3);
  g.add(coffee);

  // Small Indonesian flag on desk
  const miniPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6),
    cartoonMat(0x999999)
  );
  miniPole.position.set(-w/2 + 0.3, 1.11, -d/2 + 0.3);
  g.add(miniPole);

  const miniMerah = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.12),
    cartoonMat(MERAH, { side: THREE.DoubleSide })
  );
  miniMerah.position.set(-w/2 + 0.48, 1.28, -d/2 + 0.3);
  g.add(miniMerah);

  const miniPutih = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.12),
    cartoonMat(PUTIH, { side: THREE.DoubleSide })
  );
  miniPutih.position.set(-w/2 + 0.48, 1.16, -d/2 + 0.3);
  g.add(miniPutih);

  return g;
}

// ── Springfield Decorations ──────────────────────────────────
function buildSpringfieldDecorations() {
  // Donut (giant) — Springfield signature, near entrance
  const donutGroup = new THREE.Group();
  const donut = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.6, 12, 24),
    cartoonMat(DONUT_PINK)
  );
  donut.rotation.x = Math.PI / 2;
  donutGroup.add(donut);

  // Sprinkles
  for (let i = 0; i < 20; i++) {
    const sprinkle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.15, 4),
      cartoonMat([0xff0000, 0x00ff00, 0xffff00, 0xff6600, 0x0066ff][i % 5])
    );
    const angle = (i / 20) * Math.PI * 2;
    sprinkle.position.set(
      Math.cos(angle) * 1.5,
      0.65,
      Math.sin(angle) * 0.4
    );
    sprinkle.rotation.set(Math.random(), Math.random(), Math.random());
    donutGroup.add(sprinkle);
  }
  donutGroup.position.set(13, 2.5, 6);
  donutGroup.userData._donut = true;
  scene.add(donutGroup);

  // Donut stand
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.5, 2.5, 8),
    cartoonMat(0x8b4513)
  );
  stand.position.set(13, 1.25, 6);
  scene.add(stand);

  // Springfield trees — round cartoony
  const treePositions = [
    [-15, 5], [15, 5], [-18, -8], [18, -8],
    [-12, 10], [12, 10], [-18, -16], [18, -16],
  ];
  treePositions.forEach(([x, z]) => {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 2.5, 8),
      cartoonMat(0x6b3a1f)
    );
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    tree.add(trunk);

    // Round blob foliage — Simpsons style
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 12, 10),
      cartoonMat(0x2d8c2d)
    );
    foliage.position.y = 3.5;
    foliage.scale.set(1, 1.2, 1);
    foliage.castShadow = true;
    tree.add(foliage);

    // Secondary foliage blob
    const f2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 10, 8),
      cartoonMat(0x3da03d)
    );
    f2.position.set(0.5, 4.2, 0.3);
    tree.add(f2);

    tree.position.set(x, 0, z);
    scene.add(tree);
  });

  // Krusty Burger style food cart — Indonesian: "Warung MONI"
  const warung = new THREE.Group();
  const cart = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2, 2),
    cartoonMat(MERAH)
  );
  cart.position.y = 1;
  warung.add(cart);

  // Warung roof
  const wRoof = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.15, 2.5),
    cartoonMat(PUTIH)
  );
  wRoof.position.y = 2.1;
  warung.add(wRoof);

  // Warung counter
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.1, 0.3),
    cartoonMat(0xa0522d)
  );
  counter.position.set(0, 1.5, 1.15);
  warung.add(counter);

  warung.position.set(-13, 0, 6);
  scene.add(warung);

  // Bench
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.12, 0.6),
    cartoonMat(0x8b4513)
  );
  bench.position.set(-13, 0.5, 8);
  scene.add(bench);

  const benchLegs = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.5, 0.5),
    cartoonMat(0x555555)
  );
  benchLegs.position.set(-13, 0.25, 8);
  scene.add(benchLegs);

  // Street lamp posts
  [-8, 8].forEach(x => {
    const lamp = new THREE.Group();
    const lpole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 5, 8),
      cartoonMat(0x333333)
    );
    lpole.position.y = 2.5;
    lamp.add(lpole);

    const lHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 6),
      cartoonMat(0xffffcc, { emissive: 0xffff88, emissiveIntensity: 0.3 })
    );
    lHead.position.y = 5;
    lamp.add(lHead);

    const lLight = new THREE.PointLight(0xffee88, 0.5, 8);
    lLight.position.y = 5;
    lamp.add(lLight);

    lamp.position.set(x, 0, 5);
    scene.add(lamp);
  });

  // Tiang bendera besar di tengah halaman (main flagpole in front yard)
  const mainPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 12, 10),
    cartoonMat(0xc0c0c0)
  );
  mainPole.position.set(0, 6, 10);
  scene.add(mainPole);

  // Big flag
  const bigMerah = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 1.3),
    cartoonMat(MERAH, { side: THREE.DoubleSide })
  );
  bigMerah.position.set(2, 11, 10);
  bigMerah.userData._flag = true;
  bigMerah.userData._flagIndex = 99;
  scene.add(bigMerah);

  const bigPutih = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 1.3),
    cartoonMat(PUTIH, { side: THREE.DoubleSide })
  );
  bigPutih.position.set(2, 9.7, 10);
  bigPutih.userData._flag = true;
  bigPutih.userData._flagIndex = 99;
  scene.add(bigPutih);

  // Pole cap — gold spear
  const spear = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.5, 6),
    cartoonMat(GARUDA_GOLD)
  );
  spear.position.set(0, 12.25, 10);
  scene.add(spear);
}

// ── Clouds ───────────────────────────────────────────────────
function buildClouds() {
  const cloudPositions = [
    [-15, 18, -10], [10, 20, -15], [20, 17, -5],
    [-20, 19, 5], [5, 21, -20], [-8, 16, 10],
  ];

  cloudPositions.forEach((pos, i) => {
    const cloud = new THREE.Group();
    const count = 3 + Math.floor(Math.random() * 3);

    for (let j = 0; j < count; j++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(1 + Math.random() * 1.5, 10, 8),
        cartoonMat(0xffffff, { transparent: true, opacity: 0.9 })
      );
      puff.position.set(
        j * 1.5 - count * 0.75,
        Math.random() * 0.5,
        Math.random() * 0.8
      );
      puff.scale.y = 0.6;
      cloud.add(puff);
    }

    cloud.position.set(...pos);
    cloud.userData._cloud = true;
    cloud.userData._cloudIndex = i;
    scene.add(cloud);
  });
}

// ── Workstations ─────────────────────────────────────────────
function buildWorkstations() {
  const agents = registry.all();
  agents.forEach((agent, idx) => {
    const group = new THREE.Group();
    group.position.set(agent.position.x, 0, agent.position.z);

    group.add(createSpringfieldDesk(agent));

    const character = createSimpsonsCharacter(agent, idx);
    character.position.set(0, 0, agent.deskSize.d / 2 + 0.8);
    group.add(character);
    agentMeshes.set(agent.id, character);

    // Swivel chair
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.1, 0.6),
      cartoonMat(0x333333)
    );
    seat.position.y = 0.55;
    chair.add(seat);
    const chairBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.08),
      cartoonMat(0x333333)
    );
    chairBack.position.set(0, 0.85, -0.26);
    chair.add(chairBack);
    const chairPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6),
      cartoonMat(0x888888)
    );
    chairPole.position.y = 0.25;
    chair.add(chairPole);

    chair.position.set(0, 0, agent.deskSize.d / 2 + 0.8);
    group.add(chair);

    scene.add(group);
  });
}

// ── Animation ────────────────────────────────────────────────
function onFrame(delta, elapsed) {
  // Characters
  agentMeshes.forEach((group, id) => {
    const agent = registry.get(id);
    if (!agent) return;
    const idx = group.userData.index;

    // Idle bobbing
    group.position.y = Math.sin(elapsed * 1.2 + idx * 0.8) * 0.03;

    // Looking around
    group.rotation.y = Math.sin(elapsed * 0.4 + idx * 1.1) * 0.2;

    if (agent.status === STATUS.PROCESSING) {
      // Typing animation — faster head bob
      group.position.y = Math.sin(elapsed * 4 + idx) * 0.02;
      group.rotation.y = Math.sin(elapsed * 0.8 + idx) * 0.1;
    }

    if (agent.status === STATUS.ALERT) {
      // Panic — Homer-style freakout
      group.position.y = Math.abs(Math.sin(elapsed * 6 + idx)) * 0.1;
      group.rotation.y = Math.sin(elapsed * 3 + idx) * 0.4;
    }

    if (selectedAgentId === id) {
      group.position.y = 0.2 + Math.sin(elapsed * 2) * 0.05;
      // Wave arms — slight body tilt
      group.rotation.z = Math.sin(elapsed * 3) * 0.08;
    } else {
      group.rotation.z = 0;
    }
  });

  // Flags waving
  scene.traverse(obj => {
    if (obj.userData._flag) {
      const i = obj.userData._flagIndex;
      const wave = Math.sin(elapsed * 2.5 + i * 0.5) * 0.08;
      obj.rotation.y = wave;
      // Slight vertical flutter
      obj.position.y += Math.sin(elapsed * 3 + i) * 0.001;
    }
  });

  // Clouds drifting
  scene.traverse(obj => {
    if (obj.userData._cloud) {
      const i = obj.userData._cloudIndex;
      obj.position.x += 0.003 * (i % 2 === 0 ? 1 : -1);
      if (obj.position.x > 30) obj.position.x = -30;
      if (obj.position.x < -30) obj.position.x = 30;
    }
  });

  // Donut spinning
  scene.traverse(obj => {
    if (obj.userData._donut) {
      obj.rotation.y = elapsed * 0.5;
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
    new THREE.Vector3(agent.position.x + 2, 5, agent.position.z + 6),
    new THREE.Vector3(agent.position.x, 2, agent.position.z)
  );
}

function resetCamera() {
  selectedAgentId = null;
  animateCamera(
    new THREE.Vector3(5, 18, 30),
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
