// Trusted operator. Publishes only an aggregate; never names or contact details.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
const args = process.argv.slice(2);
if (!args.includes("--project=codovate-dev") || args.some(a => !["--project=codovate-dev", "--apply"].includes(a))) throw new Error("Usage: node scripts/publish-community-count.mjs --project=codovate-dev [--apply]");
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error("Live count refuses emulator configuration");
try {
  const app = initializeApp({ projectId: "codovate-dev", credential: applicationDefault() });
  const db = getFirestore(app), auth = getAuth(app), ref = db.doc("publicStats/community");
  // Read before enumeration; write precondition prevents overwriting concurrent registrations.
  const before = await ref.get();
  let count = 0, token;
  do { const page = await auth.listUsers(1000, token); count += page.users.length; token = page.pageToken; } while (token);
  console.log(JSON.stringify({ registeredAccounts: count, mode: args.includes("--apply") ? "apply" : "dry-run" }));
  if (args.includes("--apply")) {
    const value = { registeredStudents: count, updatedAt: FieldValue.serverTimestamp() };
    if (before.exists) await ref.update(value, { lastUpdateTime: before.updateTime });
    else await ref.create(value);
    console.log("Public aggregate published. No private records were published. If a registration overlapped the first initialization, rerun to reconcile.");
  }
} catch (e) { console.error(e.code || e.message); process.exitCode = 1; }
