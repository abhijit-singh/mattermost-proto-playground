# Research

Scope: System Console, desktop, administrator. Attribute Management and Membership Policies. The outcome stays as recorded in `request.yaml`: highlight in the policy that it uses a deleted attribute. This research adds no users, no customer quote, and no new permission model.

Tier is `tweak`, so `next.mjs` does not schedule this stage. It runs because `compliance: true` and `design:check` requires a control table in this file. The frame is left valid.

`.cursor/skills/design-pass-research/compliance.md` is not in the repo. The table below uses the sources named in the skill and in `design/README.md`: NIST SP 800-53 Rev. 5, NIST SP 800-207, NIST SP 800-162, the DoD Zero Trust Reference Architecture, ACP 240, and NATO STANAG 4774 and 4778. Control identifiers are cited only where I know them. Where a source has no clause I can cite, the row says so.

## Prior decisions

`internal-product-knowledge` is not present beside this repo, so it was not searched. No earlier decision about deleted attributes in policies was found.

In this repo, `src/pages/prototypes/` holds `external-call-participants`, `mobile-home-channel`, `outbound-calls`, and `video-calls`. None covers System Console attribute policies. Nothing earlier to reuse.

From the ticket (`source.md`): MM-64635 asks to "Highlight it in the policy if it is using a deleted attribute". It records no decision about blocking the delete. It is labelled `needs-ux` and gives no visual treatment. The parent epic MM-61756 names the Premium Advanced Information Control feature set as context.

## Seeds

None read. `internal-product-knowledge` was not searched, so no Seed is cited or invented.

## Figma

Not read. The Figma tools return `needsAuth` in this run, so neither file could be opened. Nothing is described from them.

- Ticket link: Attribute Based Channel Access, System Console Layout - sections, `https://www.figma.com/file/UCCKYrwLe2Bs2xYqMAEZCI?node-id=6715%3A225645`.
- Epic link: Attribute-Based-Channel-Access, `https://www.figma.com/design/UCCKYrwLe2Bs2xYqMAEZCI/Attribute-Based-Channel-Access?node-id=5299-272143`.

A designer should check both for an existing warning or empty-attribute state before explore treats the visual as open. This matches the designer recommendation in `request.yaml`.

## Recent releases

I read `../mattermost` read only, by commit history on `webapp/channels/src/components/admin_console/access_control` and `.../global_attributes` on `master`. I did not read release notes. The last relevant changes:

