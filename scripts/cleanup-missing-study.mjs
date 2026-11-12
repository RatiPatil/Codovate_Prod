// Trusted Admin operator. Dry-run by default; archive and delete atomically.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldPath, FieldValue } from "firebase-admin/firestore";

export function missingEducation(profile) {
  const valid = (value) =>
    typeof value === "string" &&
    /\p{L}.*\p{L}/u.test(value.trim()) &&
    !["other", "unknown", "none", "n/a"].includes(value.trim().toLowerCase());
  return !valid(profile.program) && !valid(profile.degree);
}
export function protectedAccount(profile) {
  return (
    profile.admin === true ||
    profile.isAdmin === true ||
    (profile.role && profile.role !== "student")
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (
    !args.includes("--project=codovate-dev") ||
    args.some(
      (a) =>
        !["--project=codovate-dev", "--apply", "--expected=16"].includes(a),
    )
  )
    throw new Error(
      "Usage: node scripts/cleanup-missing-study.mjs --project=codovate-dev [--apply --expected=16]",
    );
  if (process.env.FIRESTORE_EMULATOR_HOST && args.includes("--apply"))
    throw new Error("Production cleanup refuses emulator settings.");
  const apply = args.includes("--apply");
  if (apply && !args.includes("--expected=16"))
    throw new Error("Apply requires --expected=16 from the reviewed audit.");
  initializeApp({
    projectId: "codovate-dev",
    credential: applicationDefault(),
  });
  const db = getFirestore(),
    candidates = [];
  let cursor,
    scanned = 0,
    protectedCount = 0;
  while (true) {
    let query = db
      .collection("users")
      .orderBy(FieldPath.documentId())
      .limit(200);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;
    for (const snapshot of page.docs) {
      scanned++;
      const profile = snapshot.data();
      if (missingEducation(profile)) {
        if (protectedAccount(profile)) protectedCount++;
        else candidates.push(snapshot.id);
      }
    }
    cursor = page.docs.at(-1);
  }
  console.log(
    JSON.stringify({
      mode: apply ? "apply" : "preview",
      scanned,
      candidates: candidates.length,
      protectedCount,
    }),
  );
  if (!apply || !candidates.length) return;
  if (candidates.length + protectedCount !== 16)
    throw new Error(
      "Missing education count changed from the reviewed 16. No records changed. Run the audit again.",
    );
  // All reads precede writes. Firestore retries if education changes concurrently.
  const removed = await db.runTransaction(async (transaction) => {
    const records = [];
    for (const uid of candidates) {
      const user = db.doc(`users/${uid}`),
        card = db.doc(`memberProfiles/${uid}`),
        preferences = db.doc(`discoveryPreferences/${uid}`),
        archive = db.doc(`missingStudyArchives/${uid}`);
      const [u, c, p, a] = await transaction.getAll(
        user,
        card,
        preferences,
        archive,
      );
      if (
        !u.exists ||
        !missingEducation(u.data()) ||
        protectedAccount(u.data())
      )
        throw new Error(
          "A candidate changed during cleanup. No records changed; rerun the audit.",
        );
      if (a.exists)
        throw new Error(
          "A backup already exists for a candidate. No records changed; inspect the existing archive.",
        );
      records.push({ user, card, preferences, archive, u, c, p });
    }
    for (const r of records) {
      transaction.create(r.archive, {
        user: r.u.data(),
        memberProfile: r.c.exists ? r.c.data() : null,
        discoveryPreferences: r.p.exists ? r.p.data() : null,
        archivedAt: FieldValue.serverTimestamp(),
        reason: "missing_field_of_study_and_degree",
      });
      transaction.delete(r.card);
      transaction.delete(r.preferences);
      transaction.delete(r.user);
    }
    return records.length;
  });
  console.log(
    JSON.stringify({
      removed,
      backupCollection: "missingStudyArchives",
      authenticationAccountsDeleted: 0,
    }),
  );
}
if (process.argv[1]?.endsWith("cleanup-missing-study.mjs"))
  main().catch((error) => {
    console.error("Cleanup stopped:", error.message);
    process.exitCode = 1;
  });
