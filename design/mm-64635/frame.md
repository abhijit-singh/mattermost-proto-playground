---
prototype: scenes
risk_flags:
  - permissions_or_security_copy
  - destructive_action
  - admin_console
approval_required: designer
---

# Frame

## Problem

A system administrator can create an attribute, use it in a membership policy, then delete the attribute. Attribute Management removes the row. The policy keeps the reference and shows it as an ordinary attribute name. Nothing on the policy says the attribute is gone.

That is an access-control defect, not a cosmetic badge. The rule still sits in an access policy after the attribute it depends on has been removed. An administrator reading the policy cannot tell the rule is stale. MM-64635 asks for warnings and indicators when a policy uses a deleted attribute. The expected result, kept as the outcome below, is to highlight that fact in the policy.

Compliance is already on. The warning explains that an access rule still names an attribute that no longer exists.

## Outcome

outcome_headline: "[INFERRED] Highlight it in the policy if it is using a deleted attribute"

measure: Start from a membership policy whose expression references attribute A, and a second policy whose expression references only attributes that still exist. Delete A from Attribute Management. Then:

- Edit Membership Policy for the first policy shows a warning that names A (the name or the identifier the saved expression still stores). The rule row that uses A is marked. The second policy shows neither the warning nor the mark.
- The Membership Policies list shows a warning indicator on the first policy and none on the second.
- Attribute Management no longer lists A. A delete that fails still uses the existing danger banner.

Size stays small. The interaction is a new state on screens that already exist. Novelty is low: the policy editor already uses a warning notice. No new route.

## Users

The source names none. MM-64635 records no user and no customer quote. The parent epic MM-61756 describes government organizations and Premium customers as the reason attribute-based channel access exists. That text is context for the epic. This frame does not treat it as a user of this warning or as a customer quote.

## Ships today

System Console, section System Attributes. Enterprise Advanced, and attribute-based access must be enabled before the policy pages appear.

Attribute Management is the attributes page. The route is `system_attributes/manage_attributes` (`webapp/channels/src/components/admin_console/admin_definition.tsx:731`). The page title is Attribute Management (`webapp/channels/src/components/admin_console/global_attributes/global_attributes.tsx:28` and `:76`). The older User Attributes URL redirects there (`webapp/channels/src/components/admin_console/user_attributes_redirect.tsx:8` and `admin_definition.tsx:669`).

Delete is a row action, Delete attribute (`webapp/channels/src/components/admin_console/global_attributes/global_attributes_table.tsx:408`). The confirm modal is titled "Delete {name} attribute" and the body says the definition is permanently removed (`webapp/channels/src/components/admin_console/global_attributes/global_attribute_delete_modal.tsx:69` and `:112`). It does not mention policies. On success the handler refetches the table and shows nothing (`global_attributes_table.tsx:342`). A danger `AlertBanner` appears only when the request fails (`global_attributes_table.tsx:682`). A 409 says other attributes are still linked, not that a policy uses the attribute (`global_attributes_table.tsx:759`).

Membership Policies is `system_attributes/membership_policies` (`admin_definition.tsx:917`). The list columns are Name and Applies to (`webapp/channels/src/components/admin_console/access_control/policies.tsx:351`). Opening a row goes to Edit Membership Policy (`policies.tsx:343`, title at `webapp/channels/src/components/admin_console/access_control/policy_details/policy_details.tsx:556`).

The editor already has warning notices, and none of them is a deleted attribute:

- No user attributes configured yet (`policy_details.tsx:588`).
- A channel is missing the referenced attribute, so every member of that channel is removed (`policy_details.tsx:610`). That is a missing value on a channel, not a deleted attribute definition.
- Restricted (masked) values (`policy_details.tsx:665`).
- Public and private channels in one policy (`policy_details.tsx:744`).

The simple editor stores `user.attributes.<name>` (`webapp/channels/src/components/admin_console/access_control/editors/shared.tsx:261`). When the visual AST is parsed, the row keeps that name (`webapp/channels/src/components/admin_console/access_control/editors/table_editor/table_editor.tsx:282`). If the name is not in the loaded field list, the selector label falls back to the raw name (`webapp/channels/src/components/admin_console/access_control/editors/table_editor/attribute_selector_menu.tsx:154`). There is no warning style on that control.

The server can search policies for `id_<fieldID>` (`server/channels/store/sqlstore/access_control_policy_store.go:973`). A search of the mattermost repo found no app or webapp caller of `GetPoliciesByFieldID`. The client expressions and their tests use `user.attributes.<name>`, not that id form.

Permission policies are a separate System Console page, behind the PermissionPolicies flag (`admin_definition.tsx:954`). They edit expressions in their own card (`webapp/channels/src/components/admin_console/permission_policies/policy_details/permission_policy_details.tsx:688`) and have no deleted-attribute warning. Channel access rules and team policy editing reuse the same table editor (`webapp/channels/src/components/channel_settings_modal/channel_settings_access_rules_tab.tsx:783`, `webapp/channels/src/components/team_settings/team_access_policies_tab/team_policy_editor.tsx:531`).

internal-product-knowledge was not beside this repo, so it was not searched.

## Baseline map

Base screens:

- Attribute Management, the list, including the state immediately after a confirmed delete.
- Membership Policies list.
- Edit Membership Policy, simple (table) editor, with one rule whose attribute is no longer in the attribute list. The CEL editor is the same policy with a complex expression; the warning still belongs on the policy.

Entry points:

- System Console → System Attributes → Attribute Management.
- System Console → System Attributes → Membership Policies, then a policy row. Attribute-based access has to be on (`admin_definition.tsx:917`).
- The Attribute-Based Access setting links to Attribute Management (`admin_definition.tsx:804`).

