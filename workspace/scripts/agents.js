/**
 * MONI 3D Workspace — Agent Definitions
 * 12 AI Agents with roles, positions, and visual properties
 */

export const AGENT_TIERS = {
  EXECUTIVE: 'executive',
  DIRECTOR: 'director',
  LEAD: 'lead'
};

export const AGENT_STATUS = {
  ACTIVE: 'active',
  IDLE: 'idle',
  PROCESSING: 'processing',
  ALERT: 'alert'
};

export const agents = [
  // ── Executive Floor (Front Row) ────────────────────────
  {
    id: 'moni',
    name: 'MONI',
    title: 'Chief Executive Officer',
    role: 'GRC Command Center',
    emoji: '🔍',
    tier: AGENT_TIERS.EXECUTIVE,
    color: '#00ff9f',
    glowIntensity: 1.5,
    position: { x: 0, y: 0, z: 0 },
    deskSize: { w: 3.5, d: 2.0 },
    model: 'zai/glm-5',
    status: AGENT_STATUS.ACTIVE,
    metrics: { tasksToday: 47, uptime: '99.8%', latency: '120ms' },
    description: 'Central command orchestrating all agent operations. Governance, Risk & Compliance oversight with real-time monitoring.'
  },
  {
    id: 'falah',
    name: 'FALAH',
    title: 'Chief Operating Officer',
    role: 'Sharia Portfolio Advisor',
    emoji: '💰',
    tier: AGENT_TIERS.EXECUTIVE,
    color: '#4ecdc4',
    glowIntensity: 1.3,
    position: { x: -6, y: 0, z: 0 },
    deskSize: { w: 3.0, d: 1.8 },
    model: 'claude-sonnet-4-6',
    status: AGENT_STATUS.ACTIVE,
    metrics: { tasksToday: 31, uptime: '99.5%', latency: '95ms' },
    description: 'Sharia-compliant portfolio tracking, halal screening, and Islamic finance advisory operations.'
  },
  {
    id: 'aurix',
    name: 'AURIX',
    title: 'Chief Technology Officer',
    role: 'Audit & Fraud Detection',
    emoji: '🔬',
    tier: AGENT_TIERS.EXECUTIVE,
    color: '#ff6b6b',
    glowIntensity: 1.3,
    position: { x: 6, y: 0, z: 0 },
    deskSize: { w: 3.0, d: 1.8 },
    model: 'claude-opus-4-6',
    status: AGENT_STATUS.PROCESSING,
    metrics: { tasksToday: 28, uptime: '99.9%', latency: '180ms' },
    description: 'ISA 240 audit analysis, Benford\'s Law anomaly detection, and forensic accounting intelligence.'
  },

  // ── Director Row (Middle) ──────────────────────────────
  {
    id: 'takwa',
    name: 'TAKWA',
    title: 'GRC Director',
    role: 'Regulatory Compliance',
    emoji: '⚖️',
    tier: AGENT_TIERS.DIRECTOR,
    color: '#ffd93d',
    glowIntensity: 1.0,
    position: { x: -7, y: 0, z: -6 },
    deskSize: { w: 2.5, d: 1.5 },
    model: 'zai/glm-5',
    status: AGENT_STATUS.ACTIVE,
    metrics: { tasksToday: 19, uptime: '98.7%', latency: '110ms' },
    description: 'Indonesian regulatory quick-reference, OJK/BI compliance monitoring, and governance framework enforcement.'
  },
  {
    id: 'amanah',
    name: 'AMANAH',
    title: 'Investment Director',
    role: 'Portfolio Intelligence',
    emoji: '📊',
    tier: AGENT_TIERS.DIRECTOR,
    color: '#6bcb77',
    glowIntensity: 1.0,
    position: { x: -2.5, y: 0, z: -6 },
    deskSize: { w: 2.5, d: 1.5 },
    model: 'claude-sonnet-4-6',
    status: AGENT_STATUS.IDLE,
    metrics: { tasksToday: 14, uptime: '99.2%', latency: '88ms' },
    description: 'Gold price tracking (Pegadaian), Sharia stock screening, and wealth allocation advisory.'
  },
  {
    id: 'hikmah',
    name: 'HIKMAH',
    title: 'Technology Director',
    role: 'Research & Development',
    emoji: '🧠',
    tier: AGENT_TIERS.DIRECTOR,
    color: '#4d96ff',
    glowIntensity: 1.0,
    position: { x: 2.5, y: 0, z: -6 },
    deskSize: { w: 2.5, d: 1.5 },
    model: 'claude-opus-4-6',
    status: AGENT_STATUS.PROCESSING,
    metrics: { tasksToday: 22, uptime: '99.1%', latency: '200ms' },
    description: 'Doctoral research support, Algorithmic Fiduciary Framework, and AI governance literature review.'
  },
  {
    id: 'basyar',
    name: 'BASYAR',
    title: 'Intelligence Director',
    role: 'Competitive Intelligence',
    emoji: '🕵️',
    tier: AGENT_TIERS.DIRECTOR,
    color: '#ff922b',
    glowIntensity: 1.0,
    position: { x: 7, y: 0, z: -6 },
    deskSize: { w: 2.5, d: 1.5 },
    model: 'zai/glm-5',
    status: AGENT_STATUS.ACTIVE,
    metrics: { tasksToday: 16, uptime: '98.9%', latency: '130ms' },
    description: 'BPKH ecosystem intelligence, competitor analysis, and strategic market reconnaissance.'
  },

  // ── Team Lead Row (Back) ───────────────────────────────
  {
    id: 'nizam',
    name: 'NIZAM',
    title: 'Operations Lead',
    role: 'System Operations',
    emoji: '⚙️',
    tier: AGENT_TIERS.LEAD,
    color: '#cc5de8',
    glowIntensity: 0.8,
    position: { x: -8, y: 0, z: -12 },
    deskSize: { w: 2.2, d: 1.3 },
    model: 'zai/glm-4.7',
    status: AGENT_STATUS.ACTIVE,
    metrics: { tasksToday: 35, uptime: '99.6%', latency: '60ms' },
    description: 'Health pulse monitoring, auto-maintenance, backup scheduling, and infrastructure operations.'
  },
  {
    id: 'aman',
    name: 'AMAN',
    title: 'Security Lead',
    role: 'Security Hardening',
    emoji: '🛡️',
    tier: AGENT_TIERS.LEAD,
    color: '#ff4757',
    glowIntensity: 0.8,
    position: { x: -4, y: 0, z: -12 },
    deskSize: { w: 2.2, d: 1.3 },
    model: 'zai/glm-5',
    status: AGENT_STATUS.ALERT,
    metrics: { tasksToday: 12, uptime: '99.99%', latency: '45ms' },
    description: 'Fail2ban monitoring, Tailscale VPN oversight, API key rotation, and threat detection.'
  },
  {
    id: 'rais',
    name: "RA'IS",
    title: 'Oversight Lead',
    role: 'Quality Assurance',
    emoji: '👁️',
    tier: AGENT_TIERS.LEAD,
    color: '#20c997',
    glowIntensity: 0.8,
    position: { x: 0, y: 0, z: -12 },
    deskSize: { w: 2.2, d: 1.3 },
    model: 'claude-sonnet-4-6',
    status: AGENT_STATUS.ACTIVE,
    metrics: { tasksToday: 18, uptime: '99.3%', latency: '105ms' },
    description: 'Anti-hallucination enforcement, fact-checking validation, and output precision governance.'
  },
  {
    id: 'wasit',
    name: 'WASIT',
    title: 'Mediator Lead',
    role: 'Agent Coordination',
    emoji: '🤝',
    tier: AGENT_TIERS.LEAD,
    color: '#fcc419',
    glowIntensity: 0.8,
    position: { x: 4, y: 0, z: -12 },
    deskSize: { w: 2.2, d: 1.3 },
    model: 'zai/glm-4.7',
    status: AGENT_STATUS.IDLE,
    metrics: { tasksToday: 9, uptime: '98.5%', latency: '75ms' },
    description: 'Inter-agent conflict resolution, model routing decisions, and smart auto-switching coordination.'
  },
  {
    id: 'muhtasib',
    name: 'MUHTASIB',
    title: 'Compliance Lead',
    role: 'Audit Trail',
    emoji: '📋',
    tier: AGENT_TIERS.LEAD,
    color: '#e599f7',
    glowIntensity: 0.8,
    position: { x: 8, y: 0, z: -12 },
    deskSize: { w: 2.2, d: 1.3 },
    model: 'claude-sonnet-4-6',
    status: AGENT_STATUS.ACTIVE,
    metrics: { tasksToday: 21, uptime: '99.4%', latency: '92ms' },
    description: 'Continuous compliance monitoring, audit trail logging, and Sharia governance documentation.'
  }
];

