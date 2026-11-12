import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
const env = await initializeTestEnvironment({
  projectId: "demo-codovate",
  firestore: {
    host: "127.0.0.1",
    port: 8080,
    rules: await readFile(
      new URL("../firestore.rules", import.meta.url),
      "utf8",
    ),
  },
});
try {
  const details = {
    desiredRole: "",
    domain: "Research",
    experience: "Advanced",
    college: "",
    degree: "",
    fieldOfStudy: "",
    year: "",
    location: "",
    photoUrl: "",
    achievements: [],
    seeking: [],
    passions: [],
  };
  const base = {
    uid: "default-student",
    name: "Student",
    skills: [],
    details,
    updatedAt: serverTimestamp(),
  };
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/default-student"), {
      name: "Student",
      skills: [],
    });
    await setDoc(doc(db, "discoveryPreferences/default-student"), {
      uid: "default-student",
      details,
      shareDetails: true,
      discoverable: true,
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, "memberProfiles/default-student"), {
      ...base,
      importDefaults: { domain: "Research", experience: "Advanced" },
    });
  });
  const db = env.authenticatedContext("default-student").firestore(),
    ref = doc(db, "memberProfiles/default-student");
  await assertSucceeds(
    setDoc(ref, {
      ...base,
      updatedAt: serverTimestamp(),
      importDefaults: { domain: "Research", experience: "Advanced" },
    }),
  );
  await assertFails(
    setDoc(ref, {
      ...base,
      updatedAt: serverTimestamp(),
      importDefaults: { domain: "Research", experience: "Beginner" },
    }),
  );
  await assertSucceeds(setDoc(ref, { ...base, updatedAt: serverTimestamp() }));
  await assertFails(
    setDoc(ref, {
      ...base,
      updatedAt: serverTimestamp(),
      importDefaults: { domain: "Research" },
    }),
  );
  console.log("4 import-default provenance security checks passed");
} finally {
  await env.cleanup();
}
