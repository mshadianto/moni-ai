/**
 * MONI 3D Workspace — Agent Registry
 * Dynamic agent management with event-driven state updates
 */

import { bus, EVENTS } from './events.js';

// ── Constants ────────────────────────────────────────────────
export const TIER = Object.freeze({
  EXECUTIVE: 'executive',
  DIRECTOR: 'director',
  LEAD: 'lead',
});

export const STATUS = Object.freeze({
  ACTIVE: 'active',
  IDLE: 'idle',
  PROCESSING: 'processing',
  ALERT: 'alert',
  OFFLINE: 'offline',
});

// ── Agent Registry ───────────────────────────────────────────
class AgentRegistry {
  constructor() {
    /** @type {Map<string, object>} */
    this._agents = new Map();
    this._activityTemplates = [];
  }

  /**
   * Register an agent
   */
  register(agent) {
    const entry = {
      ...agent,
      status: agent.status || STATUS.IDLE,
      metrics: {
        tasksToday: 0,
        uptime: '0%',
        latency: '0ms',
        ...agent.metrics,
      },
      _createdAt: Date.now(),
    };
    this._agents.set(agent.id, entry);
    return this;
  }

  /**
   * Bulk register agents
   */
  registerAll(agentList) {
    agentList.forEach(a => this.register(a));
    return this;
  }

  /**
   * Get agent by id
   */
  get(id) {
    return this._agents.get(id) || null;
  }

  /**
   * Get all agents as array
   */
  all() {
    return Array.from(this._agents.values());
  }

  /**
   * Get agents filtered by tier
   */
  byTier(tier) {
    return this.all().filter(a => a.tier === tier);
  }

  /**
   * Get agents filtered by status
   */
  byStatus(status) {
    return this.all().filter(a => a.status === status);
  }

  /**
   * Update agent status with event emission
   */
  setStatus(id, status) {
    const agent = this._agents.get(id);
    if (!agent) return;
    const prev = agent.status;
    agent.status = status;
    bus.emit(EVENTS.AGENT_STATUS_CHANGE, { id, status, prev });
  }

  /**
   * Update agent metrics
   */
  updateMetrics(id, metrics) {
    const agent = this._agents.get(id);
    if (!agent) return;
    Object.assign(agent.metrics, metrics);
    bus.emit(EVENTS.AGENT_DATA_UPDATE, { id, metrics: agent.metrics });
  }

  /**
   * Total count
   */
  get count() { return this._agents.size; }

  /**
   * Count active agents
   */
  get activeCount() {
    return this.all().filter(a =>
      a.status === STATUS.ACTIVE || a.status === STATUS.PROCESSING
    ).length;
  }

  /**
   * Total tasks across all agents
   */
  get totalTasks() {
    return this.all().reduce((sum, a) => sum + (a.metrics.tasksToday || 0), 0);
  }

  // ── Activity Feed ────────────────────────────────────────
  registerActivities(templates) {
    this._activityTemplates = templates;
  }

  getRandomActivity() {
    if (this._activityTemplates.length === 0) return null;
    const tpl = this._activityTemplates[Math.floor(Math.random() * this._activityTemplates.length)];
    const agent = this.get(tpl.agent);
    return {
      ...tpl,
      agentName: agent?.name || tpl.agent.toUpperCase(),
      agentColor: agent?.color || '#00ff9f',
      agentEmoji: agent?.emoji || '🤖',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    };
  }
}

// ── Singleton ────────────────────────────────────────────────
export const registry = new AgentRegistry();

