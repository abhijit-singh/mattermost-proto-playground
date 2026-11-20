#!/usr/bin/env bash
# Design Pass install. Not the shared playground install.
# Write targets: this playground (the checkout) and compass-design (via the shared install).
# Research clones: mattermost and internal-product-knowledge. Push URLs are not rewritten.
# A failed research clone is a Gaps note. This script does not read Jira credentials.

set -Eeuo pipefail

log() { printf '[design-pass-install] %s\n' "$*" >&2; }

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

bash .cursor/scripts/cloud-agent-install.sh

parent="$(dirname "$repo_root")"

clone_research() {
  local name="$1"
  local url="$2"
  shift 2
  local dest="$parent/$name"

  if [ -e "$dest/.git" ] || [ -d "$dest/.git" ]; then
    log "$name already present at $dest. Remote left unchanged."
    return 0
  fi

  log "Cloning $url into $dest for research"
  if ! git clone "$@" "$url" "$dest"; then
    log "Gaps: $name was not cloned. This run is not a full-access run."
    return 0
  fi

  local fetch_url push_url
  fetch_url="$(git -C "$dest" remote get-url origin)"
  push_url="$(git -C "$dest" remote get-url --push origin)"
  log "$name fetch: $fetch_url"
  log "$name push: $push_url (not rewritten)"
}

clone_research mattermost https://github.com/mattermost/mattermost.git --filter=blob:none
clone_research internal-product-knowledge https://github.com/mattermost/internal-product-knowledge.git

log "Allowlist: design/cloud/allowlist.json"
log "Install complete"
