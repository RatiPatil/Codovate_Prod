// Trusted operator only. Defaults to a read-only preview and prints counts only.
import { syncOperation, safeSyncError } from "./discovery-sync-runtime.mjs";
import { readFile } from "node:fs/promises";
import { verifyImportPrivacy } from "./student-import-privacy.mjs";
import { publishStudent } from "./student-discovery-core.mjs";
let stage = "startup";
let progress = null;
function announce(next) {
  stage = next;
  console.log(`[discovery-sync] ${next}`);
}
async function main() {
  announce("Starting student discovery sync");
  const args = process.argv.slice(2),
    apply = args.includes("--apply");
  if (
    !args.includes("--project=codovate-dev") ||
    args.some(
      (a) => !["--project=codovate-dev", "--apply", "--dry-run"].includes(a),
    ) ||
    (apply && args.includes("--dry-run"))
  )
    throw new Error(
      "Usage: node scripts/sync-student-discovery.mjs --project=codovate-dev [--dry-run | --apply]",
    );
  if (
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST
  )
    throw new Error("Production sync refuses emulator settings.");
  const { initializeApp, applicationDefault } = await import(
    "firebase-admin/app"
  );
  const { getFirestore, FieldValue, FieldPath } = await import(
    "firebase-admin/firestore"
  );
  const { getAuth } = await import("firebase-admin/auth");
  const credential = applicationDefault();
  announce("Checking Firebase Admin credentials and deployed rules");
  if (apply)
    await syncOperation(stage, async () =>
      verifyImportPrivacy({
        project: "codovate-dev",
        credential,
        expected: await readFile(
          new URL("../firestore.rules", import.meta.url),
          "utf8",
        ),
      }),
    );
  const app = initializeApp({ credential, projectId: "codovate-dev" }),
    db = getFirestore(app),
    auth = getAuth(app);
  const counts = {
    mode: apply ? "apply" : "dry-run",
    scanned: 0,
    published: 0,
    eligible: 0,
    student_managed: 0,
    ineligible: 0,
    missing: 0,
    unavailable: 0,
    failed: 0,
  };
  progress = counts;
  let cursor;
  announce("Reading student profiles");
  do {
    let query = db
      .collection("users")
      .orderBy(FieldPath.documentId())
      .limit(200);
    if (cursor) query = query.startAfter(cursor);
    const page = await syncOperation(stage, () => query.get());
    console.log(
      `[discovery-sync] Loaded ${page.size} profiles; scanned ${counts.scanned} so far.`,
    );
    for (const record of page.docs) {
      counts.scanned++;
      try {
        stage = "Checking student account";
        const account = await syncOperation(stage, () =>
          auth.getUser(record.id),
        );
        if (account.disabled || account.customClaims?.admin) {
          counts.unavailable++;
          continue;
        }
        stage = "Saving student discovery card";
        counts[
          await syncOperation(stage, () =>
            publishStudent({
              db,
              uid: record.id,
              timestamp: () => FieldValue.serverTimestamp(),
              apply,
            }),
          )
        ]++;
      } catch (error) {
        counts.failed++;
        if (error.code === "discovery/timeout") throw error;
        const info = safeSyncError(error, stage);
        counts.errors ||= {};
        counts.errors[info.code] = (counts.errors[info.code] || 0) + 1;
      }
      if (counts.scanned % 25 === 0)
        console.log(JSON.stringify({ progress: true, ...counts }));
    }
    console.log(JSON.stringify({ progress: true, ...counts }));
    stage = "Reading student profiles";
    cursor = page.size === 200 ? page.docs.at(-1) : null;
  } while (cursor);
  console.log(JSON.stringify(counts));
  if (counts.failed) process.exitCode = 1;
}
try {
  await main();
} catch (error) {
  console.error(
    "[discovery-sync] FAILED " + JSON.stringify(safeSyncError(error, stage)),
  );
  if (progress) console.error(JSON.stringify({ partial: true, ...progress }));
  process.exitCode = 1;
  // Stop this CLI after allowing its diagnostic output to flush, even if an SDK
  // still has a retried network call open. All card writes are atomic/idempotent.
  setTimeout(() => process.exit(1), 250).unref();
}