// ── Default Agent Definitions ────────────────────────────────
export const DEFAULT_AGENTS = [
  // Executive Floor
  {
    id: 'moni', name: 'MONI', title: 'Chief Executive Officer',
    role: 'GRC Command Center', emoji: '🔍', tier: TIER.EXECUTIVE,
    color: '#00ff9f', glowIntensity: 1.5,
    position: { x: 0, y: 0, z: 0 }, deskSize: { w: 3.5, d: 2.0 },
    model: 'zai/glm-5', status: STATUS.ACTIVE,
    metrics: { tasksToday: 47, uptime: '99.8%', latency: '120ms' },
    description: 'Central command orchestrating all agent operations. Governance, Risk & Compliance oversight with real-time monitoring.',
  },
  {
    id: 'falah', name: 'FALAH', title: 'Chief Operating Officer',
    role: 'Sharia Portfolio Advisor', emoji: '💰', tier: TIER.EXECUTIVE,
    color: '#4ecdc4', glowIntensity: 1.3,
    position: { x: -6, y: 0, z: 0 }, deskSize: { w: 3.0, d: 1.8 },
    model: 'claude-sonnet-4-6', status: STATUS.ACTIVE,
    metrics: { tasksToday: 31, uptime: '99.5%', latency: '95ms' },
    description: 'Sharia-compliant portfolio tracking, halal screening, and Islamic finance advisory operations.',
  },
  {
    id: 'aurix', name: 'AURIX', title: 'Chief Technology Officer',
    role: 'Audit & Fraud Detection', emoji: '🔬', tier: TIER.EXECUTIVE,
    color: '#ff6b6b', glowIntensity: 1.3,
    position: { x: 6, y: 0, z: 0 }, deskSize: { w: 3.0, d: 1.8 },
    model: 'claude-opus-4-6', status: STATUS.PROCESSING,
    metrics: { tasksToday: 28, uptime: '99.9%', latency: '180ms' },
    description: 'ISA 240 audit analysis, Benford\'s Law anomaly detection, and forensic accounting intelligence.',
  },

  // Director Row
  {
    id: 'takwa', name: 'TAKWA', title: 'GRC Director',
    role: 'Regulatory Compliance', emoji: '⚖️', tier: TIER.DIRECTOR,
    color: '#ffd93d', glowIntensity: 1.0,
    position: { x: -7, y: 0, z: -6 }, deskSize: { w: 2.5, d: 1.5 },
    model: 'zai/glm-5', status: STATUS.ACTIVE,
    metrics: { tasksToday: 19, uptime: '98.7%', latency: '110ms' },
    description: 'Indonesian regulatory quick-reference, OJK/BI compliance monitoring, and governance framework enforcement.',
  },
  {
    id: 'amanah', name: 'AMANAH', title: 'Investment Director',
    role: 'Portfolio Intelligence', emoji: '📊', tier: TIER.DIRECTOR,
    color: '#6bcb77', glowIntensity: 1.0,
    position: { x: -2.5, y: 0, z: -6 }, deskSize: { w: 2.5, d: 1.5 },
    model: 'claude-sonnet-4-6', status: STATUS.IDLE,
    metrics: { tasksToday: 14, uptime: '99.2%', latency: '88ms' },
    description: 'Gold price tracking (Pegadaian), Sharia stock screening, and wealth allocation advisory.',
  },
  {
    id: 'hikmah', name: 'HIKMAH', title: 'Technology Director',
    role: 'Research & Development', emoji: '🧠', tier: TIER.DIRECTOR,
    color: '#4d96ff', glowIntensity: 1.0,
    position: { x: 2.5, y: 0, z: -6 }, deskSize: { w: 2.5, d: 1.5 },
    model: 'claude-opus-4-6', status: STATUS.PROCESSING,
    metrics: { tasksToday: 22, uptime: '99.1%', latency: '200ms' },
    description: 'Doctoral research support, Algorithmic Fiduciary Framework, and AI governance literature review.',
  },
  {
    id: 'basyar', name: 'BASYAR', title: 'Intelligence Director',
    role: 'Competitive Intelligence', emoji: '🕵️', tier: TIER.DIRECTOR,
    color: '#ff922b', glowIntensity: 1.0,
    position: { x: 7, y: 0, z: -6 }, deskSize: { w: 2.5, d: 1.5 },
    model: 'zai/glm-5', status: STATUS.ACTIVE,
    metrics: { tasksToday: 16, uptime: '98.9%', latency: '130ms' },
    description: 'BPKH ecosystem intelligence, competitor analysis, and strategic market reconnaissance.',
  },

  // Team Leads
  {
    id: 'nizam', name: 'NIZAM', title: 'Operations Lead',
    role: 'System Operations', emoji: '⚙️', tier: TIER.LEAD,
    color: '#cc5de8', glowIntensity: 0.8,
    position: { x: -8, y: 0, z: -12 }, deskSize: { w: 2.2, d: 1.3 },
    model: 'zai/glm-4.7', status: STATUS.ACTIVE,
    metrics: { tasksToday: 35, uptime: '99.6%', latency: '60ms' },
    description: 'Health pulse monitoring, auto-maintenance, backup scheduling, and infrastructure operations.',
  },
  {
    id: 'aman', name: 'AMAN', title: 'Security Lead',
    role: 'Security Hardening', emoji: '🛡️', tier: TIER.LEAD,
    color: '#ff4757', glowIntensity: 0.8,
    position: { x: -4, y: 0, z: -12 }, deskSize: { w: 2.2, d: 1.3 },
    model: 'zai/glm-5', status: STATUS.ALERT,
    metrics: { tasksToday: 12, uptime: '99.99%', latency: '45ms' },
    description: 'Fail2ban monitoring, Tailscale VPN oversight, API key rotation, and threat detection.',
  },
  {
    id: 'rais', name: "RA'IS", title: 'Oversight Lead',
    role: 'Quality Assurance', emoji: '👁️', tier: TIER.LEAD,
    color: '#20c997', glowIntensity: 0.8,
    position: { x: 0, y: 0, z: -12 }, deskSize: { w: 2.2, d: 1.3 },
    model: 'claude-sonnet-4-6', status: STATUS.ACTIVE,
    metrics: { tasksToday: 18, uptime: '99.3%', latency: '105ms' },
    description: 'Anti-hallucination enforcement, fact-checking validation, and output precision governance.',
  },
  {
    id: 'wasit', name: 'WASIT', title: 'Mediator Lead',
    role: 'Agent Coordination', emoji: '🤝', tier: TIER.LEAD,
    color: '#fcc419', glowIntensity: 0.8,
    position: { x: 4, y: 0, z: -12 }, deskSize: { w: 2.2, d: 1.3 },
    model: 'zai/glm-4.7', status: STATUS.IDLE,
    metrics: { tasksToday: 9, uptime: '98.5%', latency: '75ms' },
    description: 'Inter-agent conflict resolution, model routing decisions, and smart auto-switching coordination.',
  },
  {
    id: 'muhtasib', name: 'MUHTASIB', title: 'Compliance Lead',
    role: 'Audit Trail', emoji: '📋', tier: TIER.LEAD,
    color: '#e599f7', glowIntensity: 0.8,
    position: { x: 8, y: 0, z: -12 }, deskSize: { w: 2.2, d: 1.3 },
    model: 'claude-sonnet-4-6', status: STATUS.ACTIVE,
    metrics: { tasksToday: 21, uptime: '99.4%', latency: '92ms' },
    description: 'Continuous compliance monitoring, audit trail logging, and Sharia governance documentation.',
  },
];

