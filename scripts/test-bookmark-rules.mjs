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
  getDocs,
  query,
  where,
  collection,
  updateDoc,
  deleteDoc,
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
let n = 0;
const pass = async (p) => {
    await assertSucceeds(p);
    n++;
  },
  fail = async (p) => {
    await assertFails(p);
    n++;
  };
try {
  const alice = env.authenticatedContext("alice").firestore(),
    bob = env.authenticatedContext("bob").firestore(),
    guest = env.unauthenticatedContext().firestore();
  await env.withSecurityRulesDisabled(async (c) =>
    setDoc(doc(c.firestore(), "opportunities", "managed-save-test"), {
      title: "Managed job",
      organization: "Employer",
      type: "job",
      status: "published",
    }),
  );
  const ref = (db, id) => doc(db, "bookmarks", "alice_" + id),
    base = {
      studentId: "alice",
      opportunityId: "managed-save-test",
      title: "Managed job",
      organization: "Employer",
      type: "job",
      createdAt: serverTimestamp(),
    };
  await pass(setDoc(ref(alice, base.opportunityId), base));
  const external = {
    ...base,
    opportunityId: "external-save-test",
    title: "Official job",
    source: "external",
    sourceUrl: "https://employer.example/job",
  };
  await pass(setDoc(ref(alice, external.opportunityId), external));
  const directory = {
    ...external,
    opportunityId: "directory-save-test",
    title: "Hackathon reference",
    type: "hackathon",
    source: "directory",
    sourceUrl: "",
  };
  await pass(setDoc(ref(alice, directory.opportunityId), directory));
  await pass(
    getDocs(
      query(collection(alice, "bookmarks"), where("studentId", "==", "alice")),
    ),
  );
  await fail(getDoc(ref(bob, external.opportunityId)));
  await fail(getDoc(ref(guest, external.opportunityId)));
  await fail(
    setDoc(ref(bob, "cross-owner"), {
      ...external,
      opportunityId: "cross-owner",
    }),
  );
  await fail(
    setDoc(ref(alice, "bad-url"), {
      ...external,
      opportunityId: "bad-url",
      sourceUrl: "javascript:alert(1)",
    }),
  );
  await fail(
    setDoc(ref(alice, "too-long"), {
      ...external,
      opportunityId: "too-long",
      title: "x".repeat(181),
    }),
  );
  await fail(
    setDoc(ref(alice, "bad-source"), {
      ...external,
      opportunityId: "bad-source",
      source: "trusted",
    }),
  );
  await fail(
    setDoc(ref(alice, "missing-managed"), {
      ...base,
      opportunityId: "missing-managed",
    }),
  );
  await fail(
    setDoc(ref(alice, "bad-directory-id"), {
      ...directory,
      opportunityId: "bad-directory-id",
    }),
  );
  await fail(
    updateDoc(ref(alice, external.opportunityId), { studentId: "bob" }),
  );
  await fail(deleteDoc(ref(bob, external.opportunityId)));
  await pass(deleteDoc(ref(alice, external.opportunityId)));
  console.log(`${n} bookmark privacy and reference checks passed`);
} finally {
  await env.cleanup();
}
