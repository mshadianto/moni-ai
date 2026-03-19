/**
 * MONI 3D Workspace — Main Controller
 * Orchestrates all modules: scene, HUD, events, WebSocket
 */

import { CONFIG } from './config.js';
import { bus, EVENTS } from './events.js';
import { registry, TIER, STATUS, DEFAULT_AGENTS, DEFAULT_ACTIVITIES } from './agents.js';
import { initScene } from './office.js';
import { renderPipeline } from './renderer.js';
import { wsManager } from './websocket.js';

// ── DOM ──────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const canvas = $('#scene-canvas');
const agentListEl = $('#agent-list');
const activityFeedEl = $('#activity-feed');
const modalEl = $('#agent-modal');
const modalContentEl = $('#modal-content');
const modalCloseEl = $('#modal-close');
const resetCamBtn = $('#reset-camera');
const clockEl = $('#hud-clock');
const hudTitle = $('#hud-title');
const connStatus = $('#conn-status');
const fpsCounter = $('#fps-counter');

const statEls = {
  agents: $('#stat-agents'),
  active: $('#stat-active'),
  tasks: $('#stat-tasks'),
  uptime: $('#stat-uptime'),
};

// ── State ────────────────────────────────────────────────────
let feedTimer = null;
let clockTimer = null;
let fpsTimer = null;

// ── Boot ─────────────────────────────────────────────────────
function init() {
  try {
    // 1. Register agents
    registry.registerAll(DEFAULT_AGENTS);
    registry.registerActivities(DEFAULT_ACTIVITIES);

    // 2. Init 3D scene
    initScene(canvas);

    // 3. Build HUD
    buildAgentList();
    updateStats();
    startActivityFeed();
    startClock();
    startFpsCounter();

    // 4. Bind events
    bindUIEvents();
    bindBusEvents();

    // 5. Try WebSocket (fails gracefully to simulation)
    wsManager.connect();

    // 6. Title animation
    typeWriter(`${CONFIG.APP_NAME} v${CONFIG.VERSION}`, hudTitle, 0, CONFIG.HUD.TYPING_SPEED);

    bus.emit(EVENTS.APP_READY);
    console.log(`%c[MONI] Workspace v${CONFIG.VERSION} ready — ${registry.count} agents loaded`, 'color: #00ff9f; font-weight: bold');
    console.log(`[MONI] Scene objects: ${registry.count} agents`);
    console.log(`[MONI] Renderer: ${renderPipeline.quality} quality, ${renderPipeline.fps} FPS`);
    console.log(`[MONI] Canvas: ${canvas?.width}x${canvas?.height}`);
  } catch (err) {
    console.error('%c[MONI] Init failed:', 'color: #ff4757; font-weight: bold', err);
    bus.emit(EVENTS.APP_ERROR, { error: err.message });
    showError(err.message);
  }
}

// ── Agent List ───────────────────────────────────────────────
function buildAgentList() {
  const tiers = [
    { key: TIER.EXECUTIVE, label: 'EXECUTIVE' },
    { key: TIER.DIRECTOR, label: 'DIRECTORS' },
    { key: TIER.LEAD, label: 'TEAM LEADS' },
  ];

  agentListEl.innerHTML = '';

  tiers.forEach(tier => {
    const header = document.createElement('div');
    header.className = 'tier-header';
    header.textContent = `── ${tier.label} ──`;
    agentListEl.appendChild(header);

    registry.byTier(tier.key).forEach(agent => {
      const item = document.createElement('div');
      item.className = `agent-item ${agent.status}`;
      item.dataset.agentId = agent.id;
      item.innerHTML = `
        <span class="agent-indicator" style="background:${agent.color};box-shadow:0 0 6px ${agent.color}"></span>
        <span class="agent-emoji">${agent.emoji}</span>
        <div class="agent-info">
          <span class="agent-name">${agent.name}</span>
          <span class="agent-role">${agent.title}</span>
        </div>
        <span class="agent-status-dot ${agent.status}" title="${agent.status}"></span>
      `;
      item.addEventListener('click', () => bus.emit(EVENTS.AGENT_SELECT, { id: agent.id }));
      agentListEl.appendChild(item);
    });
  });
}

function highlightListItem(agentId) {
  agentListEl.querySelectorAll('.agent-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.agentId === agentId);
  });
}

// ── Stats ────────────────────────────────────────────────────
function updateStats() {
  animateCounter(statEls.agents, 0, registry.count, 800);
  animateCounter(statEls.active, 0, registry.activeCount, 1000);
  animateCounter(statEls.tasks, 0, registry.totalTasks, CONFIG.HUD.COUNTER_DURATION);
  statEls.uptime.textContent = '99.4%';
}

function animateCounter(el, from, to, duration) {
  if (!el) return;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * ease);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Activity Feed ────────────────────────────────────────────
function startActivityFeed() {
  // Initial burst
  for (let i = 0; i < 5; i++) {
    setTimeout(() => addFeedEntry(), i * 400);
  }
  scheduleFeedEntry();
}

