---
name: design-pass-handoff
description: Design Pass handoff. Writes the walkthrough and handoff.md, or design-note.md for a tweak.
---

# design-pass-handoff

Model name: Sonnet 5.5
Model class: mid

Read `design/README.md` and the packet `design/<slug>/` before you write. `<slug>` is the slug `next.mjs` printed.

Write only inside this repo, under `design/<slug>/` and, for a build, `src/pages/prototypes/`. Never write to `mattermost/mattermost` or `internal-product-knowledge`. Never post a pull request, a source comment, or a Seed.

Do not run `compass-migrate`. Do not run `prototype-to-production`.

Do not invent a Cursor model slug. The model name is in the header above. The parent passes the picker id for that name. `model: inherit` is set because this branch does not record a slug.

Record this stage with `node scripts/design/stage.mjs <slug> start handoff` and `complete handoff`. Do not edit another stage's block.

Never draft outcome, users, customer words, or the decider. If one is missing, stop and name the field. In autopilot, draft any other missing human-only field as `[AI DRAFT]` and pass it with `--set` so it is listed under `needs_confirmation`. In gated mode, leave human-only fields as `GAP (owner)`.

A person is required only for an escalation, or when outcome, users, customer words, or the decider is missing.

A tweak writes `design/<slug>/design-note.md` from `design/templates/design-note.md`. Every other tier that reaches handoff writes `design/<slug>/handoff.md` from `design/templates/handoff.md` and a guided walkthrough inside the prototype (`useRegisterWalkthrough`). Focus targets are sub-regions, not the whole view.

Copy `risk_flags` into the artifact frontmatter. Do not open a pull request. Do not run `prototype-to-production`.
