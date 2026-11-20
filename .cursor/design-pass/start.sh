#!/usr/bin/env bash
# Design Pass start. The shared playground start still runs first for inotify and tool checks.
# This environment's rules replace the shared cloud instructions for this run only.

set -Eeuo pipefail

log() { printf '[design-pass-start] %s\n' "$*" >&2; }

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

bash .cursor/scripts/cloud-agent-start.sh

if [ -f .cursor/design-pass/cursor.md ]; then
  cp .cursor/design-pass/cursor.md .cursor/AGENTS.md
  log "Materialized Design Pass instructions at .cursor/AGENTS.md"
fi

parent="$(dirname "$repo_root")"
for name in mattermost internal-product-knowledge; do
  if [ -d "$parent/$name/.git" ] || [ -f "$parent/$name/.git" ]; then
    log "$name research clone present. Push URL was not rewritten."
  else
    log "Gaps: $name research clone is missing."
  fi
done

log "Start complete"
