// Fixed credentials are deliberately limited to the LOCAL Auth/Firestore emulators.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
if (
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080"
)
  throw new Error(
    "Refusing: local Auth and Firestore emulator addresses are required. Never runs against a live project.",
  );
initializeApp({ projectId: "demo-codovate" });
const auth = getAuth();
const email = "admin@codovate.test",
  password = "Codovate-Local-Only-2026!";
let user;
try {
  user = await auth.getUserByEmail(email);
} catch (e) {
  if (e.code !== "auth/user-not-found") throw e;
  user = await auth.createUser({
    email,
    password,
    displayName: "Codovate Demo Admin",
  });
}
await auth.updateUser(user.uid, { password });
await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
const ref = getFirestore().doc("users/" + user.uid);
if (!(await ref.get()).exists)
  await ref.set({
    name: "Codovate Demo Admin",
    email,
    college: "",
    degree: "",
    graduationYear: "",
    city: "",
    bio: "",
    skills: [],
    portfolio: "",
    resumePath: "",
    resumeUrl: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
console.log(
  "LOCAL EMULATOR ONLY\nEmail: " +
    email +
    "\nPassword: " +
    password +
    "\nSign in through the normal login page with VITE_USE_EMULATORS=true.",
);
