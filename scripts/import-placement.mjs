// Trusted operator only. Dry-run is the default; existing content is never overwritten.
import { readFile, stat } from "node:fs/promises";
import {
  preparePlacementPack,
  applyPlacementPack,
} from "./placement-import-core.mjs";
import { verifyImportPrivacy } from "./student-import-privacy.mjs";
async function main() {
  const args = process.argv.slice(2),
    apply = args.includes("--apply"),
    project = args.find((x) => x.startsWith("--project="))?.slice(10),
    file =
      args.find((x) => x.startsWith("--file="))?.slice(7) ||
      new URL("../frontend/src/aptitudeStarter.json", import.meta.url);
  if (
    args.some(
      (x) =>
        !["--apply", "--dry-run"].includes(x) &&
        !x.startsWith("--file=") &&
        !x.startsWith("--project="),
    ) ||
    (apply && args.includes("--dry-run"))
  )
    throw new Error(
      "Usage: node scripts/import-placement.mjs [--file=PACK.json] [--dry-run | --apply --project=codovate-dev]",
    );
  if ((await stat(file)).size > 20 * 1024 * 1024)
    throw new Error("Content pack exceeds 20 MB.");
  const rows = preparePlacementPack(JSON.parse(await readFile(file, "utf8")));
  console.log(
    JSON.stringify({
      mode: apply ? "apply" : "dry-run",
      records: rows.length,
      folders: rows.filter((r) => r.kind === "folder").length,
      articles: rows.filter((r) => r.kind === "article").length,
      published: rows.filter((r) => r.status === "published").length,
      drafts: rows.filter((r) => r.status === "draft").length,
    }),
  );
  if (!apply) {
    console.log("Validated only. No Firebase connection or writes attempted.");
    return;
  }
  if (
    project !== "codovate-dev" ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST
  )
    throw new Error(
      "Live content import requires --project=codovate-dev without emulator environment variables.",
    );
  const { initializeApp, applicationDefault } =
    await import("firebase-admin/app");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
  const credential = applicationDefault();
  await verifyImportPrivacy({
    project,
    credential,
    expected: await readFile(
      new URL("../firestore.rules", import.meta.url),
      "utf8",
    ),
  });
  const db = getFirestore(initializeApp({ projectId: project, credential }));
  console.log("Policy verified. Checking existing content before writes…");
  let processed = 0;
  const result = await applyPlacementPack(rows, {
    db,
    timestamp: () => FieldValue.serverTimestamp(),
    onCheck: (r) => {
      if (r.checked % 20 === 0 || r.checked === r.total)
        console.log(JSON.stringify({ stage: "checking", ...r }));
    },
    onProgress: (r) => {
      processed++;
      if (processed % 10 === 0 || processed === r.total)
        console.log(JSON.stringify({ processed, ...r }));
    },
  });
  console.log(JSON.stringify({ project, ...result }));
  if (result.failed) process.exitCode = 1;
}
main().catch((e) => {
  console.error(e.code || e.message);
  process.exitCode = 1;
});
