# Deleted attribute warnings

Tweak of System Console Attribute Management and Membership Policies. Desktop only.

Highlight a policy that uses a deleted attribute. Do not block the delete.

Scenes:

1. `attributes-delete-confirm` — Attribute Management. Delete confirm is open for Clearance. The body names the Mission rooms policy. Scope is visible before the irreversible action. The primary button confirms the delete. Cancel is tertiary. Do not claim who will gain or lose channel access.
2. `attributes-after-delete` — Clearance is gone. Other attributes remain, including a long name. No toast that only says deleted.
3. `policy-list-deleted-attribute` — Membership Policies. Mission rooms has a warning tag. Standup does not.
4. `policy-detail-deleted-attribute` — Edit Membership Policy for Mission rooms. A warning on the rules panel names Clearance and says the rule still uses it. That rule row is marked. A second rule uses an attribute that still exists and is not marked. Save is the only primary action. The warning does not say members gained or lost access.
5. `attributes-delete-error` — Delete of Clearance failed. The attribute is still listed. A danger notice says what happened and how to retry.
