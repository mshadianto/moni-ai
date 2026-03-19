#!/bin/bash
# MONI AI Installer
# Usage: bash scripts/install.sh

echo "🔍 MONI AI Installer"
echo "===================="

WORKSPACE="${HOME}/.openclaw/workspace"

# Check OpenClaw
if ! command -v openclaw &> /dev/null; then
    echo "❌ OpenClaw not found. Install first: npm install -g openclaw@latest"
    exit 1
fi

echo "✅ OpenClaw $(openclaw --version) detected"

# Copy SOUL.md
cp SOUL.md $WORKSPACE/SOUL.md
echo "✅ SOUL.md copied"

# Copy skills
mkdir -p $WORKSPACE/skills
cp -r skills/* $WORKSPACE/skills/
echo "✅ $(ls skills | wc -l) skills copied"

# Restart gateway
openclaw gateway restart
echo "✅ Gateway restarted"

echo ""
echo "🎉 MONI AI installed!"
echo "Test: send a message to your Telegram/WhatsApp bot"
echo ""

# Optional: Claw3D 3D Workspace
read -p "🏢 Install Claw3D 3D workspace? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    bash "$(dirname "$0")/setup-claw3d.sh"
fi
