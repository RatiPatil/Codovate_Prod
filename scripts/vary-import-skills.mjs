// Trusted Admin tool. Alters imported suggestions only, never confirmed skills.
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
export function reducedSuggestions(uid, profile) {
  if (
    profile.importSource !== "student_workbook_v1" ||
    profile.importSkillVariation ||
    profile.skills?.length ||
    profile.onboarding?.status === "completed" ||
    !Array.isArray(profile.suggestedSkills) ||
    profile.suggestedSkills.length < 2
  )
    return null;
  const index =
    createHash("sha256")
      .update(`skill-variation-v1:${uid}`)
      .digest()
      .readUInt32BE(0) % profile.suggestedSkills.length;
  return profile.suggestedSkills.filter((_, i) => i !== index);
}
async function main() {
  const args = process.argv.slice(2),
    apply = args.includes("--apply");
  if (
    !args.includes("--project=codovate-dev") ||
    args.some((a) => !["--project=codovate-dev", "--apply"].includes(a))
  )
    throw new Error(
      "Usage: node scripts/vary-import-skills.mjs --project=codovate-dev [--apply]",
    );
  if (process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error("Production tool refuses emulator settings.");
  const { initializeApp, applicationDefault } = await import(
    "firebase-admin/app"
  );
  const { getFirestore, FieldPath, FieldValue } = await import(
    "firebase-admin/firestore"
  );
  initializeApp({
    projectId: "codovate-dev",
    credential: applicationDefault(),
  });
  const db = getFirestore(),
    counts = { scanned: 0, changed: 0, skipped: 0 };
  let cursor;
  while (true) {
    let query = db
      .collection("users")
      .where("importSource", "==", "student_workbook_v1")
      .orderBy(FieldPath.documentId())
      .limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;
    for (const snapshot of page.docs) {
      const changed = await db.runTransaction(async (tx) => {
        const user = snapshot.ref,
          card = db.doc(`memberProfiles/${snapshot.id}`);
        const [u, c] = await tx.getAll(user, card);
        if (!u.exists) return false;
        const skills = reducedSuggestions(snapshot.id, u.data());
        if (!skills) return false;
        if (apply) {
          tx.update(user, {
            suggestedSkills: skills,
            importSkillVariation: {
              version: "v1",
              originalSkills: u.data().suggestedSkills,
              appliedAt: FieldValue.serverTimestamp(),
            },
            updatedAt: FieldValue.serverTimestamp(),
          });
          if (
            c.exists &&
            !c.data().skills?.length &&
            Array.isArray(c.data().suggestedSkills)
          )
            tx.update(card, {
              suggestedSkills: skills,
              updatedAt: FieldValue.serverTimestamp(),
            });
        }
        return true;
      });
      counts.scanned++;
      counts[changed ? "changed" : "skipped"]++;
    }
    cursor = page.docs.at(-1);
    console.log(
      JSON.stringify({ mode: apply ? "apply" : "preview", ...counts }),
    );
  }
  console.log(
    "Finished. Confirmed skills and private discovery choices were preserved.",
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
