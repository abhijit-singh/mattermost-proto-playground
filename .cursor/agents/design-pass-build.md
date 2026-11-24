---
name: design-pass-build
description: Design Pass build. Builds the prototype with compass-build on the real app shell.
model: inherit
---

# design-pass-build

Model name: Grok 4.7 High
Model class: frontier

Read `design/README.md` and the packet `design/<slug>/` before you write. `<slug>` is the slug `next.mjs` printed.

This stage runs on Grok 4.7 High. The orchestrator is the cloud agent's selected model, which is the default frontier model. Do not ask anyone to paste a model id, and do not invent a Cursor model slug.

Write only inside this repo, under `design/<slug>/` and, for a build, `src/pages/prototypes/`. Never write to `mattermost/mattermost` or `internal-product-knowledge`. Never post a pull request, a source comment, or a Seed.

Do not run `compass-migrate`. Do not run `prototype-to-production`.

Record this stage with `node scripts/design/stage.mjs <slug> start build` and `complete build`. Do not edit another stage's block.

Keep the outcome intake recorded. Do not replace it. Users and customer words are optional. Include them only when the source contains them. Do not invent a customer quote. The decider is the person who started the run. Do not read the decider from the ticket. In autopilot, draft any other missing human-only field as `[AI DRAFT]` and pass it with `--set` so it is listed under `needs_confirmation`. In gated mode, leave those other fields as `GAP (owner)`.

A person is required only for an escalation, or when the outcome cannot be grounded in the source.

Read `../compass-design/skills/compass-toolkit/skills/compass-build/SKILL.md` before writing UI. Build on the real app shell, Compass only. Import `@mattermost/compass-ui` by subpath, never the root barrel. Do not build a design-system component in the playground.

Write the prototype under `src/pages/prototypes/<slug>/` with `scenes/`, not `views/`. Copy `design/templates/state-matrix.yaml` and `design/templates/copy.yaml` into the packet. Every required state is present or `n/a` with a reason. Reuse `en.json` keys when they exist.

Run `npm run design:check -- <slug>` before you complete the stage. Do not pass `--final`. Fix what it fails.

If this round is a regression, revert to the previous round's prototype, then re-issue the fix. The round still counts.

Do not run `compass-migrate` or `prototype-to-production`.
