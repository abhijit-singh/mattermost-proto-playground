# Design Pass

The design stage of Mattermost's agent-driven SDLC loop, as repo-local tooling. A deterministic triage decides whether an effort needs design and at what depth; an agent then runs one bounded stage at a time, reading and writing files under `design/<slug>/`; deterministic checks and a risk score decide which human approves. The deliverable is a prototype in this playground with a guided walkthrough; `handoff.md` is its machine-readable companion and the trigger for plan and build. Nothing here writes to `mattermost/mattermost` or `internal-product-knowledge`.

## Constraints this process composes with (read first)

1. Prototypes live under `src/pages/prototypes/<slug>/` with a thin orchestrator, `scenes/` (never `views/`), optional `components/`, and a manifest entry in `src/manifests/prototypes.ts` (`src/pages/prototypes/AGENTS.md` §Folder structure).
2. Compass lookup order is fixed: cheat sheet → installed `.d.ts` → sibling guideline in `../compass-design`; decision order: Compass export → Compass + className override → primitives in the prototype folder → request to compass-design (`src/pages/prototypes/AGENTS.md` §Prototype-only UI).
3. Import `@mattermost/compass-ui` by subpath only, never the root barrel; `@mattermost/compass-proto` from the package root (`AGENTS.md` §Import convention). Variant props are lowercase kebab-case.
4. Playground `src/components/` is catalog chrome only; design-system components go to compass-design (`AGENTS.md` §Building new UI).
5. Overlays are visual chrome; the host owns open/close, portal, positioning and outside-click; `Modal` owns dialog focus (`AGENTS.md` §Overlays). `IconButton` takes `icon={<Icon glyph={…} />}` and desktop icon buttons wrap in proto `WithTooltip` (`../compass-design/packages/compass-proto/AGENTS.md`).
6. Scene navigation uses `PrototypeTopNav` + `SceneSwitcher` in the center slot via `usePrototypeChrome()`; mobile uses `DeviceFrame`, `MobileModalStage` and `Mobile*` composites (`src/pages/prototypes/AGENTS.md` §Scene navigation, §Mobile).
7. Walkthroughs are an in-place mode (`?walkthrough=1&step=`) registered with `useRegisterWalkthrough`; focus targets are sub-regions, never the whole view (`.cursor/skills/guided-walkthrough/SKILL.md`).
8. No absolute local paths in committed files (`AGENTS.md` §Committed files). Agent guidance stays thin at the root and procedural in skills; `.cursor` and `.claude` twins stay in sync (`.cursor/rules/creating-agent-rules.mdc`).
9. Scripts: `npm run build` is `tsc -b && vite build` with a `prebuild` that verifies the installed Compass packages; `npm run lint` includes `eslint-plugin-jsx-a11y` (`package.json`, `eslint.config.js`). Node 24 / npm 11 are the declared engines.
10. Compass has three layers for product: `compass-ui` (published, webapp may use), `compass-proto` (never npm, never in product), layouts as MDX specimens (`../compass-design/docs/ROADMAP.md`). Guideline slugs live under `../compass-design/src/guidelines/{components,patterns,layouts}/`.
11. Published compass-ui components follow an API contract: backwards compatible props, translatable text, no unoverridable English, pass-through attributes, forwarded refs (`../compass-design/packages/compass-ui/AGENTS.md`). New-component requests must meet it.
12. The webapp uses compass-ui subpaths for new UI but keeps modals on `GenericModal`, menus on MUI, tooltips on `@mattermost/shared` `WithTooltip`, icons on `@mattermost/compass-icons`, and does not consume compass-proto (`../mattermost/webapp/AGENTS.md` §UI components). Every prototype piece needs a production translation.
13. Copy keys are flat dotted ids in `../mattermost/webapp/channels/src/i18n/en.json`, each `{defaultMessage, description}`; about 25k keys. Existing strings are reused by key.
14. Seeds are YAML-canonical under `../internal-product-knowledge/decisions/seed/<slug>/<slug>.yaml` with `outcome.headline` inherited word for word by delivery, typed `assumptions` with `test` and `result`, and human-only fields: customer words, lighthouse name, decider, `verified` (`../internal-product-knowledge/.claude/skills/seed/SKILL.md`). `GAP (owner)` marks the unknown; agent additions carry `added_by`; caveats survive every render.
15. Everything in internal-product-knowledge lands by pull request; agents produce drafts, a human opens the PR (`../internal-product-knowledge/AGENTS.md` §Landing changes).

## Repo layout this expects