function scheduleFeedEntry() {
  const delay = CONFIG.HUD.FEED_INTERVAL_MIN +
    Math.random() * (CONFIG.HUD.FEED_INTERVAL_MAX - CONFIG.HUD.FEED_INTERVAL_MIN);
  feedTimer = setTimeout(() => {
    addFeedEntry();
    scheduleFeedEntry();
  }, delay);
}

function addFeedEntry(activity = null) {
  const data = activity || registry.getRandomActivity();
  if (!data) return;

  const entry = document.createElement('div');
  entry.className = `feed-entry feed-${data.type}`;
  entry.innerHTML = `
    <span class="feed-time">${data.timestamp}</span>
    <span class="feed-agent" style="color:${data.agentColor}">${data.agentEmoji} ${data.agentName}</span>
    <span class="feed-message">${escapeHtml(data.message)}</span>
  `;
  entry.style.opacity = '0';
  entry.style.transform = 'translateX(-20px)';
  activityFeedEl.prepend(entry);

  requestAnimationFrame(() => {
    entry.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    entry.style.opacity = '1';
    entry.style.transform = 'translateX(0)';
  });

  // Trim
  while (activityFeedEl.children.length > CONFIG.HUD.FEED_MAX_ENTRIES) {
    activityFeedEl.lastChild.remove();
  }

  bus.emit(EVENTS.HUD_FEED_ENTRY, data);
}

// ── Modal ────────────────────────────────────────────────────
function showAgentModal(agent) {
  const statusColor = {
    [STATUS.ACTIVE]: '#00ff9f',
    [STATUS.PROCESSING]: '#4ecdc4',
    [STATUS.IDLE]: '#666',
    [STATUS.ALERT]: '#ff4757',
    [STATUS.OFFLINE]: '#333',
  }[agent.status] || '#666';

  const tierLabel = { [TIER.EXECUTIVE]: 'C-SUITE EXECUTIVE', [TIER.DIRECTOR]: 'SENIOR DIRECTOR', [TIER.LEAD]: 'TEAM LEAD' }[agent.tier] || agent.tier;
  const statusLabel = { [STATUS.ACTIVE]: 'ONLINE', [STATUS.PROCESSING]: 'PROCESSING', [STATUS.IDLE]: 'STANDBY', [STATUS.ALERT]: 'ALERT', [STATUS.OFFLINE]: 'OFFLINE' }[agent.status] || 'UNKNOWN';
  const recentActs = (registry._activityTemplates || []).filter(a => a.agent === agent.id).slice(0, 4);

  modalContentEl.innerHTML = `
    <div class="modal-hero" style="background:linear-gradient(135deg, ${agent.color}15, ${agent.color}05)">
      <div class="modal-hero-top">
        <div class="modal-avatar-lg" style="border-color:${agent.color}; box-shadow: 0 0 24px ${agent.color}44">
          <span class="modal-emoji-lg">${agent.emoji}</span>
        </div>
        <div class="modal-hero-info">
          <h2 class="modal-name-lg" style="color:${agent.color}">${agent.name}</h2>
          <p class="modal-title-lg">${agent.title}</p>
          <p class="modal-role-lg">${agent.role}</p>
        </div>
        <div class="modal-hero-right">
          <div class="modal-status-pill" style="background:${statusColor}22;border-color:${statusColor};color:${statusColor}">
            <span class="status-dot-sm" style="background:${statusColor}"></span>
            ${statusLabel}
          </div>
          <div class="modal-tier-pill">${tierLabel}</div>
        </div>
      </div>
    </div>

    <div class="modal-body-lg">
      <div class="modal-section-block">
        <div class="section-title">DESCRIPTION</div>
        <p class="modal-desc-lg">${escapeHtml(agent.description)}</p>
      </div>

      <div class="modal-section-block">
        <div class="section-title">PERFORMANCE</div>
        <div class="modal-metrics-lg">
          <div class="metric-card-lg">
            <span class="metric-icon-lg">📋</span>
            <div class="metric-data">
              <span class="metric-val-lg" style="color:${agent.color}">${agent.metrics.tasksToday}</span>
              <span class="metric-lbl-lg">Tasks Today</span>
            </div>
          </div>
          <div class="metric-card-lg">
            <span class="metric-icon-lg">⏱️</span>
            <div class="metric-data">
              <span class="metric-val-lg" style="color:${agent.color}">${agent.metrics.uptime}</span>
              <span class="metric-lbl-lg">Uptime</span>
            </div>
          </div>
          <div class="metric-card-lg">
            <span class="metric-icon-lg">⚡</span>
            <div class="metric-data">
              <span class="metric-val-lg" style="color:${agent.color}">${agent.metrics.latency}</span>
              <span class="metric-lbl-lg">Latency</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-section-block">
        <div class="section-title">RECENT ACTIVITY</div>
        <div class="modal-feed-lg">
          ${recentActs.map(a => `
            <div class="feed-item-lg feed-${a.type}">
              <span class="feed-dot-lg"></span>
              <span class="feed-msg-lg">${escapeHtml(a.message)}</span>
            </div>
          `).join('')}
          ${recentActs.length === 0 ? '<div class="feed-item-lg"><span class="feed-msg-lg" style="opacity:0.4">No recent activity</span></div>' : ''}
        </div>
      </div>

      <div class="modal-section-block">
        <div class="section-title">SYSTEM INFO</div>
        <div class="modal-info-grid">
          <div class="info-row"><span class="info-key">AI MODEL</span><span class="info-val">${agent.model}</span></div>
          <div class="info-row"><span class="info-key">TIER</span><span class="info-val">${tierLabel}</span></div>
          <div class="info-row"><span class="info-key">INTENSITY</span><span class="info-val">${agent.glowIntensity}x</span></div>
          <div class="info-row"><span class="info-key">POSITION</span><span class="info-val">X: ${agent.position.x} &nbsp;|&nbsp; Z: ${agent.position.z}</span></div>
          <div class="info-row"><span class="info-key">DESK</span><span class="info-val">${agent.deskSize.w} × ${agent.deskSize.d}</span></div>
          <div class="info-row"><span class="info-key">RENDER</span><span class="info-val">${renderPipeline.quality.toUpperCase()} @ ${renderPipeline.fps} FPS</span></div>
        </div>
      </div>
    </div>
  `;
  modalEl.classList.add('visible');
}

