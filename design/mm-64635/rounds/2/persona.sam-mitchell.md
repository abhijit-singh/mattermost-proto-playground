# Persona

One sample is `rounds/<n>/persona.<persona>.md`. Findings are synthetic.

persona: sam-mitchell
completed: true
blocker: false

Synthetic attempt. Sam Mitchell is a catalog profile (FY26 MissionOps), role-played from the screenshots and the prototype source. This is not customer evidence, and no real administrator said any of it.

## Attempt

Primary task: see that a membership policy still uses a deleted attribute, and know what to do next. I read the five screenshots and the prototype source (scenes, `DeleteAttributeModal`, `AttributeManagementPage`, `PolicyListPage`, `PolicyDetailPage`, `mm64635Data`). I did not run the prototype in a browser, so the Remove row result below comes from reading the code.

1. **attributes-delete-confirm.** The dialog is titled "Delete Clearance attribute". It names the affected policy before I delete anything: "The Mission rooms membership policy still uses this attribute, and that policy will be flagged." I get the policy name, the consequence for the policy ("flagged"), and the "cannot be undone" line. The text makes no claim about who gains or loses access. It says the policy will be flagged and stops there. For an auditor, that is the right amount to assert while the evaluation behavior is unconfirmed (framing assumption 6). Delete is the only destructive, primary-weight button, and Cancel is quieter. Pass.

2. **attributes-after-delete.** Clearance is gone from the table, and a notice reads "Mission rooms still uses Clearance / Clearance deleted. 1 membership policy still uses it." with a "View flagged policy" button. The notice names the policy, the attribute and the count, so I know what to do next. I followed the button in the source. It goes straight to the policy detail scene, and Back from there returns to the policy list, not to Attribute Management. Pass, with friction below.

3. **policy-list-deleted-attribute.** Mission rooms carries an amber "Uses a deleted attribute" tag. Standup has none. The marker is findable at a glance, and the clean policy is visibly clean. Pass.

4. **policy-detail-deleted-attribute.** A warning notice reads "A rule still uses a deleted attribute / Clearance no longer exists. Edit or remove the marked rule." The Clearance row shows the stored name and a "Deleted attribute" tag. Clearance is not offered in the attribute list, so I cannot re-pick it, but I can choose a surviving attribute. Remove row (trash icon, "Remove row" tooltip and aria-label) calls `removeRule`. The warning is derived from the current rules, so removing the Clearance row clears it. The Department row stays. Save and Cancel are in the footer. Task finished: I know which rule is stale and I have two actions (edit the rule, remove the row). The warning claims nothing about access. Pass.

5. **attributes-delete-error.** A danger notice reads "Could not delete Clearance / Clearance is still in the list. Open its actions and choose Delete attribute to try again." The attribute is still listed and the next step is stated. The existing danger banner is used, as the outcome requires. Pass, with friction below.

Verdict on the checks I was asked for: the confirm names the affected policy before delete, and no warning copy in any of the five scenes claims who gains or loses access.

## Friction

These are findings, not task blockers. Rough order of how much each would matter in an approval review.

1. **Remove row can widen access, and nothing at the point of action says so.** Rules combine with AND. Deleting the Clearance row from Mission rooms leaves "Department is Operations" as the only condition. I read the code, so I know the prototype does not claim a result, and that is correct. But an administrator clicks the trash icon, the warning disappears, and Save has no confirmation or change summary. For me, the stale warning going quiet is the moment the control is satisfied on paper. I would ask whether the product can show a before/after of the rule set on Save. It is outside this ticket's scope, but it is the next gap. Flag for the designer, not a blocker.
2. **"Flagged" and "no longer exists" do not say what the system does with the rule.** Is the rule enforced, ignored, or does it deny? Framing assumption 6 says this is not established, so the copy is right not to guess. Nobody reading these screens can answer it, though. I would want it answered in the release documentation, with the authorization-relevant behavior written down. Until it is, "the policy is flagged" is the only fact on the page. Research follow-up, not a prototype defect.
3. **After-delete notice is `info` severity and transient.** The access-control defect is shown in the blue informational style. The policy list and editor use warning. The notice sits above the table and, as built, goes away when the page state changes. Nothing on this page lists which policies are flagged once I navigate away. Only the list tag persists. I would accept this if the list tag is reliable.
4. **View flagged policy skips the list.** It opens the editor for the one policy. With one flagged policy that is efficient. The notice says "1 membership policy" generically, so with several flagged policies I could not tell which of them the button opens, and the count and the destination could diverge. Prototype data has one affected policy, so I could not test this case.
5. **The list tag does not name the attribute.** "Uses a deleted attribute" is accurate. If a policy has several rules I must open the editor to learn which attribute. Acceptable for a small ticket.
6. **Delete error has no reason.** "Could not delete Clearance" and "try again" is a retry instruction, not a cause. I cannot tell a permissions failure from a server error. The error scene is also reachable only from the scene switcher. There is no path from the Delete button in the prototype, so I could not tell whether the policy flag state is unchanged after a failed delete. The copy implies Clearance remains in use, but the scene does not say it.
7. **No audit trail visible.** Nothing on these screens says the delete, or the later row removal, is logged. I would ask where the record is. Out of scope for the UI ticket, listed because I would ask in review.
8. **Minor copy.** "Mission rooms still uses Clearance" reads as a singular-plural mismatch ("rooms ... uses") because the policy name is plural. Low priority.
