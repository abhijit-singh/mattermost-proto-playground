---
slug: cra-restore-values
title: "Required attribute values in the restore dialog"
surface: "Unarchive / restore dialog, including the System Console channel page."
users: "A member who can restore a channel (End User or Channel admin). System Admin on the System Console channel page, who can always set values."
requested_by: abhijitsingh
outcome: "Restoring an archived channel with a missing required value asks the person who can set it, and saves the value and the restore in one step."
measure: "If save fails, the channel stays archived. There is no Unarchive anyway for a person who can set the value. A person who is not allowed to set it restores the channel and the channel is flagged. System Console requires the values before restore."
bet: "Spec 7.A, priority 11.3.4. Restoring is a person’s action, same rule as create (spec 4.2)."
constraints:
  - "Start from ../../prototype-playground/global-attributes-asaad-latest. Read UnarchiveChannelModal.tsx before changing it. The handoff says product today only warns (MM-70717) and said to leave that modal until this packet. The playground file already collects values. Frame records the gap between that file and the rules below."
  - "If they can set the value, they must fill it. Set and unarchive saves values and restores in one step. If save fails, the channel stays archived."
  - "If they are not allowed to set it, restore and flag."
  - "System Console channel page: system admins can always set values, so they must fill them there too."
  - "Members: archive keeps members and drops the access policy. Restore brings the same members back and does not re-attach the policy."
assumptions_to_test:
  - id: F1
    type: usability
    statement: "A person who can set the value can fill it and restore in one confirm, and a failed save leaves the channel archived."
    test: "Three scenes: allowed user must fill before confirm; save failure stays archived; user who cannot set restores and the channel is flagged."
links:
  - "https://mattermost.atlassian.net/wiki/spaces/ICT/pages/5055971336/Channel+Required+Attributes+-+DRAFT"
labels:
  - design:tweak
---

# Values in the restore dialog — spec 7.A, priority 11.3.4

Source handoff: `../../prototype-playground/global-attributes-asaad-latest/docs/channel-required-attributes-parked-flows.md` (section 4). Epic MM-70742.

Restoring an archived channel is a person’s action, same rule as create (spec 4.2).

- If they can set the value, they must fill it. “Set and unarchive” saves values and restores in one step. If save fails, the channel stays archived. No “Unarchive anyway”.
- If they are not allowed to set it, restore and flag.
- System Console channel page: system admins can always set values, so they must fill them there too.

Today’s product dialog only warns (MM-70717). This work replaces that warning.

## Base prototype

`../../prototype-playground/global-attributes-asaad-latest`

- Scene: `/prototypes/channel-attributes-channel-view?view=unarchive-modal`
- `src/pages/AttributeHubTeamSettings/UnarchiveChannelView.tsx`
- `src/pages/AttributeHubTeamSettings/UnarchiveChannelModal.tsx`

That modal already collects Classification and Caveat. This pass checks it against the three rules above and the System Console channel page. Do not add a second restore flow.
