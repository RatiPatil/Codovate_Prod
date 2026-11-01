# Career workspace release

This release extends the existing Firebase-only student platform. It preserves the original logo and adds a muted lavender/sage visual section, a CSS-drawn career illustration and gentle floating accents that honor reduced-motion preferences. No invented company statistics, fake application success or fabricated live content are used.

## Implemented behavior

- One sign-in screen for all accounts; the default dashboard resolves the trusted custom claim and sends administrators to `/admin`.
- Existing profile, private PDF résumé, opportunity exploration, saving, transactional applications and admin status review remain available.
- Opportunity administrators can edit listing details and deadlines as well as publication state. Existing application snapshots retain the information originally submitted.
- `/planner`: private Firebase-backed goals with due dates, notes, complete/reopen, delete confirmation, loaded-task status filtering and pagination.
- `/learn`: public published resources with loaded-record search/category filters and pagination. Empty states invite real content instead of silently showing seeded data.
- Admin resources: create draft, publish, unpublish, edit and confirmed deletion. Draft documents cannot be read publicly.
- Admin student directory: paginated profiles, loaded-record name/email/college search, expandable details and profile completion. Student accounts cannot query the directory.
- Student dashboard suggestions rank the loaded open catalog by case-insensitive exact skill overlap. These are transparent local matching suggestions, not an AI service.
- New administrative queries are bounded and support cursor pagination. Permission/network errors surface in the UI; refresh is explicit.

## What remains external or out of scope

Firebase Authentication providers, Firestore/Storage provisioning, deployed rules/indexes, authorized domains, admin bootstrap and real cloud end-to-end tests require an authenticated project operator. Credentials supplied in a prior chat do not prove those services are provisioned or authorized. The repository does not claim live deployment or production certification.

The public opportunity catalog, admin lists, library and planner are cursor-paginated; their searches filter loaded records. Refresh retrieves newly published opportunities; application/profile changes retain live subscriptions. There is no full-text indexing service. Application/bookmark owner subscriptions remain unpaginated. Cloud Functions for email/push reminders, payments, organization verification, recruiter onboarding, moderation audit trails, account lifecycle automation, mentorship and messaging are not implemented. No inactive buttons advertise these as working features. Role assignment and Auth account deletion remain trusted operator tasks, not browser privileges.

Use `docs/ANTIGRAVITY_DEPLOYMENT_PROMPT.md` for the remaining connection/deployment work. Follow `docs/DATABASE.md` for exact contracts and queries. Avoid calling the platform production-ready until real project checks, operational monitoring, retention/privacy policy and recovery arrangements appropriate to the launch have been completed.
