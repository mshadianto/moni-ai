/**
 * MONI 3D Workspace — Centralized Configuration
 * Single source of truth for all tunable parameters
 */

export const CONFIG = Object.freeze({
  // ── Version ────────────────────────────────────────────
  VERSION: '2.0.0',
  APP_NAME: 'MONI 3D WORKSPACE',

  // ── Server / Connection ────────────────────────────────
  WS_URL: 'ws://localhost:18789',
  WS_RECONNECT_INTERVAL: 3000,
  WS_MAX_RETRIES: 10,

  // ── Colors ─────────────────────────────────────────────
  COLORS: {
    neon: '#00ff9f',
    neonHex: 0x00ff9f,
    teal: '#4ecdc4',
    tealHex: 0x4ecdc4,
    purple: '#2d1b4e',
    purpleHex: 0x2d1b4e,
    purpleDeep: '#1a0f2e',
    purpleDeepHex: 0x1a0f2e,
    purpleDark: '#0a0612',
    purpleDarkHex: 0x0a0612,
    red: '#ff4757',
    redHex: 0xff4757,
    gold: '#ffd93d',
    blue: '#4d96ff',
    orange: '#ff922b',
  },

  // ── Scene ──────────────────────────────────────────────
  SCENE: {
    BG_COLOR: 0x0a0612,
    FOG_DENSITY: 0.018,
    FLOOR_SIZE: 40,
    GRID_DIVISIONS: 40,
    GRID_ACCENT_DIVISIONS: 8,
  },

  // ── Camera ─────────────────────────────────────────────
  CAMERA: {
    FOV: 50,
    NEAR: 0.1,
    FAR: 100,
    DEFAULT_POSITION: [0, 18, 22],
    DEFAULT_TARGET: [0, 0, -4],
    FOCUS_OFFSET_Y: 3,
    FOCUS_OFFSET_Z: 5,
    FLY_DURATION: 1200,
    MIN_DISTANCE: 5,
    MAX_DISTANCE: 35,
    MAX_POLAR_ANGLE: Math.PI / 2.15,
    DAMPING_FACTOR: 0.08,
  },

  // ── Avatars ────────────────────────────────────────────
  AVATAR: {
    RADIUS: {
      executive: 0.6,
      director: 0.45,
      lead: 0.35,
    },
    FLOAT_SPEED: 1.5,
    FLOAT_AMPLITUDE: 0.15,
    ROTATION_SPEED: 0.5,
    GLOW_SHELL_SCALE: 1.4,
    PARTICLE_COUNT: {
      executive: 24,
      director: 12,
      lead: 12,
    },
  },

  // ── Desk ───────────────────────────────────────────────
  DESK: {
    COLOR: 0x1e1433,
    EDGE_COLOR: 0x2d1b4e,
    LEG_RADIUS: 0.04,
    HEIGHT: 0.8,
    SURFACE_THICKNESS: 0.08,
  },

  // ── Lighting ───────────────────────────────────────────
  LIGHTING: {
    AMBIENT_INTENSITY: 0.4,
    MAIN_INTENSITY: 0.6,
    FILL_INTENSITY: 0.2,
    RIM_INTENSITY: 0.3,
    SPOT_INTENSITY: 1.5,
    SHADOW_MAP_SIZE: 2048,
  },

  // ── Renderer ───────────────────────────────────────────
  RENDERER: {
    MAX_PIXEL_RATIO: 2,
    TONE_MAPPING_EXPOSURE: 1.2,
    ANTIALIAS: true,
  },

  // ── HUD ────────────────────────────────────────────────
  HUD: {
    FEED_MAX_ENTRIES: 50,
    FEED_INTERVAL_MIN: 3000,
    FEED_INTERVAL_MAX: 5000,
    COUNTER_DURATION: 1500,
    TYPING_SPEED: 60,
  },

  // ── Performance ────────────────────────────────────────
  PERFORMANCE: {
    TARGET_FPS: 60,
    LOW_FPS_THRESHOLD: 30,
    QUALITY_CHECK_INTERVAL: 2000,
    REDUCED_PARTICLES: 6,
    REDUCED_SHADOW_MAP: 1024,
  },
});

/**
 * Deep-merge user overrides into config (for runtime customization)
 */
export function mergeConfig(overrides) {
  return deepMerge(structuredClone(CONFIG), overrides);
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
