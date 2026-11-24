# Persona

One sample is `rounds/<n>/persona.<persona>.md`. Findings are synthetic.

persona: jake-reynolds
completed: true
blocker: false

## Attempt

Synthetic finding. A role-played profile from the FY26 catalog (Lt. Col. Jake Reynolds, MissionOps, security-first, short on patience). It is not customer evidence, and the source names no user for this ticket.

Task: tell that a membership policy uses a deleted attribute, see which policy, and know what to do next. Walked the five scenes in the order given.

1. `attributes-delete-confirm`: Reads the modal. "Clearance applies to users. The Mission rooms membership policy still uses this attribute, and that policy will be flagged." He sees the policy name before he commits. Hmm, good. A warning before the delete is what he wants. Delete is the only red action, Cancel is next to it.
2. `attributes-after-delete`: Clearance is gone from the list. The page says nothing about the policy. He has to go find it. No link, no toast. He moves to Membership Policies on his own because the modal told him the name.
3. `policy-list-deleted-attribute`: "Mission rooms" carries an amber "Uses a deleted attribute" tag; "Standup" has none. He gets which policy in one glance, and it matches the modal. He opens Mission rooms.
4. `policy-detail-deleted-attribute`: Warning notice at the top of the rules panel, "A rule still uses a deleted attribute. Clearance no longer exists. Edit or remove the marked rule." The Clearance row has a "Deleted attribute" tag and a line "This rule still uses Clearance." Department is unmarked. He knows which attribute, which rule, and the next step (edit or remove the rule). Task done here.
5. `attributes-delete-error`: Failed delete. Red notice "Could not delete Clearance. Clearance is still in the list. Open its actions and choose Delete attribute to try again." He reads it as plain: the delete did not happen, retry. Distinct from the amber stale-policy state.

Outcome for this profile: he can see which policy uses the deleted attribute, which rule, and what to do next. The task is finished without outside help.

## Friction

- `policy-detail-deleted-attribute`: The notice says "Edit or remove the marked rule" but does not say what the policy does now. For him the first question is whether the stale Clearance rule still gates the channels, or whether access is open or denied. Nothing on the screen answers that. The frame leaves server evaluation as an open assumption, so the wording cannot answer it yet. He would stop and ask before he trusts the policy.
- `policy-detail-deleted-attribute`: The marked row still shows "Clearance" with a live-looking "is Top secret" value and the dropdown reads as a normal selected attribute. Only the small amber tag and a small caption line separate it. Under a fast read the tag is easy to miss next to the large attribute selector. The top notice carries most of the signal.
- `policy-detail-deleted-attribute`: "Edit or remove" has no remove control on the row. The only visible actions are the Select dropdowns and "Add attribute". He can change the attribute to another one but cannot see how to delete the rule. Next step is stated, but the route to it is not obvious.
- `attributes-after-delete`: Nothing tells him the delete had a consequence. No confirmation, no "1 policy now needs attention", no link to Mission rooms. He depends on remembering the modal text from `attributes-delete-confirm`. If another admin deleted the attribute, he would have no cue here.
- `policy-list-deleted-attribute`: The tag says a deleted attribute is used but not which one. With many policies he must open each flagged one to learn it is Clearance. The list also gives no count or filter for flagged policies.
- `attributes-delete-confirm`: "That policy will be flagged" says what the system will do, not what the admin should do afterwards. The modal does not offer a link to review the policy first, and it names only one policy. The count and plural case are not shown, so he cannot tell whether other policies would also be flagged.
- `attributes-delete-error`: The notice tells him to retry but not why it failed. Its wording also suggests the attribute is still in use elsewhere, which the scene does not confirm. Minor for this task, since it is the failure path.
