#!/usr/bin/env bash
#
# install.sh — copy the agentic-workflow skill + agents into a project's .claude/
#
# Usage:
#   bash agentic-workflow/install.sh [TARGET_PROJECT_DIR]
#
#   TARGET_PROJECT_DIR  Project root to install into. Defaults to the current directory.
#
# Idempotent. Copies:
#   skills/orchestrate  -> <target>/.claude/skills/orchestrate
#   agents/aw-*.md      -> <target>/.claude/agents/
# Never touches settings.json (adopt docs/permissions.md separately if you want the allow-list).

set -euo pipefail

# Resolve this script's own directory (the agentic-workflow source dir).
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TARGET="${1:-$(pwd)}"
TARGET="$(cd "$TARGET" && pwd)"   # normalize / validate it exists

CLAUDE_DIR="$TARGET/.claude"
SKILLS_DIR="$CLAUDE_DIR/skills"
AGENTS_DIR="$CLAUDE_DIR/agents"

echo "agentic-workflow installer"
echo "  source: $SRC_DIR"
echo "  target: $TARGET"

if [ ! -d "$SRC_DIR/skills/orchestrate" ] || [ ! -d "$SRC_DIR/agents" ]; then
  echo "ERROR: run this from the agentic-workflow directory (skills/ and agents/ not found)." >&2
  exit 1
fi

mkdir -p "$SKILLS_DIR" "$AGENTS_DIR"

# Skill (whole directory, references included).
rm -rf "$SKILLS_DIR/orchestrate"
cp -R "$SRC_DIR/skills/orchestrate" "$SKILLS_DIR/orchestrate"
echo "  ✓ installed skill: .claude/skills/orchestrate"

# Agents.
agent_count=0
for f in "$SRC_DIR"/agents/aw-*.md; do
  [ -e "$f" ] || continue
  cp "$f" "$AGENTS_DIR/"
  agent_count=$((agent_count + 1))
done
echo "  ✓ installed $agent_count agents: .claude/agents/aw-*.md"

echo
echo "Done. Invoke with:  /orchestrate <describe the work>"
echo "Permissions allow-list is opt-in — see agentic-workflow/docs/permissions.md"
