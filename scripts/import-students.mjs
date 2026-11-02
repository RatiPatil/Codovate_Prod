// Trusted operator only. This module is never bundled into the website.
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import readExcelFile from "read-excel-file/node";
import { prepareStudents, importStudent } from "./student-import-core.mjs";
import { verifyImportPrivacy } from "./student-import-privacy.mjs";
async function main() {
  const args = process.argv.slice(2),
    input = args.find((a) => a.startsWith("--file="))?.slice(7),
    project = args.find((a) => a.startsWith("--project="))?.slice(10);
  const apply = args.includes("--apply");
  const allowed = (a) =>
    a === "--apply" ||
    a === "--dry-run" ||
    a === "--ack-private-rules" ||
    a === "--details" ||
    a.startsWith("--file=") ||
    a.startsWith("--project=");
  if (
    !input ||
    args.some((a) => !allowed(a)) ||
    (apply && args.includes("--dry-run"))
  )
    throw new Error(
      "Usage: node scripts/import-students.mjs --file=PATH.xlsx [--dry-run | --apply --project=codovate-dev --ack-private-rules]",
    );
  const repo = path.resolve(fileURLToPath(new URL("..", import.meta.url))),
    realInput = path.resolve(input);
  if (realInput === repo || realInput.startsWith(repo + path.sep))
    throw new Error("Keep the private workbook outside the repository.");
  if ((await stat(input)).size > 20 * 1024 * 1024)
    throw new Error("Workbook exceeds the 20 MB input limit.");
  const sheets = await readExcelFile(input);
  if (sheets.length !== 1)
    throw new Error(
      "Use a workbook with exactly one sheet; no sheets are silently ignored.",
    );
  const plan = prepareStudents(sheets[0].data);
  console.log(
    JSON.stringify({ mode: apply ? "apply" : "dry-run", ...plan.summary }),
  );
  console.log(
    "Issue totals: " +
      JSON.stringify(
        plan.issues.reduce((out, item) => {
          for (const key of item.reasons || [item.code])
            out[key] = (out[key] || 0) + 1;
          return out;
        }, {}),
      ),
  );
  if (args.includes("--details"))
    for (const issue of plan.issues) console.log(JSON.stringify(issue));
  if (!apply) {
    console.log(
      "Created accounts: 0. No Firebase connection or writes were attempted.",
    );
    return;
  }
  if (project !== "codovate-dev" || !args.includes("--ack-private-rules"))
    throw new Error(
      "Apply requires --project=codovate-dev --ack-private-rules.",
    );
  if (
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST
  )
    throw new Error(
      "Production import refuses emulator environment variables.",
    );
  const { initializeApp, applicationDefault } =
    await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
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
  const app = initializeApp({ credential, projectId: project }),
    auth = getAuth(app),
    db = getFirestore(app);
  const result = {
    created: 0,
    recovered: 0,
    existing: 0,
    conflict: 0,
    partial: 0,
    failed: 0,
  };
  for (const r of plan.eligible) {
    try {
      const outcome = await importStudent(r, {
        auth,
        db,
        timestamp: () => FieldValue.serverTimestamp(),
      });
      result[outcome.status]++;
      if (["partial", "conflict"].includes(outcome.status))
        console.log(JSON.stringify({ row: r.row, status: outcome.status }));
    } catch (e) {
      result.failed++;
      console.log(
        JSON.stringify({
          row: r.row,
          status: "failed",
          code: typeof e.code === "string" ? e.code : "import_error",
        }),
      );
    }
  }
  console.log(
    JSON.stringify({
      project,
      validation: plan.summary,
      result,
      createdAuthenticationAccounts: result.created + result.partial,
      completedNewProfiles: result.created,
    }),
  );
  if (result.failed || result.partial) process.exitCode = 1;
}
main().catch((e) => {
  console.error(
    e.message?.includes("credential")
      ? "Firebase Admin credentials unavailable. Use trusted application-default credentials."
      : e.code || e.message,
  );
  process.exitCode = 1;
});
