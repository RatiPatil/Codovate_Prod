# Mentor sessions: prepare, meet, apply

Codovate mentoring extends the existing administrator-operated session catalog. Its distinctive workflow connects a student's actual project or career question to a private preparation brief, a mentor takeaway, and a trackable action plan. It does not claim to be a self-service mentor marketplace. Real mentors sign in with an existing Codovate account and access only their assigned bookings.

## Student experience

1. Open **Mentor sessions** (`/mentoring`). Browse future published sessions, search loaded results, and filter by session focus. Six supported topics include project feedback, portfolio walkthroughs, team/hackathon guidance, interview practice, career direction, and résumé review.
2. Request a place with a specific question. The deterministic booking ID prevents repeat requests. A request is pending until an administrator confirms it.
3. Open **My bookings → Open workspace**. Save a single goal, context, and an optional HTTPS project, résumé, or portfolio link. The original form entries remain on a failed save.
4. Confirmed bookings expose the private meeting link and calendar download. Administrators coordinate availability directly with the mentor before confirming; booking is not automatic.
5. Follow the mentor takeaway and up to three concrete next steps. Checkboxes save transactionally. Live workspace updates reflect an administrator's new plan; stale checkboxes cannot mark a replacement step complete.
6. Once the administrator marks the session completed (after its end time), submit a private usefulness rating and reflection. Cancelled/declined bookings keep a read-only workspace.

The page contains no fabricated mentors, availability, ratings, booking totals, or paid-session claims. Catalogs may initially be empty: administrators must publish real sessions. No fictional profiles are used.

## Administrator operation

- **Admin → Mentor sessions:** create a real session with mentor name, topic, future date/time, description, duration and format. Start time is entered in the administrator's local timezone; dates display in each viewer's local timezone. Schedule and mentor are immutable; close an incorrect session and publish a replacement.
- **Admin → Mentor bookings:** review the question and **Preparation & action plan**, verify actual mentor availability, and confirm with an HTTPS meeting link for online sessions. Existing decision notifications remain atomic with the booking change.
- Open **Preparation & action plan** for a confirmed/completed booking to share a takeaway and one to three distinct next steps. An assigned mentor can also share the action plan from **Mentor sessions → Assigned sessions → Open workspace**. Publishing a replacement plan resets checkbox progress, with an explicit warning.
- After the actual end time, mark the booking completed; the student can then reflect. The reflection is private, not a public mentor rating.

## Database contract

Existing `mentorSessions` and `mentorBookings` retain their schema and ownership rules; only the session topic enum expands. New collection:

`mentorWorkspaces/{bookingId}`

| Field | Type and validation |
| --- | --- |
| bookingId | String, same ID as the existing parent booking |
| studentId | String, exactly the parent booking's owner |
| preparation | Map: goal ≤300 characters, context ≤1500, artifactUrl empty or HTTPS ≤500 |
| plan | Map: summary ≤1500; 0–3 unique nonempty action strings ≤180 each; summary and actions must be present together |
| completedActions | Unique indices into existing plan actions; no fabricated progress |
| rating / reflection | Integer 0–5 and text ≤1000; zero/empty means not submitted, otherwise both required |
| createdAt / updatedAt | Server timestamps; identity and creation time immutable |

The first authorized save creates the workspace. No migration, seed, student-record update, or new index is required. No phone, email, résumé contents, or full profile is copied into the workspace.

Only the parent booking owner, its administrator-assigned mentor account, and a verified custom-claim administrator can read a single workspace. Collection listing and deletion are denied. Students cannot write mentor plans; admins and mentors cannot overwrite preparation or student reflection. Feedback writes require a completed parent booking; cancelled/declined parent bookings deny all workspace writes. All updates are transactions and Firestore rules independently enforce identity, size limits, lifecycle and changed-field permissions. Invalid documents fail closed.

This is not an end-to-end encrypted service. Authorized Codovate administrators can read these notes; an external project URL retains the access settings of its host. Do not paste credentials or private access tokens.

## Release and checks

From the authenticated deployment checkout:

```powershell
git pull origin main
npm run deploy
```

The deployment script builds, deploys rules/indexes, then Hosting. Publish a genuine session through Admin and verify request → confirm → private workspace → plan → completion → reflection using separate accounts.

