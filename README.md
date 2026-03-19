# 🔍 MONI — Personal GRC & Wealth AI Command Center

> **Monitor, Optimize, Navigate, Inform** — A multi-agent AI system built on OpenClaw for GRC professionals and Islamic finance practitioners.

## What is MONI?

MONI is a production-grade AI command center running on [OpenClaw](https://github.com/openclaw/openclaw), designed for:
- **GRC (Governance, Risk, Compliance)** advisory and audit automation
- **Sharia-compliant portfolio monitoring** with real-time market data
- **Doctoral research support** for AI governance frameworks
- **Multi-channel communication** via Telegram & WhatsApp

Built by [MS Hadianto](https://github.com/mshadianto) — GRC Expert, AI-Powered Builder.

## Architecture

```
┌─────────────────────────────────────────────┐
│              MONI AI System                  │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    │
│  │ MONI │  │FALAH │  │AURIX │  │BAYAN │    │
│  │ Main │  │Portf.│  │Audit │  │Resrch│    │
│  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘    │
│     └─────────┴─────────┴─────────┘         │
│                    │                         │
│  ┌─────────────────┴──────────────────┐     │
│  │         OpenClaw Gateway            │     │
│  │         v2026.3.12                  │     │
│  └─────────────────┬──────────────────┘     │
│                    │                         │
│  ┌────────┐  ┌────────┐  ┌────────┐         │
│  │Telegram│  │WhatsApp│  │WebChat │         │
│  └────────┘  └────────┘  └────────┘         │
│                                              │
│  ┌──────────────────────────────────┐       │
│  │  🏢 Claw3D — 3D Visual Workspace │       │
│  │  Agents → Office → Real-Time     │       │
│  └──────────────────────────────────┘       │
│                                              │
│  Models: ZAI/GLM-5 + SumoPod (Claude/GPT)  │
│  Search: Tavily | Memory: Voyage AI          │
│  Security: Fail2ban + Tailscale              │
└─────────────────────────────────────────────┘
```

## Agents

| Agent | Role | Default Model | Emoji |
|-------|------|---------------|-------|
| **MONI** | GRC Command Center | zai/glm-5 | 🔍 |
| **FALAH** | Sharia Portfolio Advisor | claude-sonnet-4-6 | 💰 |
| **AURIX** | Audit & Fraud Detection | claude-opus-4-6 | 🔬 |
| **BAYAN** | Doctoral Research | claude-opus-4-6 | 📚 |

## Skills (25+)

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

# Copy skills to OpenClaw workspace
cp -r skills/* ~/.openclaw/workspace/skills/

# Copy SOUL.md
cp SOUL.md ~/.openclaw/workspace/SOUL.md

# Copy agent configs (edit with your own API keys)
cp config/openclaw-sample.json ~/.openclaw/openclaw.json

# Restart gateway
openclaw gateway restart
```

### Environment Variables (set in ~/.bash_profile)
```bash
export TAVILY_API_KEY="tvly-your-key"
export VOYAGE_API_KEY="pa-your-key"
export GITHUB_TOKEN="ghp_your-token"
```

## Claw3D — 3D Visual Workspace

MONI integrates with [Claw3D](https://github.com/iamlukethedev/Claw3D), a 3D visual workspace that turns your AI agents into visible workers in a retro office environment.

```
┌─────────────────────────────────────────────────┐
│                 Claw3D Studio                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │  /agents   │  │  /office   │  │  /builder  │   │
│  │  Fleet     │  │  3D Retro  │  │  Layout    │   │
│  │  Manager   │  │  Office    │  │  Editor    │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
│        └──────────────┬──────────────┘           │
│                       │ WebSocket                │
│              ┌────────┴────────┐                 │
│              │ OpenClaw Gateway │                 │
│              └────────┬────────┘                 │
│     ┌────────┬────────┼────────┐                 │
│   MONI    FALAH    AURIX    BAYAN               │
└─────────────────────────────────────────────────┘
```

### Setup Claw3D
```bash
bash scripts/setup-claw3d.sh
cd claw3d && npm run dev
# Open http://localhost:3000
```

### Agent Desk Assignments
| Agent | Room | Function |
|-------|------|----------|
| MONI | Command Center | GRC oversight & coordination |
| FALAH | Trading Desk | Portfolio monitoring & alerts |
| AURIX | Audit Room | Fraud detection & audit findings |
| BAYAN | Research Lab | Doctoral research & literature |

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

## Methodology

> *"Curious → Coding → Deploy → Repeat"*
>
> *"Domain expertise + AI tools = results"*

MONI is built using AI as co-pilot, not traditional programming. Every skill and configuration is the result of iterative refinement through actual daily use.

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
