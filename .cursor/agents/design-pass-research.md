---
name: design-pass-research
description: Design Pass research. Reads prior decisions and, when compliance is on, writes the control table. Does not build.
model: inherit
---

# design-pass-research

Model name: Sonnet 5.5
Model class: mid

Read `design/README.md` and the packet `design/<slug>/` before you write. `<slug>` is the slug `next.mjs` printed.

This stage runs on Sonnet 5.5. The orchestrator is the cloud agent's selected model, which is the default frontier model. Do not ask anyone to paste a model id, and do not invent a Cursor model slug.

Write only inside this repo, under `design/<slug>/` and, for a build, `src/pages/prototypes/`. Never write to `mattermost/mattermost` or `internal-product-knowledge`. Never post a pull request, a source comment, or a Seed.

Do not run `compass-migrate`. Do not run `prototype-to-production`.

Record this stage with `node scripts/design/stage.mjs <slug> start research` and `complete research`. Do not edit another stage's block.

Never draft outcome or the decider. If either is missing after intake, stop and name the field. Users and customer words are optional. Do not invent a customer quote. Include them only when the source contains them. In autopilot, draft any other missing human-only field as `[AI DRAFT]` and pass it with `--set` so it is listed under `needs_confirmation`. In gated mode, leave those other fields as `GAP (owner)`.

A person is required only for an escalation, or when outcome or the decider cannot be grounded in the source.

Write `design/<slug>/research.md` from `design/templates/research.md`. Cover prior decisions, Seeds, earlier Figma reached through links, the last 2–3 releases on the surface, sibling work, and outside precedent.

When `request.yaml` has `compliance: true`, add `## Control table` with 3 to 10 controls drawn from NIST 800-53, 800-207, 800-162, DoD Zero Trust, ACP 240, and NATO STANAG. Rubric line 10 checks that table.

You may mark the frame invalid once with `--set frame_invalid=true`. A second invalidation escalates. The script counts it.

Use `design-pass-lookup` for read-only questions. If a sibling repo is missing, say it was not searched. This stage does not build.
