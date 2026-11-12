import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  serverTimestamp,
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
const alice = env.authenticatedContext("signal-alice").firestore(),
  bob = env.authenticatedContext("signal-bob").firestore(),
  outsider = env.authenticatedContext("signal-outsider").firestore();
let count = 0;
const check = async (name, promise) => {
  await promise;
  count++;
  console.log("PASS " + name);
};
try {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "connections", "signal-alice_signal-bob"), {
      fromId: "signal-alice",
      toId: "signal-bob",
      status: "accepted",
    });
    await setDoc(doc(db, "conversations", "dm_signal-alice_signal-bob"), {
      kind: "direct",
      connectionId: "signal-alice_signal-bob",
      members: ["signal-alice", "signal-bob"],
    });
    await setDoc(
      doc(db, "conversations", "dm_signal-alice_signal-bob", "messages", "one"),
      {
        senderId: "signal-alice",
        senderName: "Alice",
        text: "Hello",
        createdAt: Timestamp.now(),
      },
    );
  });
  const room = "dm_signal-alice_signal-bob";
  await check(
    "member can publish own typing state",
    assertSucceeds(
      setDoc(doc(alice, "conversations", room, "typing", "signal-alice"), {
        uid: "signal-alice",
        active: true,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "other participant can read typing indicators",
    assertSucceeds(getDocs(collection(bob, "conversations", room, "typing"))),
  );
  await check(
    "outsider cannot read private typing state",
    assertFails(getDocs(collection(outsider, "conversations", room, "typing"))),
  );
  await check(
    "member cannot spoof another typing identity",
    assertFails(
      setDoc(doc(alice, "conversations", room, "typing", "signal-bob"), {
        uid: "signal-bob",
        active: true,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "receipt confirms only the current participant",
    assertSucceeds(
      setDoc(doc(bob, "conversations", room, "readReceipts", "signal-bob"), {
        uid: "signal-bob",
        lastMessageId: "one",
        lastReadAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "other participant can read the receipt",
    assertSucceeds(
      getDocs(collection(alice, "conversations", room, "readReceipts")),
    ),
  );
  await check(
    "receipt must reference a real message",
    assertFails(
      setDoc(doc(bob, "conversations", room, "readReceipts", "signal-bob"), {
        uid: "signal-bob",
        lastMessageId: "nonexistent",
        lastReadAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "read time cannot be forged",
    assertFails(
      setDoc(doc(bob, "conversations", room, "readReceipts", "signal-bob"), {
        uid: "signal-bob",
        lastMessageId: "one",
        lastReadAt: Timestamp.fromMillis(1),
      }),
    ),
  );
  await check(
    "receipt cannot carry contact data",
    assertFails(
      setDoc(doc(bob, "conversations", room, "readReceipts", "signal-bob"), {
        uid: "signal-bob",
        lastMessageId: "one",
        lastReadAt: serverTimestamp(),
        email: "private@example.test",
      }),
    ),
  );
  await env.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(
      doc(ctx.firestore(), "connections", "signal-alice_signal-bob"),
      { status: "blocked" },
    );
  });
  await check(
    "blocking revokes typing reads",
    assertFails(getDocs(collection(bob, "conversations", room, "typing"))),
  );
  await check(
    "blocking revokes receipt writes",
    assertFails(
      setDoc(doc(bob, "conversations", room, "readReceipts", "signal-bob"), {
        uid: "signal-bob",
        lastMessageId: "one",
        lastReadAt: serverTimestamp(),
      }),
    ),
  );
  console.log(`${count} chat signal security checks passed.`);
} finally {
  await env.cleanup();
}
