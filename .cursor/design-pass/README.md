# Design Pass environment

This folder is a separate Cursor environment. It is not the shared playground environment in `.cursor/environment.json`. Do not merge these files into that one.

Point the Design Pass environment at `.cursor/design-pass/environment.json`.

- Write targets: this playground, and `compass-design` (`repositoryDependencies`).
- Research clones only: `mattermost` (`git clone --filter=blob:none`) and `internal-product-knowledge`. The install script does not rewrite their push URLs. A failed clone is a Gaps note.
- Chromium libraries: `npx playwright@1.64.1 install-deps chromium` in this folder's Dockerfile.
- Allowlist: `design/cloud/allowlist.json`.
- No Jira credentials.
