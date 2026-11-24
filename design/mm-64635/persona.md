# Persona: mm-64635, round 2

## persona.jake-reynolds.md

# Persona

One sample is `rounds/<n>/persona.<persona>.md`. Findings are synthetic.

Synthetic attempt by the `jake-reynolds` FY26 catalog profile (Lt. Col. Jake Reynolds, MissionOps). It is a role-play against the prototype screenshots and scene code. It is not customer evidence and not a research session.

persona: jake-reynolds
completed: true
blocker: false

## Attempt

Primary task: see that a membership policy uses a deleted attribute, and know what to do next. I walked the five scenes in the order a delete would happen, with Clearance as the attribute and Mission rooms as the policy.

1. **attributes-delete-confirm.** The modal is titled "Delete Clearance attribute". It says the Mission rooms policy "still uses this attribute, and that policy will be flagged", and that the delete cannot be undone. I know before I click Delete that a policy is affected, and which one. Delete is red and Cancel is the quiet button. "Hmm. Flagged. Fine. But what happens to the people in those channels?" The modal does not say. I clicked Delete.

2. **attributes-after-delete.** Clearance is gone from the table. A notice reads "Mission rooms still uses Clearance / Clearance deleted. 1 membership policy still uses it." with a View flagged policy button. I found the next step without hunting, and the button took me to the policy editor. The notice is blue and informational. For an access rule that points at nothing, I read blue as "FYI", not "act now". The policy editor uses amber for the same fact.

3. **policy-list-deleted-attribute.** Mission rooms carries an amber tag, "Uses a deleted attribute". Standup has none. I can scan the list and tell which policy is stale. The tag says what is wrong but not which attribute. That is fine for two rows. With forty policies I would open each one to find out. Nothing in the list takes me to the policy. In the prototype I used the scene switcher to reach the detail.

4. **policy-detail-deleted-attribute.** A warning at the top of the rules panel: "A rule still uses a deleted attribute / Clearance no longer exists. Edit or remove the marked rule." The Clearance row has an amber "Deleted attribute" tag beside the Attribute field. Department has no tag. The warning names the attribute and the marked row is easy to pick out. I chose **Remove row** on the Clearance row. The row disappeared, the warning disappeared, and one rule remains: Department is Operations. No confirmation appeared, and nothing said what changed. I stopped there. I have what I need: the stale rule is found and I know the two ways out, edit it or remove it.

5. **attributes-delete-error.** A red notice: "Could not delete Clearance / Clearance is still in the list. Open its actions and choose Delete attribute to try again." Clearance is still in the table. Plain and truthful. It tells me the attribute is intact and how to retry. It does not say why the delete failed. It does not say whether any policy was touched. I would assume nothing changed, but the screen does not confirm it.

Result: I could see that Mission rooms uses a deleted attribute, from three places, and I could act on it. The next step is clear: open the policy, then edit or remove the marked row. Completed. Nothing stopped the task, so no blocker.

## Friction

These are objections from a security-first reader. None blocks the task.

1. **The Remove row on the stale rule changes who gets in, and the screen is silent.** The policy ANDs its rules, so deleting the Clearance row leaves only Department is Operations. Anyone with that department could now qualify for Mission brief, Field reports and Europe desk. The warning says "Edit or remove the marked rule" as if both choices were equally safe. Remove has no confirmation, no note that access widens, and no undo. Save is the only commit, but nothing on the Remove action or beside it says "this admits more people". "Security is non-negotiable. Taking a clearance check out of a mission room, and no one tells me?" This is the most serious finding.
2. **The screens do not say what the policy does today.** The frame lists what the server does at evaluation time, once the attribute is gone, as not established. The prototype leaves it unsaid in the modal, the notice and the warning. My first question is whether those channels are open, locked or unchanged right now. Whatever the true answer is, the warning should state it, or say plainly that it is unknown.
3. **Severity is uneven.** After delete: blue info notice. Policy list and detail: amber warning. Same fact, two weights. The first screen an admin sees after the delete is the quietest one.
4. **The list tag does not name the attribute, and the row has no link.** Fine for two policies. At scale, finding which policy uses which deleted attribute needs the detail page every time. The prototype does not show a way from the list row to the detail, only the "View flagged policy" button on the delete notice.
5. **The stale Attribute field reads like a placeholder.** The Clearance label is the select's placeholder, so it is grey and looks like an unfilled field. The amber tag does the real work. Without the tag I might read the row as "not set", not as "set to something that no longer exists".
6. **"Remove row" is the same label on every row.** The tooltip and the accessible name are both "Remove row". A screen-reader user or a keyboard user cannot tell which rule they are removing. Rules are numbered in the other labels (for example "Attribute for rule 1"), so the delete control is the odd one out.
7. **No result after Save, and Save is never held back.** Save is enabled with the stale rule in place. Saving a policy that still names a deleted attribute is allowed and nothing is said, which is consistent with the frame's "leave the saved expression in place". There is also no saved or error state in the prototype, so I cannot tell whether the policy is now clean.
8. **Delete error gives no reason and no policy status.** See scene 5.
9. **After the flow, nothing records who deleted it or when.** I would want that in a log. This is outside the ticket, so it is a note and not a defect.

Short form, in his voice: "I found it. Three places. Good. Now tell me what it did to access, and don't let me widen it by accident."

## persona.sam-mitchell.md

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
