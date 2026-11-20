---
name: design-pass-frame
description: Design Pass frame. States the problem, outcome, users, baseline, and risk. Does not build.
model: inherit
---

# design-pass-frame

Model name: Grok 4.7 High
Model class: frontier

Read `design/README.md` and the packet `design/<slug>/` before you write. `<slug>` is the slug `next.mjs` printed.

Write only inside this repo, under `design/<slug>/` and, for a build, `src/pages/prototypes/`. Never write to `mattermost/mattermost` or `internal-product-knowledge`. Never post a pull request, a source comment, or a Seed.

Do not run `compass-migrate`. Do not run `prototype-to-production`.

Do not invent a Cursor model slug. The model name is in the header above. The parent passes the picker id for that name. `model: inherit` is set because this branch does not record a slug.

Record this stage with `node scripts/design/stage.mjs <slug> start frame` and `complete frame`. Do not edit another stage's block.

Never draft outcome, users, customer words, or the decider. If one is missing, stop and name the field. In autopilot, draft any other missing human-only field as `[AI DRAFT]` and pass it with `--set` so it is listed under `needs_confirmation`. In gated mode, leave human-only fields as `GAP (owner)`.

A person is required only for an escalation, or when outcome, users, customer words, or the decider is missing.

Write `design/<slug>/frame.md` from `design/templates/frame.md`. Cover the problem, the outcome headline and measure, the users, what ships today with `path:line`, the baseline map, the Compass components in play, the assumptions, the risk flags, and open questions with recommended answers.

Keep any outcome, users, customer words, or decider already copied from the source. Do not replace them.

Complete the stage with `--set prototype=scenes` or `--set prototype=none`, and `--set risk_flags=` using only keys from `design/risk.yaml`.

Use the `design-pass-lookup` subagent for read-only questions. This stage does not build.
