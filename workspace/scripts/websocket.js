/**
 * MONI 3D Workspace — WebSocket Manager
 * Handles real-time connection to OpenClaw Gateway
 * Falls back to simulated feed when gateway is unavailable
 */

import { bus, EVENTS } from './events.js';
import { CONFIG } from './config.js';

class WebSocketManager {
  constructor() {
    this._ws = null;
    this._url = CONFIG.WS_URL;
    this._retries = 0;
    this._maxRetries = CONFIG.WS_MAX_RETRIES;
    this._reconnectTimer = null;
    this._connected = false;
    this._simulationMode = false;
    this._simulationTimer = null;
    this._messageQueue = [];
    this._handlers = new Map();
  }

  /**
   * Attempt connection to gateway
   * Silently falls back to simulation if unavailable
   */
  connect(url = null) {
    if (url) this._url = url;

    try {
      this._ws = new WebSocket(this._url);

      this._ws.onopen = () => {
        this._connected = true;
        this._retries = 0;
        this._simulationMode = false;
        this._stopSimulation();
        bus.emit(EVENTS.WS_CONNECTED, { url: this._url });
        console.log(`[WS] Connected to ${this._url}`);

        // Flush queued messages
        while (this._messageQueue.length > 0) {
          this.send(this._messageQueue.shift());
        }
      };

      this._ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          bus.emit(EVENTS.WS_MESSAGE, data);

          // Route to specific handlers
          if (data.type && this._handlers.has(data.type)) {
            this._handlers.get(data.type).forEach(cb => cb(data));
          }
        } catch (err) {
          console.warn('[WS] Invalid message:', event.data);
        }
      };

      this._ws.onclose = () => {
        this._connected = false;
        bus.emit(EVENTS.WS_DISCONNECTED);
        this._attemptReconnect();
      };

      this._ws.onerror = () => {
        // Silently handle — onclose will fire after this
      };

    } catch (err) {
      this._startSimulation();
    }
  }

  /**
   * Register a handler for a specific message type
   */
  onMessage(type, callback) {
    if (!this._handlers.has(type)) {
      this._handlers.set(type, new Set());
    }
    this._handlers.get(type).add(callback);
    return () => this._handlers.get(type)?.delete(callback);
  }

  /**
   * Send a message (queues if disconnected)
   */
  send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    if (this._connected && this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(message);
    } else {
      this._messageQueue.push(data);
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  _attemptReconnect() {
    if (this._retries >= this._maxRetries) {
      console.log('[WS] Max retries reached, switching to simulation mode');
      this._startSimulation();
      return;
    }

    this._retries++;
    const delay = Math.min(
      CONFIG.WS_RECONNECT_INTERVAL * Math.pow(1.5, this._retries - 1),
      30000
    );

    console.log(`[WS] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this._retries}/${this._maxRetries})`);
    this._reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  /**
   * Start simulation mode (offline/demo)
   */
  _startSimulation() {
    if (this._simulationMode) return;
    this._simulationMode = true;
    bus.emit(EVENTS.WS_DISCONNECTED, { simulation: true });
    console.log('[WS] Running in simulation mode');
  }

  /**
   * Stop simulation
   */
  _stopSimulation() {
    this._simulationMode = false;
    if (this._simulationTimer) {
      clearInterval(this._simulationTimer);
      this._simulationTimer = null;
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    clearTimeout(this._reconnectTimer);
    this._stopSimulation();
    if (this._ws) {
      this._ws.onclose = null; // prevent reconnect
      this._ws.close();
      this._ws = null;
    }
    this._connected = false;
    this._retries = 0;
  }

  get isConnected() { return this._connected; }
  get isSimulation() { return this._simulationMode; }
}

// Singleton
export const wsManager = new WebSocketManager();
