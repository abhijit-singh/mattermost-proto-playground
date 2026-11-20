---
slug: cra-import-preset
title: "One attribute preset for a bulk import run"
surface: "Bulk import command and the missing-values list that already flags imported channels. No new import wizard."
users: "System Admin (MissionOps) who runs an import. Extension Developer when the same API is called."
requested_by: abhijitsingh
outcome: "An import run can take one attribute preset, and imported channels without a valid preset are flagged."
measure: "mmctl import process <file> --attribute Program=BOREALIS labels imported channels with that value. A run without a preset still imports, and those channels show on the missing-values list. A preset whose option was deleted flags “preset no longer valid” and does not write the bad value."
bet: "Spec 6.4, priority 11.3.5. Open decision: once presets exist, spec 6.1 says refuse an import that has no preset. Spec recommends refuse, with a message that names --attribute. Leave that decision open."
constraints:
  - "Start from ../../prototype-playground/global-attributes-asaad-latest. Imported channels are already a flagged source on the review list. Do not invent an import wizard or a new route."
  - "If the only change is the command flag, the flag message, and the existing flagged row, set prototype to none and write the design note. Add a scene only if the flag message or the flagged row needs a screen the base prototype does not show."
  - "Preset rules spec 6.1. Recheck on every use. Never label a channel with a deleted option."
  - "Per-channel values inside the import file are a separate packet (spec 6.4 later, priority 11.3.8). Do not design that here."
  - "Open: refuse an import with no preset once presets exist. Spec recommends yes. Do not close it."
assumptions_to_test: []
links:
  - "https://mattermost.atlassian.net/wiki/spaces/ICT/pages/5055971336/Channel+Required+Attributes+-+DRAFT"
labels:
  - design:tweak
---

# Import preset — spec 6.4, priority 11.3.5

Source handoff: `../../prototype-playground/global-attributes-asaad-latest/docs/channel-required-attributes-parked-flows.md` (section 5). Epic MM-70742.

Import files have no attribute values yet. The admin supplies one preset for the run: `mmctl import process <file> --attribute Program=BOREALIS`. Without it, imported channels are flagged.

Open decision (spec 6.4 / 14): a person runs every import, so rule 6.1 says refuse instead, once the preset exists. Spec recommends refuse, with a message that names `--attribute`.

Later, separate ticket (11.3.8): per-channel values in the import file, plus a dry run that reports missing values before write. That ticket is its own packet.

## Base prototype

`../../prototype-playground/global-attributes-asaad-latest`. The review list already flags channels by source, including import. Read `src/pages/AttributeManagementHub/_components/AppliesToEditor/UnmarkedChannelsModal.tsx` and `ResourceConfigPanel.tsx`. This packet does not rebuild that list.
