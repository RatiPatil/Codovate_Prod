// Trusted operator only. Never imports this module into browser code.
import { readFile } from "node:fs/promises";
import {
  directoryRow,
  sameDirectoryRow,
  accountCounts,
} from "./admin-directory-core.mjs";
import { verifyImportPrivacy } from "./student-import-privacy.mjs";
async function main() {
  const args = process.argv.slice(2),
    project = args.find((a) => a.startsWith("--project="))?.slice(10),
    apply = args.includes("--apply"),
    countOnly = args.includes("--count-only");
  if (
    project !== "codovate-dev" ||
    args.some(
      (a) =>
        !["--apply", "--dry-run", "--count-only"].includes(a) &&
        !a.startsWith("--project="),
    ) ||
    (apply && (countOnly || args.includes("--dry-run")))
  )
    throw new Error(
      "Usage: node scripts/sync-admin-directory.mjs --project=codovate-dev [--count-only | --dry-run | --apply]",
    );
  if (
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST
  )
    throw new Error(
      "Live directory sync refuses emulator environment variables.",
    );
  const { initializeApp, applicationDefault } =
    await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore, Timestamp, FieldValue } =
    await import("firebase-admin/firestore");
  const credential = applicationDefault();
  if (apply)
    await verifyImportPrivacy({
      project,
      credential,
      expected: await readFile(
        new URL("../firestore.rules", import.meta.url),
        "utf8",
      ),
    });
  const app = initializeApp({ credential, projectId: project }),
    auth = getAuth(app),
    db = getFirestore(app),
    accounts = [];
  let token;
  do {
    const page = await auth.listUsers(1000, token);
    accounts.push(...page.users);
    token = page.pageToken;
  } while (token);
  const counts = {
    project,
    ...accountCounts(accounts),
    countedAt: new Date().toISOString(),
  };
  if (countOnly) {
    console.log(JSON.stringify(counts));
    console.log(
      "Read-only count. Registered accounts are not a count of active students.",
    );
    return;
  }
  const old = await db.collection("adminUsers").get();
  const snapshots = new Map(old.docs.map((d) => [d.id, d]));
  const projected = [];
  let missingNames = 0;
  for (let i = 0; i < accounts.length; i += 200) {
    const chunk = accounts.slice(i, i + 200);
    const profiles = await db.getAll(
      ...chunk.map((a) => db.collection("users").doc(a.uid)),
    );
    for (let n = 0; n < chunk.length; n++) {
      const row = directoryRow(
        chunk[n],
        profiles[n].exists ? profiles[n].data() : null,
        (d) => Timestamp.fromDate(d),
      );
      if (!row.fullName) missingNames++;
      projected.push(row);
    }
    console.log(
      JSON.stringify({
        stage: "checking",
        processed: Math.min(i + 200, accounts.length),
        total: accounts.length,
      }),
    );
  }
  const existing = new Map(old.docs.map((d) => [d.id, d.data()])),
    ids = new Set(projected.map((r) => r.uid));
  const writes = projected.filter(
    (r) => !sameDirectoryRow(existing.get(r.uid), r),
  );
  const stale = [];
  for (const d of old.docs.filter((d) => !ids.has(d.id))) {
    try {
      await auth.getUser(d.id);
    } catch (e) {
      if (e.code === "auth/user-not-found") stale.push(d);
      else throw e;
    }
  }
  const summary = {
    ...counts,
    mode: apply ? "apply" : "dry-run",
    newDirectoryRows: writes.filter((r) => !existing.has(r.uid)).length,
    updatedDirectoryRows: writes.filter((r) => existing.has(r.uid)).length,
    staleDirectoryRows: stale.length,
    missingFullNames: missingNames,
  };
  console.log(JSON.stringify(summary));
  if (!apply) {
    console.log(
      "Read-only plan. No accounts, profiles or directory records changed.",
    );
    return;
  }
  const operations = [
    ...writes.map((row) => ({ row })),
    ...stale.map((d) => ({ stale: d })),
  ];
  for (let i = 0; i < operations.length; i += 200) {
    const batch = db.batch();
    for (const op of operations.slice(i, i + 200)) {
      if (op.row) {
        const ref = db.collection("adminUsers").doc(op.row.uid);
        const data = { ...op.row, updatedAt: FieldValue.serverTimestamp() };
        const prior = snapshots.get(op.row.uid);
        if (prior)
          batch.update(ref, data, { lastUpdateTime: prior.updateTime });
        else batch.create(ref, data);
      } else
        batch.delete(op.stale.ref, { lastUpdateTime: op.stale.updateTime });
    }
    await batch.commit();
    console.log(
      JSON.stringify({
        stage: "syncing",
        processed: Math.min(i + 200, operations.length),
        total: operations.length,
      }),
    );
  }
  const verified = await db.collection("adminUsers").select("uid").get();
  console.log(
    JSON.stringify({
      project,
      registeredAccounts: accounts.length,
      directoryAccounts: verified.size,
      syncComplete: true,
    }),
  );
  console.log(
    "Only the derived administrator name/UID directory was synced. Authentication accounts and private profiles were not changed.",
  );
}
main().catch((e) => {
  console.error(e.code || e.message);
  process.exitCode = 1;
});
