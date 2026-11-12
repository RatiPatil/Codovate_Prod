import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
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
const uid = "default-visibility-student",
  db = env.authenticatedContext(uid).firestore();
const details = {
  desiredRole: "",
  domain: "",
  experience: "",
  college: "",
  degree: "",
  year: "",
  location: "",
  photoUrl: "",
  achievements: [],
  seeking: [],
  passions: [],
};
try {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users", uid), {
      name: "Example Student",
      skills: [],
    });
  });
  const pref = doc(db, "discoveryPreferences", uid),
    member = doc(db, "memberProfiles", uid);
  let batch = writeBatch(db);
  batch.set(pref, {
    uid,
    details,
    discoverable: true,
    shareDetails: true,
    updatedAt: serverTimestamp(),
  });
  batch.set(member, {
    uid,
    name: "Example Student",
    skills: [],
    details,
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
  await assertFails(
    updateDoc(pref, { discoverable: false, updatedAt: serverTimestamp() }),
  );
  batch = writeBatch(db);
  batch.update(pref, { discoverable: false, updatedAt: serverTimestamp() });
  batch.delete(member);
  await assertSucceeds(batch.commit());
  await assertFails(
    setDoc(member, {
      uid,
      name: "Example Student",
      skills: [],
      updatedAt: serverTimestamp(),
    }),
  );
  batch = writeBatch(db);
  batch.update(pref, { discoverable: true, updatedAt: serverTimestamp() });
  batch.set(member, {
    uid,
    name: "Example Student",
    skills: [],
    details,
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
  const other = env.authenticatedContext("different-student").firestore();
  await assertFails(
    updateDoc(doc(other, "discoveryPreferences", uid), {
      discoverable: false,
      updatedAt: serverTimestamp(),
    }),
  );
  await env.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), "users", uid), {
      importSource: "student_workbook_v1",
      suggestedSkills: ["Programming fundamentals"],
    });
  });
  await assertSucceeds(
    updateDoc(member, {
      suggestedSkills: ["Programming fundamentals"],
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(member, {
      suggestedSkills: ["Fake expert certification"],
      updatedAt: serverTimestamp(),
    }),
  );
  batch = writeBatch(db);
  batch.update(pref, {
    "details.fieldOfStudy": "F".repeat(180),
    updatedAt: serverTimestamp(),
  });
  batch.update(member, {
    "details.fieldOfStudy": "F".repeat(180),
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
  batch = writeBatch(db);
  batch.update(pref, {
    "details.fieldOfStudy": "F".repeat(181),
    updatedAt: serverTimestamp(),
  });
  batch.update(member, {
    "details.fieldOfStudy": "F".repeat(181),
    updatedAt: serverTimestamp(),
  });
  await assertFails(batch.commit());
  console.log("10 default-discovery security checks passed.");
} finally {
  await env.cleanup();
}
