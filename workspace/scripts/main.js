/**
 * MONI 3D Workspace — Main Controller
 * HUD logic, agent list, detail modal, live activity feed
 */

import { agents, AGENT_TIERS, AGENT_STATUS, getRandomActivity } from './agents.js';
import { initScene, selectAgent, resetCamera, setOnAgentSelect, setOnAgentHover } from './office.js';

// ── DOM Elements ─────────────────────────────────────────────
const canvas = document.getElementById('scene-canvas');
const agentListEl = document.getElementById('agent-list');
const activityFeedEl = document.getElementById('activity-feed');
const modalEl = document.getElementById('agent-modal');
const modalContentEl = document.getElementById('modal-content');
const modalCloseEl = document.getElementById('modal-close');
const statAgentsEl = document.getElementById('stat-agents');
const statActiveEl = document.getElementById('stat-active');
const statTasksEl = document.getElementById('stat-tasks');
const statUptimeEl = document.getElementById('stat-uptime');
const resetCamBtn = document.getElementById('reset-camera');
const clockEl = document.getElementById('hud-clock');

// ── Initialize ───────────────────────────────────────────────
function init() {
  initScene(canvas);
  buildAgentList();
  updateStats();
  startActivityFeed();
  startClock();
  bindEvents();

  // Typing effect for title
  typeWriter('MONI 3D WORKSPACE', document.getElementById('hud-title'), 0, 60);
}

// ── Agent List Panel ─────────────────────────────────────────
function buildAgentList() {
  const tiers = [
    { key: AGENT_TIERS.EXECUTIVE, label: 'EXECUTIVE' },
    { key: AGENT_TIERS.DIRECTOR, label: 'DIRECTORS' },
    { key: AGENT_TIERS.LEAD, label: 'TEAM LEADS' }
  ];

  agentListEl.innerHTML = '';

  tiers.forEach(tier => {
    const tierHeader = document.createElement('div');
    tierHeader.className = 'tier-header';
    tierHeader.textContent = `── ${tier.label} ──`;
    agentListEl.appendChild(tierHeader);

    const tierAgents = agents.filter(a => a.tier === tier.key);
    tierAgents.forEach(agent => {
      const item = document.createElement('div');
      item.className = `agent-item ${agent.status}`;
      item.dataset.agentId = agent.id;
      item.innerHTML = `
        <span class="agent-indicator" style="background: ${agent.color}; box-shadow: 0 0 6px ${agent.color}"></span>
        <span class="agent-emoji">${agent.emoji}</span>
        <div class="agent-info">
          <span class="agent-name">${agent.name}</span>
          <span class="agent-role">${agent.title}</span>
        </div>
        <span class="agent-status-dot ${agent.status}" title="${agent.status}"></span>
      `;

      item.addEventListener('click', () => {
        selectAgent(agent.id);
        highlightListItem(agent.id);
      });

      agentListEl.appendChild(item);
    });
  });
}

function highlightListItem(agentId) {
  document.querySelectorAll('.agent-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.agentId === agentId);
  });
}

// ── Stats Bar ────────────────────────────────────────────────
function updateStats() {
  const active = agents.filter(a =>
    a.status === AGENT_STATUS.ACTIVE || a.status === AGENT_STATUS.PROCESSING
  ).length;
  const totalTasks = agents.reduce((sum, a) => sum + a.metrics.tasksToday, 0);

  animateCounter(statAgentsEl, 0, agents.length, 800);
  animateCounter(statActiveEl, 0, active, 1000);
  animateCounter(statTasksEl, 0, totalTasks, 1500);
  statUptimeEl.textContent = '99.4%';
}

