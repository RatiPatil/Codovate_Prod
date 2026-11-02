# Codovate administration and notifications

The existing theme, layout and logo are unchanged. `/admin` now opens a control centre with module shortcuts. Its URL tabs can be bookmarked. Available modules: opportunities/publication, applications and résumé review, student directory, learning resources, project/team moderation, mentor sessions/bookings, platform updates and private notifications. These are operational modules; billing, employer verification, email campaigns and authentication-account deletion are not implemented.

## One login and verified roles

Use the regular `/login` page. Firebase verifies email/password or Google sign-in; an `admin: true` custom claim opens administration. Non-admin users cannot access the admin route or admin-only Firestore writes. No public email or browser-written profile field grants authority.

For a real administrator, register/sign in first and copy that account's UID from Firebase Authentication. On your trusted workstation with locally configured Firebase Admin application-default credentials, run:

```powershell
npm --prefix scripts ci
node scripts/set-admin.mjs codovate-dev YOUR_AUTH_UID grant
```

Sign out and back in. Use `revoke` instead of `grant` to remove access. Firebase CLI browser login is not itself Firebase Admin application-default credentials. If using a service-account JSON, keep it outside the checkout and point `GOOGLE_APPLICATION_CREDENTIALS` to its local path. Never upload it or commit it. This change does not create a live administrator or set a production password.

There is deliberately no production hardcoded password. Fixed credentials are provided only for local emulator testing:

- Email: `admin@codovate.test`
- Password: `Codovate-Local-Only-2026!`

Start the Auth and Firestore emulators for `demo-codovate`, then in another PowerShell terminal:

```powershell
$env:FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"
$env:FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
node scripts/seed-demo-admin.mjs
```

The script refuses other/missing emulator addresses and always uses `demo-codovate`. Configure the local frontend for the same demo project with `VITE_FIREBASE_ENABLED=true`, `VITE_USE_EMULATORS=true` and the existing emulator setup instructions. Do not deploy emulator settings. Fixed demo credentials do not work on the live Firebase project.

Fingerprint/passkey login is not added. This static Firebase client currently has no WebAuthn credential registration/challenge-verification service; displaying a fingerprint button without that verification would not authenticate an administrator. Existing Google and email/password sign-in remain available.

## Notifications

`/notifications` is an authenticated private inbox. The navigation uses an owner-filtered, bounded live listener (`studentId == uid`, `read == false`, `limit(1)`) to signal new/unread messages. Inbox/history uses 24-record cursor pages ordered by creation time, explicit Refresh and Load more. The listener signals unread presence, not a fabricated unread count. A listener error prompts inbox refresh. Account changes hide the old user's unread state immediately.

Private student profiles are no longer listed in the admin directory. Enter a student ID shared by the student in the notification composer. Admins enter a title, body and optional supported internal destination. Security rules verify the recipient profile exists without allowing the sender to read it. An unchanged draft retries the same document ID to avoid duplicate delivery after an ambiguous response. Changing the draft creates a new request. Sent content cannot be edited or deleted by browser clients.

Application status changes and admin mentoring decisions write their notification in the same Firestore transaction as the decision. Both commit or neither does. Repeating an unchanged application status sends nothing. Student cancellations do not generate admin messages. Public broadcasts use Platform updates, without expensive per-student fanout. Notifications are in-app only, not email, SMS or operating-system push.

### Document contract

`notifications/{autoId}` fields: `studentId` string 1–128; `title` 1–120; `body` 1–2000; `link` enum empty, `/applications`, `/profile`, `/mentoring`, `/planner`, `/updates`, `/explore`; `read` boolean; `createdBy` admin UID; `createdAt` and `updatedAt` server timestamps. Only a custom-claim admin can create, with an existing recipient, own sender UID and initial `read=false`. Owner/admin can read; only the recipient can change `read` and `updatedAt`. No deletion. Other students and anonymous callers are denied.

The executable schema/fixtures now cover thirteen collections. Indexes include owner+creation order and owner+read-state. Security rules are authoritative; fixtures are never seeded into production.

## Release and acceptance

Deploy the new Firestore rules/indexes before the frontend; follow `docs/GROWTH.md`. No domain, VPS, billing or live hosting changes are included. Test with separate real admin/student accounts after deployment: denied student admin access; direct private delivery; unread marker; mark read/unread; application decision notification; mentoring confirmation notification; cross-account denial. Production administrators must be provisioned separately using trusted credentials.

## Student privacy update

Admin browser clients can no longer read/list the users collection, including contact information. The former student directory is replaced by a privacy notice. Trusted Firebase Console/Admin SDK operators retain privileged backend access; frontend role claims do not bypass profile privacy. Deploy the updated rules before importing student records.

### Placement preparation

Use the Placement preparation tab to choose one of 24 sections, open nested folders, and create/edit draft or published articles. Content renders as escaped text instead of PDF embeds. See [PLACEMENT_PREPARATION.md](PLACEMENT_PREPARATION.md) for hierarchy, visibility and database details.

Aptitude source folders can be imported as drafts for editorial review. The editor supports reading time, source notes, level and up to six practice checkpoints, each with four options, an answer and an explanation. Student private notes and progress remain unavailable to admin browser clients.

### Dedicated administration layout

`/admin` now has a separate Master admin header and grouped administrator sidebar. Student workspace links, public opportunity navigation and the public footer are not rendered on the verified administrator route. The same login and verified admin claim still protect access. URL-based module links retain browser back/forward support; unknown module IDs fall back to Overview. Small screens use a collapsible admin navigation menu.

User accounts and System settings are dedicated modules. The no-billing choice is preserved: account listing, enable/disable and provider settings open the project’s Firebase Console; granting/revoking admin access generates a reviewed command for the existing trusted operator tool. Copying does not execute anything, unsafe UIDs are rejected and the current administrator cannot generate a self-access-change command. The panel does not claim these are browser-side Auth mutations or display fake user totals. Console operations require Google IAM project access in addition to the application admin role.

System settings show nonsecret project/configuration status and offer a bounded live Firestore read check. Student contact information and private learning notes remain protected by existing owner-only rules. No rules, claims, database documents, billing plans or credentials are changed by this layout update. Firebase Functions account-management APIs would require a billing-enabled trusted backend and are intentionally not enabled.
