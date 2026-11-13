# Mentor sessions: prepare, meet, apply

Codovate mentoring extends the existing administrator-operated session catalog. Its distinctive workflow connects a student's actual project or career question to a private preparation brief, a mentor takeaway, and a trackable action plan. It does not claim to be a self-service mentor marketplace.

## Student experience

1. Open **Mentor sessions** (`/mentoring`). Browse future published sessions, search loaded results, and filter by session focus. Six supported topics include project feedback, portfolio walkthroughs, team/hackathon guidance, interview practice, career direction, and résumé review.
2. Request a place with a specific question. The deterministic booking ID prevents repeat requests. A request is pending until an administrator confirms it.
3. Open **My bookings → Open workspace**. Save a single goal, context, and an optional HTTPS project, résumé, or portfolio link. The original form entries remain on a failed save.
4. Confirmed bookings expose the private meeting link and calendar download. Administrators coordinate availability directly with the mentor before confirming; booking is not automatic.
5. Follow the mentor takeaway and up to three concrete next steps. Checkboxes save transactionally. Live workspace updates reflect an administrator's new plan; stale checkboxes cannot mark a replacement step complete.
6. Once the administrator marks the session completed (after its end time), submit a private usefulness rating and reflection. Cancelled/declined bookings keep a read-only workspace.

The page contains no fabricated mentors, availability, ratings, booking totals, or paid-session claims. Catalogs may initially be empty: administrators must publish real sessions.

## Administrator operation

- **Admin → Mentor sessions:** create a real session with mentor name, topic, future date/time, description, duration and format. Start time is entered in the administrator's local timezone; dates display in each viewer's local timezone. Schedule and mentor are immutable; close an incorrect session and publish a replacement.
- **Admin → Mentor bookings:** review the question and **Preparation & action plan**, verify actual mentor availability, and confirm with an HTTPS meeting link for online sessions. Existing decision notifications remain atomic with the booking change.
- Open **Preparation & action plan** for a confirmed/completed booking to share a takeaway and one to three distinct next steps. The administrator records feedback on behalf of the mentor. Publishing a replacement plan resets checkbox progress, with an explicit warning.
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

Only the parent booking owner and a verified custom-claim administrator can read a single workspace. Collection listing and deletion are denied. Students cannot write mentor plans; admins cannot overwrite preparation or student reflection. Feedback writes require a completed parent booking; cancelled/declined parent bookings deny all workspace writes. All updates are transactions and Firestore rules independently enforce identity, size limits, lifecycle and changed-field permissions. Invalid documents fail closed.

This is not an end-to-end encrypted service. Authorized Codovate administrators can read these notes; an external project URL retains the access settings of its host. Do not paste credentials or private access tokens.

## Release and checks

From the authenticated deployment checkout:

```powershell
git pull origin main
npm run deploy
```

The deployment script builds, deploys rules/indexes, then Hosting. Publish a genuine session through Admin and verify request → confirm → private workspace → plan → completion → reflection using separate accounts.

Automated checks: input/transaction tests, student/admin workspace rendering, existing mentoring lifecycle tests, strict JSON Schema tests, and `scripts/test-mentor-workspace-rules.mjs` against Firestore emulator port 8080. Production Firebase access is required for live verification; emulator success does not establish that rules were deployed.

Availability approval remains manual. This change does not add mentor self-service accounts, payments, automatic slot/capacity allocation, in-app video, email/SMS reminders or public reviews. Existing bounded catalog/bookings lists retain cursor pagination and explicit Refresh; workspace contents subscribe live only while open.