Four clones side by side, plus the persona catalog: `../compass-design`, `../mattermost` (read only), `../internal-product-knowledge` (read only), and this repo. Override a sibling path with `DESIGN_PASS_COMPASS`, `DESIGN_PASS_MATTERMOST`, `DESIGN_PASS_IPK` (never commit a value). `design/personas/` is a verbatim copy of the FY26 persona catalog; where the catalog says `Personas/…`, read `design/personas/…`.

## Tiers

Triage is deterministic (`scripts/design/triage.rules.json`; no LLM) and prints the rules that fired.

| Tier        | Fires when                                                                                                                              | Produces                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skip`      | no UI surface named; server, infra, API or data paths only                                                                              | `design/<slug>/decision.md` recording why                                                                                                          |
| `tweak`     | an existing screen only: copy, a setting in an existing panel, a component swap, a visual bug; no new route                             | `frame.md`, `design-note.md`; plus a prototype with as many scenes as the change touches when frame sets `prototype: scenes`                       |
| `explore`   | a Seed at `ask: explore`, or a direction question ("how should we…")                                                                    | `frame.md`, `research.md`, `options.md`, `critique-options.md`; option sketches in `src/pages/prototypes/<slug>-options/` with a short walkthrough |
| `prototype` | a new screen, route, flow or surface; multi-step; mobile parity; a Seed at `ask: prototype` with a usability or desirability assumption | the whole pass: prototype + walkthrough + `handoff.md`                                                                                             |

The old names `none`, `note` and `full` are still accepted by `--tier`, `design:<tier>` labels and older packets.

A named existing surface, with no competing tier phrase, is a tweak. That includes a change to warnings, indicators, labels, and similar. A missing tier keyword is not a stop. Intake stops for a person only when the source has no surface and no tier phrase, or when tier phrases conflict. `--tier` overrides both.

Intake reads the whole source. A Jira key or GitHub issue is not triaged from the key or title alone. If the body cannot be read, intake stops and says the source was unreadable. It does not invent ticket text.

The triage agent decides the tier from the whole source and writes `design/<slug>/triage.json`. The script checks that file. Keyword hits are signals. A missing keyword does not stop the run. `--tier`, a `design:*` label, or a Seed `ask:` overrides the tier. A named existing surface with a change on it, including warnings, indicators, and labels, is a tweak and continues. The run escalates when the source is unreadable, the outcome cannot be grounded, the tier confidence is low, or the proposal contradicts a strong signal such as "new page" or "new flow".

The person who started the run is always the decider. The decider is not read from the ticket and never causes a stop. That person may assign the pull request to someone else. The triage agent recommends whether a designer should be involved, with the reason. That recommendation is not a gate.

Users and customer words are optional. Leaving either empty is not an escalation. They are recorded only when the source actually contains them. A customer quote that was not given is not invented.

Tier sets the stages. **Size** (`small | large`, `scripts/design/size.rules.json`) sets the loop budget: `rounds_max` 4 or 10 (2 for `tweak`). Triage scores what the source shows from keywords and leaves novelty, interaction depth and prior art `unknown`. Frame scores novelty and interaction depth and corrects any keyword score the code contradicts; research scores prior art and novelty. Either may move the size, recording the signals.

**Compliance scope.** Intake turns it on when the source matches a keyword in `triage.rules.json` `compliance` (permissions, roles, ABAC, classification, labels, encryption, audit, retention, export, cross-domain, identity, and similar). Frame turns it on when it records the `permissions_or_security_copy` flag. `--compliance on|off` overrides both. When it is on, research writes a control table (NIST 800-53, 800-207, 800-162, DoD ZT RA, ACP 240, NATO STANAG 4774/4778) using `.cursor/skills/design-pass-research/compliance.md`, and critique line 10 checks that each control the UI must show is visible. Features such as mobile navigation or agent UX do not match a keyword, so the sub-step does not run for them.

**Mode.** `autopilot` (issues, PRs, Jira by default): no stage waits for a person before the PR; the frame drafts missing human-only fields as `[AI DRAFT]` and the option gate copies the merged recommendation with `chosen_by: autopilot`; every such field is listed under `needs_confirmation`. `gated` (briefs and Seeds by default): the frame stops on `GAP` fields and the option gate waits for a person. In both modes, when only one option is eligible the gate is skipped (`chosen_by: sole-eligible`, listed under `needs_confirmation`). Flip with `--gated` / `--autopilot`, a `design:gated` label, or `gates.*` in `request.yaml`. The PR approval is always a person.

**Models.** Every AI stage runs as its own subagent, `design-pass-<stage>`, defined in `.cursor/agents/` and `.claude/agents/`. Those files are generated from `scripts/design/models.json` by `npm run design:sync-skills`, and `design:check` fails when they drift.

| Class    | Stages                                                         | Why                                                                                                                                                |
| -------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| frontier | frame, explore, build                                          | Frame and explore set what every later stage works on. Build quality sets the number of rounds, and each round costs a build plus 2–5 judge calls. |
| mid      | research, critique-options, critique, persona, verify, handoff | Anything that can block or force a build round is at least mid.                                                                                    |
| fast     | `design-pass-lookup`                                           | Read-only lookups for frame and research; decides nothing.                                                                                         |
| none     | intake, `next.mjs`, `loop.mjs` merges, check, emit             | Scripts.                                                                                                                                           |

The orchestrator is the cloud agent's selected model, which is the default frontier model. Each stage skill names the model that stage runs on: Grok 4.7 High for frame, explore, and build; Sonnet 5.5 for research, both critiques, persona, verify, handoff, and lookups. `next.mjs` prints that name on the `agent:` line. These are names, not Cursor model slugs, and the run does not ask for a model id.

## Run it

Start the agent from this repo's root, so the run loads only this repo's instructions. If a parent folder on your machine has its own `CLAUDE.md`, list it under `claudeMdExcludes` in `.claude/settings.local.json` (never committed): Claude Code loads every ancestor `CLAUDE.md` into the chat and each stage subagent.

```sh
npm run design:triage -- <source>                   # preview only. Seed YAML path | github.com/mattermost/mattermost issue or PR URL | JIRA-123 | brief.md
npm run design:request -- <source> [--gated|--autopilot] [--tier X] [--size X] [--compliance on|off]   # intake: runs triage, writes design/<slug>/{request.yaml,source.json,log.md}
npm run design:next -- <slug>                       # or /design-pass <slug>: the one thing to run next
/design-pass <slug>                                 # runs the next step: scripts in this chat, AI stages in their design-pass-<stage> subagent
node scripts/design/loop.mjs <slug> merge-critique-options | merge-critique | merge-persona | merge-verify
node scripts/design/brief.mjs <slug> critique | verify | persona <persona>   # what one judge reads: request values and the frame, research and option sections it scores
npm run design:check -- <slug>                      # guardrails; exit non-zero on failure
npm run design:emit -- <slug>                       # PR body, source comment, Seed log draft, design-complete.json under design/<slug>/emit/
```

`next.mjs` is the state machine: it reads `request.yaml` and prints the next stage and its subagent, applying only the transitions the automation owns (the option choice when it is autopilot or sole-eligible; the loop verdict). It never runs a stage. Stages write their block with `scripts/design/stage.mjs` and never edit another stage's block. Humans fill `GAP` fields with `stage.mjs <slug> fill --set outcome.headline="…" --by "<name>"`.

## Stages and contracts

| Stage            | Reads                                                                                                                                                                                                                                     | Writes                                                                                       | Fresh context                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------- |
| frame            | request, source, `../mattermost/webapp` code and `en.json`, installed Compass `.d.ts`, guidelines                                                                                                                                         | `frame.md` (with the baseline map: base screens, entry points, current flow), `stages.frame` | no                              |
| research         | frame, Seeds and T3s, Figma found through links in Confluence, Jira, PRs and Seeds (read only), the last 2–3 releases on the surface, prototypes, Compass patterns, issues, external precedent, and control sources when compliance is on | `research.md`, `stages.research`                                                             | no                              |
| explore          | frame, research, `rubric-options.md`                                                                                                                                                                                                      | `options.md` with an after-flow per option (+ sketches for `explore`), `stages.explore`      | no                              |
| critique-options | frame, research, `rubric-options.md`, options                                                                                                                                                                                             | `rounds/options-<n>/critique-options.sample-<k>.md` → merged `critique-options.md`           | **yes, ×3**                     |
| build            | chosen option, previous `critique.md` fixes + `persona.md` blockers/frictions                                                                                                                                                             | prototype, `state-matrix.yaml`, `copy.yaml`, screenshots, `stages.build`                     | no                              |
| critique         | the brief (`brief.mjs <slug> critique`: scored frame and research sections, the chosen option's section of `options.md`), `rubric.md`, prototype, screenshots, state matrix                                                               | `rounds/<n>/critique.sample-<k>.md` → merged `critique.md`                                   | **yes; ×3 on a passing sample** |
| persona          | the brief (`brief.mjs <slug> persona <persona>`: frame problem, outcome, users, assumptions), one profile, screenshots, state matrix, copy; source by lookup only                                                                         | `rounds/<n>/persona.<slug>.md` → merged `persona.md`                                         | **yes, one per persona**        |
| verify           | the brief (`brief.mjs <slug> verify`), `rubric.md`, final prototype, `design:check` output                                                                                                                                                | `rounds/verify-<a>/verify.sample-<k>.md` → merged `verify.md`                                | **yes, ×3**                     |
| handoff          | everything in the packet, the code                                                                                                                                                                                                        | walkthrough, `handoff.md` or `design-note.md`, `stages.handoff`                              | no                              |

**Loop rules** (`scripts/design/loop.mjs`, deterministic): a round passes when no rubric line is below 3, must-pass lines (1, 9, and 10 at risk ≥ 2) are 4 or more, the mean is 4 or more, no persona `blocker` is open and every persona completes the task. Otherwise iterate, up to `rounds_max`. Two consecutive rounds with no line improving and no fewer blockers is a plateau → escalate. A round that turns a passing line failing is a regression → revert, re-issue the fix, count the round. Verify gets one repair, then escalates. Counters never reset.

**Options rules** (`loop.mjs merge-critique-options`): an option is eligible when no line is below 3, lines 1 and 6 are 4 or more, and the mean is 4 or more. The set passes when one or more options are eligible; the rest are recorded as considered. The critics' majority pick is the preferred option. If it is eligible, it is recommended. If it is not eligible but passes lines 1 and 6, it gets one refine round, and the eligible options are kept as the fallback. When none is eligible: after round 1, the critics' `send_back_to` (one back-edge to research, one shared back-edge to frame). After the last explore round (round 2, or 3 after a late back-edge), an unused back-edge the critics vote for is taken once, because a refine cannot fix a research gap or a wrong problem; otherwise a refine round on the best option that passes lines 1 and 6, else escalate. The after-flow is evidence for lines 1 and 2, not a scoring rule; `design:check` requires one per option. A refine round runs once per run and is always the last options round; if it fails with no fallback, the run escalates.

**Risk and approval** (`risk.yaml`): flags sum to a score; 2 or more needs a designer, otherwise PM or engineer may self-approve. `design:check` recomputes it from `handoff.md`.

## Files

```
design/README.md            this file
design/rubric.md            prototype critique rubric (anchors, must-pass) · scripts/design/rubric.json is its machine twin
design/rubric-options.md    options critique rubric
design/follow-ups.md        open items no one has confirmed yet
design/risk.yaml            risk flags → score → approver
design/personas/            FY26 persona catalog and profiles, verbatim
design/templates/           request.yaml, frame.md, research.md, options.md, critique-options.md, critique.md, persona.md, verify.md, state-matrix.yaml, copy.yaml, handoff.md, design-note.md
design/<slug>/              one packet per effort: request.yaml, source.json, log.md, stage artifacts, rounds/, emit/
scripts/design/             lib, triage(+rules), size.rules, models, agents, request, stage, next, loop, check, emit, screenshots, sync-skills
.cursor/skills/design-pass*/  stage skills; .claude/skills/ holds identical copies (npm run design:sync-skills)
.cursor/agents/design-pass-*  stage subagents (model: inherit; the parent passes the model); .claude/agents/ sets the Claude Code alias. Both generated from models.json
```

## Never

- Write to `mattermost/mattermost` or `internal-product-knowledge`. Produce drafts for humans to PR.
- Fill a human-only field silently. Gated: `GAP (owner)`. Autopilot: `[AI DRAFT]` with `added_by`, listed under `needs_confirmation`.
- Write customer words that no one recorded.
- Build a design-system component in the playground.
- Run a critique, a persona, or a verify in the context that built the prototype, or let any of them read another's output.
- Pass a build round while a persona `blocker` is open or a must-pass rubric line is below 4.
- Let verify iterate past one repair.
- Present persona findings as customer evidence. They are synthetic and labeled so.
- Skip triage because the request "obviously" needs design. The record of the decision is the point.
- Continue past `rounds_max` or past a plateau.
- Merge or approve a PR in autopilot. The PR approval is always a person.
- Store process state anywhere but `design/<slug>/`.

## Later: the pipeline

| Stage        | Local now                                                       | Pipeline later                                                                                                               |
| ------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Triage       | `npm run design:triage`                                         | GitHub Action on issue label / Seed PR merge / PR opened; sets `design:*` label                                              |
| Delegate     | `npm run design:request`                                        | same action creates the branch and `request.yaml`, dispatches a cloud agent with the stage name                              |
| Agent stages | `/design-pass <slug>` starts the `design-pass-<stage>` subagent | the same agent headless; one stage per job, on the model `next.mjs --json` names (`model`); fresh contexts are separate jobs |
| Guardrails   | `npm run design:check`                                          | required CI check on the playground PR; risk score sets reviewers via CODEOWNERS / labels                                    |
| Emit         | `npm run design:emit`                                           | the same drafts posted by the action; `design-complete` label triggers plan                                                  |
