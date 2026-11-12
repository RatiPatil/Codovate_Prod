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
  collection,
  updateDoc,
  deleteDoc,
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
const a = env.authenticatedContext("task-alice").firestore(),
  b = env.authenticatedContext("task-bob").firestore(),
  outsider = env.authenticatedContext("task-outsider").firestore(),
  admin = env.authenticatedContext("task-admin", { admin: true }).firestore();
let count = 0;
const pass = async (name, promise) => {
  await promise;
  count++;
  console.log("PASS " + name);
};
const ref = (db, id = "demo") =>
  doc(db, "projectTeams", "task-studio", "tasks", id);
const task = () => ({
  title: "Build working demo",
  description: "Finish the first prototype.",
  assigneeId: "task-bob",
  dueDate: "2028-02-29",
  status: "todo",
  createdBy: "task-alice",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
try {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "projectTeams", "task-studio"), {
      ownerId: "task-alice",
      members: ["task-alice", "task-bob"],
      roles: { "task-alice": "leader", "task-bob": "member" },
      lifecycle: "active",
    });
    await setDoc(doc(db, "memberProfiles", "task-bob"), {
      uid: "task-bob",
      name: "BOB",
      skills: [],
    });
  });
  await pass(
    "member creates task with current-member assignment",
    assertSucceeds(setDoc(ref(a), task())),
  );
  await pass("team member can read task", assertSucceeds(getDoc(ref(b))));
  await pass(
    "outsider cannot read private team tasks",
    assertFails(getDoc(ref(outsider))),
  );
  await pass(
    "admin has no implicit task access",
    assertFails(
      getDocs(collection(admin, "projectTeams", "task-studio", "tasks")),
    ),
  );
  await pass(
    "member can move task into progress",
    assertSucceeds(
      updateDoc(ref(b), { status: "doing", updatedAt: serverTimestamp() }),
    ),
  );
  await pass(
    "member cannot edit another creators task details",
    assertFails(
      updateDoc(ref(b), {
        title: "Changed by noncreator",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "creator can edit description",
    assertSucceeds(
      updateDoc(ref(a), {
        description: "New context",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "invalid calendar date is rejected",
    assertFails(
      updateDoc(ref(a), {
        dueDate: "2026-02-31",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "outsider assignment is rejected",
    assertFails(
      updateDoc(ref(a), {
        assigneeId: "task-outsider",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "creator identity cannot change",
    assertFails(
      updateDoc(ref(a), {
        createdBy: "task-bob",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "creation timestamp cannot change",
    assertFails(
      updateDoc(ref(a), {
        createdAt: Timestamp.fromMillis(1),
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "unknown task status is rejected",
    assertFails(
      updateDoc(ref(a), { status: "complete", updatedAt: serverTimestamp() }),
    ),
  );
  await pass(
    "extra contact fields cannot enter task contract",
    assertFails(
      updateDoc(ref(a), {
        email: "private@example.test",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "noncreator member cannot delete a task",
    assertFails(deleteDoc(ref(b))),
  );
  await pass(
    "member may create own unassigned task",
    assertSucceeds(
      setDoc(ref(b, "second"), {
        ...task(),
        createdBy: "task-bob",
        assigneeId: "",
      }),
    ),
  );
  await pass(
    "leader can edit a member task",
    assertSucceeds(
      updateDoc(ref(a, "second"), {
        title: "Clarified task",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "leader can delete a member task",
    assertSucceeds(deleteDoc(ref(a, "second"))),
  );
  await env.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), "projectTeams", "task-studio"), {
      members: ["task-alice"],
      roles: { "task-alice": "leader" },
    });
  });
  await pass(
    "removed member immediately loses task access",
    assertFails(getDoc(ref(b))),
  );
  await pass(
    "removed member cannot update task state",
    assertFails(
      updateDoc(ref(b), { status: "done", updatedAt: serverTimestamp() }),
    ),
  );
  await pass(
    "remaining member can finish a task whose assignee left",
    assertSucceeds(
      updateDoc(ref(a), { status: "done", updatedAt: serverTimestamp() }),
    ),
  );
  await env.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), "projectTeams", "task-studio"), {
      lifecycle: "archived",
    });
  });
  await pass(
    "archived tasks remain readable to members",
    assertSucceeds(getDoc(ref(a))),
  );
  await pass(
    "archived tasks reject status changes",
    assertFails(
      updateDoc(ref(a), { status: "todo", updatedAt: serverTimestamp() }),
    ),
  );
  await pass("archived tasks reject deletion", assertFails(deleteDoc(ref(a))));
  const saved = doc(
    a,
    "teammateShortlists",
    "task-alice",
    "members",
    "task-bob",
  );
  await pass(
    "shortlist stores only private owner references",
    assertSucceeds(
      setDoc(saved, {
        studentId: "task-alice",
        peerId: "task-bob",
        saved: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "another student cannot read shortlist",
    assertFails(
      getDoc(doc(b, "teammateShortlists", "task-alice", "members", "task-bob")),
    ),
  );
  await pass(
    "admin cannot enumerate private shortlists",
    assertFails(
      getDocs(collection(admin, "teammateShortlists", "task-alice", "members")),
    ),
  );
  await pass(
    "shortlist identity cannot change",
    assertFails(
      updateDoc(saved, {
        peerId: "task-outsider",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await env.withSecurityRulesDisabled(async (ctx) => {
    await deleteDoc(doc(ctx.firestore(), "memberProfiles", "task-bob"));
  });
  await pass(
    "owner can unsave a now-hidden student",
    assertSucceeds(
      updateDoc(saved, { saved: false, updatedAt: serverTimestamp() }),
    ),
  );
  await pass(
    "hidden student cannot be newly saved",
    assertFails(
      updateDoc(saved, { saved: true, updatedAt: serverTimestamp() }),
    ),
  );
  console.log(`${count} team task and shortlist security checks passed.`);
} finally {
  await env.cleanup();
}
