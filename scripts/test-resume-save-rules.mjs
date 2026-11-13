import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import assert from "node:assert/strict";
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
  const owner = env.authenticatedContext("resume-owner").firestore(),
    other = env.authenticatedContext("other-student").firestore(),
    guest = env.unauthenticatedContext().firestore();
  const path = (db) => doc(db, "users", "resume-owner");
  await env.withSecurityRulesDisabled((c) =>
    setDoc(path(c.firestore()), {
      name: "STUDENT NAME",
      email: "student@example.com",
      college: "College",
      degree: "MCA",
      graduationYear: "2027",
      city: "Solapur",
      bio: "",
      skills: [],
      portfolio: "",
      resumePath: "",
      resumeUrl: "",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }),
  );
  await assertSucceeds(
    updateDoc(path(owner), {
      resumeUrl: "https://provider.example/resume.pdf",
      updatedAt: serverTimestamp(),
    }),
  );
  assert.equal(
    (await getDoc(path(owner))).data().resumeUrl,
    "https://provider.example/resume.pdf",
  );
  await assertSucceeds(
    updateDoc(path(owner), {
      resumePath: "resumes/resume-owner/resume.pdf",
      resumeUrl: "",
      updatedAt: serverTimestamp(),
    }),
  );
  const saved = (await getDoc(path(owner))).data();
  assert.equal(saved.resumeUrl, "");
  assert.equal(saved.resumePath, "resumes/resume-owner/resume.pdf");
  assert.equal(saved.college, "College");
  await assertFails(
    updateDoc(path(owner), {
      resumePath: "resumes/other-student/resume.pdf",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(path(owner), {
      resumeUrl: "javascript:alert(1)",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(getDoc(path(other)));
  await assertFails(getDoc(path(guest)));
  console.log("8 résumé persistence and private-access checks passed");
} finally {
  await env.cleanup();
}
