import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
} from "@firebase/rules-unit-testing";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getIdTokenResult,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  runTransaction,
  serverTimestamp,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
if (
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080"
)
  throw new Error(
    "Run only through firebase emulators:exec with Auth and Firestore on the documented local ports.",
  );
const projectId = "demo-codovate";
const env = await initializeTestEnvironment({
  projectId,
  firestore: {
    host: "127.0.0.1",
    port: 8080,
    rules: await readFile(
      new URL("../firestore.rules", import.meta.url),
      "utf8",
    ),
  },
});
const app = initializeApp(
  {
    projectId,
    apiKey: "local-emulator-key",
    appId: "1:123:web:emulator",
    authDomain: projectId + ".firebaseapp.com",
  },
  "login-regression",
);
const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8080);
try {
  const email = "login-regression-" + Date.now() + "@example.test";
  const registered = await createUserWithEmailAndPassword(
    auth,
    email,
    "sixsix",
  );
  const uid = registered.user.uid;
  await signOut(auth);
  const signedIn = await signInWithEmailAndPassword(auth, email, "sixsix");
  assert.equal(signedIn.user.uid, uid);
  console.log("PASS Firebase accepts an existing six-character password.");
  const profileRef = doc(db, "users", uid);
  async function ensureProfile() {
    await runTransaction(db, async (tx) => {
      const current = await tx.get(profileRef);
      if (current.exists()) return;
      tx.set(profileRef, {
        name: "Login Test",
        email,
        college: "",
        degree: "",
        graduationYear: "",
        city: "",
        bio: "",
        skills: [],
        portfolio: "",
        resumePath: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }
  await ensureProfile();
  assert.equal((await getDoc(profileRef)).data().name, "Login Test");
  console.log(
    "PASS authenticated profile transaction creates the owner profile.",
  );
  await updateDoc(profileRef, {
    college: "Regional College",
    updatedAt: serverTimestamp(),
  });
  await ensureProfile();
  assert.equal((await getDoc(profileRef)).data().college, "Regional College");
  console.log("PASS repeated sign-in initialization preserves profile data.");
  await assertFails(getDocs(collection(db, "users")));
  console.log("PASS signing in does not grant access to all profiles.");
  await signOut(auth);
  await assert.rejects(
    signInWithEmailAndPassword(auth, email, "not-the-password"),
  );
  console.log("PASS incorrect credentials remain rejected.");
  if (process.env.TEST_DEMO_ADMIN === "true") {
    const demo = await signInWithEmailAndPassword(
      auth,
      "admin@codovate.test",
      "Codovate-Local-Only-2026!",
    );
    assert.equal((await getIdTokenResult(demo.user, true)).claims.admin, true);
    console.log("PASS local demo login receives a verified admin claim.");
    await assertFails(getDocs(collection(db, "users")));
    console.log("PASS verified demo admin cannot access private student profiles.");
  }
} catch (e) {
  console.error(e.code || e.message);
  process.exitCode = 1;
} finally {
  await deleteApp(app);
  await env.cleanup();
}
