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
