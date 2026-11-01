// Local operator tool only. Never import into the browser application.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
const [projectId, uid, action = "grant"] = process.argv.slice(2);
if (!projectId || !uid || !["grant", "revoke"].includes(action)) {
  console.error(
    "Usage: node scripts/set-admin.mjs NEW_PROJECT_ID USER_UID [grant|revoke]",
  );
  process.exit(1);
}
initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, {
  ...user.customClaims,
  admin: action === "grant",
});
console.log(
  `Admin ${action} complete for ${uid} in ${projectId}. Sign out and sign in to refresh the token.`,
);
