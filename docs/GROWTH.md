# Mentoring and platform updates

This release adds `/mentoring` and `/updates`, their navigation/dashboard entry points, and admin tabs for sessions, bookings and announcements. The existing theme, layout and logo are preserved; new modules reuse the current controls and styling. There is no production seed or database deletion.

## Firestore contracts

| Collection | Fields and constraints | Access |
| --- | --- | --- |
| mentorSessions/{id} | title 120, mentorName 100, description 2000, topic enum, startsAt timestamp, durationMinutes integer 15–120, format Online/In person, location 180, status draft/published/closed, createdBy, createdAt, updatedAt | Public published records; custom-claim admin creates/updates |
| mentorBookings/{studentId}_{sessionId} | studentId, studentName 100, sessionId, sessionTitle, mentorName, startsAt, durationMinutes, format, location, note 1–1000, status, meetingUrl empty/HTTPS 500, createdAt, updatedAt | Student owner or admin only |
| announcements/{id} | title 120, body 3000, category Platform news/Opportunities/Learning/Community, status draft/published, link empty/HTTPS 500, createdBy, createdAt, updatedAt | Public published records; admin creates/edits/unpublishes |

Topics: Interview practice, Career direction, Resume review, Project feedback. Exact types/required fields and fixtures are in `database/firestore.schema.json` and `database/examples.json`. Fixtures are documentation only. Server timestamps and security rules govern browser writes.

## Booking integrity

A transaction checks the deterministic booking ID and authoritative published future session. Rules independently verify the owner/profile name and immutable session snapshot. One request per student per session, including previously cancelled requests. Session schedules are immutable after creation; close a session and create a replacement to change its time. No capacity or availability guarantee is shown.

Admin transitions: pending → confirmed / declined / cancelled; confirmed → completed / cancelled. Terminal decisions cannot reopen. Students may cancel pending/confirmed requests. Online confirmation requires an HTTPS meeting link. Confirmation is blocked after session start; completion requires the session to have ended. Meeting links and notes stay private. The calendar download is available on confirmed bookings; it does not send invitations or emails. Published sessions remain discoverable after their start but cannot accept new requests.

Admins operate mentoring on behalf of mentors; there is no separate mentor login or automated matching. Admin authorization uses the existing verified custom claim, never an email match or browser-written role.

## Queries

Public sessions and announcements: `status == published`, `createdAt desc`. Own bookings: `studentId == auth.uid`, `createdAt desc`. Admin lists: `createdAt desc`. New composite indexes are included in `firestore.indexes.json`. All lists request 25 records and display 24 with cursor-based Load more. Search/categories filter loaded records; Refresh fetches changes. No fabricated total counts or bookings are shown.

## Résumés without paid Storage

My profile accepts an HTTPS résumé link, saved only in the private user document and copied into private applications. Profile completeness recognizes a PDF path or link. Applying requires one of them and validates it against the saved profile. Existing PDF résumés remain supported. Users must grant reviewers access at their file provider. If both exist, the interface opens the link first. Clear a selected PDF before saving a link if Storage is unavailable.

## Release from your authenticated workstation

No live deployment or DNS change was made as part of this release. Build with your ignored `frontend/.env.local` enabled for the intended project. Before publishing the updated frontend, deploy its Firestore policies/indexes and wait for indexes to finish building:

```powershell
npx --yes firebase-tools@15.34.2 deploy --only "firestore:rules,firestore:indexes" --project codovate-dev --account ratikantpatil413@gmail.com
npm run build
npx --yes firebase-tools@15.34.2 deploy --only hosting --project codovate-dev --account ratikantpatil413@gmail.com
```

Storage deployment, billing upgrades, VPS changes and domain/DNS configuration are not required for the résumé-link workflow. After release, verify real student registration/profile saving, link-based application, admin publication, mentoring request/confirmation/cancellation and private meeting-link access with separate accounts. Emulator checks do not establish live provider/account readiness.
