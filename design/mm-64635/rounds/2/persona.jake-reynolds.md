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
