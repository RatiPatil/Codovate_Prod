// Read-only audit: never deletes accounts or publishes private profile values.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldPath } from "firebase-admin/firestore";
const normalizeStudyField = (value) =>
  typeof value === "string" ? value.trim() : "";
const validStudyField = (value) =>
  typeof value === "string" &&
  /\p{L}.*\p{L}/u.test(value.trim()) &&
  !["other", "unknown", "none", "n/a"].includes(value.trim().toLowerCase());
if (!process.argv.includes("--project=codovate-dev"))
  throw new Error("Specify --project=codovate-dev");
initializeApp({ projectId: "codovate-dev", credential: applicationDefault() });
const db = getFirestore();
const counts = {
  scanned: 0,
  missingEducation: 0,
  recoverableFromDegree: 0,
  validField: 0,
};
let cursor;
while (true) {
  let query = db.collection("users").orderBy(FieldPath.documentId()).limit(200);
  if (cursor) query = query.startAfter(cursor);
  const page = await query.get();
  if (page.empty) break;
  for (const document of page.docs) {
    const profile = document.data();
    counts.scanned++;
    if (validStudyField(normalizeStudyField(profile.program)))
      counts.validField++;
    else if (validStudyField(profile.degree)) counts.recoverableFromDegree++;
    else counts.missingEducation++;
  }
  cursor = page.docs.at(-1);
  console.log(JSON.stringify(counts));
}
console.log(
  "Audit complete. No records were changed. Counts include accounts with incomplete onboarding.",
);
