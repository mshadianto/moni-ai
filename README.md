# 🔍 MONI — Personal GRC & Wealth AI Command Center

> **Monitor, Optimize, Navigate, Inform** — A multi-agent AI system built on OpenClaw for GRC professionals and Islamic finance practitioners.

## What is MONI?

MONI is a production-grade AI command center running on [OpenClaw](https://github.com/openclaw/openclaw), designed for:
- **GRC (Governance, Risk, Compliance)** advisory and audit automation
- **Sharia-compliant portfolio monitoring** with real-time market data
- **Doctoral research support** for AI governance frameworks
- **Multi-channel communication** via Telegram & WhatsApp
- **3D Visual Workspace** for real-time agent monitoring

Built by [MS Hadianto](https://github.com/mshadianto) — GRC Expert, AI-Powered Builder.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    MONI AI System                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │ MONI │ │FALAH │ │AURIX │ │BAYAN │  ← 4 Core Agents  │
│  │ CEO  │ │ COO  │ │ CTO  │ │Resrch│                   │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘                   │
│     │        │        │        │                         │
│  ┌──┴───┐ ┌──┴───┐ ┌──┴──┐ ┌──┴───┐ ┌──────┐          │
│  │TAKWA │ │AMANAH│ │HIKM.│ │BASYR.│ │NIZAM │           │
│  │ GRC  │ │ Inv. │ │ R&D │ │Intel │ │ Ops  │           │
│  └──────┘ └──────┘ └─────┘ └──────┘ └──────┘           │
│  ┌──────┐ ┌──────┐ ┌──────┐                             │
│  │ AMAN │ │RA'IS │ │WASIT │ ← 12 Agents Total          │
│  │ Sec. │ │ QA   │ │Coord.│ + MUHTASIB (Compliance)    │
│  └──────┘ └──────┘ └──────┘                             │
│                    │                                     │
│  ┌─────────────────┴──────────────────┐                 │
│  │         OpenClaw Gateway            │                 │
│  │         v2026.3.12                  │                 │
│  └─────────────────┬──────────────────┘                 │
│                    │                                     │
│  ┌────────┐  ┌────────┐  ┌────────┐                     │
│  │Telegram│  │WhatsApp│  │WebChat │                     │
│  └────────┘  └────────┘  └────────┘                     │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │  🏢 3D Workspace (Three.js)                   │       │
│  │  GTA-style open world │ Interactive agents    │       │
│  │  Real-time HUD │ WebSocket-ready              │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  Models: ZAI/GLM-5 + SumoPod (Claude/GPT)              │
│  Search: Tavily | Memory: Voyage AI                      │
│  Security: Fail2ban + Tailscale                          │
└──────────────────────────────────────────────────────────┘
```

## 12 AI Agents

### Executive Floor (C-Suite)
| Agent | Title | Role | Model | Emoji |
|-------|-------|------|-------|-------|
| **MONI** | CEO | GRC Command Center | zai/glm-5 | 🔍 |
| **FALAH** | COO | Sharia Portfolio Advisor | claude-sonnet-4-6 | 💰 |
| **AURIX** | CTO | Audit & Fraud Detection | claude-opus-4-6 | 🔬 |

### Director Row
| Agent | Title | Role | Model | Emoji |
|-------|-------|------|-------|-------|
| **TAKWA** | GRC Director | Regulatory Compliance | zai/glm-5 | ⚖️ |
| **AMANAH** | Investment Director | Portfolio Intelligence | claude-sonnet-4-6 | 📊 |
| **HIKMAH** | Technology Director | Research & Development | claude-opus-4-6 | 🧠 |
| **BASYAR** | Intelligence Director | Competitive Intelligence | zai/glm-5 | 🕵️ |

### Team Leads
| Agent | Title | Role | Model | Emoji |
|-------|-------|------|-------|-------|
| **NIZAM** | Operations Lead | System Operations | zai/glm-4.7 | ⚙️ |
| **AMAN** | Security Lead | Security Hardening | zai/glm-5 | 🛡️ |
| **RA'IS** | Oversight Lead | Quality Assurance | claude-sonnet-4-6 | 👁️ |
| **WASIT** | Mediator Lead | Agent Coordination | zai/glm-4.7 | 🤝 |
| **MUHTASIB** | Compliance Lead | Audit Trail | claude-sonnet-4-6 | 📋 |

## 3D Workspace

The MONI 3D Workspace is a **GTA-style interactive environment** built with Three.js where all 12 agents are visualized in a photorealistic open-world corporate compound.

### Features
- **GTA Realistic 4K** — Golden hour lighting, glass skyscraper HQ, distant city skyline
- **12 Interactive Agents** — Click any character to view full agent dossier
- **Cinematic Camera** — Orbit controls with smooth fly-to animation on agent select
- **Real-time HUD** — Agent fleet panel, live activity feed, performance stats, FPS counter
- **Agent Dossier Modal** — Full-width panel with metrics, activity history, system info
- **Modular Architecture** — Event bus, render pipeline, WebSocket-ready for live gateway data
- **Adaptive Quality** — Auto-scales pixel ratio and shadows based on FPS

### Tech Stack
- **Three.js r160** — 3D engine (bundled locally, no CDN required)
- **OrbitControls** — Camera navigation
- **ES6 Modules** — Clean modular architecture
- **Vanilla CSS** — Glassmorphism HUD panels

### Run the 3D Workspace
```bash
cd workspace
bash start.sh
# Open http://127.0.0.1:8080
```

### Module Architecture
```
workspace/
├── index.html              # Full-screen canvas + HUD overlays
├── styles/main.css         # GTA-themed dark HUD with neon accents
├── start.sh                # Static server (Node.js or Python)
├── lib/
│   ├── three.module.js     # Three.js r160 (bundled)
│   └── OrbitControls.js    # Camera controls (bundled)
└── scripts/
    ├── config.js           # Centralized parameters (scene, camera, perf)
    ├── events.js           # Pub/sub event bus (decouples all modules)
    ├── agents.js           # Agent registry + activity feed templates
    ├── renderer.js         # Render pipeline + adaptive quality scaling
    ├── websocket.js        # Gateway connection + simulation fallback
    ├── office.js           # 3D scene (building, characters, props, lighting)
    └── main.js             # HUD controller + orchestrator
```

## Claw3D Integration

MONI also integrates with [Claw3D](https://github.com/iamlukethedev/Claw3D) (git submodule) for OpenClaw gateway-connected 3D visualization.

```bash
bash scripts/setup-claw3d.sh
cd claw3d && npm run dev
# Open http://localhost:3000
```

## Skills (26)

### Core
- `chain-of-thought` — Structured thinking protocol
- `fact-checker` — Zero tolerance for hallucination
- `precision-output` — BLUF style, quantified outputs
- `anti-hallucination` — Confidence tagging [HIGH/MED/LOW]
- `error-recovery` — Graceful error handling
- `ultimate-agent` — Meta-skill operating system
- `model-router` — Intelligent model selection
- `smart-autoswitch` — Auto-suggest model per task

### GRC & Audit
- `grc-regulatory` — Indonesian regulatory quick reference
- `aurix-audit` — ISA 240 audit findings & Benford's Law
- `competitive-intel` — BPKH Limited & hajj ecosystem intelligence

### Finance
- `pegadaian-emas` — Gold price tracking (Pegadaian reference)
- `falah-portfolio` — Sharia-compliant portfolio tracker
- `bill-tracker` — Monthly bill reminder & payment tracking

### Productivity
- `smart-summarize` — BLUF document summarization
- `daily-digest` — Comprehensive morning briefing
- `meeting-assist` — Pre/post meeting support
- `doc-drafter` — Formal document drafting (surat, memo, laporan)
- `social-planner` — LinkedIn & YouTube content planning
- `project-tracker` — Multi-project status tracking

### Research
- `doctoral-research` — Algorithmic Fiduciary Framework support
- `research-pipeline` — Multi-phase deep research

### Operations
- `security-hardening` — Server security monitoring
- `health-pulse` — System health check
- `auto-maintenance` — Self-maintenance protocol
- `backup-manager` — Config & data backup

### Workspace
- `claw3d-workspace` — 3D visual workspace integration

## Quick Start

### Prerequisites
- VPS with Node.js 22+ (Tencent Cloud, AWS, DigitalOcean)
- [OpenClaw](https://github.com/openclaw/openclaw) installed
- API keys: ZAI (z.ai), SumoPod, Tavily, Voyage AI

### Installation

```bash
# Clone this repo
git clone https://github.com/mshadianto/moni-ai.git
cd moni-ai

# Run installer (copies skills, SOUL.md, optionally sets up Claw3D)
bash scripts/install.sh

# Or manually:
cp -r skills/* ~/.openclaw/workspace/skills/
cp SOUL.md ~/.openclaw/workspace/SOUL.md
cp config/openclaw-sample.json ~/.openclaw/openclaw.json
openclaw gateway restart
```

### Environment Variables
```bash
export TAVILY_API_KEY="tvly-your-key"
export VOYAGE_API_KEY="pa-your-key"
export GITHUB_TOKEN="ghp_your-token"
```

### Run 3D Workspace
```bash
cd workspace && bash start.sh
# Open http://127.0.0.1:8080
```

## Models

| Provider | Models | Cost | Use Case |
|----------|--------|------|----------|
| ZAI (z.ai) | GLM-5, GLM-4.7 | Free | Daily operations |
| SumoPod | Claude Opus/Sonnet/Haiku | $0/1M tokens | Heavy analysis |
| SumoPod | GPT-5.2, DeepSeek R1 | $0/1M tokens | Coding, reasoning |

## Security

- **Fail2ban**: SSH brute-force protection (3 retries → 24h ban)
- **Tailscale**: VPN mesh network for secure remote access
- **API Key rotation**: Regular key regeneration protocol
- **Loopback binding**: Gateway only accessible locally

## Author

**MS Hadianto (Sopian)**
- GRC Expert | CACP® | CCFA® | QIA® | CA® | GRCP® | GRCA® | CGP®
- Senior Lead Auditor ISO 37001 | Lead Auditor ISO 9001
- [LinkedIn](https://linkedin.com/in/ms-hadianto)
- [GitHub](https://github.com/mshadianto)
- [YouTube](https://youtube.com/@MSHadianto)

## License

MIT License — See [LICENSE](LICENSE) for details.

---

*Built with 🔍 MONI + 🦞 OpenClaw + ☕ Curiosity*
