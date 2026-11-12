# Codovate collaboration and private data

Open **Teams → My Teams** after signing in. The expanded model and history contracts are documented in [Teams data model](TEAMS_DATA_MODEL.md). Earlier recruiting boards and private workspaces remain accessible with their original records. The sections below describe the retained original collaboration workflow.

## Current phase-one interface

The four primary views are My Teams, Connections, Find Teammates and Suggested for You. My Teams offers Create team and a directly accessible Join team directory. Membership changes remain transactional; the leader approves join requests, team capacity is checked again at approval, and each change records immutable history. Member and mentor roles do not grant leader or platform-admin permissions. Pending requests, full teams and missing discovery consent disable join actions.

Discovery uses centered student cards and explicit opt-in profile projections. Photo, role, course, college, year, city, achievements, seeking preferences and passions are published only after separate expanded-detail consent. Private phone/email/résumé never enter the directory. Long tag lists show three values initially with an accessible expand control. Filters and actual weighted match scores apply to loaded profiles; they are not global search or compatibility guarantees.

Accepted connections are shown under Connected students. The current phase-one UI does not open direct or new-team chats. Active chats displays the under-development notice; its 24h Limit badge is explicitly marked planned because expiry is not enforced. Existing conversation records and rules are preserved for earlier private workspaces. No presence, typing indicators, notifications or fabricated online status are added.


## Discovery and consent

Existing/imported accounts are not automatically made public. A student selects **Make my profile discoverable** to publish a separate document containing only their UID, full name, confirmed skills and update timestamp. Email, mobile, résumé and private notes are never in that projection. With separate expanded-detail consent, the optional discovery card can include education, location, desired role and self-reported achievements/interests. Students can hide it at any time. Profile saves update an existing projection and private profile in one transaction, preserving opt-out during concurrent edits. Branch-derived skill suggestions are not presented as confirmed experience. Skill labels are single-line strings of 1–60 characters, with at most 20 unique labels. Boundary and mixed-type tests enforce this contract without exceeding Firestore rule expression limits.

Discovery is available only to signed-in accounts. Search applies to loaded profiles; 48 profiles load initially and another 48 can be loaded at a time, up to 1,968. Member-name lookups used in conversations read only the discovery projection. A hidden profile shows a generic member label; past chat messages retain the name the sender chose when sending.

## Connections and chat

Send a connection request. Only the recipient can accept or decline it. Pending invitations do not permit messaging. Acceptance opens one direct conversation for that connection. Either party can block; a blocked or withdrawn connection loses direct-chat access, including history. Only the person who blocked can unblock. Unblocking requires a new request and acceptance before chat resumes. Retried requests reuse the same connection record.

Messages are plain text, up to 1,500 characters, with immutable sender UID, sender name and server timestamp. No private contact fields are automatically copied. Members can voluntarily type contact details; the composer makes this explicit. Messages are not end-to-end encrypted; Firestore access rules enforce membership. Administrators do not automatically get private conversation access.

The most recent 50 messages are streamed live; older messages load in 50-message pages. Message retries keep a generated message ID and use a transaction to avoid duplicate sends. Listener errors clear message state; listeners unsubscribe on close/logout. Messages are retained; this release does not offer message editing, file uploads, calls, typing indicators, push notifications or account-deletion data cleanup.

## Project groups

A project group starts with its owner and supports up to 12 members. The owner invites discoverable members; the recipient must accept. Invitation acceptance and membership update commit atomically. Pending or cancelled invitations cannot read group messages. The owner can cancel pending invitations, remove members and archive a group. Other members can leave; leaving/removal immediately removes chat access. Archived groups keep readable history for remaining members and reject new messages. Existing recruiting-team join approvals do not automatically grant chat access: create a group and invite those teammates.

Groups, connection lists and invitation lists are bounded to 100 documents per subscription. Discovery/invite selection has load-more controls. These are initial product limits; monitor Spark read/write quotas before increasing them. There is no server-side abuse/rate-limiting service in this no-billing release; Firebase Auth throttles account operations, and chat is restricted to accepted connections or group members.

## Storage map

| Firebase location | Stored data | Read access |
| --- | --- | --- |
| Authentication | Sign-in identity and password credentials managed by Firebase | Firebase Auth; no plaintext passwords in Firestore or source |
| `users/{uid}` | Private full profile, email/mobile and imported fields | Account owner only |
| `adminUsers/{uid}` | Administrator name/UID index | Owner and verified administrators |
| `memberProfiles/{uid}` | Opt-in name and confirmed skills; separately consented card details | Signed-in members |
| `connections/{fromId}_{toId}` | Two UIDs, request state, blocker and timestamps | The two participants |
| `conversations/{id}` | Direct-connection reference or group title, membership, owner/state | Participants; pending group invitees can preview group metadata |
| `conversations/{id}/messages/{id}` | Sender UID/name, text, server timestamp | Current group members or an accepted direct connection |
| `groupInvites/{groupId}_{uid}` | Invite owner/recipient IDs, state and timestamps | Owner and invited student |

All Firestore data remains in project **codovate-dev**. The UI never reads other students' `users` documents. Schema aliases `chatMessages` in the JSON contract describe the nested `messages` collection, not a public top-level collection.

## Password recovery

`/forgot-password` validates the registered email, requests Firebase's native one-time reset link, shows delivery errors without falsely claiming success, and applies a 60-second resend cooldown in the UI. Firebase provides the actual reset validation and server throttling; the UI cooldown is not a security boundary. Unknown addresses receive the same generic response. Enable Email/Password sign-in and authorize each deployment domain in Firebase Authentication. Check Authentication → Templates → Password reset if emails are not delivered. For Google accounts, use Continue with Google.

This release does **not** implement numeric email OTP or SMS OTP. Firebase's native password recovery is email-link based; production SMS requires Blaze billing. Numeric email OTP would need a trusted delivery/verification backend and email service. The existing no-billing preference is preserved; no OTP/password is stored in Firestore or browser code.

## Deploy and verify

```powershell
cd "D:\Downloads\Codovate-Fresh"
git pull origin main
npm run build
npx --yes firebase-tools@15.34.2 deploy --only "firestore:rules,firestore:indexes,hosting" --project codovate-dev --account ratikantpatil413@gmail.com
```

Wait for the conversations index to finish building. Sign in as two separate students in separate browser profiles. Opt both into discovery, send/accept a connection, send a message and verify it appears on the other account. Create a group, invite/accept, verify messages, then remove a member and verify access is denied. A third unrelated account must be denied access. Verify a recovery email with an account you control; production email delivery cannot be proven from local tests. No application records are seeded or imported by deployment.

The recruiting board streams its entire loaded prefix (24 records initially, with live load-more). Empty cached results are not treated as confirmed empty database results; a timed-out read shows a retryable error. Group/member feeds distinguish missing indexes and denied rules from a genuine empty collection.
