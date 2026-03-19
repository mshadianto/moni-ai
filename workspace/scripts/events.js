/**
 * MONI 3D Workspace — Event Bus
 * Decoupled pub/sub system for all module communication
 */

class EventBus {
  constructor() {
    this._listeners = new Map();
    this._onceListeners = new Map();
    this._history = [];
    this._maxHistory = 100;
  }

  /**
   * Subscribe to an event
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once
   */
  once(event, callback) {
    if (!this._onceListeners.has(event)) {
      this._onceListeners.set(event, new Set());
    }
    this._onceListeners.get(event).add(callback);
    return () => this._onceListeners.get(event)?.delete(callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event with data
   */
  emit(event, data = null) {
    const entry = { event, data, timestamp: Date.now() };

    // Store in history
    this._history.push(entry);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    // Notify regular listeners
    this._listeners.get(event)?.forEach(cb => {
      try { cb(data); } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    });

    // Notify and clear once listeners
    this._onceListeners.get(event)?.forEach(cb => {
      try { cb(data); } catch (err) {
        console.error(`[EventBus] Error in once-listener for "${event}":`, err);
      }
    });
    this._onceListeners.delete(event);

    // Wildcard listeners
    this._listeners.get('*')?.forEach(cb => {
      try { cb(entry); } catch (err) {
        console.error(`[EventBus] Error in wildcard listener:`, err);
      }
    });
  }

  /**
   * Get event history (for debugging)
   */
  getHistory(event = null) {
    if (event) return this._history.filter(e => e.event === event);
    return [...this._history];
  }

  /**
   * Clear all listeners
   */
  clear() {
    this._listeners.clear();
    this._onceListeners.clear();
  }

  /**
   * Get listener count for debugging
   */
  listenerCount(event) {
    return (this._listeners.get(event)?.size || 0) +
           (this._onceListeners.get(event)?.size || 0);
  }
}

// ── Event Constants ──────────────────────────────────────────
export const EVENTS = Object.freeze({
  // Lifecycle
  APP_INIT: 'app:init',
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',

  // Scene
  SCENE_READY: 'scene:ready',
  SCENE_RESIZE: 'scene:resize',
  SCENE_QUALITY_CHANGE: 'scene:quality_change',

  // Agent
  AGENT_SELECT: 'agent:select',
  AGENT_DESELECT: 'agent:deselect',
  AGENT_HOVER: 'agent:hover',
  AGENT_STATUS_CHANGE: 'agent:status_change',
  AGENT_DATA_UPDATE: 'agent:data_update',

  // Camera
  CAMERA_MOVE: 'camera:move',
  CAMERA_RESET: 'camera:reset',

  // HUD
  HUD_FEED_ENTRY: 'hud:feed_entry',
  HUD_STATS_UPDATE: 'hud:stats_update',

  // WebSocket
  WS_CONNECTED: 'ws:connected',
  WS_DISCONNECTED: 'ws:disconnected',
  WS_MESSAGE: 'ws:message',
  WS_ERROR: 'ws:error',
});

// Singleton instance
export const bus = new EventBus();
