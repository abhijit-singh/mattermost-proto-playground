# Prototype critique rubric

Fixed. Ten lines, each scored 1–5 with evidence (a scene id or `file:line`). Each line carries written anchors for **2**, **3**, **4** and **5**; 1 is below 2. The critic quotes the anchor it applied. Lines marked **must-pass** need 4 or more regardless of the mean. The machine-readable twin is `scripts/design/rubric.json`; if you change a line here, change it there.

| # | Line | 2 looks like | 3 looks like | 4 looks like | 5 looks like | Must-pass |
|---|---|---|---|---|---|---|
| 1 | Outcome fit | The primary task takes more steps than the shipped flow, or the decision information is behind a click, or the outcome headline is not served | The primary task takes the same steps as today, but the decision information needs a scroll or a second view, or shows only at full width | The primary task takes no more steps than today; the decision information is visible where the decision is made, at compact width too | As 4, and the primary task takes fewer steps than the baseline map's current flow | **Yes** |
| 2 | Grounded in shipped behavior | Renames, removes or re-defaults something users rely on without saying so; navigation or terminology contradicts `frame.md` | Navigation, terms and permissions match `frame.md`, but one change to shipped behavior is not named in the chosen option's after-flow | Current navigation, terms and permissions model respected; any deliberate change to shipped behavior is named in the chosen option's after-flow | As 4, and shipped routes and `en.json` keys are reused wherever they exist | No |
| 3 | Compass fidelity | A restyled cousin where Compass ships the control; invented chrome; root-barrel import | Every control is a Compass export, but one is not the one its guideline intends, or a local composition has no "why no Compass fits" header | Every control is the Compass export its guideline intends; "choose this, not that" rules hold; local compositions carry a "why no Compass fits" header | As 4, and there is no local composition, or each one names the compass-design request it waits on | No (`check.mjs` catches the hard cases) |
| 4 | State coverage | A required state is missing with no `n/a` reason, or a state is an empty placeholder | Every state is present or `n/a` with a reason, but one is not reachable from a scene, or an error state does not say how to recover | Every required state present and reachable, or `n/a` with a one-line reason; error states say how to recover | As 4, and states use realistic extremes (long names, zero, many), and errors keep the user's input | No |
| 5 | Accessibility | An icon-only control with no name; focus lost on an overlay; text below 0.72 opacity | Every control is named and no overlay loses focus, but focus order differs from reading order once, or one overlay does not close with Escape | Focus order follows reading order; every control named; overlays keyboard reachable and dismissible; contrast floors met | As 4, and loading, error and success changes are announced (live region or focus move), and no meaning depends on color alone | No |
| 6 | Copy | Vague or wordy labels; two terms for one thing; placeholder text; a new string where `en.json` has an exact match | Specific and sentence case, but one term differs from the shipped term, or a new string duplicates a near-match in `en.json` with no reason given | Short, specific, sentence case, consistent with shipped terms; new strings listed in `copy.yaml` | As 4, and every error and empty state says what happened and what to do next | No |
| 7 | Mobile and density | Content clipped or unreadable at narrow width with no desktop-only note in `frame.md` | Operable at compact width, but one element is clipped, scrolls sideways, or is hard to tap | Readable and operable at compact width, or `frame.md` states desktop-only and why | As 4, and the compact layout reorders or collapses by priority rather than only shrinking | No |
| 8 | Cognitive load | Two primary actions in one view; a dense view with no progressive disclosure | One primary action per view, but secondary actions compete with it, or a dense view shows everything at once | One primary action per view; high-density data disclosed progressively; the next step is visible | As 4, and defaults are filled from context, so the user confirms rather than enters | No |
| 9 | Direction fit | Contradicts a decision research found, a non-goal, or closes a door the Seed's later bets need open | Consistent with prior decisions, but the roadmap doors it opens or closes are not stated, or sibling work on the surface is ignored | Serves the anchored outcome; consistent with prior decisions and sibling work; roadmap doors stated | As 4, and it reuses the pattern sibling work set instead of adding a second one | **Yes** |
| 10 | Trust and safety | Shows existence, counts or metadata beyond what the authorization state allows; an unsafe default; unclear scope on a destructive action | Shows nothing beyond the authorization state, but a destructive action shows its scope only after it starts, or one compliance control's evidence is missing | Shows nothing beyond the authorization state; safe defaults; scope and blast radius visible before an irreversible action | As 4, and a user who is denied sees why, and how to get access | **Yes when the risk score ≥ 2**; otherwise reported, and `risk_suspected: true` when anything shown depends on who the user is |

## Pass

No line below 3, every must-pass line at 4 or more, mean at or above 4.

## Scoring protocol

- **Fresh context.** The critic and verify see the same evidence: the brief from `scripts/design/brief.mjs` (the `frame.md` sections the lines score, the `research.md` sections for lines 2, 9 and 10, the chosen option's section of `options.md` with its after-flow and roadmap doors on tier prototype, the risk score and the advisory list), this rubric, the prototype source, the screenshots and `state-matrix.yaml`. Verify also sees the `design:check` output. Neither sees the other options, the explorer's recommendation, chat history, `persona.md`, or an earlier critique.
- **Median of 3.** When the first sample meets the threshold, two more samples run in two more fresh contexts and the median per line is the score (`scripts/design/loop.mjs merge-critique` refuses to pass a round on one sample). A round that fails on the first sample uses that sample; a failure needs no confirmation.
- **Regression.** A build round that turns a passing line into a failing line is reverted to the previous round's prototype and the fix is re-issued with the regression named. The round still counts.
- **Plateau.** Two consecutive rounds with no rubric line improving and no fewer persona blockers escalate to a human.

## Output format (one sample)

Write `design/<slug>/rounds/<n>/critique.sample-<k>.md`:

```
# Critique sample <k>: <slug>, round <n>

| # | Line | Score | Anchor applied | Evidence | Fix |
|---|------|-------|----------------|----------|-----|
| 1 | Outcome fit | 4 | "The primary task takes no more steps than today…" | scene:shared-with | … |
… one row per line, 1 through 10 …

risk_suspected: true|false

## Compass misuse
- <restyled cousin / invented chrome / root barrel>, with file:line; or "none found"
```

The score cell holds a single digit 1–5. The anchor cell quotes the anchor nearest the score. Evidence names a scene id or `file:line`. Fix is one concrete change.
