# Private student onboarding

This operator tool reads a private single-sheet XLSX file outside the repository. It does not copy the workbook into code, create public student records, send invitations or print names, emails, mobiles or passwords. The uploaded workbook is not a source-code fixture.

## Validation and defaults

Required headers: Name, mobile no, email address, Tal, PROGRAM. Full names retain their original order/case with surrounding/repeated spaces cleaned; no name, college, degree or graduation year is guessed. Tal is a private taluka, separate from city. Require a full name, valid-looking email, valid-looking Indian mobile and mapped program. Indian mobiles normalize to +91. Format validation is not contact-ownership verification.

Identical rows are deduplicated. All valid candidates sharing conflicting email/mobile identities are held for review, including conflicts against incomplete rows. Missing contacts and unknown programs are not fabricated. Full branch labels are normalized through explicit aliases. Civil, civil structure, CSE, electrical, E&TC, mechanical, MBA and design engineering receive program-based *suggestedSkills*. These are not verified abilities; confirmed `skills` starts empty. A future consent-based team matcher must distinguish suggestions from confirmed skills.

Profiles use existing `users/{uid}` schema plus private mobile, taluka, program, suggestedSkills, suggestion provenance, invited account status, mobileVerified=false and discoveryEnabled=false. They are not shown publicly, indexed for discovery, or counted as active students. No import publishes teams/projects or enables OTP services.

## Account safety

Apply uses only the explicitly named codovate-dev project and trusted Firebase Admin credentials. It verifies the exact deployed Firestore rules against this checkout before creating any accounts. A missing/unauthorized policy read or policy mismatch fails closed. Normal Firebase CLI browser login is separate from Firebase Admin application-default credentials.

Email accounts are created with a unique high-entropy random password, emailVerified=false, no elevated claims and the complete source name. Passwords are never printed, saved to Firestore or exported. Students should set a password through the existing Forgot password flow; sharing reusable plaintext credentials is not part of this import. This tool does not implement a forced-password-change gate. Imported mobiles remain unverified profile data and are not prelinked as authentication factors. Future phone login must prove ownership and link the existing account, avoiding recycled-number takeover and duplicate accounts. No SMS or email messages are sent by this tool.

Existing Firebase emails, profiles and phone owners are preserved. No existing password or claims are changed. Deterministic import UIDs allow a rerun to recover an account whose profile write previously failed. Auth and Firestore do not share a transaction: partial results are reported explicitly, never silently deleted or counted as completed profiles. An existing account is not automatically assumed to belong to an imported record solely because the email matches.

## Privacy policy for every user

The browser users collection is owner-only. Other students, anonymous visitors and custom-claim admin clients cannot read/list another user's profile. The old admin directory no longer retrieves student data. Private notifications still work because rules can check recipient existence without exposing a profile to the sender. Firebase Console/Admin SDK operators remain privileged; Firestore rules cannot restrict those trusted credentials. All undeclared directory/import collections remain denied to browser clients.

Existing student applications deliberately submitted for admin review retain their application-specific permissions. No imported profile automatically submits an application. Disabling browser admin profile access does not erase earlier cloud data or change provider authentication records.

## Run locally as an authorized operator

Keep the actual workbook OUTSIDE the checkout. Never commit student rows, service-account JSON or generated private exports. Use Node 22.12+ and install operator dependencies:

```powershell
cd D:\Downloads\Codovate-Fresh
npm --prefix scripts ci
node scripts/import-students.mjs --file="D:\Private\2020.xlsx" --dry-run
```

The default is dry-run: no Firebase connection/writes. Add `--details` to print row numbers and issue codes only; counts of issue reasons can overlap, while summary row buckets are mutually exclusive.

Before apply, configure Firebase Admin application-default credentials for the project-owning Google account. One supported route is Google Cloud CLI `gcloud auth application-default login` on the trusted workstation. Keep those credentials local. Do not paste keys or passwords into chat or Git. Firebase CLI `login:use` does not establish Admin SDK credentials.

Deploy privacy rules first using the already authenticated Firebase CLI account:

```powershell
npx --yes firebase-tools@15.34.2 deploy --only firestore:rules --project codovate-dev --account ratikantpatil413@gmail.com
node scripts/import-students.mjs --file="D:\Private\2020.xlsx" --apply --project=codovate-dev --ack-private-rules
```

Deploy the updated frontend separately so the old admin-directory UI is removed. The tool does not deploy rules, change hosting/DNS/billing, or turn on email/mobile OTP.

End-of-run counts distinguish created Auth accounts, completed new profiles, recovered profiles, existing accounts, contact conflicts, partial writes and failures. Cloud duplicate checks happen only after authorized access; dry-run eligible rows are not a promise of that many new users.

## Verification

`npm --prefix scripts run test:import` covers names, phone normalization, missing data, aliases, suggestions, duplication/conflicts, existing accounts, recovery, partial writes, private defaults and deployed-policy checks. Firestore emulator tests verify that imported owners can read/update their own records while admin/other-user reads, fake mobile verification and discovery activation are denied. Synthetic test fixtures contain no student records from a real workbook.
