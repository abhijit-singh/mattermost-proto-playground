---
slug: cra-import-file-values
title: "Per-channel attribute values in an import file"
surface: "Import file format and the dry-run report. No new screen unless the dry-run report is already a screen in product."
users: "System Admin (MissionOps) running an import. Extension Developer writing the file."
requested_by: abhijitsingh
outcome: "An import file can carry an attribute value per channel, and a dry run lists missing values before anything is written."
measure: "A dry run reports every channel that would be missing a required value and writes nothing. A file that includes the values imports those channels labeled. Channels omitted from the file follow the run preset packet, which is separate."
bet: "Spec 6.4 later, priority 11.3.8. Separate from the one-preset-per-run packet."
constraints:
  - "Start from ../../prototype-playground/global-attributes-asaad-latest. Do not invent an import wizard."
  - "The one preset for the whole run is packet cra-import-preset. This packet is only per-channel values plus the dry run."
  - "Dry run reports gaps before anything is written."
  - "Preset rules spec 6.1 still apply to any run-level preset. A value in the file is the person-supplied value for that channel, not a guess."
  - "If product has no dry-run screen today, set prototype to none. The design note names the file field, the dry-run lines, and the copy."
assumptions_to_test: []
links:
  - "https://mattermost.atlassian.net/wiki/spaces/ICT/pages/5055971336/Channel+Required+Attributes+-+DRAFT"
labels:
  - design:tweak
---

# Per-channel import file values — spec 6.4 later, priority 11.3.8

Source handoff: `../../prototype-playground/global-attributes-asaad-latest/docs/channel-required-attributes-parked-flows.md` (section 8). Epic MM-70742.

See the import preset section. This ticket is later and separate: per-channel values in the import file, plus a dry run that reports missing values before write.

## Base prototype

`../../prototype-playground/global-attributes-asaad-latest`. The missing-values list already shows flagged imported channels. This packet does not rebuild that list. It specifies the file field and the dry-run report.
