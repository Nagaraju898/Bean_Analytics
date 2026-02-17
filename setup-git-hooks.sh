#!/bin/bash
################################################################################
# Git Hook Installer for Docker Auto-Rebuild
# Purpose: Set up post-pull git hook to auto-rebuild Docker containers
# Usage: ./setup-git-hooks.sh
################################################################################

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_HOOKS_DIR="${PROJECT_DIR}/.git/hooks"

echo "🔧 Git Hook Setup for Docker Auto-Rebuild"
echo "=========================================="

# Check if .git directory exists
if [ ! -d "${PROJECT_DIR}/.git" ]; then
    echo "❌ Error: Not a git repository"
    echo "Please run this script from the project root"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"

# Copy post-pull hook
echo "📋 Installing post-pull hook..."
cp "${PROJECT_DIR}/post-pull-rebuild.sh" "${GIT_HOOKS_DIR}/post-pull"
chmod +x "${GIT_HOOKS_DIR}/post-pull"

echo "✅ Git hooks installed successfully"
echo ""
echo "Available hooks:"
echo "  • post-pull: Auto-rebuilds Docker containers on git pull"
echo ""
echo "Hooks location: ${GIT_HOOKS_DIR}"
echo ""
echo "🚀 Next time you run 'git pull', containers will rebuild automatically!"
echo ""
