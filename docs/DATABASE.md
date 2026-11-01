# Firebase database contract — v1

Firestore is schemaless; the schema below is enforced by `firestore.rules`, form validation and deterministic document IDs. Collections are created on the first valid write, not during UI preview. There is no seed of old production data. All times except the human-readable ISO deadline use Firestore timestamps. `createdAt` and `updatedAt` use server timestamps, not the client clock.

## Collections

| Path | Fields | Read access | Write access |
| --- | --- | --- | --- |
| `users/{authUid}` | name, email, college, degree, graduationYear, city, bio, skills[], portfolio, resumePath, createdAt, updatedAt | Owner and admin | Owner; email/createdAt immutable; no role field allowed |
| `opportunities/{autoId}` | title, organization, type, category, mode, location, duration, stipend, skills[], deadline, closesAt, description, responsibilities, eligibility, status, createdBy, createdAt, updatedAt | Public if published; admin sees all | Admin only; creator/time immutable |
| `applications/{uid}_{opportunityId}` | studentId, opportunityId, opportunityTitle, organization, studentName, college, resumePath, coverNote, status, createdAt, updatedAt | Student owner and admin | Owner creates once; admin changes only status and updatedAt |
| `bookmarks/{uid}_{opportunityId}` | studentId, opportunityId, title, organization, type, createdAt | Owner only | Owner creates/deletes; updates disallowed |

### Profile

`graduationYear` is a four-character string, matching browser form data. `skills` is an array with at most 20 entries. `portfolio` is empty or HTTPS. Field bounds: name 100, email 320, college 180, degree 100, city 100, bio 1500, portfolio 500 characters. A profile cannot gain `role`, `admin`, permission fields or extra keys. The login token's `admin: true` custom claim is the only administrator authority.

### Opportunity

- `type`: internship / job / competition / hackathon.
- `category`: Technology / Design / Marketing / Business / Finance / Other.
- `mode`: Remote / On-site / Hybrid.
- `status`: draft / published / closed. Closing preserves applications and history.
- `stipend`: INR number, 0–10,000,000; monthly for jobs/internships, prize pool for competitions/hackathons. Zero means not specified.
- `deadline`: ISO date string for rendering. `closesAt`: Firestore timestamp enforcing the deadline in security rules using server time. Both originate from the same admin form value. The timestamp is authoritative for accepting applications.
- Discovery excludes closed/expired listings. Public queries must include `status == published` to satisfy rules. Discovery orders by `createdAt desc`, limited to 200.
- Text bounds: title/organization/location/duration 180; description/responsibilities/eligibility 6000 characters each.

### Application integrity

A transaction reads the application ID and authoritative listing, checks duplicates and expiry, then writes a single record. Rules independently enforce owner ID, published status, server-time deadline, immutable listing title/organization, and a nonempty owner name/college/résumé path matching the profile. Deterministic IDs plus create-only access prevent repeated applications even in concurrent tabs. Applications store snapshots of student name/college and listing title/organization, retaining context when a profile/listing changes.

Statuses: submitted → under_review → shortlisted → selected / rejected. Administrators can correct a status; updates cannot rewrite the owner, opportunity, résumé path or submission. Students cannot update application status. Cover notes have a 2000 character maximum. No applicant email or résumé is placed in a public listing.

Student lists use `where(studentId, ==, uid)`; rules reject unrestricted cross-student queries. Admin lists order by createdAt and show the latest 200. The one composite index required for published listing discovery is in `firestore.indexes.json`; owner and admin queries use default single-field indexes.

## Storage

`resumes/{uid}/resume.pdf`: only the owner can upload/replace; only owner/admin can read. Maximum 5 MB; `application/pdf` content type required. Objects outside this exact path are denied. Firestore stores the path, never a public download URL. Administrators retrieve a download URL only on demand. Firebase download URLs are bearer links, so recipients should keep them private. Content-type/size rules are not a malware scan. Replacing a résumé updates the stable file for existing applications as well; versioned application attachments are a future enhancement.

## Provisioning and lifecycle

1. Enable Auth/Firestore/Storage in the new project and deploy rules/indexes before real use.
2. Auth registration is followed by profile creation. If profile creation is interrupted, the profile page can initialize it on the next successful save. No account is silently granted elevated access.
3. Use `scripts/set-admin.mjs` from a trusted workstation to grant/revoke the admin custom claim.
4. Admin publishes a listing → student saves/applies → admin reviews and updates status → student observes live state via Firestore listeners.
5. Old cloud data is untouched. There is no migration, import or automatic database deletion.

Rules default-deny all unknown collections/paths. Profile/application deletion and account deletion are not exposed in v1; define retention and deletion policy before production use.

## Executable schema and read-only audit

