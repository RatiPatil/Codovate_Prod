# Career workspace verification

Verified in the isolated workspace on 2026-11-01. This is not a live Firebase deployment certificate.

| Check | Result |
| --- | --- |
| Frontend tests | 45 passed across 8 files |
| Firebase configuration helper tests | 4 passed |
| JSON Schema examples | 6 documents valid, 0 invalid |
| Schema regression tests | 10 passed |
| Firestore and Storage emulator policies | 55 allowed/denied checks passed |
| Auth and Firestore login emulator | 5 checks passed |
| Production build | Passed |
| Production dependency audit | 0 vulnerabilities reported at verification |
| Desktop browser preview | Home/career section and library rendered, original logo preserved; library navigation and deep-link reload checked; no horizontal overflow at observed 1363px viewport |

The security suite includes task ownership, completion/deletion, cross-student denial, draft resource protection, publication/unpublication/deletion, immutable creator, HTTPS constraints and admin-only directory queries. Cursor tests cover lookahead, startAfter, refresh reset and ignoring stale responses when owner changes. UI tests cover task creation/failure preservation, complete/reopen/delete, resource edits/filtering and default admin routing from the shared login.

Local emulator runner: Firebase CLI 13.35.1 with installed Java 17. CI uses the project's pinned Firebase CLI 15.34.2 with Java 21. Security regression CI is added in this release. Expected permission-denied emulator logs are successful negative tests. The demo project cannot write to production services.

Browser development hot reload briefly logged hook-order errors while the catalog hook implementation was being replaced. A clean direct library reload rendered successfully after the edits. Browser extension metadata errors are outside the application. No live signed-in browser session, live Firebase integration or current mobile browser test is claimed. Responsive breakpoints and reduced-motion rules are implemented; verify real devices during launch acceptance.

Remaining launch tasks are explicitly described in docs/ANTIGRAVITY_DEPLOYMENT_PROMPT.md. Authentication providers, project access, database/bucket provisioning, deployed rules/index readiness, admin claim bootstrap and Hosting have not been applied to the user's Firebase project in this release.
