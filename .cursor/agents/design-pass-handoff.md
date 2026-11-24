---
name: design-pass-handoff
description: Design Pass handoff. Writes the walkthrough and handoff.md, or design-note.md for a tweak.
model: inherit
---

# design-pass-handoff

Model name: Sonnet 5.5
Model class: mid

Read `design/README.md` and the packet `design/<slug>/` before you write. `<slug>` is the slug `next.mjs` printed.

This stage runs on Sonnet 5.5. The orchestrator is the cloud agent's selected model, which is the default frontier model. Do not ask anyone to paste a model id, and do not invent a Cursor model slug.

Write only inside this repo, under `design/<slug>/` and, for a build, `src/pages/prototypes/`. Never write to `mattermost/mattermost` or `internal-product-knowledge`. Never post a pull request, a source comment, or a Seed.

Do not run `compass-migrate`. Do not run `prototype-to-production`.

Record this stage with `node scripts/design/stage.mjs <slug> start handoff` and `complete handoff`. Do not edit another stage's block.

Keep the outcome intake recorded. Do not replace it. Users and customer words are optional. Include them only when the source contains them. Do not invent a customer quote. The decider is the person who started the run. Do not read the decider from the ticket. In autopilot, draft any other missing human-only field as `[AI DRAFT]` and pass it with `--set` so it is listed under `needs_confirmation`. In gated mode, leave those other fields as `GAP (owner)`.

A person is required only for an escalation, or when the outcome cannot be grounded in the source.

A tweak writes `design/<slug>/design-note.md` from `design/templates/design-note.md`. Every other tier that reaches handoff writes `design/<slug>/handoff.md` from `design/templates/handoff.md` and a guided walkthrough inside the prototype (`useRegisterWalkthrough`). Focus targets are sub-regions, not the whole view.

Copy `risk_flags` into the artifact frontmatter. Do not open a pull request. Do not run `prototype-to-production`.
