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
  getDocs,
  collection,
  serverTimestamp,
  updateDoc,
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
const number = "+919999999999",
  data = (visibility) => ({
    uid: "alice",
    mobile: number,
    visibility,
    updatedAt: serverTimestamp(),
  });
async function seed(visibility, status = null, reverse = false) {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/alice"), { mobile: number });
    await setDoc(doc(db, "mobileSharing/alice"), data(visibility));
    if (status)
      await setDoc(
        doc(db, "connections/" + (reverse ? "bob_alice" : "alice_bob")),
        {
          fromId: reverse ? "bob" : "alice",
          toId: reverse ? "alice" : "bob",
          status,
        },
      );
  });
}
try {
  const alice = env.authenticatedContext("alice").firestore(),
    bob = env.authenticatedContext("bob").firestore(),
    anon = env.unauthenticatedContext().firestore();
  for (const mode of ["only_me", "none"]) {
    await seed(mode);
    await assertSucceeds(getDoc(doc(alice, "mobileSharing/alice")));
    await assertFails(getDoc(doc(bob, "mobileSharing/alice")));
  }
  await seed("everyone");
  await assertSucceeds(getDoc(doc(bob, "mobileSharing/alice")));
  await assertFails(getDoc(doc(anon, "mobileSharing/alice")));
  await assertFails(getDocs(collection(bob, "mobileSharing")));
  await assertFails(getDoc(doc(bob, "users/alice")));
  for (const reverse of [false, true]) {
    await seed("connections", "accepted", reverse);
    await assertSucceeds(getDoc(doc(bob, "mobileSharing/alice")));
  }
  for (const status of ["pending", "declined", "blocked"]) {
    await seed("connections", status);
    await assertFails(getDoc(doc(bob, "mobileSharing/alice")));
  }
  await seed("everyone", "blocked");
  await assertFails(getDoc(doc(bob, "mobileSharing/alice")));
  await seed("only_me");
  await assertSucceeds(
    setDoc(doc(alice, "mobileSharing/alice"), data("connections")),
  );
  await assertFails(setDoc(doc(bob, "mobileSharing/alice"), data("everyone")));
  await assertFails(
    setDoc(doc(alice, "mobileSharing/alice"), {
      ...data("everyone"),
      mobile: "+918888888888",
    }),
  );
  await assertFails(setDoc(doc(alice, "mobileSharing/alice"), data("invalid")));
  await seed("everyone");
  await env.withSecurityRulesDisabled((context) =>
    updateDoc(doc(context.firestore(), "users/alice"), {
      mobile: "+918888888888",
    }),
  );
  await assertFails(getDoc(doc(bob, "mobileSharing/alice")));
  console.log("19 mobile privacy security checks passed");
} finally {
  await env.cleanup();
}
