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
let checks = 0;
const pass = async (p) => {
  await assertSucceeds(p);
  checks++;
};
const fail = async (p) => {
  await assertFails(p);
  checks++;
};
try {
  const student = env.authenticatedContext("alice").firestore(),
    other = env.authenticatedContext("bob").firestore(),
    admin = env.authenticatedContext("admin", { admin: true }).firestore(),
    guest = env.unauthenticatedContext().firestore();
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), "mentorBookings", "alice_m1"), {
      studentId: "alice",
      status: "pending",
    });
  });
  const path = (db) => doc(db, "mentorWorkspaces", "alice_m1");
  const row = {
    bookingId: "alice_m1",
    studentId: "alice",
    preparation: { goal: "Review project", context: "", artifactUrl: "" },
    plan: { summary: "", actions: [] },
    completedActions: [],
    rating: 0,
    reflection: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await pass(getDoc(path(student)));
  await fail(getDoc(path(other)));
  await fail(setDoc(path(other), row));
  await pass(setDoc(path(student), row));
  await fail(getDoc(path(guest)));
  await pass(getDoc(path(admin)));
  await fail(
    updateDoc(path(student), {
      plan: { summary: "Fake advice", actions: ["Do work"] },
      updatedAt: serverTimestamp(),
    }),
  );
  await fail(
    updateDoc(path(student), {
      rating: 5,
      reflection: "Good",
      updatedAt: serverTimestamp(),
    }),
  );
  await fail(
    updateDoc(path(student), {
      completedActions: [0],
      updatedAt: serverTimestamp(),
    }),
  );
  await fail(
    updateDoc(path(admin), {
      plan: { summary: "Advice", actions: ["Build"] },
      updatedAt: serverTimestamp(),
    }),
  );
  await env.withSecurityRulesDisabled(async (c) => {
    await updateDoc(doc(c.firestore(), "mentorBookings", "alice_m1"), {
      status: "confirmed",
    });
  });
  await pass(
    updateDoc(path(admin), {
      plan: { summary: "Start with a diagram", actions: ["Draw the design"] },
      completedActions: [],
      updatedAt: serverTimestamp(),
    }),
  );
  await pass(
    updateDoc(path(student), {
      completedActions: [0],
      updatedAt: serverTimestamp(),
    }),
  );
  await fail(
    updateDoc(path(student), {
      completedActions: [0, 0],
      updatedAt: serverTimestamp(),
    }),
  );
  await fail(
    updateDoc(path(admin), {
      preparation: { goal: "Overwrite student", context: "", artifactUrl: "" },
      updatedAt: serverTimestamp(),
    }),
  );
  await fail(
    updateDoc(path(student), {
      studentId: "bob",
      updatedAt: serverTimestamp(),
    }),
  );
  await fail(
    updateDoc(path(student), {
      createdAt: Timestamp.fromMillis(1),
      updatedAt: serverTimestamp(),
    }),
  );
  await env.withSecurityRulesDisabled(async (c) => {
    await updateDoc(doc(c.firestore(), "mentorBookings", "alice_m1"), {
      status: "completed",
    });
  });
  await pass(
    updateDoc(path(student), {
      rating: 5,
      reflection: "I will draw the design.",
      updatedAt: serverTimestamp(),
    }),
  );
  await fail(
    updateDoc(path(student), { reflection: "", updatedAt: serverTimestamp() }),
  );
  await env.withSecurityRulesDisabled(async (c) => {
    await updateDoc(doc(c.firestore(), "mentorBookings", "alice_m1"), {
      status: "cancelled",
    });
  });
  await fail(
    updateDoc(path(student), {
      completedActions: [],
      updatedAt: serverTimestamp(),
    }),
  );
  await pass(getDoc(path(student)));
  console.log(`${checks} mentor workspace privacy and lifecycle checks passed`);
} finally {
  await env.cleanup();
}
