---
slug: cra-fill-many
title: "Set one required attribute on many channels at once"
surface: "System Console missing-values list for a channel attribute (the review list already in the base prototype)."
users: "System Admin (MissionOps) clearing missing channel attribute values."
requested_by: abhijitsingh
outcome: "From the missing-values list, an admin filters, selects channels, and sets one attribute value on the selection in a single confirmed action."
measure: "Each selected channel is checked and audited on its own. Failures are listed. Channels that already have a value are unchanged. The action does not become a default for new channels."
bet: "Spec 7.B. One-time action, not a default."
constraints:
  - "Start from the prototype at ../../prototype-playground/global-attributes-asaad-latest. The missing-values list already exists. Add multi-select and the confirm step only."
  - "Confirm copy shape: Set Program to BOREALIS on 312 channels?"
  - "Filter by team, or by source."
  - "Do not add a preset picker on the make-required screen."
  - "Do not turn this into a team-wide or server default (spec 6.5)."
assumptions_to_test:
  - id: F1
    type: usability
    statement: "An admin can select a filtered set and confirm one value without opening each channel."
    test: "Scene: filter, select, confirm. A failure row stays listed with the reason. A channel that already has a value is not in the write set."
links:
  - "https://mattermost.atlassian.net/wiki/spaces/ICT/pages/5055971336/Channel+Required+Attributes+-+DRAFT"
labels:
  - design:tweak
---

# Fill many at once — spec 7.B, priority 11.3.2

Source handoff: `../../prototype-playground/global-attributes-asaad-latest/docs/channel-required-attributes-parked-flows.md` (section 2). Epic MM-70742.

From the missing-values list, filter (team, or source), select channels, **Set Program**, confirm (“Set Program to BOREALIS on 312 channels?”). Each channel is checked and audited on its own. Failures are listed. One-time action, not a default.

Left to build: multi-select and the confirm step on the review list. The list itself already exists.

## Base prototype

`../../prototype-playground/global-attributes-asaad-latest`

- Review hub: `/prototypes/attribute-hub-channel-aligned-per-resource?attr=classification`
- List UI: `src/pages/AttributeManagementHub/_components/AppliesToEditor/UnmarkedChannelsModal.tsx`
- `src/pages/AttributeManagementHub/_components/AppliesToEditor/ResourceConfigPanel.tsx`
- `src/pages/AttributeHubChannelAlignedPerResource/AttributeHubChannelAlignedPerResource.tsx`

Read those files before drawing a new list. The change is selection and confirm on that list.
