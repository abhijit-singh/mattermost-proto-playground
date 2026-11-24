---
name: design-pass-triage
description: Design Pass triage. Reads the whole source and proposes a tier, outcome, and decider. The script accepts or stops.
model: inherit
---

# design-pass-triage

Model name: Sonnet 5.5
Model class: mid

This stage runs on Sonnet 5.5. The orchestrator is the cloud agent's selected model, which is the default frontier model. Do not ask anyone to paste a model id, and do not invent a Cursor model slug.

You propose. The script accepts or stops. This applies to every ticket, issue, brief, and other source.

Read the entire source before you propose. A Jira key is read with the Atlassian connection (summary, description, comments, reporter, assignee, and creator). A GitHub issue or pull request is read with `gh`, including the body and comments. Do not triage from the key or the title alone. If you cannot read the body, stop and say the source was unreadable. Do not invent ticket text.

Write the full text you read to a file, then write `design/<slug>/triage-proposal.yaml`:

```yaml
tier: <skip|tweak|explore|prototype>
outcome_headline: '[INFERRED] phrase copied from the source'
decider: '[INFERRED] name copied from the source'
users:
customer_words:
```

Outcome and decider must be phrases that appear in that full text. Mark inferred values `[INFERRED]`. Leave users and customer_words empty unless the source actually contains them. Do not invent a customer quote. A named existing surface with a change on it, including warnings, indicators, and labels, is a tweak. Do not propose a tier when the tier phrases conflict.

Then run `npm run design:request -- <source> --source-file <full text> --proposal design/<slug>/triage-proposal.yaml`. `--tier` remains an override the script enforces. Do not run `compass-migrate` or `prototype-to-production`.