`database/firestore.schema.json` defines all four document shapes using JSON Schema 2020-12, with required fields, enums, numeric ranges, lengths and unknown-field rejection. `database/examples.json` contains one example of each collection; these records are documentation fixtures and are never imported into Firebase.

The validator normalizes Firestore timestamps to ISO 8601 strings. It also checks relationships that JSON Schema cannot express: matching `deadline`/`closesAt`, deterministic application/bookmark IDs, and owner-specific résumé paths. Security Rules remain the authority for live Firebase access; the JSON Schema is a separate read-only validation and review tool, not a native Firestore schema migration.

```bash
npm --prefix scripts ci
npm --prefix scripts run schema:check
npm --prefix scripts run test:schema
# Validate a JSON export shaped like database/examples.json:
node scripts/validate-schema.mjs --file export.json
# Optional: audit the NEW Firebase project using local application-default credentials:
node scripts/validate-schema.mjs --project YOUR_NEW_PROJECT_ID
```

The cloud audit reads every document in the four named collections. It makes no writes and prints only record paths and validation failures. Run it deliberately on an appropriately sized project, as Firestore reads are billable.

Live rules now require unique string skills, each 1–60 characters, with at most 20 skills. Graduation year must be empty for an incomplete profile or a four-digit year from 2000 through 2100. Profile and publishing forms explain skill-limit violations before submitting to Firebase. Existing data is not rewritten; use the read-only audit to identify any records requiring manual correction before deploying stricter rules.

## Career workspace collections

`careerTasks/{autoId}` is private planning data: `studentId`, `title` (1–120), `note` (0–1000), `dueDate` (YYYY-MM-DD, date-only in the student's local calendar), `status` (`todo` or `done`), `createdAt`, `updatedAt`. Creation uses a server timestamp, authenticated owner ID and `todo`. Owners can complete, reopen and delete tasks. Owner and creation time cannot be changed. Administrators may read/update/delete for support through trusted tooling; the UI does not expose other students' private goals.

`resources/{autoId}` stores curated external learning links: `title` (1–120), `description` (1–1000), `url` (HTTPS, up to 1000), `category` (`Interview prep`, `Resume & portfolio`, `Technical skills`, `Career guidance`), `status` (`draft` or `published`), `createdBy`, `createdAt`, `updatedAt`. Only a custom-claim admin can create, edit, publish, unpublish or delete. Creator and creation time are immutable. The public library can only query published records. Links open in a new tab with `noopener noreferrer`.

All six collections have executable contracts in `database/firestore.schema.json` and documentation-only records in `database/examples.json`. These records are not seeded automatically. Firebase creates collections on their first authorized write; there is no SQL migration or second database.

## Query catalog and pagination

Implementation: `frontend/src/data.js` (owner live subscriptions and catalog adapter) and `frontend/src/careerData.js` (bounded cursor queries).

| Screen | Query | Index / access |
| --- | --- | --- |
| Opportunity catalog | `status == published`, `createdAt desc`, 25 requested / 24 displayed | Composite index in repository; public |
| Own applications / bookmarks | `studentId == auth.uid` | Automatic single-field index; owner only |
| Career planner | `studentId == auth.uid`, `createdAt desc`, 25 requested / 24 displayed | Composite index; owner or admin |
| Public library | `status == published`, `createdAt desc`, 25 / 24 | Composite index; only published |
| Admin listings, applications, users, resources | `createdAt desc`, 25 / 24 | Automatic single-field descending index; admin only |
| Listing detail | Exact document ID | Published listing or admin |

New paginated queries request one lookahead record to determine whether another page exists, then resume with `startAfter(lastDisplayedSnapshot)`. Refresh resets the cursor; updates refresh the current list. Filtering/search within these lists applies to **loaded records**, explicitly labelled in the UI. These are not full-text search indexes. Admin lists have a Load more button, so records beyond the first page are accessible. The public opportunity catalog also uses cursor pagination with explicit refresh. New listings appear after refresh; profile and application status subscriptions remain live. No global counts are fabricated.

Writes use `serverTimestamp()` and Firestore rules validate timestamps. Applications remain duplicate-safe transactions using deterministic IDs. Data errors and timeouts are surfaced to the user; failed operations are not shown as successful. Schema validation is a read-only offline/ADC tool; Security Rules remain the authority for browser writes. Date-only task input validates actual calendar dates in the client and JSON Schema; rules enforce the date string shape.

Admin claims must be provisioned with `scripts/set-admin.mjs` using trusted credentials. One public login is shared by both roles. After session resolution, the default dashboard route sends claim-verified admins to `/admin`; students receive the student dashboard. No email string, environment variable or client-written profile field grants authority. Authentication account deletion, role assignment and sensitive maintenance belong in a trusted operator environment, not a browser with privileged keys.