function animateCounter(el, start, end, duration) {
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(start + (end - start) * ease);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Activity Feed ────────────────────────────────────────────
function startActivityFeed() {
  // Initial entries
  for (let i = 0; i < 5; i++) {
    setTimeout(() => addActivityEntry(), i * 400);
  }

  // Continuous feed
  setInterval(addActivityEntry, 3000 + Math.random() * 2000);
}

function addActivityEntry() {
  const activity = getRandomActivity();
  const entry = document.createElement('div');
  entry.className = `feed-entry feed-${activity.type}`;
  entry.innerHTML = `
    <span class="feed-time">${activity.timestamp}</span>
    <span class="feed-agent" style="color: ${activity.agentColor}">${activity.agentEmoji} ${activity.agentName}</span>
    <span class="feed-message">${activity.message}</span>
  `;

  // Insert at top with animation
  entry.style.opacity = '0';
  entry.style.transform = 'translateX(-20px)';
  activityFeedEl.prepend(entry);

  requestAnimationFrame(() => {
    entry.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    entry.style.opacity = '1';
    entry.style.transform = 'translateX(0)';
  });

  // Remove old entries
  while (activityFeedEl.children.length > 50) {
    activityFeedEl.lastChild.remove();
  }
}

// ── Agent Detail Modal ───────────────────────────────────────
function showAgentModal(agent) {
  const statusColors = {
    [AGENT_STATUS.ACTIVE]: '#00ff9f',
    [AGENT_STATUS.PROCESSING]: '#4ecdc4',
    [AGENT_STATUS.IDLE]: '#666',
    [AGENT_STATUS.ALERT]: '#ff4757'
  };

  modalContentEl.innerHTML = `
    <div class="modal-header" style="border-color: ${agent.color}">
      <div class="modal-avatar" style="background: radial-gradient(circle, ${agent.color}44, ${agent.color}11); border-color: ${agent.color}">
        <span class="modal-emoji">${agent.emoji}</span>
      </div>
      <div class="modal-title-block">
        <h2 class="modal-agent-name" style="color: ${agent.color}">${agent.name}</h2>
        <p class="modal-agent-title">${agent.title}</p>
        <p class="modal-agent-role">${agent.role}</p>
      </div>
      <div class="modal-status-badge" style="background: ${statusColors[agent.status]}22; border-color: ${statusColors[agent.status]}; color: ${statusColors[agent.status]}">
        ${agent.status.toUpperCase()}
      </div>
    </div>

    <div class="modal-body">
      <p class="modal-description">${agent.description}</p>

      <div class="modal-metrics">
        <div class="metric-card">
          <span class="metric-value" style="color: ${agent.color}">${agent.metrics.tasksToday}</span>
          <span class="metric-label">TASKS TODAY</span>
        </div>
        <div class="metric-card">
          <span class="metric-value" style="color: ${agent.color}">${agent.metrics.uptime}</span>
          <span class="metric-label">UPTIME</span>
        </div>
        <div class="metric-card">
          <span class="metric-value" style="color: ${agent.color}">${agent.metrics.latency}</span>
          <span class="metric-label">LATENCY</span>
        </div>
      </div>

      <div class="modal-meta">
        <div class="meta-row">
          <span class="meta-key">MODEL</span>
          <span class="meta-value">${agent.model}</span>
        </div>
        <div class="meta-row">
          <span class="meta-key">TIER</span>
          <span class="meta-value">${agent.tier.toUpperCase()}</span>
        </div>
        <div class="meta-row">
          <span class="meta-key">POSITION</span>
          <span class="meta-value">X:${agent.position.x} Z:${agent.position.z}</span>
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
function bindEvents() {
  setOnAgentSelect((agent) => {
    showAgentModal(agent);
    highlightListItem(agent.id);
  });

  setOnAgentHover((agentId) => {
    // Could add tooltip later
  });

  modalCloseEl.addEventListener('click', hideModal);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) hideModal();
  });

  resetCamBtn.addEventListener('click', () => {
    resetCamera();
    hideModal();
    highlightListItem(null);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModal();
      resetCamera();
      highlightListItem(null);
    }
  });
}

// ── Clock ────────────────────────────────────────────────────
function startClock() {
  function update() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
  }
  update();
  setInterval(update, 1000);
}

// ── Typing Effect ────────────────────────────────────────────
function typeWriter(text, el, i, speed) {
  if (i < text.length) {
    el.textContent = text.substring(0, i + 1);
    setTimeout(() => typeWriter(text, el, i + 1, speed), speed);
  }
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
