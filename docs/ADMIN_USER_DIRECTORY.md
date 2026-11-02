# Live administrator user directory

Administration → User accounts now displays full names, UIDs, profile join dates, search by name/UID, a synced registered-account count and 30-row pagination. A Firestore snapshot listener updates the minimal directory in real time. Cached snapshots are labelled as cached; failed reads clear the displayed names and show an error instead of reporting a false zero. Listener subscriptions are removed on logout/account changes.

`adminUsers/{uid}` stores exactly uid, fullName (up to 200 chars), joinedAt and updatedAt. Verified administrators can list/read it. Students can read only their own entry and cannot enumerate names. Owners can create/update only their own name projection and only when its name/date match their private users document after the same transaction. Email, mobile, notes, skills and role fields are prohibited in directory documents. No existing private-profile or learning-note permissions are widened.

New Codovate profile creation writes the private profile and name directory atomically. Profile edits atomically update both records. Existing imported accounts need the trusted sync below; future bulk imports and changes made directly in Firebase Console also need a sync. No automatic Auth trigger or billing-enabled backend is introduced. Names are displayed as supplied, without guessing name order. Missing names are clearly labelled rather than derived from email addresses.

## Exact Authentication count (read-only)

```powershell
node scripts/sync-admin-directory.mjs --project=codovate-dev --count-only
```

Uses the same Application Default Credentials already configured for student imports. Lists Firebase Authentication accounts in pages of 1,000 and prints only registeredAccounts, enabledAccounts, disabledAccounts and count time. It does not connect count-only mode to profile data or write anything. These are registered accounts including administrator/test/invited accounts, not a claim about active students. Paginated counts reflect the enumeration time, not an atomic snapshot during concurrent account creation.

## Initial setup and existing-account sync

Finish active student imports, pull matching code, deploy the new directory rules, then run:

```powershell
cd "D:\Downloads\Codovate-Fresh"
git pull origin main
npm run build
npx --yes firebase-tools@15.34.2 deploy --only "firestore:rules,hosting" --project codovate-dev --account ratikantpatil413@gmail.com
node scripts/sync-admin-directory.mjs --project=codovate-dev --dry-run
node scripts/sync-admin-directory.mjs --project=codovate-dev --apply
```

The default is read-only planning; apply requires the explicit flag and project. It verifies that deployed rules exactly match checked-out firestore.rules before writes. Existing Auth accounts are enumerated, names come from private profiles with Auth display-name fallback, and only the four-field projection is persisted. No emails/phones are logged. The sync prints aggregate registered counts, planned directory changes and progress every 200 accounts. A final read reports the actual directoryAccounts count.

Unchanged directory rows are skipped. Stale derived directory rows for deleted Auth users are removed only after a fresh Auth absence check; Authentication accounts and private profiles are never created, deleted or modified. Write preconditions protect concurrent directory changes; if a batch fails, earlier batches may have completed. Rerun the same sync to reconcile. Client profile updates remain atomic; direct Console/legacy-client changes need a later sync. New registrations occurring during enumeration can make Auth and directory totals temporarily differ; rerun for a fresh count.

The live UI listens to the directory, not directly to the privileged Auth list API. It deliberately labels its count as synced accounts. The listener initially reads all minimal name records so name-contains search and the current directory total are accurate; pagination limits rendered rows, not Firestore reads. At larger scales, a trusted search/count backend should replace that approach. Each new admin session/refresh reads the directory records and consumes Firestore read quota.

No new Firebase billing plan, Functions, VPS or other database is required. Firebase Hosting/rules deployment and the first sync remain operator steps when development has no cloud credentials.

## Public community count and admin summaries

The home page reads only `publicStats/community` and labels its aggregate “registered members”, not active learners. No member names, email addresses or phones are public. Initialize/reconcile from the actual Firebase Authentication total (the reported 1,479 is not hardcoded):

```powershell
node scripts/publish-community-count.mjs --project=codovate-dev
node scripts/publish-community-count.mjs --project=codovate-dev --apply
```

New in-app profiles increment the initialized counter in their creation transaction. Retries/existing profiles do not increment again. Rules permit exactly +1 only with the owner's first profile creation; clients cannot initialize, reset or delete the counter. The trusted script uses a write precondition to avoid overwriting concurrent increments. Re-run after bulk imports, Console account deletions, or overlapping first initialization. Auth registrations whose profile creation failed are counted when the reconciliation script runs. Counts include administrator/test/invited accounts, so “registered members” is deliberate. No count is fabricated before initialization or on read failure.

Admin overview has live cards for synced accounts, opportunities, applications and placement items. Cards open the corresponding modules; loading, cached and error states are explicit. These listeners read the corresponding collections while that admin screen is open and consume Firestore reads.

Placement navigation remains visible to guests. Opening `/placement` (including direct lesson URLs) redirects to login and preserves the destination. Published placement documents now require authentication in Firestore rules. Starter lesson text is no longer bundled in the public frontend; import it with the existing trusted placement importer. Previously downloaded/offline copies cannot be revoked.
