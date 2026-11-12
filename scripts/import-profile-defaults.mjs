// One-time trusted operator tool. Preview by default; does not create public cards.
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
export const VERSION = "import-profile-defaults-v1";
const technical = [
  "Web Development",
  "AI/ML",
  "Data Science",
  "Cyber Security",
  "Research",
];
const other = [
  "Startups",
  "Research",
  "Hackathons",
  "Web Development",
  "AI/ML",
];
export function domainChoices(field) {
  const value = String(field || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return /COMPUTER|MCA|ARTIFICIALINTELLIGENCE|AIML|DATASCIENCE|ELECTRONICS|TELECOMMUNICATION/.test(
    value,
  )
    ? technical
    : other;
}
function pick(uid, key, values) {
  return values[
    createHash("sha256")
      .update(`${VERSION}:${uid}:${key}`)
      .digest()
      .readUInt32BE(0) % values.length
  ];
}
const blank = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && !value.trim());
export function defaultsFor(uid, profile, preferences = {}, card = {}) {
  if (
    profile.importSource !== "student_workbook_v1" ||
    profile.onboarding?.status === "completed" ||
    profile.admin === true ||
    profile.isAdmin === true ||
    (profile.role && profile.role !== "student")
  )
    return {};
  const selected = {},
    career = profile.careerPreferences || {};
  for (const key of ["domain", "experience"]) {
    if (
      [career[key], preferences.details?.[key], card.details?.[key]].every(
        blank,
      )
    )
      selected[key] = pick(
        uid,
        key,
        key === "domain"
          ? domainChoices(profile.program || profile.degree)
          : ["Beginner", "Intermediate", "Advanced"],
      );
  }
  return selected;
}
async function main() {
  const args = process.argv.slice(2),
    apply = args.includes("--apply");
  if (
    !args.includes("--project=codovate-dev") ||
    args.some((arg) => !["--project=codovate-dev", "--apply"].includes(arg))
  )
    throw new Error(
      "Usage: node scripts/import-profile-defaults.mjs --project=codovate-dev [--apply]",
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
    counts = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      domains: {},
      experience: {},
    };
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
      const result = await db.runTransaction(async (tx) => {
        const uid = snapshot.id,
          user = db.doc(`users/${uid}`),
          pref = db.doc(`discoveryPreferences/${uid}`),
          card = db.doc(`memberProfiles/${uid}`),
          backup = db.doc(`importDefaultBackups/${uid}`);
        const [u, p, c, b] = await tx.getAll(user, pref, card, backup);
        if (!u.exists) return {};
        const values = defaultsFor(uid, u.data(), p.data(), c.data());
        if (!Object.keys(values).length || !apply) return values;
        if (!b.exists)
          tx.create(backup, {
            version: VERSION,
            user: u.data(),
            preferences: p.exists ? p.data() : null,
            memberProfile: c.exists ? c.data() : null,
            createdAt: FieldValue.serverTimestamp(),
          });
        const now = FieldValue.serverTimestamp(),
          root = { updatedAt: now },
          privatePatch = { updatedAt: now },
          publicPatch = { updatedAt: now };
        for (const [key, value] of Object.entries(values)) {
          root[`careerPreferences.${key}`] = value;
          root[`importAssignedDefaults.${key}`] = value;
          privatePatch[`details.${key}`] = value;
          publicPatch[`details.${key}`] = value;
        }
        root["importAssignedDefaults.version"] = VERSION;
        tx.update(user, root);
        if (p.exists && p.data().details) tx.update(pref, privatePatch);
        // Preserve explicit privacy choices and do not publish new cards.
        if (
          c.exists &&
          c.data().details &&
          p.data()?.details &&
          p.data()?.shareDetails === true &&
          p.data()?.discoverable !== false
        ) {
          publicPatch.importDefaults = {
            ...c.data().importDefaults,
            ...values,
          };
          tx.update(card, publicPatch);
        }
        return values;
      });
      counts.scanned++;
      if (Object.keys(result).length) {
        counts.updated++;
        for (const [key, value] of Object.entries(result)) {
          const target = key === "domain" ? counts.domains : counts.experience;
          target[value] = (target[value] || 0) + 1;
        }
      } else counts.skipped++;
    }
    cursor = page.docs.at(-1);
    console.log(
      JSON.stringify({ mode: apply ? "apply" : "preview", ...counts }),
    );
  }
  console.log(
    "Finished. Assigned values are import defaults, not verified student experience.",
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error("Import default update stopped:", error.message);
    process.exitCode = 1;
  });
