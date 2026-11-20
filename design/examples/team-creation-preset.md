---
slug: cra-team-preset
title: "Team-creation preset for required channel attributes"
surface: "Create team (webapp and the team-create API). Default channels Town Square and Off-Topic."
users: "System Admin (MissionOps) creating a team while a channel attribute is Required."
requested_by: abhijitsingh
outcome: "When a channel attribute is Required, creating a team asks for that attribute’s values and applies them to Town Square and Off-Topic."
measure: "A team created with the values has both default channels labeled. A team created without them still exists, and Town Square and Off-Topic are flagged on the missing-values list."
bet: "Spec 6.3. The preset is per create-team action. It is not a team-wide default (spec 6.5)."
constraints:
  - "Start from the prototype at ../../prototype-playground/global-attributes-asaad-latest. Do not rebuild flows that prototype already covers."
  - "Do not invent a team-wide default. Spec 6.5 rejects a server-invented default that fills existing empty channels."
  - "Admin-chosen new-channel Default stays, and it applies to newly created channels only."
  - "Preset rules in spec 6.1 apply. Only preset a value the actor is allowed to set. Recheck on every use. Audit who set the preset. A form may start filled in and may not start with a guess. Changing a saved preset affects new channels only."
  - "mmctl shape already specified: mmctl team create --default-channel-attribute Program=BOREALIS. The API takes the same values."
assumptions_to_test:
  - id: F1
    type: usability
    statement: "A system admin can supply Town Square and Off-Topic values in the create-team step without hunting for the channels afterward."
    test: "One scene: create team with a Required attribute. Both default channels show the chosen value. A second scene: create team with the step skipped or empty. The team exists and both channels are flagged."
links:
  - "https://mattermost.atlassian.net/wiki/spaces/ICT/pages/5055971336/Channel+Required+Attributes+-+DRAFT"
labels:
  - design:tweak
---

# Team-creation preset — spec 6.3, priority 11.3.1

Source handoff: `../../prototype-playground/global-attributes-asaad-latest/docs/channel-required-attributes-parked-flows.md` (section 1). Epic MM-70742. Page 5055971336.

New teams create Town Square and Off-Topic. When an attribute is Required, create-team gains a step that asks for those values and applies them to both default channels. Without them the team is still created and Town Square / Off-Topic are flagged.

Left to build: the create-team step and the mmctl/API field. Do not invent a team-wide default (spec 6.5).

## Base prototype

The current build is `../../prototype-playground/global-attributes-asaad-latest`. Review hub: `/prototypes/attribute-hub-channel-aligned-per-resource?attr=classification`. This item is not in that prototype. Build the create-team step on top of that attribute model (Classification / Program as already shown). Do not redesign the make-required gate, the missing-channel review, notify, or delete-and-replace.

## Already decided

- Required cannot turn on while any existing channel lacks a value.
- Connected-workspace channels are flagged and listed with the other missing channels. No preset picker on the make-required screen.
- People who can create a channel can set the value. Do not build the spec 4.1 who-can-set coupling.
- Ranked-hierarchical attributes and the clearance cap (spec 8) are out of this work.
