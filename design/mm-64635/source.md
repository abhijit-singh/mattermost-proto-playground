key: MM-64635
url: https://mattermost.atlassian.net/browse/MM-64635
type: Story
status: Open
priority: Low
fix version: Queued
summary: Add warnings and indicators if a policy is using deleted attributes
reporter: Abhijit Singh
assignee: Abhijit Singh
creator: Abhijit Singh
labels: needs-ux
parent: MM-61756 (Attribute Based Channel Access, Epic, status GA release)
issuelinks: none
comments: none
Figma: Attribute Based Channel Access - System Console Layout - sections - https://www.figma.com/file/UCCKYrwLe2Bs2xYqMAEZCI?node-id=6715%3A225645

description:
If I create an attribute, then create a policy that uses that attribute, then go back and delete the attribute:

Currently the attribute is deleted from the attributes page (without feedback), but no change or indication happens on the policy that is based on that now-deleted.

Expected: Highlight it in the policy if it is using a deleted attribute

Relevant discussion in Mattermost - https://hub.mattermost.com/pde/pl/wc3b4i9u1pgh9qdpig46x7i8xo

parent epic MM-61756 (context, not a customer quote):
Problem: Many organizations, particularly governments, have strict information security rules that require users to have specific clearance to access certain types of information.
Justification: This is a feature that has been requested by our customers to expand our advanced user access controls and will be part of our new Premium SKU.
Solution: Mattermost Premium (Advanced Information Control feature set) customers will be able to define very fine-grained access rules for users to access sensitive channels. The attribute-based policies will be based on the user properties available through User Custom Properties.
Figma: https://www.figma.com/design/UCCKYrwLe2Bs2xYqMAEZCI/Attribute-Based-Channel-Access?node-id=5299-272143
UX Specs: https://mattermost.atlassian.net/wiki/x/DQAQxg
Project plan: https://mattermost.atlassian.net/wiki/spaces/ICT/pages/3418423314/DRAFT+Project+Plan+Attribute+Based+Channel+Access
epic labels: FY26, Q1-2025, Q2-2025, advanced-info-control
epic comments: none
