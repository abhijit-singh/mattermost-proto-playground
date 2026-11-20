# Calibration

The first 5 runs of the Design Pass are calibration runs. `scripts/design/request.mjs` reads and increments `run_counter` and sets `calibration: true` in `request.yaml` while the counter is 5 or less. Dry runs (`--dry-run`) do not touch the counter.

run_counter: 11
advisory_lines: []

## Runs

| run | slug | date | calibration | designer | notes |
|---|---|---|---|---|---|
| 1 | shared-with-panel-auto | 2026-11-01 | yes |  |  |
| 2 | cra-team-preset | 2026-11-05 | yes |  |  |
| 3 | cra-fill-many | 2026-11-05 | yes |  |  |
| 4 | cra-channel-banner | 2026-11-05 | yes |  |  |
| 5 | cra-restore-values | 2026-11-05 | yes |  |  |
| 6 | cra-import-preset | 2026-11-05 | no |  |  |
| 7 | cra-partner-preset | 2026-11-05 | no |  |  |
| 8 | cra-plugin-playbooks | 2026-11-05 | no |  |  |
| 9 | cra-import-file-values | 2026-11-05 | no |  |  |
| 10 | cra-list-policy | 2026-11-05 | no |  |  |
| 11 | cra-clearance-cap | 2026-11-05 | no |  |  |
<!-- runs -->

## Designer blind scores

On a calibration run, a designer scores every rubric line **before** reading `critique.md`. `check.mjs` fails when the designer's timestamp is later than the critique's `completed_at`. One row per build round. The timestamp is ISO 8601 (`date -u +%Y-%m-%dT%H:%M:%SZ`).

| slug | round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | by | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Disagreements

After each calibration run, compare the designer row with the critic's median per line. A line that differs by more than 1 point on 2 or more of the 5 runs is added to `advisory_lines` above (by number) and listed here with the anchor that needs rewriting. It returns to blocking after its anchor is rewritten in `rubric.md` and 3 further runs agree within 1 point.

| line | runs that disagreed | designer vs critic | anchor problem | status |
|---|---|---|---|---|
