---
slug: cra-partner-preset
title: "Required-attribute preset on a connected workspace"
surface: "System Console > Connected Workspaces. Accept-connection step, and the existing connection page."
users: "System Admin (MissionOps) accepting and managing a connected workspace."
requested_by: abhijitsingh
outcome: "Accepting a connection asks for every Required attribute, and a later edit can fill that partner’s still-empty channels without changing channels that already have a value."
measure: "Accept stays disabled until each Required value is set. The fill-empty checkbox is unticked by default. Channels that already have a value do not change. With no preset, partner channels stay flagged on the existing missing-values list."
bet: "Spec 6.2 and 6.6 point 2, priority 11.3.6. The make-required screen does not grow a connection picker."
constraints:
  - "Start from ../../prototype-playground/global-attributes-asaad-latest. Partner channels are already flagged and listed with the other missing channels (circle-multiple-outline). Do not add a preset picker on the make-required screen."
  - "Accept stays disabled until the values are set (6.1 rule 1: you can only preset a value you are allowed to set)."
  - "Changing the preset later is on the connection page. A checkbox, unticked by default, can also fill that partner’s channels that still have no value. It never changes channels that already have one."
  - "Spec 6.6 point 2 is a warning, not a block, and the on-screen pickers were rejected. Leave that decision open. Do not draw those pickers."
  - "Preset rules spec 6.1. Changing a saved preset affects new channels only, except the explicit unticked-by-default fill of still-empty channels on that connection."
assumptions_to_test:
  - id: F1
    type: usability
    statement: "An admin can see that Accept is blocked on missing Required values, set them, and later choose whether empty partner channels get the updated preset."
    test: "Accept disabled with empty Required fields. Connection page shows the preset and an unticked fill-empty checkbox. A channel that already has a value is described as unchanged."
links:
  - "https://mattermost.atlassian.net/wiki/spaces/ICT/pages/5055971336/Channel+Required+Attributes+-+DRAFT"
labels:
  - design:tweak
---

# Partner connection preset — spec 6.2 and 6.6 point 2, priority 11.3.6

Source handoff: `../../prototype-playground/global-attributes-asaad-latest/docs/channel-required-attributes-parked-flows.md` (section 6). Epic MM-70742.

Incoming shared channels are created here with no attribute values. The preset lives on the connection in **System Console > Connected Workspaces**, next to the team already stored there.

- Accepting a connection asks for every Required attribute. Accept stays disabled until the values are set.
- Changing the preset later is on the connection page. A checkbox, unticked by default, can also fill that partner’s channels that still have no value. It never changes channels that already have one.
- Without a preset, partner channels are flagged.
- The make-required screen lists connections with no preset in the spec, and Product rejected the picker on that screen. This prototype flags those channels and lists them with the others. Keep that.

## Base prototype

`../../prototype-playground/global-attributes-asaad-latest`

- Review hub: `/prototypes/attribute-hub-channel-aligned-per-resource?attr=classification`
- Shared-channel rows: `src/pages/AttributeManagementHub/hubData.ts` and `UnmarkedChannelsModal.tsx` (`circle-multiple-outline`)

There is no Connected Workspaces accept screen in that prototype. This packet adds that screen. It does not add pickers to the make-required screen.
