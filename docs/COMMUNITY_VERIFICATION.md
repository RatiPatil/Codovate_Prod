# Community release verification

Verified in the isolated workspace on 2026-11-01. No live Firebase data or access policies were changed.

| Check | Result |
| --- | --- |
| Frontend tests | 72 passed across 11 files |
| Firestore/Storage policy emulator | 101 allowed/denied checks passed |
| Executable document examples | 9 valid, 0 invalid |
| Schema regression tests | 15 passed |
| Firebase configuration helper | 4 passed |
| Production build | Passed |
| Production dependency audit | 0 vulnerabilities reported at verification |
| Desktop browser | Project showcase/empty state rendered with original logo, no horizontal overflow at observed 1363px viewport; disconnected team route remained protected |

New tests cover private/public project access, hidden-content protection, immutable creator identity, owner/editor restrictions, unsafe links, direct project spotlights, duplicate requests, owner decisions, withdrawals, stale decision rejection, closed teams and applicant privacy. Query tests check both moderation filters, owner inbox constraints and immediately clearing old private rows on account change. UI tests exercise failed-draft preservation, double-submit prevention and clearing a draft on sign-out.

Auth/profile/application regressions remain in the frontend suite; the existing five Auth/Firestore emulator login checks also run in the security CI job. CI validates the web build, schemas and emulator policies on every PR. Local emulator runner uses the installed CLI 13.35.1/Java 17; CI uses the repository's pinned CLI 15.34.2/Java 21.

Browser QA used an explicitly disconnected local preview. Authenticated community screens were tested through component/transaction tests and emulator policies, not a live signed-in cloud browser. No current real-device mobile check, live Firebase acceptance or deployment is claimed. The new breakpoints and navigation scrolling still require launch checks on real devices.

See COMMUNITY.md for implemented boundaries and ANTIGRAVITY_DEPLOYMENT_PROMPT.md for the remaining Firebase connection, index deployment and live checks.
