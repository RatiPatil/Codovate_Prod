# Codovate

A student opportunity platform for Tier 2 and Tier 3 colleges, with the original Codovate logo and a new responsive interface. Discover internships, fresher jobs, competitions and hackathons; manage a private profile, résumé, bookmarks and applications.

## Run locally

Requires Node.js **22.12+** (Node 24 recommended).

```bash
npm run setup
npm run dev
```

Open **http://localhost:5173**. No backend server is needed. Without configuration the app runs a clearly labelled, read-only preview with sample listings. Sign-in, bookmarks, uploads and applications are disabled or require connection. Preview records are never inserted into Firebase. With configuration, the app reads ONLY real Firestore records; an empty project shows an empty opportunity board.

```bash
npm test
npm run build
npm run preview
```

## Connect the selected Firebase project

The selected project is **codovate-dev**. From this repository folder, run:

```bash
npm run firebase:setup
```

Sign in to the Google account that owns the project when the Firebase CLI opens. The command downloads this exact web app's configuration, writes ignored `frontend/.env.local`, and deploys Firestore rules/indexes and Storage rules. It does not import sample data or deploy the website. Restart `npm run dev`, open **http://localhost:5173**, and use `/setup` to test a live Firestore server read.

Firebase Console must have Google and Email/Password sign-in enabled, localhost authorized, Cloud Firestore created, and the configured Storage bucket provisioned. If a service is missing or permission is denied, setup reports the error; fix the service/account issue and rerun. `npm run firebase:configure` performs only login and local configuration without deploying rules.

For current live-check results, setup behavior, and remaining cloud requirements, see [docs/FIREBASE_CONNECTION.md](docs/FIREBASE_CONNECTION.md). A local configuration or successful build does **not** establish that cloud rules, Storage or login providers are ready.

The web API key is not committed. Never commit `.env.local` or a service-account key. To use another Firebase project later, explicitly change `config/firebase.project.json` and `.firebaserc`, or configure the six values in `frontend/.env.example` manually.

## Administrator setup

Students cannot select or promote their role. Administration uses the Firebase Auth **`admin: true` custom claim**, assigned by a trusted operator.

1. Register/sign in with the intended administrator account and copy its UID from Firebase Authentication.
2. Install the operator tool dependencies: `npm --prefix scripts install`.
3. Locally set `GOOGLE_APPLICATION_CREDENTIALS` to the path of a service-account JSON for the **new** project. Keep this file outside the repository. The service account needs permission to manage Firebase Auth users.
4. Run:

```bash
node scripts/set-admin.mjs YOUR_NEW_PROJECT_ID USER_UID grant
# To remove the role later:
node scripts/set-admin.mjs YOUR_NEW_PROJECT_ID USER_UID revoke
```

5. Sign out and sign in again, then open `/admin`. Publish an opportunity. Administrators can see applications and update their status. Profiles display the current role. Students cannot access administration even by typing its URL.

## Database and access design

See [docs/DATABASE.md](docs/DATABASE.md) for the complete collection schema, ownership, constraints and query indexes. Firebase Auth is the only identity provider, Cloud Firestore is the only database, and optional Firebase Storage holds private PDF résumés; students can instead provide a private HTTPS résumé link. No SQL, MongoDB, custom JWT, API server or browser database is used.

## Local emulator testing (optional)

Use a demo project ID so tests cannot touch your real data:

```bash
firebase emulators:start --project demo-codovate
```

In `frontend/.env.local`, set `VITE_USE_EMULATORS=true` plus web config for a local demo project (`projectId=demo-codovate`; a nonempty fake API key and matching demo authDomain/storageBucket are sufficient for emulators). Restart Vite. Emulator connections are accepted only by development builds. These services keep data only for that emulator session unless explicitly exported.

## Acceptance walkthrough with the new project

1. Open the public homepage and search; navigate between internships, jobs, competitions and hackathons.
2. Create a student account via email/password and separately test Google sign-in. Confirm password reset sends email.
3. Complete the profile and upload a PDF under 5 MB. Refresh and verify saved fields.
4. As an administrator, publish a future-dated opportunity. Confirm it appears in search and filters.
5. As a student, bookmark the listing, refresh, then remove the bookmark.
6. Apply once and verify it appears in My applications. A duplicate application must be refused.
7. As an administrator, move the application to shortlisted; confirm the student sees the change.
8. Close the listing; verify it disappears from discovery and stops accepting applications.
9. Confirm a second student cannot read the first student's profile, applications or résumé, and cannot publish listings or assign admin privileges.
10. Repeat at mobile width. Refresh direct URLs and use browser Back/Forward.

## Scope and limits

This rebuild implements the opportunity-to-application workflow. It does not claim full feature parity with Internshala or Unstop: paid courses, employer onboarding, payments, team submissions, assessments, event scoring and email/push notifications are not implemented. Admins currently publish on behalf of organizations. Competition/hackathon applications are individual expressions of interest, with no team or multi-round scoring engine. Discovery, admin lists, the learning library and career planner use bounded cursor pagination. Search/filter controls operate on loaded records; refresh retrieves new catalog entries. Owner application/bookmark subscriptions remain unpaginated. Live Firebase acceptance requires your new configuration and deployed rules. The résumé path is stable: replacing a résumé also changes the file an administrator sees for earlier applications.

