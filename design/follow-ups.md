# Design Pass follow-ups

Open items found while building the pass. Each one is something no one has confirmed yet. Close an item by recording what was decided and where it now lives.

## Compliance sources

| #   | Item                                              | Why it is open                                                                                                                   | Who can close it         |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| C1  | ACP 240: what it covers and whether it applies    | In program scope, but its content has not been confirmed. `compliance.md` says to open it before mapping.                        | Compliance or PM         |
| C2  | NATO STANAG 4774 / 4778: access and applicability | Most STANAGs are not public. Confirm we can read them and whether customers need labels bound to content in the UI.              | Compliance               |
| C3  | DoD ZT RA pillar names                            | The seven pillars in `compliance.md` are from memory of v2.0. Check them against the current published version.                  | Anyone with the document |
| C4  | NIST SP 800-53 control IDs in the cheat sheet     | Ported from standards-mapper, not checked against Rev 5 (CPRT) in this pass.                                                     | Anyone; one-time check   |
| C5  | Compliance keyword list (`triage.rules.json`)     | "export", "policy", "role", "identity" and "guest" may turn compliance on for work with no control impact. Tune after real runs. | Designer, after 5 runs   |

## Research inputs

| #   | Item                                      | Why it is open                                                                                                                                  | Who can close it |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| R1  | Confluence and Jira search outside Cursor | Figma discovery uses the Atlassian MCP. A CI or GitHub Action run has no MCP. Decide how those runs search, or have them record "not searched". | Eng              |
| R2  | Figma account for runs                    | A found link may be in a file the runner cannot open; it is recorded as "link only (no access)". Confirm which account runs use.                | Design ops       |
| R3  | "Last 2–3 releases"                       | Approximated as six months of `git log` on the base screens. Confirm the release cadence, or switch to release tags.                            | Eng              |
| R4  | Current images for the baseline map       | There is no store of shipped-product screenshots, so "none found" will be common. Pick a source (docs images, a test server capture).           | Design           |

## Rubric and process

| #   | Item                                                                                                                                                                                                               | Status     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| P2  | Rubric resources to keep learning from (a golden set from old specs, PRs and design review comments)                                                                                                               | To discuss |
| P3  | Re-score the 9 critique and 3 verify samples from `shared-with-panel` on the mid class and compare with the recorded scores; any line that drifts by more than 1 point needs its anchor fixed or stays on frontier | Later      |

## Decided

- Every AI stage runs as a `design-pass-<stage>` subagent. Classes: frontier for frame, explore and build; mid for research, both critiques, persona, verify and handoff; fast only for read-only lookups (2026-11-05).
- Anchors for scores 3 and 5 are in `rubric.md` and `rubric-options.md`; critics quote the anchor nearest the score. Prototype line 2 now names the chosen option's after-flow instead of `handoff.md` (2026-11-05).
- Tier names are `skip`, `tweak`, `explore`, `prototype`; the old names `none`, `note`, `full` are still accepted (2026-11-05).
- After the last explore round, an unused back-edge to research or frame that the critics vote for is taken once, then one more explore round runs (2026-11-05).
- The after-flow is evidence for options lines 1 and 2, not a scoring rule; `design:check` requires one per option (2026-11-05).
- Stage skills name the model: Grok 4.7 High for frame, explore, and build; Sonnet 5.5 for research, both critiques, persona, verify, handoff, and lookups. The orchestrator is the cloud agent's selected model. No shell model ids (2026-11-20).

## Decided, not doing

- Code-level checks from `functional-changes-ux.yaml` in `check.mjs`: not part of this process (2026-11-05).
