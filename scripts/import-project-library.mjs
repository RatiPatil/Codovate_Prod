import { readFile } from "node:fs/promises";
import { validateDocument } from "./validate-schema.mjs";
async function main() {
  const args = process.argv.slice(2),
    apply = args.includes("--apply");
  if (
    !args.includes("--project=codovate-dev") ||
    args.some((a) => !["--project=codovate-dev", "--apply"].includes(a))
  )
    throw new Error(
      "Usage: node scripts/import-project-library.mjs --project=codovate-dev [--apply]",
    );
  const rows = JSON.parse(
    await readFile(
      new URL("../frontend/src/projectLibrary.json", import.meta.url),
      "utf8",
    ),
  );
  if (
    !rows.length ||
    rows.length > 500 ||
    new Set(rows.map((r) => r.id)).size !== rows.length
  )
    throw new Error("Expected 1–500 unique project records.");
  for (const row of rows) {
    const result = validateDocument("projectLibrary", row.id, row);
    if (!result.valid)
      throw new Error(
        `Invalid project schema: ${row.id}: ${JSON.stringify(result.errors)}`,
      );
  }
  console.log(
    `Validated all ${rows.length} project records. Checking Firebase Admin access…`,
  );
  if (process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error("Production import refuses emulator settings.");
  const { initializeApp, applicationDefault } = await import(
    "firebase-admin/app"
  );
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
  initializeApp({
    projectId: "codovate-dev",
    credential: applicationDefault(),
  });
  const db = getFirestore(),
    refs = rows.map((row) => db.doc(`projectLibrary/${row.id}`)),
    snapshots = await db.getAll(...refs),
    batch = db.batch();
  let created = 0;
  for (let index = 0; index < rows.length; index++)
    if (!snapshots[index].exists) {
      created++;
      if (apply)
        batch.create(refs[index], {
          ...rows[index],
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
    }
  if (apply && created) await batch.commit();
  console.log(
    JSON.stringify({
      mode: apply ? "apply" : "preview",
      total: rows.length,
      create: created,
      preserved: rows.length - created,
    }),
  );
}
main().catch((error) => {
  console.error("Project library import stopped:", error.message);
  process.exitCode = 1;
});