CI runs tests and builds. **There is no automatic deployment**; changes on main are for local review. Optional Firebase Hosting configuration is included for a later explicit deployment. The old implementation remains available in Git history.

### Security rule regression suite

With the Firestore and Storage emulators running:

```bash
npm --prefix scripts ci
npm --prefix scripts run test:rules
```

This suite uses only the `demo-codovate` emulator project and checks allowed and denied profile, listing, application, bookmark, planner, learning-resource and Storage operations. It requires the emulator suite on ports 8080 and 9199.

## UI refinement and database schemas

The opportunity-first interface uses a compact search hero, visual category tiles, functional homepage tabs, and consistent cards. The original logo and all Firebase application workflows remain in place.

Machine-readable collection contracts and example documents are in `database/`. To validate them, install the operator/test dependencies with `npm --prefix scripts ci`, then run `npm --prefix scripts run schema:check` and `npm --prefix scripts run test:schema`. See `docs/DATABASE.md` for optional read-only validation against the new project.

**Using a downloaded ZIP:** download the latest main-branch ZIP into a new folder, open that folder in VS Code, run `npm run setup`, then `npm run dev`. Git commands do not work in ZIP downloads. Keep your private `frontend/.env.local` outside Git and copy it to the new folder only when it contains your intended new Firebase project's configuration.

### Login troubleshooting

See [docs/LOGIN_FIXES.md](docs/LOGIN_FIXES.md) for authentication recovery behavior and the emulator login regression check. Existing passwords are submitted without an eight-character client-side restriction; new registrations still require eight characters. A successful sign-in with a failed account-data connection opens a recovery screen with retry/sign-out actions. Database permission failures require authorized cloud setup and are distinct from incorrect credentials.

## Career workspace and deployment handoff

The release adds a private career planner, curated public learning library, admin resource management, a searchable admin student directory, listing editing, cursor pagination and skill-based dashboard suggestions. One login serves both roles; verified admins reach administration through the default dashboard route. Original branding is preserved. See [docs/CAREER_WORKSPACE.md](docs/CAREER_WORKSPACE.md) for implemented behavior and limits.

For Antigravity, copy [docs/ANTIGRAVITY_DEPLOYMENT_PROMPT.md](docs/ANTIGRAVITY_DEPLOYMENT_PROMPT.md). It covers the remaining live Firebase configuration, admin bootstrap, rules/index deployment, live acceptance checks and optional hosting. Nothing in this handoff claims those cloud steps have already succeeded.


## Student projects and team discovery

/projects provides a public showcase and a private-by-default portfolio editor. /teams lets signed-in students start a team, discover recruiting teams, send a private introduction and track owner decisions. Owners have an inbox; admins can moderate projects and teams. Acceptance records an introduction, not a chat workspace or challenge team submission.

See [docs/COMMUNITY.md](docs/COMMUNITY.md) for functionality, database contracts, privacy and acceptance checks. This release also improves navigation overflow, clears private rows on account changes, prevents duplicate form submissions, preserves failed drafts and adds render-error recovery. Firebase cloud setup remains separate from emulator verification.

### Mentoring, updates and résumé links

Students can discover mentor sessions, request a place, track admin decisions, cancel and download confirmed appointments as calendar events. Administrators manage sessions, private booking decisions/meeting links and categorized platform announcements. The new screens reuse the existing theme and layout, with clear empty/error states. See [docs/GROWTH.md](docs/GROWTH.md) for schemas, permissions, limitations and release instructions.

**No-billing résumé workflow:** add an HTTPS résumé link in My profile instead of uploading a PDF. Firestore and Authentication are required; Cloud Storage is optional. `npm run firebase:configure` only writes local configuration. Deploy Firestore rules/indexes separately when Storage is unavailable; the full `firebase:setup` script also attempts Storage deployment.

### Admin control centre and private notifications

See [docs/ADMIN_PANEL.md](docs/ADMIN_PANEL.md) for module access, real admin provisioning, local-only fixed demo credentials and notification schema/access rules. Application and mentoring decisions atomically notify students. In-app notifications include a live unread indicator and private read/unread inbox; platform updates handle public broadcasts. The current theme and layout are preserved.

### Résumé templates and official opportunity links

Open `/resume` for three editable templates and browser Print → Save as PDF. Explore and the homepage now include a separate curated section linking to real employer/organizer listings. Sources, eligibility, freshness policy and maintenance are documented in [docs/RESUME_AND_REAL_OPPORTUNITIES.md](docs/RESUME_AND_REAL_OPPORTUNITIES.md). External applications happen on the original website; stale/expired curated records are hidden automatically. Theme, colours, shared styles and logo remain unchanged.