// ── Default Activity Templates ───────────────────────────────
export const DEFAULT_ACTIVITIES = [
  { agent: 'moni', message: 'Completed GRC risk assessment scan', type: 'success' },
  { agent: 'moni', message: 'Routing task to AURIX for fraud analysis', type: 'info' },
  { agent: 'moni', message: 'Daily governance scorecard generated', type: 'success' },
  { agent: 'falah', message: 'Portfolio rebalancing alert: IHSG -1.2%', type: 'warning' },
  { agent: 'falah', message: 'Sharia screening passed for 3 new stocks', type: 'success' },
  { agent: 'falah', message: 'Dividend yield analysis complete', type: 'info' },
  { agent: 'aurix', message: 'Benford\'s Law anomaly detected in dataset #47', type: 'alert' },
  { agent: 'aurix', message: 'ISA 240 audit template generated', type: 'success' },
  { agent: 'aurix', message: 'Fraud pattern scan: 0 threats found', type: 'success' },
  { agent: 'takwa', message: 'OJK regulation update: POJK 12/2024 indexed', type: 'info' },
  { agent: 'takwa', message: 'Compliance checklist auto-updated', type: 'success' },
  { agent: 'amanah', message: 'Gold price update: Rp 1,847,000/gram', type: 'info' },
  { agent: 'amanah', message: 'Pegadaian Emas price feed synced', type: 'success' },
  { agent: 'hikmah', message: 'Literature review: 12 new papers indexed', type: 'success' },
  { agent: 'hikmah', message: 'Doctoral framework chapter 3 analysis complete', type: 'info' },
  { agent: 'basyar', message: 'BPKH competitor report generated', type: 'success' },
  { agent: 'basyar', message: 'Market intelligence scan: 5 signals detected', type: 'warning' },
  { agent: 'nizam', message: 'System health: all services nominal', type: 'success' },
  { agent: 'nizam', message: 'Auto-backup completed: 2.4GB archived', type: 'info' },
  { agent: 'nizam', message: 'Gateway uptime: 14d 7h 23m', type: 'success' },
  { agent: 'aman', message: 'Blocked 23 SSH brute-force attempts', type: 'alert' },
  { agent: 'aman', message: 'Tailscale mesh: all 4 nodes connected', type: 'success' },
  { agent: 'aman', message: 'API key rotation scheduled in 48h', type: 'info' },
  { agent: 'rais', message: 'Fact-check validation: 98.7% accuracy', type: 'success' },
  { agent: 'rais', message: 'Hallucination flag: confidence LOW on response #291', type: 'warning' },
  { agent: 'wasit', message: 'Model switch: GLM-5 → Opus for deep analysis', type: 'info' },
  { agent: 'wasit', message: 'Agent conflict resolved: AURIX ↔ TAKWA priority', type: 'success' },
  { agent: 'muhtasib', message: 'Audit trail: 142 events logged today', type: 'info' },
  { agent: 'muhtasib', message: 'Sharia governance report exported', type: 'success' },
  { agent: 'muhtasib', message: 'Compliance score: 97.3% — above threshold', type: 'success' },
];
