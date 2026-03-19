/**
 * MONI 3D Workspace — Render Pipeline
 * Manages Three.js renderer, resize, performance monitoring, quality scaling
 */

import * as THREE from 'three';
import { bus, EVENTS } from './events.js';
import { CONFIG } from './config.js';

class RenderPipeline {
  constructor() {
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._canvas = null;
    this._animationId = null;
    this._callbacks = new Set();
    this._running = false;

    // Performance
    this._frameTimes = [];
    this._lastFrameTime = 0;
    this._fps = 60;
    this._quality = 'high'; // high | medium | low
    this._qualityCheckTimer = null;
  }

  /**
   * Initialize renderer with canvas
   */
  init(canvas, scene, camera) {
    this._canvas = canvas;
    this._scene = scene;
    this._camera = camera;

    this._renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: CONFIG.RENDERER.ANTIALIAS,
      alpha: false,
      powerPreference: 'high-performance',
    });

    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.RENDERER.MAX_PIXEL_RATIO));
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = CONFIG.RENDERER.TONE_MAPPING_EXPOSURE;

    window.addEventListener('resize', this._onResize.bind(this));

    // Start quality monitoring
    this._qualityCheckTimer = setInterval(
      () => this._checkPerformance(),
      CONFIG.PERFORMANCE.QUALITY_CHECK_INTERVAL
    );

    return this._renderer;
  }

  /**
   * Register a per-frame callback
   * @returns {Function} unregister function
   */
  onFrame(callback) {
    this._callbacks.add(callback);
    return () => this._callbacks.delete(callback);
  }

  /**
   * Start the render loop
   */
  start() {
    if (this._running) return;
    this._running = true;
    this._lastFrameTime = performance.now();
    console.log('[Renderer] Starting render loop —', this._callbacks.size, 'frame callbacks registered');
    this._loop();
  }

  /**
   * Stop the render loop
   */
  stop() {
    this._running = false;
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }

  /**
   * Core render loop
   */
  _loop() {
    if (!this._running) return;
    this._animationId = requestAnimationFrame(() => this._loop());

    const now = performance.now();
    const delta = (now - this._lastFrameTime) / 1000;
    this._lastFrameTime = now;

    // Track FPS
    this._frameTimes.push(now);
    while (this._frameTimes.length > 0 && this._frameTimes[0] < now - 1000) {
      this._frameTimes.shift();
    }
    this._fps = this._frameTimes.length;

    // Execute frame callbacks
    for (const cb of this._callbacks) {
      try {
        cb(delta, now / 1000);
      } catch (err) {
        console.error('[Renderer] Frame callback error:', err);
      }
    }

    // Render
    this._renderer.render(this._scene, this._camera);
  }

  /**
   * Adaptive quality based on FPS
   */
  _checkPerformance() {
    const prevQuality = this._quality;

    if (this._fps < CONFIG.PERFORMANCE.LOW_FPS_THRESHOLD && this._quality !== 'low') {
      this._quality = this._quality === 'high' ? 'medium' : 'low';
      this._applyQuality();
    } else if (this._fps > 50 && this._quality !== 'high') {
      this._quality = this._quality === 'low' ? 'medium' : 'high';
      this._applyQuality();
    }

    if (prevQuality !== this._quality) {
      bus.emit(EVENTS.SCENE_QUALITY_CHANGE, { quality: this._quality, fps: this._fps });
      console.log(`[Renderer] Quality: ${prevQuality} → ${this._quality} (${this._fps} FPS)`);
    }
  }

  _applyQuality() {
    switch (this._quality) {
      case 'low':
        this._renderer.setPixelRatio(1);
        this._renderer.shadowMap.enabled = false;
        break;
      case 'medium':
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this._renderer.shadowMap.enabled = true;
        break;
      case 'high':
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.RENDERER.MAX_PIXEL_RATIO));
        this._renderer.shadowMap.enabled = true;
        break;
    }
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);

    bus.emit(EVENTS.SCENE_RESIZE, { width: w, height: h });
  }

  /**
   * Dispose renderer and all resources
   */
  dispose() {
    this.stop();
    clearInterval(this._qualityCheckTimer);
    window.removeEventListener('resize', this._onResize);
    this._renderer?.dispose();
    this._callbacks.clear();
  }

  get fps() { return this._fps; }
  get quality() { return this._quality; }
  get renderer() { return this._renderer; }
}

// Singleton
export const renderPipeline = new RenderPipeline();
