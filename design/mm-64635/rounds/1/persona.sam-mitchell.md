# Persona

One sample is `rounds/<n>/persona.<persona>.md`. Findings are synthetic.

persona: sam-mitchell
completed: true
blocker: false

## Attempt

Synthetic finding. A model role-played the Sam Mitchell profile (MissionOps, DoD cyber compliance officer, documentation-first). It is not customer evidence and no real person said any of this.

Primary task: tell that a membership policy uses a deleted attribute, which policy it is, and what to do next. Walked from the screenshots in `design/mm-64635/screenshots/` and the scene code.

- `attributes-delete-confirm`: Sam opens Delete Clearance. The modal says "The Mission rooms membership policy still uses this attribute, and that policy will be flagged." It names the affected policy before the delete. It makes no claim that anyone gains or loses access. Sam reads that as honest, since the server behavior is not established, but it gives him nothing to record. Delete is the only red action and Cancel is available.
- `attributes-after-delete`: Clearance is gone from the list. Nothing here points to the policy that still uses it. Sam has to go to Membership Policies himself.
- `policy-list-deleted-attribute`: Mission rooms carries an amber "Uses a deleted attribute" tag. Standup has none. Sam finds the policy in one glance.
- `policy-detail-deleted-attribute`: the notice reads "A rule still uses a deleted attribute. Clearance no longer exists. Edit or remove the marked rule." The rule row has a "Deleted attribute" tag and the line "This rule still uses Clearance." The Department rule is not marked. Sam can see which rule, which attribute, and the next step (edit or remove the rule). He finishes the task.
- `attributes-delete-error`: a danger banner says "Could not delete Clearance" and the row stays. Sam can tell the delete did not happen and that the rule is intact.

Result: Sam can see which policy uses the deleted attribute and what to do next, so `completed: true`. No step stops him, so `blocker: false`. He would not approve this as a compliance control yet. These are gaps in evidence, not in the task.

## Friction

- `policy-detail-deleted-attribute`: the notice says the attribute "no longer exists" and says to edit or remove the rule. It does not say what the rule does now. Sam asks whether Mission rooms admits more people, fewer people, or the same people than before the delete. The prototype makes no such claim, which is correct while server behavior is unconfirmed (assumption 6 in the brief). But an access-control warning with no stated access effect leaves him unable to judge urgency or write the finding. The warning needs a stated "effect unknown, verify" or the confirmed behavior.
- `policy-detail-deleted-attribute`: "Edit or remove the marked rule" gives two options and no guidance on which is safe. Removing a rule from an AND policy could widen access. Sam wants that consequence stated before he removes anything.
- `policy-detail-deleted-attribute`: the "Deleted attribute" tag is small amber text. The same amber is used for the warning notice and the inline line, so the cue is repeated three times. That is redundant, not wrong. Nothing shows when the attribute was deleted or by whom. Sam wants a record for the audit trail and sees none in this scene.
- `attributes-delete-confirm`: the modal names one policy. It does not say how many policies use the attribute or that it checked all of them. With one policy named, Sam cannot tell "only one" from "first one found". It also lists no channels. The policy list shows Mission rooms applies to 3 channels, and that count is not in the confirm.
- `attributes-delete-confirm`: the modal says the policy "will be flagged". That does not tell Sam the policy keeps working, keeps denying, or is disabled. Nobody asked for a block on delete here, but the wording could be read as "the policy is handled".
- `attributes-after-delete`: no pointer from the attribute list to the flagged policy and no success message. The delete and the warning sit on two pages. If Sam did not read the confirm, he would not learn a policy is now stale until he opened the policy list.
- `attributes-delete-error`: the banner says "Clearance is still in the list. Open its actions and choose Delete attribute to try again." It gives no cause. Sam cannot tell a transient failure from a policy block, and cannot tell whether the policy reference is untouched. The retry advice is clear, the diagnosis is absent.
- `policy-list-deleted-attribute`: the tag says "Uses a deleted attribute" and does not name which one. With several flagged policies, Sam has to open each to find out.
