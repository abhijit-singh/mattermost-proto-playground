---
slug: cra-list-policy
title: "Missing-value counts, source filters, and policy-sync warnings"
surface: "System Console channel-attributes entry, and the missing-values list already in the base prototype."
users: "System Admin (MissionOps) reviewing missing channel attributes before an access-policy sync."
requested_by: abhijitsingh
outcome: "The admin can see how many channel values are missing, filter that list by source, and see private channels that would lose every member at the next policy sync."
measure: "The System Console menu shows a count (Channel attributes · 12 missing). The list filters by import, plugin, partner, and restored. After an import, a summary states what was flagged. Before a sync, private channels that would lose every member are marked and shown first."
bet: "Spec 7.D and 7.E, priority 11.3.9. Open: should sync skip a private channel with no value instead of removing everyone? Leave it open."
constraints:
  - "Start from ../../prototype-playground/global-attributes-asaad-latest. Extend the existing review list. Do not draw a second list."
  - "Access policies (spec 10): a policy that reads a channel attribute removes everyone from a private channel that has no value for it. Public channels only gain members. Required works without policies."
  - "Do not decide the open sync question. Show the warning either way, and label the skip-versus-remove choice as open."
  - "Summary after each import belongs on this list, not in a new import wizard."
assumptions_to_test:
  - id: F1
    type: usability
    statement: "An admin scanning the menu and the list can find the private channels that would empty at the next sync before running it."
    test: "Menu shows the count. Filter by source works. Private channels that would lose every member are first and marked. The sync-skip question is visible as undecided."
links:
  - "https://mattermost.atlassian.net/wiki/spaces/ICT/pages/5055971336/Channel+Required+Attributes+-+DRAFT"
labels:
  - design:tweak
---

# List improvements and policy warnings — spec 7.D and 7.E, priority 11.3.9

Source handoff: `../../prototype-playground/global-attributes-asaad-latest/docs/channel-required-attributes-parked-flows.md` (section 9). Epic MM-70742.

- **D.** Count on the System Console menu (“Channel attributes · 12 missing”), filters by source (import, plugin, partner, restored), summary after each import.
- **E.** Before an access policy sync, the list marks private channels that would lose every member, and shows them first. Open question: should sync skip a private channel with no value instead of removing everyone?

Access policies (spec 10): a policy that reads a channel attribute removes everyone from a private channel that has no value for it. Public channels only gain members. Required works without policies, but this is why customers care.

## Base prototype

`../../prototype-playground/global-attributes-asaad-latest`

- Review hub: `/prototypes/attribute-hub-channel-aligned-per-resource?attr=classification`
- `src/pages/AttributeManagementHub/_components/AppliesToEditor/UnmarkedChannelsModal.tsx`
- `src/pages/AttributeManagementHub/_components/AppliesToEditor/ResourceConfigPanel.tsx`
- `src/pages/AttributeHubChannelAlignedPerResource/ChannelConfigurationPage.tsx`

The list exists. This packet adds the menu count, source filters, import summary, and the private-channel warning.
