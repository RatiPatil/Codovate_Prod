# Firebase connection — codovate-dev

## Current target

The owner selected project `codovate-dev` and web app `1:546984701088:web:b5dd4fe58e806c69206dc5`. Nonsecret project identifiers are in `config/firebase.project.json`; `.firebaserc` binds CLI operations to the same project. The web API key stays in the ignored `frontend/.env.local` and is not committed.

## Setup on a connected checkout

```powershell
git pull origin main
npm run setup
npm run firebase:setup
npm run dev
```

The setup command uses a pinned official Firebase CLI, opens Google login on the operator's computer, downloads this exact app's SDK configuration, verifies the returned project/app IDs, and writes the ignored local environment file atomically. It preserves unrelated local environment settings, explicitly disables emulators, deploys Firestore rules/indexes, and then deploys Storage rules. It never deploys Hosting, imports sample listings, deletes cloud data, or stores service-account credentials.

If only local configuration is needed, run `npm run firebase:configure`. No Firebase project-management login is available in the assistant workspace; a connected official Firebase integration or the owner's CLI login is required to deploy cloud settings.

Open **http://localhost:5173** after restarting Vite. The public Auth configuration currently authorizes `localhost`, so this is the preferred local address. `/setup` distinguishes loaded local configuration from a live Firestore read and lets the operator test an actual server query with a timeout. A successful read is not a complete authentication/upload test.

## Observed cloud status, 1 November 2026

These were read-only checks using the owner-supplied web configuration, with no accounts, application records or files created:

| Check | Result |
| --- | --- |
| Firebase Auth public project configuration | HTTP 200; localhost authorized |
| Published-opportunity Firestore query | HTTP 403: Missing or insufficient permissions |
| Configured Storage bucket endpoint | HTTP 404: Not Found |

The web configuration is valid. Cloud readiness is **not complete**: the expected public listing query is denied and the configured bucket is unavailable. No claim is made that the new rules/indexes have been deployed. Firebase Console must have Google and Email/Password enabled, Firestore created, and the configured Storage bucket provisioned with any required billing plan. Cloud provisioning/changes require authorized account access; they cannot be performed with a web API key alone.

If a combined setup fails after Firestore deployment, Storage may still need provisioning before its rules can deploy. Setup reports failures and can be rerun after the reported service issue is corrected. Changing rule files in GitHub does not deploy them to Firebase.

## Schema and lifecycle

- `database/firestore.schema.json` defines the four collection shapes. `database/examples.json` is documentation/test data only, never a production seed.
- `users/{uid}` is created by an idempotent transaction at initial sign-in. Repeated or concurrent setup does not overwrite an existing profile.
- `opportunities/{id}` is published by an administrator with a trusted custom claim.
- `applications/{uid}_{opportunityId}` is created once after profile/resume checks; authoritative `closesAt` timestamps control expiry.
- `bookmarks/{uid}_{opportunityId}` belongs to the signed-in student.
- `resumes/{uid}/resume.pdf` is private to that student and administrators.

Firestore creates collections on the first permitted record write; no SQL schema import is needed. The database contract, indexes and role boundaries are documented in `docs/DATABASE.md`.

## Verification

- Production build with the supplied local configuration.
- 17 frontend tests, including session readiness, non-overwriting profile creation, server-connection status and authoritative deadlines.
- Frontend production dependency audit: 0 reported vulnerabilities after updating the pinned gRPC transitive dependency; no forced Firebase downgrade.
- 4 setup tests for project identity, managed environment variables, idempotent settings preservation and atomic local writes.
- 8 schema tests; 4 example documents validate successfully.
- 32 Firestore/Storage emulator policy checks, including reading a missing owner profile before transactional creation.

Real-project registration, Google OAuth, private PDF upload, publishing, application submission and review remain pending authorized cloud setup. The schemas and policies are implemented; a fully operational cloud environment has not yet been verified.