Automated checks: input/transaction tests, student/admin workspace rendering, existing mentoring lifecycle tests, strict JSON Schema tests, and `scripts/test-mentor-workspace-rules.mjs` against Firestore emulator port 8080. Production Firebase access is required for live verification; emulator success does not establish that rules were deployed.

Availability approval remains manual. This change does not add mentor self-registration/approval, payments, automatic slot/capacity allocation, in-app video, email/SMS reminders or public reviews. Existing bounded catalog/bookings lists retain cursor pagination and explicit Refresh; workspace contents subscribe live only while open.

## Real mentor assignment and private conversations

Admin session creation now supports mentor role, biography, up to six expertise tags, an expected takeaway, preparation guidance, and a **Mentor account UID**. New published sessions require complete mentor metadata. Existing records remain accessible in administration and booking history.

Before assigning an account, verify the real mentor has agreed to participate and has signed into Codovate. Copy their existing account UID from the admin student directory or Firebase Authentication; never use an invented UID, name or email as an authorization rule. Firestore requires the assigned UID to have an existing user profile. Assignment is fixed in the session and copied exactly into each booking by the booking transaction and checked again by rules. No global administrator role is granted.

**Mentor sessions → Assigned sessions** queries `mentorBookings` by `mentorUid == auth.uid`, with cursor pagination and the included `mentorUid / createdAt desc` index. It exposes no unassigned student bookings. Mentors can read their students' booking notes and workspaces, but cannot confirm bookings, change the session schedule, cancel a student's booking, or write a student's reflection. An admin must confirm after checking availability.

Once confirmed, **Open workspace → Open conversation** subscribes to private `mentorBookings/{bookingId}/messages/{messageId}` records. Students, the assigned mentor and authorized administrators can exchange plain text in real time. Each message has only `senderId`, server-validated `senderRole` (student/mentor/coordinator), `text` (1–2,000 characters, not blank) and a server `createdAt`. No phone, email or access token is copied. React renders messages as text; no message HTML is executed. Edits/deletes and role spoofing are denied.

Reads load the latest 50 messages, with an explicit Load earlier action up to the latest 200. Rules reject list queries above 200 records. Closing the conversation or leaving the page detaches its live listener. Message IDs remain stable across a failed-send retry; the transaction checks an existing message to avoid duplicates. An unconfirmed send retains the draft. Writes are allowed only while the parent booking is confirmed; pending/completed/cancelled/declined conversations have no composer and rules independently reject writes. Existing conversation history remains readable to authorized participants. This is not end-to-end encrypted, and there is no attachment upload, read-receipt, online-presence or email/push delivery claim.

Admins can use **Mentor bookings → Remove mentor access**. This only clears `mentorUid` on the parent booking; parent-based rules immediately remove the mentor's access to notes, conversation and workspace. It does not delete student records or message history, and admins can continue coordinating the booking. Replace an incorrectly assigned session rather than trying to reuse another person's identity. Revocation cannot erase information a former participant already saw.

Additional checks: `frontend/src/mentorChatData.test.js`, `MentorChat.test.jsx`, and `scripts/test-mentor-chat-rules.mjs`, including a genuine Firestore listener receiving a message across separate authenticated test contexts. No production accounts or production messages were created during development.

## Real mentor discovery replacement

The fictional demo dataset and its fallback rendering have been removed. Student discovery now queries published `mentoringVersion: 2` sessions only, with the included composite index, and displays only future sessions linked to a mentor UID. Existing legacy sessions/bookings remain in admin/history; they are not deleted or silently promoted as real available mentoring.

New admin sessions carry version 2. Publishing requires an existing mentor account UID, nonempty specialization, biography, expertise and expected outcome in addition to the existing schedule and session fields. Both input validation and Firestore rules enforce completeness. Admins must confirm the actual mentor's identity, consent, qualifications and available time before publication; account existence alone is not professional credential verification. Create a complete replacement for a legacy session rather than changing its immutable account or schedule.

The redesigned page includes a goal picker, topic/format/search filters, session details, preparation guidance and a direct booking request. My bookings and Assigned sessions retain private meeting links, live chat, action plans and post-session reflections. No fabricated reviews, mentors, prices or counts are used. It remains an administrator-operated service, without payments, self-service mentor onboarding or automatic appointment allocation. Real participating mentors must be supplied by Codovate; no identities or availability can be populated from fictional data.

No database import is required; deploy rules/indexes before publishing new real sessions.
