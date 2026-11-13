import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  Timestamp,
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
const rows = JSON.parse(
  await readFile(
    new URL("../frontend/src/projectLibrary.json", import.meta.url),
    "utf8",
  ),
);
try {
  const admin = env.authenticatedContext("admin", { admin: true }).firestore(),
    student = env.authenticatedContext("student").firestore(),
    anon = env.unauthenticatedContext().firestore();
  const row = {
      ...rows[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    ref = doc(admin, "projectLibrary", row.id);
  await assertSucceeds(setDoc(ref, row));
  await assertSucceeds(getDoc(doc(anon, "projectLibrary", row.id)));
  await assertFails(setDoc(doc(student, "projectLibrary", row.id), row));
  await assertSucceeds(
    updateDoc(ref, { status: "hidden", updatedAt: serverTimestamp() }),
  );
  await assertFails(
    updateDoc(ref, {
      sourceUrl: "https://malicious.example/a",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(ref, {
      createdAt: Timestamp.fromMillis(1),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(ref, { studentId: "fake", updatedAt: serverTimestamp() }),
  );
  await assertFails(
    updateDoc(ref, { sourceKind: "idea", updatedAt: serverTimestamp() }),
  );
  console.log("8 project library ownership and schema checks passed");
} finally {
  await env.cleanup();
}
