import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
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
  const admin = env
      .authenticatedContext("catalog-admin", { admin: true })
      .firestore(),
    student = env.authenticatedContext("catalog-student").firestore(),
    anon = env.unauthenticatedContext().firestore();
  const data = { code: "BIOTECHNOLOGY", enabled: true };
  await assertSucceeds(setDoc(doc(admin, "studyFields/BIOTECHNOLOGY"), data));
  await assertSucceeds(getDoc(doc(student, "studyFields/BIOTECHNOLOGY")));
  await assertFails(getDoc(doc(anon, "studyFields/BIOTECHNOLOGY")));
  await assertFails(
    setDoc(doc(student, "studyFields/BIOTECHNOLOGY"), {
      ...data,
      enabled: false,
    }),
  );
  await assertFails(
    setDoc(doc(admin, "studyFields/BAD"), { code: "X", enabled: true }),
  );
  await assertFails(
    setDoc(doc(admin, "studyFields/BAD"), {
      ...data,
      email: "private@example.com",
    }),
  );
  await assertSucceeds(
    setDoc(doc(admin, "studyFields/BIOTECHNOLOGY"), {
      ...data,
      enabled: false,
    }),
  );
  await assertFails(deleteDoc(doc(admin, "studyFields/BIOTECHNOLOGY")));
  console.log("8 study catalog access and validation checks passed");
} finally {
  await env.cleanup();
}