- `c63a7a96e3` (2026-11-23) moves post attributes into the `access_control` property group (#40288).
- `da40b3298b` (2026-11-20), MM-70717, warns admins before required channel attributes and lets them fix values from System Console (#38885). It is about missing channel attribute values, not a deleted attribute definition.
- `a524a9d230` (2026-10-27), MM-70824, explains the graph attribute operators in the policy editor menu (#38940).
- `b4465ee19e`, `10e1a4be4f`, `c7ae9d590d` (2026-11-05) change the Attribute Management listing: resource filter, source filter, one search endpoint (#39506, #39503, #39500).
- `b4c43b05e7` (2026-10-22) moves `SectionNotice` to Compass UI (#39042). The policy editor warning therefore already uses the Compass component.

Does any UI already warn on a deleted attribute? No. What exists is a fallback, not a warning:

- The table editor resolves a row's attribute with `fieldForRow`, which returns `undefined` when the rule names an attribute that no longer exists (`webapp/channels/src/components/admin_console/access_control/editors/table_editor/table_editor.tsx:431` to `:439`). That result only feeds the attribute type and the target list (`table_editor.tsx:447`, `:775`). It does not render a message.
- The value selector keeps showing a row's channel target when the attribute was deleted, so the target is not dropped on the next keystroke (`webapp/channels/src/components/admin_console/access_control/editors/table_editor/single_value_selector_menu.tsx:145`, test at `.../value_selector_menu.test.tsx:186`). That keeps data. It does not tell the admin.
- The delete modal body says only that the definition is permanently removed and cannot be undone (`webapp/channels/src/components/admin_console/global_attributes/global_attribute_delete_modal.tsx:113`). It does not mention policies.
- The Membership Policies list has no warning or tag column (`webapp/channels/src/components/admin_console/access_control/policies.tsx:351` lists Name and Applies to). The only `SectionNotice` in that file is the masked-values warning (`policies.tsx:508` to `:509`).

No path:line in the repo renders a deleted-attribute warning on a policy list row or in the policy editor. The frame's finding stands.

## Sibling work

- MM-70717 (`da40b3298b`) is the closest pattern in the same System Console area: an admin is warned that a configuration leaves channels in a bad state, with a way to act. Reuse its tone (state what is wrong, name the object, offer the next step). Do not reuse its data model.
- The policy editor warning notices listed in the frame (`policy_details.tsx:588`, `:610`, `:665`, `:744`) are the visual sibling. The deleted-attribute warning should read as one more of them.
- Permission policies (`PermissionPolicies` flag), channel access rules, and team policy editing reuse the same table editor (`webapp/channels/src/components/channel_settings_modal/channel_settings_access_rules_tab.tsx:783`, `webapp/channels/src/components/team_settings/team_access_policies_tab/team_policy_editor.tsx:531`). They inherit the same stale-rule state. They stay out of this tweak, as the frame recommends.
- `mm-64635` is the only Design Pass packet for this surface in this repo.

## Outside precedent

I am not certain of any product that warns specifically when an ABAC policy references a deleted attribute. What I know is nearby:

- AWS IAM: when a principal named in a resource-based or role trust policy is deleted, the console shows the principal's unique ID in place of the ARN. That marks the reference as unresolvable. It is not a labelled warning, and it concerns principals, not attributes.
- Microsoft Azure portal, role assignments: a deleted user or service principal appears as "Identity not found" in the assignment list. It names the missing object in the place where the reference lives. It also concerns principals, not attributes.

Neither blocks the deletion of the referenced object. Both support allow-delete plus a mark where the reference lives, which is the frame's recommendation. Neither is evidence for exact copy.

## Control table

These rows say what this prototype must show. None requires blocking the delete, adding a permission, or a mobile surface.

| Control | Source | What the UI must show |
| ------- | ------ | --------------------- |
| AC-3 Access Enforcement | NIST SP 800-53 Rev. 5 | Edit Membership Policy shows a warning on the rules panel that names the deleted attribute, and marks the rule row that uses it. The saved expression is not changed by the warning. |
| AC-16 Security and Privacy Attributes | NIST SP 800-53 Rev. 5 | The Membership Policies list shows a warning indicator on the policy that still names a deleted attribute and none on a policy whose attributes all exist. The indicator has text, not color alone. |
| CM-4 Impact Analyses | NIST SP 800-53 Rev. 5 | The Delete attribute confirm says that membership policies may still reference the attribute and that those policies will be flagged. It does not claim the delete is blocked, and it names affected policies only if the prototype data actually lists them. |
| AC-6 Least Privilege | NIST SP 800-53 Rev. 5 | Warning copy states only what is known: the rule names an attribute that no longer exists. It does not say who gains or loses access, because evaluation of a missing attribute is not established (frame assumption 6). It tells the admin to edit or remove the rule. |
| SP 800-207 tenets 4 and 7 (section 2.1) | NIST SP 800-207 | Access policy depends on current attribute state. The policy list and the editor show that a policy no longer matches the attribute set, so an administrator sees the state of the policy without opening a log. |
| SP 800-162 attribute and policy administration (PAP) | NIST SP 800-162 | Attribute Management and Membership Policies stay consistent after a delete: the row leaves Attribute Management, and the policy that used it carries the warning in the same session. No clause number is cited. |
| DoD ZT RA, User pillar and Visibility and Analytics | DoD Zero Trust Reference Architecture | A policy that cannot be evaluated as written is visible to the administrator at the place they manage it. No activity number is cited. |
| ACP 240 with STANAG 4774 and 4778 | ACP 240, NATO STANAG 4774 and 4778 | The warning names the attribute exactly as the saved expression stores it (display name while the field still loads, stored name once it is gone), so an administrator can match it to a label or clearance attribute. These documents define label syntax and binding. They have no admin-console warning clause. |

## Prior art and novelty

Novelty stays low and prior art stays high in the product itself: `SectionNotice` `type="warning"` already marks policy problems in the same editor. Size stays small. No signal in this research moves it.
