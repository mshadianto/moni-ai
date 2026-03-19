# CLAUDE.md — Project Guide for AI Assistants

## Project Overview

**MONI** is a multi-agent AI command center running on OpenClaw, with a Three.js 3D visual workspace. It manages 12 AI agents across 3 organizational tiers for GRC (Governance, Risk, Compliance), Islamic finance, and doctoral research.

## Repository Structure

```
moni/
├── SOUL.md                     # Agent personality & system prompt
├── README.md                   # Project documentation
├── CLAUDE.md                   # This file — AI assistant guide
├── LICENSE                     # MIT
├── .gitignore
├── config/
│   └── openclaw-sample.json    # OpenClaw gateway config (models, agents, channels, studio)
├── scripts/
│   ├── install.sh              # Main installer
│   └── setup-claw3d.sh         # Claw3D submodule setup
├── skills/                     # 26 OpenClaw skills (each has SKILL.md)
│   ├── chain-of-thought/
│   ├── aurix-audit/
│   ├── falah-portfolio/
│   ├── claw3d-workspace/       # 3D workspace skill
│   └── ... (22 more)
├── claw3d/                     # Git submodule → github.com/iamlukethedev/Claw3D
└── workspace/                  # 3D Visual Workspace (Three.js)
    ├── index.html              # Entry point — canvas + HUD
    ├── start.sh                # Local dev server (port 8080)
    ├── styles/main.css         # HUD styling (dark theme, glassmorphism)
    ├── lib/
    │   ├── three.module.js     # Three.js r160 (bundled locally)
    │   └── OrbitControls.js    # Camera controls (bundled locally)
    └── scripts/
        ├── config.js           # All tunable parameters
        ├── events.js           # Pub/sub event bus
        ├── agents.js           # Agent registry (12 agents + activity feed)
        ├── renderer.js         # Render pipeline + FPS-based quality scaling
        ├── websocket.js        # WebSocket manager (gateway + simulation fallback)
        ├── office.js           # Three.js scene (GTA-style compound)
        └── main.js             # HUD controller + module orchestrator
```

## Key Technical Decisions

### Three.js Version
- Using **r160** (not latest) because `OrbitControls` in r160 extends `EventDispatcher` which is included in the standalone build. Later versions require `Controls` base class from a separate import path.
- Three.js and OrbitControls are **bundled locally** under `workspace/lib/` — no CDN dependency.

### Workspace Architecture
- **Event-driven**: All modules communicate via `events.js` pub/sub bus. No direct coupling between office.js and main.js.
- **Render pipeline**: Centralized in `renderer.js` with adaptive quality (auto-downgrades pixel ratio and shadows when FPS drops below 30).
- **WebSocket**: `websocket.js` attempts gateway connection, silently falls back to simulation mode with fake activity feed.
- **Config-driven**: All tunable values in `config.js` (camera FOV, avatar sizes, particle counts, performance thresholds).

### Current Theme
- **GTA Realistic Golden Hour** — glass skyscraper HQ, palm trees, parked vehicles, distant city skyline, sunset gradient sky
- Characters wear suits with agent-colored ties; executives have sunglasses
- Previous themes available in git history: Cyberpunk Neon, LEGO, The Simpsons x Indonesia

### 12 Agents (3 Tiers)
- **Executive** (x: -6/0/6, z: 0): MONI, FALAH, AURIX
- **Director** (x: -7/-2.5/2.5/7, z: -6): TAKWA, AMANAH, HIKMAH, BASYAR
- **Lead** (x: -8/-4/0/4/8, z: -12): NIZAM, AMAN, RA'IS, WASIT, MUHTASIB

## Common Tasks

### Run the 3D workspace
```bash
cd workspace && bash start.sh
# Or: cd workspace && node -e "..." (see start.sh for inline server)
# Open http://127.0.0.1:8080 (use 127.0.0.1, not localhost — proxy issues on Windows)
```

### Change workspace theme
Edit `workspace/scripts/office.js` — the `initScene()`, `buildLighting()`, and character/desk creation functions control the visual style. Update `workspace/styles/main.css` CSS variables to match.

### Add a new agent
1. Add to `DEFAULT_AGENTS` array in `workspace/scripts/agents.js`
2. Set unique `id`, `position`, `color`, `tier`
3. Add activity templates to `DEFAULT_ACTIVITIES`
4. Agent auto-registers via `registry.registerAll()` on init

### Modify agent modal
The modal HTML is generated in `showAgentModal()` in `workspace/scripts/main.js`. Styles are in `main.css` under the `/* Agent Modal — Large Dossier */` section.

## Environment Notes
- **Platform**: Windows 11 (bash via Git Bash / MSYS2)
- **Node.js**: v22+
- **Package manager**: Bun (for OpenClaw skills)
- **Port conflicts**: Port 8080 is often occupied — use 9090 or another port if needed
- **Proxy issues**: Use `127.0.0.1` instead of `localhost` to avoid Windows proxy interception
- **Google Fonts**: May fail behind proxy — CSS has system font fallbacks

## Do NOT
- Do not upgrade Three.js beyond r160 without verifying OrbitControls compatibility
- Do not use CDN imports — everything must be bundled locally under `workspace/lib/`
- Do not commit real API keys (`.gitignore` covers `.env`, `credentials/`, `secrets/`)
- Do not modify files inside `claw3d/` directly — it's a git submodule
