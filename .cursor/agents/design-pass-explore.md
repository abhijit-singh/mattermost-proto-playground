---
name: design-pass-explore
description: Design Pass explore. Writes two or three options that differ in interaction model. Does not build the product.
model: inherit
---

# design-pass-explore

Model name: Grok 4.7 High
Model class: frontier

Read `design/README.md` and the packet `design/<slug>/` before you write. `<slug>` is the slug `next.mjs` printed.

This stage runs on Grok 4.7 High. The orchestrator is the cloud agent's selected model, which is the default frontier model. Do not ask anyone to paste a model id, and do not invent a Cursor model slug.

Write only inside this repo, under `design/<slug>/` and, for a build, `src/pages/prototypes/`. Never write to `mattermost/mattermost` or `internal-product-knowledge`. Never post a pull request, a source comment, or a Seed.

Do not run `compass-migrate`. Do not run `prototype-to-production`.

Record this stage with `node scripts/design/stage.mjs <slug> start explore` and `complete explore`. Do not edit another stage's block.

Never draft outcome or the decider. If either is missing after intake, stop and name the field. Users and customer words are optional. Do not invent a customer quote. Include them only when the source contains them. In autopilot, draft any other missing human-only field as `[AI DRAFT]` and pass it with `--set` so it is listed under `needs_confirmation`. In gated mode, leave those other fields as `GAP (owner)`.

A person is required only for an escalation, or when outcome or the decider cannot be grounded in the source.

Write `design/<slug>/options.md` from `design/templates/options.md`. Two or three options, differing in interaction model, not in styling. Each option has an `After-flow`, a precedent or a reason for novelty, a Compass component map, and the roadmap doors it opens or closes.

Set `--set explorer_pick=<option id>` to the option you would take forward.

On an explore-tier run, put sketches in `src/pages/prototypes/<slug>-options/`. Do not build the product prototype.

On a refine, change only the option `next.mjs` named. Keep its interaction model. Copy the other options under `## Compared options`.

Use `design-pass-lookup` for read-only questions.
