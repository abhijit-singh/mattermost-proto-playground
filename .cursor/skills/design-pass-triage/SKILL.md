---
name: design-pass-triage
description: Design Pass triage. Reads the whole source and proposes a tier, outcome, and decider. The script accepts or stops.
---

# design-pass-triage

Model name: Sonnet 5.5
Model class: mid

This stage runs on Sonnet 5.5. The orchestrator is the cloud agent's selected model, which is the default frontier model. Do not ask anyone to paste a model id, and do not invent a Cursor model slug.

You decide the tier. The script checks your file and accepts or stops. This is the same process for every ticket, issue, brief, and other source.

Read the whole source before you write. A Jira key is read with the Atlassian connection: title, description, acceptance criteria, comments, labels, the parent epic, and linked issues. A GitHub issue or pull request is read with `gh`, including the body and the comments. Do not decide from the key or the title alone. If the body cannot be read, stop and say the source was unreadable. Do not invent ticket text.

Write that full text to a file. Then write `design/<slug>/triage.json`. Each of tier, size, compliance, and outcome_headline has a value, a confidence (`high`, `medium`, or `low`), and at least one evidence quote copied word for word from the source. users and customer_words use the same shape, and their value is null when the source does not contain them. Do not invent a customer quote. Do not put a decider in this file. The script sets the decider to the person who started the run.

Also write `designer_recommendation` with `involve` true or false and a `reason`. Use it when the risk looks like 2 or higher, or compliance is on. It is a recommendation, not a gate.

A named existing surface with a change on it, including warnings, indicators, and labels, is a tweak. Say `low` confidence when you are unsure. `--tier`, a `design:*` label, and a Seed `ask:` are overrides the script enforces.

Do not run `compass-migrate` or `prototype-to-production`.