Current flow:

1. Create an attribute with New attribute on Attribute Management.
2. Add a membership policy and a rule that selects that attribute.
3. Return to Attribute Management, choose Delete attribute, and confirm. The row disappears. There is no success notice and no list of policies that still use it.
4. Open the policy. The rule still shows the attribute name. The list row still shows only the policy name and what it applies to.

Scenes this tweak touches:

- `attributes-after-delete`. Attribute Management just after confirming deletion of an attribute a membership policy still uses. The row is gone. This is the trigger the ticket describes.
- `policy-detail-deleted-attribute`. Edit Membership Policy for that policy. The rules panel carries a warning that names the deleted attribute, and the rule row is marked.
- `policy-list-deleted-attribute`. Membership Policies, with a warning indicator on that policy and a clean second policy beside it.

## Compass components

No new component. The installed `@mattermost/compass-ui` types already cover a warning on a policy and a mark on a row:

- `SectionNotice` (`type` includes `warning` and `danger`) from `@mattermost/compass-ui/components/section-notice`. The policy editor already uses `type="warning"` for the notices above. Use it again for the policy-level warning, on the rules panel, so the defect is announced with a title and a description that names the attribute.
- `Tag` (`type` includes `warning` and `danger`) from `@mattermost/compass-ui/components/tag`. Use it for the indicator on the policy list row and, if the rule needs a compact mark, on the rule row.
- `FieldMessage` (`tone` includes `warning`) from `@mattermost/compass-ui/components/field-message`. Use it under the attribute selector when the selected name is not in the loaded field list. The selector currently renders a plain label.
- `Chip` has an `error` border. That fits a bad selected value, not a missing attribute definition. Prefer `Tag` and `FieldMessage` for this state.

The attributes page already uses the webapp `AlertBanner` for a failed delete (`global_attributes_table.tsx:35` and `:682`). A successful delete does not need a new banner component. If the confirm step should name affected policies, that is copy in the existing delete modal.

## Assumptions

1. The attributes page in the ticket is Attribute Management, and the policy is a membership policy. Test: follow the ticket steps on `system_attributes/manage_attributes` and `system_attributes/membership_policies`. The attribute disappears from the first page and the second page still shows the rule.
2. Delete succeeds while a policy expression still names the attribute. Test: create the attribute, reference it, delete it, reload the policy. The expression still contains the name. The 409 path in `global_attributes_table.tsx:759` is for linked attributes, and `GetPoliciesByFieldID` has no app caller, so a policy reference is not expected to block the delete.
3. The client can detect the stale rule by comparing the parsed attribute name (`table_editor.tsx:287`) with the loaded fields. The selector already takes the branch where the name is missing (`attribute_selector_menu.tsx:157`). Test: after delete, that branch is true and the label equals the stored name. If a save rewrites the expression to `id_<fieldID>`, this comparison has to use the id instead. Read the stored expression before and after save to confirm which token remains.
4. The highlight names the attribute and leaves the saved expression in place. Test: the warning text includes the attribute name, and saving without an edit does not strip the reference. Changing who the policy admits is outside this ticket.
5. `SectionNotice`, `Tag`, and `FieldMessage` are enough. Test: the prototype imports those three and adds no component under `src/components/`.
6. What the server does at evaluation time when the named attribute no longer exists is not established here. The channel-attribute notice at `policy_details.tsx:621` is about a channel missing a value. Test during research: evaluate a policy after the attribute delete and record whether access is denied, allowed, or unchanged. The prototype shows the warning either way.

## Risk

Score 4. Approval: designer.

- `permissions_or_security_copy` (2). The warning tells an administrator that an access rule still references a deleted attribute. That is access-control copy. Compliance is already on, and research writes the control table.
- `destructive_action` (1). The frame includes the attribute delete that creates the stale rule. The current confirm says the definition is permanently removed (`global_attribute_delete_modal.tsx:112`).
- `admin_console` (1). Attribute Management and Membership Policies are System Console pages.

Mobile, global chrome, and copy-only stay off. The screens are desktop System Console. The change is a new visible state, not wording on a control that already exists. A new component and a new pattern stay off: `SectionNotice` `type="warning"` is already the policy editor's warning, and `Tag` plus `FieldMessage` can mark the row.

## Open questions

1. Where does the highlight sit: policy detail, policy list, or both? Recommended: both. The detail names the attribute on the rule, which is the ticket's "in the policy". The list carries a `Tag` so the stale policy is visible without opening every row. The three scenes above match that.
2. Should delete be blocked when a policy still uses the attribute? Recommended: allow the delete, which is what the server does today, and highlight the policy. The ticket's expected result is the highlight. The confirm body should say that policies still use the attribute, because it currently only says the definition is removed.
3. Does the attributes page need a success notice after delete? Recommended: a notice that only says "deleted" does not meet the outcome. The missing signal is the policy that still uses the attribute. Put that in the confirm copy and in the policy highlight. The `attributes-after-delete` scene shows the row gone and, if the confirm step names policies, that sentence.
4. Are permission policies, channel access rules, and team policy editors in this tweak? Recommended: the scenes stay the three System Console membership surfaces. Those other editors can hold the same stale name (`channel_settings_access_rules_tab.tsx:783`, `team_policy_editor.tsx:531`, `permission_policy_details.tsx:688`). If research finds they load the same fields, they get the same mark later. They are not extra scenes in this tweak.
5. Which token does the warning name, the display name or the CEL name? Recommended: the display name when the last loaded field still has one, and the stored CEL name when the field is already gone. Test with assumption 3.
