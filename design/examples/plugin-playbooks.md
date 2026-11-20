---
slug: cra-plugin-playbooks
title: "Required attributes on Playbooks run and convert-to-channel"
surface: "Playbooks run form, and Convert group message to private channel. API rows are recorded, not drawn as new screens."
users: "End User starting a playbook run. Channel admin converting a group message. Extension Developer for the plugin API note."
requested_by: abhijitsingh
outcome: "A person who is present is asked for required channel attributes on Playbooks run and on convert-to-channel. Machine paths that cannot ask yet flag the channel."
measure: "Start run stays disabled while a required value is empty. The run form starts filled from the playbook preset and the starter can change unlocked values. If convert-to-channel save fails, the conversation stays a group message. Plugins on the current API keep working and their channels are flagged."
bet: "Spec 5, priority 11.3.7. The new plugin method creates the channel and the values in one step. Name is not final."
constraints:
  - "Start from ../../prototype-playground/global-attributes-asaad-latest. Do not redraw webapp Create channel. The handoff says that path already refuses with api.channel.create_channel.missing_required_attributes.app_error (HTTP 400) and the error does not name the attribute."
  - "Mobile Create channel and Convert to channel stay blocked until mobile asks (mobile PR 10146). Do not design a mobile scene. That block is why the flag cannot be on by default."
  - "Draw only the two person-present forms that are not in the base prototype: Playbooks run, and Convert group message to private channel."
  - "mmctl, including --local, refuses. --local skips permission checks and still enforces the attribute rule. Record the command: mmctl channel create --team eng --name ops-room --attribute Program=AURORA. No new screen."
  - "Plugins, current API: keep it working and flag. Plugins, new CreateChannelWithAttributes: one step, name not final. Record it. Do not draw an API console."
  - "Boards, Spaces, /test, /manualtest, DMs, and group messages are out of scope (spec 12)."
  - "A form may start filled in. It may not start with a guess (spec 6.1 rule 4)."
assumptions_to_test:
  - id: F1
    type: usability
    statement: "A playbook starter can see the preset values, change an unlocked one, and cannot start while a required value is empty."
    test: "Run form opens filled. Empty required value keeps Start run disabled. A failed convert leaves the group message in place."
links:
  - "https://mattermost.atlassian.net/wiki/spaces/ICT/pages/5055971336/Channel+Required+Attributes+-+DRAFT"
  - "https://github.com/mattermost/mattermost-mobile/pull/10146"
labels:
  - design:tweak
---

# New plugin API, then Playbooks — spec 5, priority 11.3.7

Source handoff: `../../prototype-playground/global-attributes-asaad-latest/docs/channel-required-attributes-parked-flows.md` (section 7). Epic MM-70742.

| Path | If a required value is missing | What this packet does |
| --- | --- | --- |
| Webapp Create channel, and your own API scripts | Refused. Error does not name the attribute. | Already specified. No new screen. |
| Mobile Create channel and Convert to channel | Refused, blocked on mobile PR 10146. | No scene. |
| Convert group message to private channel | Refused until the form asks. If save fails, it stays a group message. | One scene. Same fields as create. |
| mmctl, including --local | Refused without --attribute. | Design note only. |
| Playbooks run | Refused after Playbooks moves. Until then, flag the channels. | Run form scene. Preset on the playbook. Start run disabled if a required value is empty. |
| Plugins, new CreateChannelWithAttributes | Refused until the new method is used. Name not final. | Design note only. |
| Plugins, current plugin API | Flagged. Keep the current API working. | Design note only. |
| Bulk import, partner share, new team default channels | Preset, else flagged. | Other packets. |

## Base prototype

`../../prototype-playground/global-attributes-asaad-latest`. Use its attribute fields (Classification and the channel attribute panel) as the controls inside the two new forms. Do not rebuild the attribute hub.
