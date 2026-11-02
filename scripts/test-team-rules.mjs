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
  deleteDoc,
  serverTimestamp,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
const example = JSON.parse(
  await readFile(new URL("../database/examples.json", import.meta.url), "utf8"),
).users[0].data;
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
const contexts = Object.fromEntries(
  ["team-a", "team-b", "team-c"].map((uid) => [
    uid,
    env.authenticatedContext(uid, { email: uid + "@example.com" }).firestore(),
  ]),
);
const a = contexts["team-a"],
  b = contexts["team-b"],
  c = contexts["team-c"],
  guest = env.unauthenticatedContext().firestore(),
  admin = env.authenticatedContext("team-admin", { admin: true }).firestore();
let checks = 0;
async function pass(label, p) {
  await p;
  checks++;
  console.log("PASS " + label);
}
const stamp = () => ({
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
const card = (uid, name) => ({
  uid,
  name,
  skills: ["React"],
  updatedAt: serverTimestamp(),
});
const group = {
  kind: "group",
  title: "Project Studio",
  ownerId: "team-a",
  members: ["team-a"],
  status: "active",
  ...stamp(),
};
try {
  await env.withSecurityRulesDisabled(async (ctx) => {
    for (const [uid, name] of [
      ["team-a", "Alice Team"],
      ["team-b", "Bob Team"],
      ["team-c", "Carol Team"],
    ])
      await setDoc(doc(ctx.firestore(), "users", uid), {
        ...example,
        resumePath: "",
        name,
        skills: ["React"],
        email: uid + "@example.com",
        mobile: "+919999999999",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
  });
  await pass(
    "owner publishes only confirmed name and skills",
    assertSucceeds(
      setDoc(doc(a, "memberProfiles", "team-a"), card("team-a", "Alice Team")),
    ),
  );
  await pass(
    "second member opts in",
    assertSucceeds(
      setDoc(doc(b, "memberProfiles", "team-b"), card("team-b", "Bob Team")),
    ),
  );
  await pass(
    "third member opts in",
    assertSucceeds(
      setDoc(doc(c, "memberProfiles", "team-c"), card("team-c", "Carol Team")),
    ),
  );
  const original = (await getDoc(doc(a, "users", "team-a"))).data();
  const profileSave = writeBatch(a);
  profileSave.update(doc(a, "users", "team-a"), {
    name: "Alice Team",
    skills: ["React"],
    updatedAt: serverTimestamp(),
  });
  profileSave.set(
    doc(a, "memberProfiles", "team-a"),
    card("team-a", "Alice Team"),
  );
  profileSave.set(doc(a, "adminUsers", "team-a"), {
    uid: "team-a",
    fullName: "Alice Team",
    joinedAt: original.createdAt,
    updatedAt: serverTimestamp(),
  });
  await pass(
    "profile, admin projection and discovery update atomically",
    assertSucceeds(profileSave.commit()),
  );
  const fullSkills = Array.from({ length: 20 }, (_, i) => "Skill " + i);
  const fullSave = writeBatch(a);
  fullSave.update(doc(a, "users", "team-a"), {
    skills: fullSkills,
    updatedAt: serverTimestamp(),
  });
  fullSave.update(doc(a, "memberProfiles", "team-a"), {
    skills: fullSkills,
    updatedAt: serverTimestamp(),
  });
  fullSave.update(doc(a, "adminUsers", "team-a"), {
    updatedAt: serverTimestamp(),
  });
  await pass(
    "maximum skill list saves across all three projections",
    assertSucceeds(fullSave.commit()),
  );
  const restore = writeBatch(a);
  restore.update(doc(a, "users", "team-a"), {
    skills: ["React"],
    updatedAt: serverTimestamp(),
  });
  restore.update(doc(a, "memberProfiles", "team-a"), {
    skills: ["React"],
    updatedAt: serverTimestamp(),
  });
  await restore.commit();
  for (const [label, skills] of [
    ["mixed number", ["React", 1]],
    ["mixed boolean", ["React", true]],
    ["mixed null", ["React", null]],
    ["mixed map", ["React", {}]],
        ["multiline label", ["React\nPython"]],
    ["carriage return", ["React\rPython"]],
    ["oversized label", ["x".repeat(61)]],
    ["empty label", [""]],
    ["too many skills", Array.from({ length: 21 }, (_, i) => "Skill " + i)],
    ["duplicates", ["React", "React"]],
  ]) {
    await pass(
      "skill validation rejects " + label,
      assertFails(
        updateDoc(doc(a, "users", "team-a"), {
          skills,
          updatedAt: serverTimestamp(),
        }),
      ),
    );
  }
  await pass(
    "signed in discovery query allowed",
    assertSucceeds(getDocs(collection(a, "memberProfiles"))),
  );
  await pass(
    "guest cannot browse member profiles",
    assertFails(getDocs(collection(guest, "memberProfiles"))),
  );
  await pass(
    "discovery rejects mobile and email",
    assertFails(
      setDoc(doc(a, "memberProfiles", "team-a"), {
        ...card("team-a", "Alice Team"),
        email: "private@example.com",
        mobile: "+919999999999",
      }),
    ),
  );
  await pass(
    "discovery rejects unconfirmed skills",
    assertFails(
      setDoc(doc(a, "memberProfiles", "team-a"), {
        ...card("team-a", "Alice Team"),
        skills: ["Invented"],
      }),
    ),
  );
  await pass(
    "discovery rejects name spoofing",
    assertFails(
      setDoc(doc(a, "memberProfiles", "team-a"), card("team-a", "Fake Name")),
    ),
  );
  await pass(
    "others cannot edit discovery profile",
    assertFails(
      setDoc(doc(b, "memberProfiles", "team-a"), card("team-a", "Alice Team")),
    ),
  );
  const connection = {
      fromId: "team-a",
      toId: "team-b",
      status: "pending",
      blockedBy: "",
      ...stamp(),
    },
    cid = "team-a_team-b";
  await pass(
    "connection invitation created",
    assertSucceeds(setDoc(doc(a, "connections", cid), connection)),
  );
  await pass(
    "reverse duplicate invitation rejected",
    assertFails(
      setDoc(doc(b, "connections", "team-b_team-a"), {
        fromId: "team-b",
        toId: "team-a",
        status: "pending",
        blockedBy: "",
        ...stamp(),
      }),
    ),
  );
  await pass(
    "sender cannot self-accept",
    assertFails(
      updateDoc(doc(a, "connections", cid), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "outsider cannot read connection",
    assertFails(getDoc(doc(c, "connections", cid))),
  );
  const direct = {
    kind: "direct",
    connectionId: cid,
    members: ["team-a", "team-b"],
    createdAt: serverTimestamp(),
  };
  await pass(
    "pending connection cannot open chat",
    assertFails(setDoc(doc(a, "conversations", "dm_" + cid), direct)),
  );
  await pass(
    "recipient accepts connection",
    assertSucceeds(
      updateDoc(doc(b, "connections", cid), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "accepted pair opens direct chat",
    assertSucceeds(setDoc(doc(a, "conversations", "dm_" + cid), direct)),
  );
  await pass(
    "cannot add outsider to direct chat",
    assertFails(
      updateDoc(doc(a, "conversations", "dm_" + cid), {
        members: ["team-a", "team-b", "team-c"],
      }),
    ),
  );
  const message = {
    senderId: "team-a",
    senderName: "Alice Team",
    text: "Hello, let's build together.",
    createdAt: serverTimestamp(),
  };
  const dm = doc(a, "conversations", "dm_" + cid, "messages", "hello");
  await pass("member sends real message", assertSucceeds(setDoc(dm, message)));
  await pass(
    "recipient reads message",
    assertSucceeds(
      getDoc(doc(b, "conversations", "dm_" + cid, "messages", "hello")),
    ),
  );
  await pass(
    "outsider cannot read chat",
    assertFails(
      getDoc(doc(c, "conversations", "dm_" + cid, "messages", "hello")),
    ),
  );
  await pass(
    "admin has no automatic private chat access",
    assertFails(
      getDoc(doc(admin, "conversations", "dm_" + cid, "messages", "hello")),
    ),
  );
  await pass(
    "sender cannot impersonate another name",
    assertFails(
      setDoc(doc(a, "conversations", "dm_" + cid, "messages", "spoof"), {
        ...message,
        senderName: "Bob Team",
      }),
    ),
  );
  await pass(
    "oversized messages rejected",
    assertFails(
      setDoc(doc(a, "conversations", "dm_" + cid, "messages", "large"), {
        ...message,
        text: "x".repeat(1501),
      }),
    ),
  );
  await pass(
    "message history cannot be edited",
    assertFails(updateDoc(dm, { text: "changed" })),
  );
  await pass(
    "owner creates group",
    assertSucceeds(setDoc(doc(a, "conversations", "team-project"), group)),
  );
  await pass(
    "cannot silently add group members",
    assertFails(
      updateDoc(doc(a, "conversations", "team-project"), {
        members: ["team-a", "team-b"],
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "outsider cannot read group",
    assertFails(getDoc(doc(c, "conversations", "team-project"))),
  );
  const invite = {
    groupId: "team-project",
    ownerId: "team-a",
    studentId: "team-b",
    status: "pending",
    ...stamp(),
  };
  await pass(
    "owner sends group invite",
    assertSucceeds(
      setDoc(doc(a, "groupInvites", "team-project_team-b"), invite),
    ),
  );
  await pass(
    "invitee can preview group",
    assertSucceeds(getDoc(doc(b, "conversations", "team-project"))),
  );
  await pass(
    "invite alone does not permit chat reading",
    assertFails(
      getDocs(collection(b, "conversations", "team-project", "messages")),
    ),
  );
  await pass(
    "acceptance must also join group",
    assertFails(
      updateDoc(doc(b, "groupInvites", "team-project_team-b"), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  const join = writeBatch(b);
  join.update(doc(b, "conversations", "team-project"), {
    members: ["team-a", "team-b"],
    updatedAt: serverTimestamp(),
  });
  join.update(doc(b, "groupInvites", "team-project_team-b"), {
    status: "accepted",
    updatedAt: serverTimestamp(),
  });
  await pass(
    "invitation acceptance and membership commit atomically",
    assertSucceeds(join.commit()),
  );
  await pass(
    "group member sends message",
    assertSucceeds(
      setDoc(
        doc(b, "conversations", "team-project", "messages", "group-hello"),
        {
          senderId: "team-b",
          senderName: "Bob Team",
          text: "Ready!",
          createdAt: serverTimestamp(),
        },
      ),
    ),
  );
  await pass(
    "group owner reads chat",
    assertSucceeds(
      getDoc(
        doc(a, "conversations", "team-project", "messages", "group-hello"),
      ),
    ),
  );
  await pass(
    "unrelated user cannot join without invitation",
    assertFails(
      updateDoc(doc(c, "conversations", "team-project"), {
        members: ["team-a", "team-b", "team-c"],
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "participant can query own groups",
    assertSucceeds(
      getDocs(
        query(
          collection(b, "conversations"),
          where("kind", "==", "group"),
          where("members", "array-contains", "team-b"),
        ),
      ),
    ),
  );
  await pass(
    "unfiltered conversation enumeration rejected",
    assertFails(getDocs(collection(b, "conversations"))),
  );
  await pass(
    "owner removes member",
    assertSucceeds(
      updateDoc(doc(a, "conversations", "team-project"), {
        members: ["team-a"],
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "removed member cannot read old messages",
    assertFails(
      getDoc(
        doc(b, "conversations", "team-project", "messages", "group-hello"),
      ),
    ),
  );
  await pass(
    "removed member cannot send messages",
    assertFails(
      setDoc(doc(b, "conversations", "team-project", "messages", "removed"), {
        senderId: "team-b",
        senderName: "Bob Team",
        text: "No",
        createdAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "owner can invite another member",
    assertSucceeds(
      setDoc(doc(a, "groupInvites", "team-project_team-c"), {
        groupId: "team-project",
        ownerId: "team-a",
        studentId: "team-c",
        status: "pending",
        ...stamp(),
      }),
    ),
  );
  await pass(
    "owner cancels pending invitation",
    assertSucceeds(
      updateDoc(doc(a, "groupInvites", "team-project_team-c"), {
        status: "revoked",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "cancelled invite no longer grants group preview",
    assertFails(getDoc(doc(c, "conversations", "team-project"))),
  );
  await pass(
    "owner archives group",
    assertSucceeds(
      updateDoc(doc(a, "conversations", "team-project"), {
        status: "archived",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "archived group preserves member history",
    assertSucceeds(
      getDoc(
        doc(a, "conversations", "team-project", "messages", "group-hello"),
      ),
    ),
  );
  await pass(
    "archived group rejects new messages",
    assertFails(
      setDoc(
        doc(a, "conversations", "team-project", "messages", "archived"),
        message,
      ),
    ),
  );
  await pass(
    "recipient blocks direct connection",
    assertSucceeds(
      updateDoc(doc(b, "connections", cid), {
        status: "blocked",
        blockedBy: "team-b",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "blocked member cannot read direct history",
    assertFails(getDoc(dm)),
  );
  await pass(
    "blocked member cannot send messages",
    assertFails(
      setDoc(
        doc(a, "conversations", "dm_" + cid, "messages", "blocked"),
        message,
      ),
    ),
  );
  await pass(
    "blocked party cannot unblock itself",
    assertFails(
      updateDoc(doc(a, "connections", cid), {
        status: "declined",
        blockedBy: "",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "blocker can unblock",
    assertSucceeds(
      updateDoc(doc(b, "connections", cid), {
        status: "declined",
        blockedBy: "",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "sender can send a new request",
    assertSucceeds(
      updateDoc(doc(a, "connections", cid), {
        status: "pending",
        blockedBy: "",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await pass(
    "owner hides discovery profile",
    assertSucceeds(deleteDoc(doc(a, "memberProfiles", "team-a"))),
  );
  console.log(`${checks} team collaboration security checks passed.`);
} finally {
  await env.cleanup();
}
