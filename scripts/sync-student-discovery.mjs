// Trusted operator only. Defaults to a read-only preview and prints counts only.
import { readFile } from "node:fs/promises";
import { verifyImportPrivacy } from "./student-import-privacy.mjs";
import { publishStudent } from "./student-discovery-core.mjs";
async function main() {
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
  if (apply)
    await verifyImportPrivacy({
      project: "codovate-dev",
      credential,
      expected: await readFile(
        new URL("../firestore.rules", import.meta.url),
        "utf8",
      ),
    });
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
  let cursor;
  do {
    let query = db
      .collection("users")
      .orderBy(FieldPath.documentId())
      .limit(200);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    for (const record of page.docs) {
      counts.scanned++;
      try {
        const account = await auth.getUser(record.id);
        if (account.disabled || account.customClaims?.admin) {
          counts.unavailable++;
          continue;
        }
        counts[
          await publishStudent({
            db,
            uid: record.id,
            timestamp: () => FieldValue.serverTimestamp(),
            apply,
          })
        ]++;
      } catch {
        counts.failed++;
      }
    }
    cursor = page.size === 200 ? page.docs.at(-1) : null;
  } while (cursor);
  console.log(JSON.stringify(counts));
  if (counts.failed) process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "Sync failed. Check trusted Firebase application-default credentials, deployed rules and project access. No credentials or student data are logged.",
  );
  process.exitCode = 1;
});
