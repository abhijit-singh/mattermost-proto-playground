# Design Pass

This is the Design Pass environment. It is not the shared playground environment.

The orchestrator is this cloud agent's selected model, which is the default frontier model. Stage skills name the model for each stage. Frame, explore, and build run on Grok 4.7 High. Research, both critiques, persona, verify, handoff, and lookups run on Sonnet 5.5. Those are names. Do not invent a Cursor model slug, and do not ask anyone to paste a model id.

Fetch `origin` before any design step. A clean checkout that is behind `origin/<branch>` runs `git pull --ff-only` and continues, printing the old and new SHA. Refuse only when the checkout is dirty or has diverged. `design:request` and `design:next` print `commit` and `design_pass_version` first. Start a new agent for every run. Do not continue an agent that started before a push.

The triage agent decides the tier from the whole source and writes `design/<slug>/triage.json`. The script checks that file. It does not decide the tier from keywords. The person who started the run is the decider, is not read from the ticket, and may assign the pull request to someone else. A designer recommendation is not a gate.

Scripts decide the next step, the median score, the round count, and the checks. You design. A person approves the pull request.

## Write targets and research clones

- Write targets: this playground, and `compass-design`.
- Research clones only: `mattermost` and `internal-product-knowledge`. Read them. Do not open a pull request to either. Do not rewrite a git remote or a push URL.
- The allowlist is `design/cloud/allowlist.json`.
- No Jira credentials are in this environment. Do not read or store any. Do not post a Jira comment, a GitHub comment, or a Seed.

## Must

- Run intake as a script, with no model. Honor skip, tweak, explore, and prototype.
- Run each AI stage as its own subagent. The stage skill says which model name to use.
- On an outcome or decider that cannot be grounded in the source, stop. Users and customer words are optional. Do not invent a customer quote.
- Draft any other gated field as `[AI DRAFT]` and list it under `needs_confirmation`. Continue.
- Copy the option-gate recommendation. A sole eligible option skips the gate and is recorded as sole-eligible.
- The critique step picks one or two personas from `design/personas/` (the FY26 catalog's MissionOps panel). Do not invent a persona.
- Build with `compass-build`. Review the prototype with `compass-review`. That review does not replace the rubric or `design:check`.
- Do not run `compass-migrate` or `prototype-to-production`.
- Emit writes drafts in the packet and does not post them. Open one playground pull request only when this tier built a prototype.
- Stop at 90 minutes, or if you cannot finish within 50 USD. Both are escalations.
- End with exactly one stop line and no text after it:

```text
STOP <skip|gap|escalate|emit> | prs=<0|1> | targets=<none|playground> | sha=<commit> | reason=<one sentence>
```

`prs=1` and `targets=playground` only when a prototype was built. Every other stop is `prs=0` and `targets=none`.
