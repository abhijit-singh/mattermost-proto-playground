---
slug: cra-channel-banner
title: "In-channel banner when a required attribute is empty"
surface: "Channel center, above the message list, on desktop web. One banner for every missing source."
users: "People who can see and set the attribute (Channel admin / Operational Champion, and members who can set it). Everyone else sees nothing."
requested_by: abhijitsingh
outcome: "People who can see and set the attribute see that this channel has no value, with a way to set it. Everyone else sees no banner and no attribute name."
measure: "A person allowed to set Program sees “This channel has no Program” and can open set-Program. A person who cannot see or set it sees the channel with no banner. One banner covers import, plugin, partner, and restored sources."
bet: "Spec 7.C. The info RHS error fields in the base prototype are the channel-admin path, not this banner."
constraints:
  - "Start from ../../prototype-playground/global-attributes-asaad-latest. Do not replace the info RHS. Add the banner."
  - "Creation errors never name the attribute. List messages only go to channel admins allowed to see the attribute."
  - "Copy shape: This channel has no Program. Set Program."
  - "Do not build spec 4.1 who-can-set coupling. People who cannot set the value do not get create-channel."
assumptions_to_test:
  - id: F1
    type: usability
    statement: "A person who can set the value can do it from the banner without leaving the channel."
    test: "Allowed user sees one banner and reaches the existing set-value control. A user who cannot see the attribute sees no banner and no attribute name."
links:
  - "https://mattermost.atlassian.net/wiki/spaces/ICT/pages/5055971336/Channel+Required+Attributes+-+DRAFT"
labels:
  - design:tweak
---

# Banner inside the channel — spec 7.C, priority 11.3.3

Source handoff: `../../prototype-playground/global-attributes-asaad-latest/docs/channel-required-attributes-parked-flows.md` (section 3). Epic MM-70742.

People who can see and set the attribute see “This channel has no Program. [Set Program]”. Everyone else sees nothing. One banner covers every source.

Left to build: the in-channel banner. The info RHS error fields in the base prototype are the channel-admin path, not this banner.

## Base prototype

`../../prototype-playground/global-attributes-asaad-latest`

- Channel view: `/prototypes/channel-attributes-channel-view`
- `src/pages/ChannelAttributesChannelView/ChannelAttributesChannelView.tsx`
- Info RHS: `src/pages/AttributeHubTeamSettings/ChannelInfoSidebar.tsx`
- `src/pages/AttributeHubTeamSettings/ChannelAttributesPanel.tsx`

The banner is new on that channel view. Keep the RHS behavior.