function hideModal() {
  modalEl.classList.remove('visible');
}

// ── Events ───────────────────────────────────────────────────
function bindUIEvents() {
  modalCloseEl.addEventListener('click', hideModal);
  modalEl.addEventListener('click', e => { if (e.target === modalEl) hideModal(); });
  resetCamBtn.addEventListener('click', () => {
    bus.emit(EVENTS.CAMERA_RESET);
    bus.emit(EVENTS.AGENT_DESELECT);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hideModal();
      bus.emit(EVENTS.CAMERA_RESET);
      bus.emit(EVENTS.AGENT_DESELECT);
    }
  });
}

function bindBusEvents() {
  bus.on(EVENTS.AGENT_SELECT, ({ id }) => {
    const agent = registry.get(id);
    if (agent) {
      showAgentModal(agent);
      highlightListItem(id);
    }
  });

  bus.on(EVENTS.AGENT_DESELECT, () => {
    highlightListItem(null);
  });

  bus.on(EVENTS.WS_CONNECTED, () => {
    if (connStatus) {
      connStatus.textContent = 'LIVE';
      connStatus.className = 'conn-badge conn-live';
    }
  });

  bus.on(EVENTS.WS_DISCONNECTED, () => {
    if (connStatus) {
      connStatus.textContent = 'SIM';
      connStatus.className = 'conn-badge conn-sim';
    }
  });

  bus.on(EVENTS.WS_MESSAGE, (data) => {
    // Handle real-time gateway messages
    if (data.type === 'agent_status') {
      registry.setStatus(data.agentId, data.status);
    }
    if (data.type === 'activity') {
      addFeedEntry({
        agent: data.agentId,
        message: data.message,
        type: data.level || 'info',
        agentName: registry.get(data.agentId)?.name || data.agentId,
        agentColor: registry.get(data.agentId)?.color || '#00ff9f',
        agentEmoji: registry.get(data.agentId)?.emoji || '🤖',
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      });
    }
  });

  bus.on(EVENTS.SCENE_QUALITY_CHANGE, ({ quality, fps }) => {
    console.log(`[HUD] Quality: ${quality} @ ${fps} FPS`);
  });
}

// ── Clock ────────────────────────────────────────────────────
function startClock() {
  function tick() {
    if (clockEl) clockEl.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
  }
  tick();
  clockTimer = setInterval(tick, 1000);
}

// ── FPS Counter ──────────────────────────────────────────────
function startFpsCounter() {
  fpsTimer = setInterval(() => {
    if (fpsCounter) fpsCounter.textContent = `${renderPipeline.fps} FPS`;
  }, 500);
}

// ── Utilities ────────────────────────────────────────────────
function typeWriter(text, el, i, speed) {
  if (!el) return;
  if (i < text.length) {
    el.textContent = text.substring(0, i + 1);
    setTimeout(() => typeWriter(text, el, i + 1, speed), speed);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showError(message) {
  const overlay = document.querySelector('.boot-overlay');
  if (overlay) {
    overlay.style.animation = 'none';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.innerHTML = `
      <div style="color:#ff4757;font-family:monospace;text-align:center">
        <p style="font-size:16px;margin-bottom:10px">SYSTEM ERROR</p>
        <p style="font-size:12px;opacity:0.7">${escapeHtml(message)}</p>
        <p style="font-size:11px;opacity:0.4;margin-top:20px">Check console for details</p>
      </div>
    `;
  }
}

// ── Cleanup (for hot-reload / SPA contexts) ──────────────────
export function destroy() {
  clearTimeout(feedTimer);
  clearInterval(clockTimer);
  clearInterval(fpsTimer);
  wsManager.disconnect();
  renderPipeline.dispose();
  bus.clear();
}

// ── Start ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
