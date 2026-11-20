---
slug: cra-clearance-cap
title: "Clearance cap on Classification"
surface: "Classification value picker on create channel and on set-value. No prototype scene."
users: "End User and Channel admin allowed to set Classification. System Admin. Security reviewer for the open decision."
requested_by: abhijitsingh
outcome: "A Classification value a person sets cannot sit above that person’s clearance, and a value already set cannot be lowered."
measure: "Not built. The design note records option B plus a raise-only lock as the spec recommendation, the risk of too high and too low, and that Product and Security have not decided."
bet: "Spec 8, priority 11.3.10. Spec recommends B plus a raise-only lock. Options A accept and document (today), B cap at the creator’s clearance, C warn and allow confirm."
constraints:
  - "Do not build this in the prototype. The handoff says so. Frame sets prototype to none."
  - "Ranked-hierarchical attributes are also out."
  - "Start from ../../prototype-playground/global-attributes-asaad-latest only as the place this must not be added. Today anyone allowed to set Classification can pick any level."
  - "Too high: the creator can be removed from their own private channel at the next sync. Too low: the channel is exposed. The spec treats too low as the more dangerous case."
  - "Leave the decision open for Product and Security."
assumptions_to_test: []
links:
  - "https://mattermost.atlassian.net/wiki/spaces/ICT/pages/5055971336/Channel+Required+Attributes+-+DRAFT"
labels:
  - design:tweak
---

# Clearance cap — spec 8, priority 11.3.10

Source handoff: `../../prototype-playground/global-attributes-asaad-latest/docs/channel-required-attributes-parked-flows.md` (section 10). Epic MM-70742.

Classification only. Today anyone allowed to set it can pick any level.

- Too high: creator can be removed from their own private channel at the next sync.
- Too low: the channel is exposed. Spec treats this as the more dangerous case.

Options: A accept and document (today), B cap at the creator’s clearance, C warn and allow confirm. Spec recommends **B plus a raise-only lock**. Needs Product and Security. **Do not build it in this prototype.**

This packet is a design note. It does not add a scene to `../../prototype-playground/global-attributes-asaad-latest` or to this playground.
