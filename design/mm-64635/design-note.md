---
risk_flags:
  - permissions_or_security_copy
  - destructive_action
  - admin_console
approval_required: designer
---

# Design note

## What changed

MM-64635: a membership policy can keep naming an attribute after an admin deletes it from Attribute Management. Nothing on the policy said so. The prototype is at `/prototypes/mm-64635`. It has five scenes: `attributes-delete-confirm`, `attributes-after-delete`, `policy-list-deleted-attribute`, `policy-detail-deleted-attribute` and `attributes-delete-error`.

- **Warning on the policy.** Edit Membership Policy shows a warning, "A rule still uses a deleted attribute", on the rules panel. It names Clearance and tells the admin to edit or remove the marked rule. The rule row that uses Clearance carries a "Deleted attribute" tag.
- **List tag on that policy only.** On Membership Policies, Mission rooms carries an "Uses a deleted attribute" tag. Standup, whose attributes all exist, has no tag.
- **Delete confirm names the policy.** "Delete Clearance attribute" says the Mission rooms membership policy still uses the attribute and will be flagged, before the admin confirms.
- **After-delete notice.** Attribute Management shows a notice that Mission rooms still uses Clearance, with a View flagged policy action that opens Edit Membership Policy for Mission rooms.
- **Delete stays allowed.** The delete is not blocked. The failed-delete state keeps the existing danger banner.
- **No access claim.** The warning states only that the rule names an attribute that no longer exists. It does not say who gains or loses access.

## Screens

- `attributes-delete-confirm`: the admin sees the Delete Clearance attribute modal, which names the Mission rooms policy as still using it and flagged after delete, with Cancel and a destructive Delete. See `design/mm-64635/screenshots/attributes-delete-confirm.png`.
- `attributes-after-delete`: the admin sees Attribute Management without the Clearance row and an info notice, "Mission rooms still uses Clearance", with View flagged policy. See `design/mm-64635/screenshots/attributes-after-delete.png`.
- `policy-list-deleted-attribute`: the admin sees Membership Policies with an "Uses a deleted attribute" tag on Mission rooms and a clean Standup row. See `design/mm-64635/screenshots/policy-list-deleted-attribute.png`.
- `policy-detail-deleted-attribute`: the admin sees the rules panel warning that names Clearance and the "Deleted attribute" tag on the affected rule. See `design/mm-64635/screenshots/policy-detail-deleted-attribute.png`.
- `attributes-delete-error`: the admin sees the danger notice "Could not delete Clearance", with Clearance still in the list and a prompt to try again. See `design/mm-64635/screenshots/attributes-delete-error.png`.

## Needs confirmation

These fields are listed under `needs_confirmation` in `request.yaml`:

- `outcome_headline`: "[INFERRED] Highlight it in the policy if it is using a deleted attribute". Triage inferred it from the ticket; an owner should confirm it.
- `lighthouse_name`: "[AI DRAFT] none named in MM-64635". The ticket names no lighthouse customer.
- `verified`: "[AI DRAFT] not verified". No one has verified the outcome against the shipped product.

Other items for a person:

- Users and customer words are empty. The ticket records no user and no customer quote, and none is added here.
- The decider is Cursor Agent, set by the script.
- A designer should confirm the visual. `approval_required` is designer: the score is 4, and compliance is on with permissions-or-security copy, a destructive action and the admin console in play. The ticket gives no visual treatment for the highlight.
- Figma was not read. The ticket links a Figma file for the System Console layout, and a designer should check it for an existing warning or empty-attribute state.
- `internal-product-knowledge` was not searched.