/**
 * Simulated activity feed messages
 */
export const activityTemplates = [
  { agent: 'moni', message: 'Completed GRC risk assessment scan', type: 'success' },
  { agent: 'moni', message: 'Routing task to AURIX for fraud analysis', type: 'info' },
  { agent: 'falah', message: 'Portfolio rebalancing alert: IHSG -1.2%', type: 'warning' },
  { agent: 'falah', message: 'Sharia screening passed for 3 new stocks', type: 'success' },
  { agent: 'aurix', message: 'Benford\'s Law anomaly detected in dataset #47', type: 'alert' },
  { agent: 'aurix', message: 'ISA 240 audit template generated', type: 'success' },
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
  { agent: 'aman', message: 'Blocked 23 SSH brute-force attempts', type: 'alert' },
  { agent: 'aman', message: 'Tailscale mesh: all 4 nodes connected', type: 'success' },
  { agent: 'rais', message: 'Fact-check validation: 98.7% accuracy', type: 'success' },
  { agent: 'rais', message: 'Hallucination flag: confidence LOW on response #291', type: 'warning' },
  { agent: 'wasit', message: 'Model switch: GLM-5 → Opus for deep analysis', type: 'info' },
  { agent: 'wasit', message: 'Agent conflict resolved: AURIX ↔ TAKWA priority', type: 'success' },
  { agent: 'muhtasib', message: 'Audit trail: 142 events logged today', type: 'info' },
  { agent: 'muhtasib', message: 'Sharia governance report exported', type: 'success' }
];

/**
 * Get a random activity for the live feed
 */
export function getRandomActivity() {
  const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
  const agent = agents.find(a => a.id === template.agent);
  return {
    ...template,
    agentName: agent?.name || template.agent.toUpperCase(),
    agentColor: agent?.color || '#00ff9f',
    agentEmoji: agent?.emoji || '🤖',
    timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false })
  };
}

/**
 * Get agents by tier
 */
export function getAgentsByTier(tier) {
  return agents.filter(a => a.tier === tier);
}
