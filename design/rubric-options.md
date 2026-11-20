# Options critique rubric

Fixed. Scored per option, 1–5 with evidence, before anything is built. Same anchor rule as `rubric.md`: quote the anchor nearest your score. Machine-readable twin: `scripts/design/rubric.json` (`options`).

| # | Line | 2 looks like | 3 looks like | 4 looks like | 5 looks like | Must-pass |
|---|---|---|---|---|---|---|
| 1 | Answers the frame | Solves a neighboring problem; the primary task is not the one `frame.md` states | Serves the outcome headline, but the primary task differs from `frame.md` in one step, or the decision information is one step away from the decision | Serves the outcome headline and the primary task as stated; the decision information is placed where the decision is made | As 4, and the after-flow is shorter than the baseline's current flow and changes no base screen without a reason | **Yes** |
| 2 | Distinct | Same interaction model and primary component as another option; a styling variant | A different interaction model, but it gives up the same thing as another option | A different interaction model from every other option, with a different trade-off | As 4, and the set's trade-offs cover the real choice the frame poses, so picking one rules something out | No |
| 3 | Grounded | No precedent and no novelty reason; the cited precedent does not match | A precedent is cited, but it fits only part of the option, or the novelty reason has no evidence behind it | A Compass pattern, shipped Mattermost flow (`path:line`) or named external pattern cited from `research.md`, or an explicit novelty reason | As 4, and the precedent is shipped Mattermost or Compass, with evidence in `research.md` that it worked for users | No |
| 4 | Tests the assumptions | Would produce no evidence for or against the frame's assumptions | All but one assumption has a scene or state that tests it, or a test only collects self-report | Each assumption the frame says must be tested has a scene or state that would test it | As 4, and each test states the result that would count against the assumption | No |
| 5 | Compass fit on paper | Component map skips the decision order; "no Compass fit" with no candidates named | Every UI need is mapped, but one skips the decision order, or one "no fit" names only one candidate | Every UI need mapped with the decision step; every "no fit" names 2 or more candidates and why each fails | As 4, and no step-4 request is needed, or each request names the guideline it extends | No |
| 6 | Direction | Contradicts a prior decision research found; closes a door the roadmap needs | Consistent with prior decisions, but what it leaves open or closes is not stated | Consistent with prior decisions; states what it leaves open or closes | As 4, and it states the cost of each door it closes | **Yes** |
| 7 | Feasibility | Needs an import or a permissions behavior the webapp cannot provide, with no note | Nothing contradicts the webapp constraints, but a production gap is implied and not named (for example data the API does not return) | Nothing contradicts the webapp constraints in `frame.md`; any production gap is named | As 4, and every data field and permission it shows is traced to an existing API or a named gap | No |

## Set-level verdict

Always median of 3 fresh samples (`scripts/design/loop.mjs merge-critique-options`). The script applies these rules; critics do not.

- **Eligible option:** no line below 3, must-pass lines 1 and 6 at 4 or more, mean at or above 4.
- **Pass:** one or more options are eligible. The others are kept in the record as "considered" and are not built.
- **Preferred option:** the critics' majority pick across all options, eligible or not.
- **Recommendation:** the preferred option when it is eligible. Otherwise the critics' majority among eligible options, else the eligible option with the highest mean (ties go to the explorer's pick). Disagreement with the explorer is written to `needs_confirmation` when autopilot copies the pick.
- **One eligible option:** the option gate is skipped in both modes. The choice is recorded with `chosen_by: sole-eligible` and listed under `needs_confirmation`.

**Refine round.** One per run, and always the last options round. Explore fixes only one option, keeping its interaction model; three fresh critics re-score it.

| After this round | Eligible options | And | Next |
|---|---|---|---|
| Any round | One or more | The preferred option is eligible | Pass; recommend it |
| An explore round | One or more | The preferred option is not eligible, has lines 1 and 6 at 4 or more, and no refine has run | **Refine** the preferred option. The eligible options are kept as the fallback. |
| An explore round | One or more | The preferred option cannot be refined | Pass; recommend among the eligible options |
| Round 1 | None | | The critics' majority `send_back_to` (no majority: `explore`) |
| Last explore round | None | The critics' majority is `research` or `frame`, that back-edge is unused, and no late back-edge has run | **Late back-edge.** Take it; one more explore round follows. |
| Last explore round | None | An option has lines 1 and 6 at 4 or more | **Refine** that option (the preferred one if it qualifies, else the highest mean) |
| Last explore round | None | No option has lines 1 and 6 at 4 or more | Escalate |
| Refine | The refined option, plus any fallback | | Pass. The refined option is recommended if it is eligible; otherwise the fallback is used. |
| Refine | None | | Escalate |

The last explore round is round 2, or round 3 after a late back-edge.

`send_back_to` values a critic may write:

- `explore`: options are not distinct, lack precedent or a novelty reason, or miss an assumption the frame says must be tested.
- `research`: an option rests on a claim `research.md` does not support, or the set ignores a prior decision research should have found. One back-edge per run.
- `frame`: the options answer a different problem than the source states, or every option fails line 1. Uses the run's single back-edge to frame; if research already used it, the run escalates after round 1, and the table decides after the last explore round.

Each back-edge is taken at most once per run. After the last explore round an unused back-edge still wins over a refine, because a refine polishes one option and cannot fix a research gap or a wrong problem. That late back-edge happens once and adds one explore round.

The after-flow in `options.md` is evidence for lines 1 and 2 (which base screens change, and why). It is not a scoring rule; `design:check` requires every option to have one.

In a refine round the critic scores one option. It scores line 2 (Distinct) against the other options, which explore copies into `options.md` under **Compared options**, so a refine can fix a distinctness shortfall. If no sample scores line 2, the merge carries it from the previous round.

## Output format (one sample)

Write `design/<slug>/rounds/options-<n>/critique-options.sample-<k>.md`:

```
# Options critique sample <k>: <slug>, options round <n>

## Option A
| # | Line | Score | Anchor applied | Evidence | Fix |
|---|------|-------|----------------|----------|-----|
| 1 | Answers the frame | 4 | "…" | options.md §A, frame.md primary task | … |
… rows 1 through 7 …

## Option B
… same table …

## Set verdict
send_back_to: null | explore | research | frame
recommended: <option id the critic would take forward on its merits, eligible or not, with one sentence why>
```
