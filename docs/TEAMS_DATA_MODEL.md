# Teams: data model, history and compatibility

The Teams landing page has four main views: **My Teams**, **Connections**, **Find Teammates**, and **Suggested for You**. The existing application palette, fonts, logo and shared controls are retained. Real direct/group chat remains available; no fake 24-hour expiry, online status, typing indicator or percentage match is displayed.

## Canonical membership and atomic revisions

`projectTeams/{teamId}` is the canonical record for a new team. It contains ownerId, title, description, requiredSkills, capacity (2–12), recruitment (open/recruiting/closed), lifecycle (active/archived), members, roles, version, historyId, createdAt and updatedAt. Roles are keyed by UID and exactly match the member list; exactly one leader is the immutable owner. The owner may assign Member or Mentor to existing members. Mentor is a team role, not a professional verification badge or platform administrator permission.

A bounded UID array and role map are deliberate: small student teams do not need a second independently editable `teamMembers` source. Every membership, role, metadata, capacity or lifecycle change increments version by one and writes all of the following in the same Firestore transaction/batch:

1. The canonical team record.
2. A new `projectTeams/{teamId}/history/{historyId}` document containing actorId, server timestamp and the complete post-change team state.
3. A matching `teamListings/{teamId}` discovery projection containing safe team metadata and a member count, without member identities or roles.

Initial creation also writes `conversations/{teamId}` with `{kind: "team", teamId, createdAt}`. This chat reference does not duplicate membership. Message permissions resolve membership directly from the canonical team, so removal/leave immediately revokes access.

Rules require the next version, a fresh history pointer, matching snapshot, request-time timestamps and a consistent listing. Application clients, including leaders, cannot rewrite or delete old revisions, orphan a history entry, silently alter membership, or edit a public member count independently. Privileged Firebase project operators still retain their normal administrative powers; this is not a tamper-proof ledger against project owners.

## Joining and capacity

`projectTeamInvites/{teamId}_{studentId}` records leader-issued invitations. Students explicitly accept or decline; leaders may revoke pending invitations. `projectTeamRequests/{teamId}_{studentId}` records a student's note and join request. The leader accepts or declines; a pending applicant may withdraw. The requester must have an opted-in name/skill card. These records retain their original createdAt, current state and updatedAt. Reissuing an invitation/request reuses its identity; the request documents are not a full transition-by-transition audit log.

Acceptance and canonical membership update occur atomically with the new team revision and matching listing. The role for a new member is Member. An invitation/request alone never grants chat access. Concurrent accepts retry against the current team state; capacity cannot be exceeded or lowered beneath current membership. Full is derived from member count and capacity, not stored as an independent flag. Closed recruitment stops joins; archiving also stops new messages. Current members keep read access to retained chat and team history. Leaders can reopen a team; other members can leave archived teams.

## Data history and existing records

No existing teams, introductions, messages, accounts or profiles are copied, deleted, renamed or seeded by this release. Earlier `teams` and `teamRequests` remain in their original collections. Earlier private workspaces remain `conversations` documents of kind `group`, with their original message subcollections and IDs. My Teams shows earlier owned recruiting teams and joined private workspaces and links to their original workflows. Earlier accepted recruiting introductions are labelled as introductions; they are not fabricated into confirmed workspace memberships.

Append-only revisions begin when a new canonical team is created. Earlier workspaces do not receive invented historical events. Their existing message history is retained. Historical team snapshots store stable UIDs and roles, not private student records. Display names resolve from current opted-in cards, so an old revision does not claim to preserve a name as it appeared at that time.

## Discovery, privacy and recommendation contracts

`memberProfiles/{uid}` keeps the existing required name and confirmed skills. Optional `details` fields are desiredRole, domain, experience, college, year, location, photoUrl, achievements, seeking and passions. Students explicitly choose whether to publish these extras. No imported data is bulk-published, and private profile fields are not automatically copied. Achievements and experience are self-reported. Photo links are restricted to Google/GitHub avatar hosts, loaded without a referrer; no paid Storage upload service is introduced.

