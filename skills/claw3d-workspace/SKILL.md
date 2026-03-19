---
name: claw3d-workspace
description: 3D visual workspace integration — monitor agent activity, office navigation, and spatial collaboration through Claw3D Studio
---

# claw3d-workspace

## Overview
Claw3D turns the MONI AI system into a visual workplace where agents collaborate, review tasks, and execute work inside a shared 3D office environment.

## What It Does
- **Agent Visualization**: See MONI, FALAH, AURIX, and BAYAN as workers in a retro 3D office
- **Real-Time Monitoring**: Watch agent activity, approvals, and task execution live
- **Spatial Collaboration**: Agents occupy rooms based on their current function (audit room, research lab, trading desk)
- **Fleet Management**: Manage all agents from a unified workspace dashboard

## Agent Desk Assignments
| Agent | Room | Function |
|-------|------|----------|
| MONI | Command Center | GRC oversight & coordination |
| FALAH | Trading Desk | Portfolio monitoring & alerts |
| AURIX | Audit Room | Fraud detection & audit findings |
| BAYAN | Research Lab | Doctoral research & literature review |

## Connection
Claw3D connects to the OpenClaw Gateway via WebSocket proxy:
```
Browser → Studio (localhost:3000) → Gateway (localhost:18789)
```

## Setup
```bash
bash scripts/setup-claw3d.sh
```

## Usage
When asked about workspace visualization, agent monitoring, or 3D office:
1. Confirm Claw3D Studio is running
2. Provide the Studio URL (default: http://localhost:3000)
3. Guide user to the relevant view:
   - `/agents` — fleet management, chat, approvals
   - `/office` — 3D retro office with live agent activity
   - `/office/builder` — customize office layout