`discoveryPreferences/{uid}` stores the student's optional details and shareDetails choice privately. Saving while sharing is off keeps the private draft and removes public extra fields atomically. Hiding the entire discovery card preserves these private preferences; republishing restores the fields the student previously chose to share. Email, mobile, résumé, account status and private learning notes are never copied into discovery.

`discoveryDismissals/{uid}/members/{peerId}` stores private dismissed/restored choices with original creation and update timestamps. No other student can enumerate these preferences. Dismissal does not change another student's account or profile.

Filters combine name/role search, skill, domain and experience level. Suggested profiles use explicit reasons: unique shared skills, same domain, shared interests/goals, same college/year and similar experience. Missing fields do not create a match and skills/interests are not guessed. Ranking is a deterministic explanation of supplied fields, not a verified suitability score. Filtering/ranking applies to loaded opted-in profiles; 48 load initially with explicit load-more controls up to 1,968. Existing blocked connections are excluded from the discovery view.

## Read/access map

| Location | Data | Read access |
| --- | --- | --- |
| `users/{uid}` | Private student profile and imported/contact fields | Owner |
| `memberProfiles/{uid}` | Name, confirmed skills, chosen optional extras | Signed-in students |
| `discoveryPreferences/{uid}` | Private discovery draft and sharing choice | Owner |
| `discoveryDismissals/{uid}/members/{peerId}` | Private dismissed/restored choice | Owner |
| `projectTeams/{teamId}` | Canonical metadata, UID membership and roles | Current members; pending invitees may preview |
| `projectTeams/{teamId}/history/{historyId}` | Append-only revision snapshots and actor UID | Current members |
| `teamListings/{teamId}` | Safe discovery projection; no member identities | Signed-in students while active; owner after archive |
| `projectTeamInvites/{teamId}_{uid}` | Invitation identity and current state | Leader and invited student |
| `projectTeamRequests/{teamId}_{uid}` | Join note and current state | Leader and applicant |
| `conversations/{teamId}/messages/{id}` | Sender UID/name, message, server timestamp | Current team members |

Direct connections and earlier group chats keep their existing access contracts. Administrators do not automatically receive browser access to private chats or preferences. All application data remains in Firebase project `codovate-dev`; no new database, server or billing plan is introduced.

## Schemas, indexes and operational limits

Executable contracts and synthetic examples are in `database/firestore.schema.json` and `database/examples.json`. Nested history records use schema alias `projectTeamHistory`; this is not a public top-level collection. The schema validator also checks role/member agreement, leader identity, capacity, archive/recruitment consistency and document identity. Firestore rules are authoritative for atomic cross-document consistency and permissions.

Deploy the new leader/team invitation and request indexes. Collection listeners are bounded (100 team/request records per subscription; discovery has load-more). History loads 20 recent revisions with explicit older-history loading. Unopened history/discovery views avoid unnecessary subscriptions. Reads and writes consume Spark quotas. There is no automated retention/deletion, paid backup service or new push/presence service in this release. Preserve history by archiving rather than deleting teams. Optional discovery drafts and request records store current state; only canonical team revisions and chat messages are append-only histories.

## Deployment and live verification

```powershell
cd "D:\Downloads\Codovate-Fresh"
git pull origin main
npm run build
npx --yes firebase-tools@15.34.2 deploy --only "firestore:rules,firestore:indexes,hosting" --project codovate-dev --account ratikantpatil413@gmail.com
```

Wait for indexes to finish building. Use two controlled student accounts: opt into discovery, create a team, invite/accept or request/approve, exchange a message, change a role and inspect the next history revision. Remove a member and verify chat/history access is denied. Archive and confirm new messages/joins fail, while remaining members retain history. Check that earlier workspaces remain accessible and no imported profiles became public automatically. Production reads, writes and hosting deployment require the operator's Firebase credentials and were not performed from the development environment.
