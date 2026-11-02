import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import {
  teamSnapshot,
  teamListing,
} from "../frontend/src/projectTeamDomain.js";
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
const ids = ["project-a", "project-b", "project-c", "project-d"],
  clients = ids.map((uid) =>
    env.authenticatedContext(uid, { email: uid + "@example.com" }).firestore(),
  ),
  [a, b, c, d] = clients,
  guest = env.unauthenticatedContext().firestore();
let checks = 0;
async function check(label, p) {
  await p;
  checks++;
  console.log("PASS " + label);
}
const details = {
  desiredRole: "Frontend Developer",
  domain: "Web Development",
  experience: "Beginner",
  college: "Example College",
  year: "Second year",
  location: "Example City",
  photoUrl: "",
  achievements: ["Student project"],
  seeking: ["Project Collaborators"],
  passions: ["Open Source"],
};
const stamp = () => ({
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
const card = (uid) => ({
  uid,
  name: uid,
  skills: ["React"],
  updatedAt: serverTimestamp(),
});
function revision(db, id, team, actor, extra = () => {}) {
  const batch = writeBatch(db),
    h = doc(collection(db, "projectTeams", id, "history")),
    next = { ...team, historyId: h.id, updatedAt: serverTimestamp() };
  batch.set(doc(db, "projectTeams", id), next);
  batch.set(h, {
    teamId: id,
    actorId: actor,
    snapshot: teamSnapshot(next),
    createdAt: serverTimestamp(),
  });
  batch.set(
    doc(db, "teamListings", id),
    teamListing(id, next, serverTimestamp()),
  );
  extra(batch);
  return batch.commit();
}
async function current() {
  return (await getDoc(doc(a, "projectTeams", "studio"))).data();
}
const entry = (studentId) => ({
  teamId: "studio",
  ownerId: ids[0],
  studentId,
  status: "pending",
  ...stamp(),
});
try {
  const example = JSON.parse(
    await readFile(
      new URL("../database/examples.json", import.meta.url),
      "utf8",
    ),
  ).users[0].data;
  await env.withSecurityRulesDisabled(async (ctx) => {
    for (const uid of ids)
      await setDoc(doc(ctx.firestore(), "users", uid), {
        ...example,
        name: uid,
        email: uid + "@example.com",
        resumePath: "",
        skills: ["React"],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
  });
  for (let i = 0; i < ids.length; i++)
    await setDoc(doc(clients[i], "memberProfiles", ids[i]), card(ids[i]));
  const share = writeBatch(a);
  share.set(doc(a, "discoveryPreferences", ids[0]), {
    uid: ids[0],
    details,
    shareDetails: true,
    updatedAt: serverTimestamp(),
  });
  share.set(doc(a, "memberProfiles", ids[0]), { ...card(ids[0]), details });
  await check(
    "optional details require an explicit consistent opt-in",
    assertSucceeds(share.commit()),
  );
  const maximumSkills = Array.from({ length: 20 }, (_, i) => "Skill " + i),
    maximumDetails = {
      ...details,
      achievements: Array.from({ length: 6 }, (_, i) => "Achievement " + i),
      seeking: [
        "Hackathon Teammates",
        "Project Collaborators",
        "Startup Co-founders",
        "Research Partners",
      ],
      passions: [
        "AI Products",
        "Hackathons",
        "Open Source",
        "Research",
        "Entrepreneurship",
        "Community Projects",
      ],
    };
  const privateProfile = (await getDoc(doc(a, "users", ids[0]))).data();
  const full = writeBatch(a);
  full.update(doc(a, "users", ids[0]), {
    skills: maximumSkills,
    updatedAt: serverTimestamp(),
  });
  full.set(doc(a, "adminUsers", ids[0]), {
    uid: ids[0],
    fullName: ids[0],
    joinedAt: privateProfile.createdAt,
    updatedAt: serverTimestamp(),
  });
  full.set(doc(a, "discoveryPreferences", ids[0]), {
    uid: ids[0],
    details: maximumDetails,
    shareDetails: true,
    updatedAt: serverTimestamp(),
  });
  full.set(doc(a, "memberProfiles", ids[0]), {
    ...card(ids[0]),
    skills: maximumSkills,
    details: maximumDetails,
  });
  await check(
    "full profile and optional discovery limits remain within the rules budget",
    assertSucceeds(full.commit()),
  );
  const restore = writeBatch(a);
  restore.update(doc(a, "users", ids[0]), {
    skills: ["React"],
    updatedAt: serverTimestamp(),
  });
  restore.set(doc(a, "discoveryPreferences", ids[0]), {
    uid: ids[0],
    details,
    shareDetails: true,
    updatedAt: serverTimestamp(),
  });
  restore.set(doc(a, "memberProfiles", ids[0]), { ...card(ids[0]), details });
  await restore.commit();
  await check(
    "another student can read chosen discovery details",
    assertSucceeds(getDoc(doc(b, "memberProfiles", ids[0]))),
  );
  await check(
    "private discovery preferences remain owner-only",
    assertFails(getDoc(doc(b, "discoveryPreferences", ids[0]))),
  );
  await check(
    "cannot insert contacts in public profile",
    assertFails(
      setDoc(doc(a, "memberProfiles", ids[0]), {
        ...card(ids[0]),
        email: "private@example.com",
        details,
      }),
    ),
  );
  await check(
    "extra private detail fields are rejected",
    assertFails(
      setDoc(doc(a, "discoveryPreferences", ids[0]), {
        uid: ids[0],
        details: { ...details, mobile: "9999999999" },
        shareDetails: true,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "untrusted photo host rejected",
    assertFails(
      setDoc(doc(a, "discoveryPreferences", ids[0]), {
        uid: ids[0],
        details: { ...details, photoUrl: "https://example.com/tracker" },
        shareDetails: true,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "cannot disable sharing while leaving extra fields published",
    assertFails(
      updateDoc(doc(a, "discoveryPreferences", ids[0]), {
        shareDetails: false,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  const hide = writeBatch(a);
  hide.update(doc(a, "discoveryPreferences", ids[0]), {
    shareDetails: false,
    updatedAt: serverTimestamp(),
  });
  hide.set(doc(a, "memberProfiles", ids[0]), card(ids[0]));
  await check(
    "withdrawing extra-field consent removes only public details",
    assertSucceeds(hide.commit()),
  );
  if (
    !(await getDoc(doc(a, "discoveryPreferences", ids[0]))).data().details
      .college
  )
    throw new Error("Private preferences were lost.");
  await check(
    "private dismissal stored",
    assertSucceeds(
      setDoc(doc(a, "discoveryDismissals", ids[0], "members", ids[1]), {
        studentId: ids[0],
        peerId: ids[1],
        dismissed: true,
        ...stamp(),
      }),
    ),
  );
  await check(
    "other students cannot read dismissals",
    assertFails(
      getDoc(doc(b, "discoveryDismissals", ids[0], "members", ids[1])),
    ),
  );
  await check(
    "restoring a dismissal preserves its original record",
    assertSucceeds(
      updateDoc(doc(a, "discoveryDismissals", ids[0], "members", ids[1]), {
        dismissed: false,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  const team = {
    ownerId: ids[0],
    title: "Project Studio",
    description: "Build a student project",
    requiredSkills: ["React"],
    capacity: 2,
    recruitment: "recruiting",
    lifecycle: "active",
    members: [ids[0]],
    roles: { [ids[0]]: "leader" },
    version: 1,
    createdAt: serverTimestamp(),
  };
  await check(
    "leader cannot create a team without history and chat",
    assertFails(
      setDoc(doc(a, "projectTeams", "bad"), {
        ...team,
        historyId: "missing",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "create team, chat, listing and revision atomically",
    assertSucceeds(
      revision(a, "studio", team, ids[0], (batch) =>
        batch.set(doc(a, "conversations", "studio"), {
          kind: "team",
          teamId: "studio",
          createdAt: serverTimestamp(),
        }),
      ),
    ),
  );
  await check(
    "maximum team capacity and required skills are supported",
    assertSucceeds(
      revision(
        a,
        "maximum-team",
        { ...team, capacity: 12, requiredSkills: maximumSkills },
        ids[0],
        (batch) =>
          batch.set(doc(a, "conversations", "maximum-team"), {
            kind: "team",
            teamId: "maximum-team",
            createdAt: serverTimestamp(),
          }),
      ),
    ),
  );
  await check(
    "public listing is safe to discover after sign-in",
    assertSucceeds(
      getDocs(
        query(
          collection(b, "teamListings"),
          where("lifecycle", "==", "active"),
        ),
      ),
    ),
  );
  await check(
    "guest cannot enumerate team listings",
    assertFails(getDocs(collection(guest, "teamListings"))),
  );
  await check(
    "outsider cannot read private membership",
    assertFails(getDoc(doc(b, "projectTeams", "studio"))),
  );
  await check(
    "cannot forge listing membership count",
    assertFails(
      updateDoc(doc(a, "teamListings", "studio"), {
        memberCount: 12,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "team mutation requires a matching immutable revision",
    assertFails(
      updateDoc(doc(a, "projectTeams", "studio"), {
        description: "Silent edit",
        version: 2,
        historyId: "missing",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "leader invites student",
    assertSucceeds(
      setDoc(doc(a, "projectTeamInvites", "studio_" + ids[1]), entry(ids[1])),
    ),
  );
  await check(
    "invitee may preview team metadata",
    assertSucceeds(getDoc(doc(b, "projectTeams", "studio"))),
  );
  await check(
    "pending invitation does not grant chat",
    assertFails(getDocs(collection(b, "conversations", "studio", "messages"))),
  );
  let old = await current();
  await check(
    "leader cannot silently add unconsenting students",
    assertFails(
      revision(
        a,
        "studio",
        {
          ...old,
          members: [...old.members, ids[1]],
          roles: { ...old.roles, [ids[1]]: "member" },
          version: old.version + 1,
        },
        ids[0],
      ),
    ),
  );
  await check(
    "invite acceptance alone does not grant membership",
    assertFails(
      updateDoc(doc(b, "projectTeamInvites", "studio_" + ids[1]), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "joining team grants membership and chat in the same revision",
    assertSucceeds(
      revision(
        b,
        "studio",
        {
          ...old,
          members: [...old.members, ids[1]],
          roles: { ...old.roles, [ids[1]]: "member" },
          version: old.version + 1,
        },
        ids[1],
        (batch) =>
          batch.update(doc(b, "projectTeamInvites", "studio_" + ids[1]), {
            status: "accepted",
            updatedAt: serverTimestamp(),
          }),
      ),
    ),
  );
  await check(
    "joined member sees My Teams query",
    assertSucceeds(
      getDocs(
        query(
          collection(b, "projectTeams"),
          where("members", "array-contains", ids[1]),
        ),
      ),
    ),
  );
  const msg = {
    senderId: ids[1],
    senderName: ids[1],
    text: "Ready to collaborate",
    createdAt: serverTimestamp(),
  };
  await check(
    "joined member sends real team chat",
    assertSucceeds(
      setDoc(doc(b, "conversations", "studio", "messages", "hello"), msg),
    ),
  );
  await check(
    "leader reads team chat",
    assertSucceeds(
      getDoc(doc(a, "conversations", "studio", "messages", "hello")),
    ),
  );
  await check(
    "unrelated student cannot read team chat",
    assertFails(getDoc(doc(c, "conversations", "studio", "messages", "hello"))),
  );
  await check(
    "capacity rejects additional invitations",
    assertFails(
      setDoc(doc(a, "projectTeamInvites", "studio_" + ids[2]), entry(ids[2])),
    ),
  );
  await check(
    "capacity rejects join requests",
    assertFails(
      setDoc(doc(c, "projectTeamRequests", "studio_" + ids[2]), {
        ...entry(ids[2]),
        note: "I can help",
      }),
    ),
  );
  old = await current();
  await check(
    "ordinary member cannot promote themselves",
    assertFails(
      revision(
        b,
        "studio",
        {
          ...old,
          roles: { ...old.roles, [ids[1]]: "mentor" },
          version: old.version + 1,
        },
        ids[1],
      ),
    ),
  );
  await check(
    "leader can assign a team mentor role",
    assertSucceeds(
      revision(
        a,
        "studio",
        {
          ...old,
          roles: { ...old.roles, [ids[1]]: "mentor" },
          version: old.version + 1,
        },
        ids[0],
      ),
    ),
  );
  old = await current();
  await check(
    "capacity cannot shrink below current members",
    assertFails(
      revision(
        a,
        "studio",
        { ...old, capacity: 1, version: old.version + 1 },
        ids[0],
      ),
    ),
  );
  await check(
    "leader can increase capacity",
    assertSucceeds(
      revision(
        a,
        "studio",
        { ...old, capacity: 3, version: old.version + 1 },
        ids[0],
      ),
    ),
  );
  await check(
    "student requests to join using public listing",
    assertSucceeds(
      setDoc(doc(c, "projectTeamRequests", "studio_" + ids[2]), {
        ...entry(ids[2]),
        note: "I can help with React",
      }),
    ),
  );
  old = await current();
  await check(
    "requester cannot self-approve",
    assertFails(
      revision(
        c,
        "studio",
        {
          ...old,
          members: [...old.members, ids[2]],
          roles: { ...old.roles, [ids[2]]: "member" },
          version: old.version + 1,
        },
        ids[2],
        (batch) =>
          batch.update(doc(c, "projectTeamRequests", "studio_" + ids[2]), {
            status: "accepted",
            updatedAt: serverTimestamp(),
          }),
      ),
    ),
  );
  await check(
    "leader approves requested membership atomically",
    assertSucceeds(
      revision(
        a,
        "studio",
        {
          ...old,
          members: [...old.members, ids[2]],
          roles: { ...old.roles, [ids[2]]: "member" },
          version: old.version + 1,
        },
        ids[0],
        (batch) =>
          batch.update(doc(a, "projectTeamRequests", "studio_" + ids[2]), {
            status: "accepted",
            updatedAt: serverTimestamp(),
          }),
      ),
    ),
  );
  old = await current();
  const roles = { ...old.roles };
  delete roles[ids[1]];
  await check(
    "leader removes a member and records new membership",
    assertSucceeds(
      revision(
        a,
        "studio",
        {
          ...old,
          members: old.members.filter((uid) => uid !== ids[1]),
          roles,
          version: old.version + 1,
        },
        ids[0],
      ),
    ),
  );
  await check(
    "removed member cannot read retained messages",
    assertFails(getDoc(doc(b, "conversations", "studio", "messages", "hello"))),
  );
  await check(
    "removed member cannot read private team history",
    assertFails(getDocs(collection(b, "projectTeams", "studio", "history"))),
  );
  const history = await getDocs(
    collection(a, "projectTeams", "studio", "history"),
  );
  if (history.size !== 6)
    throw new Error(
      "Expected six retained team revisions, received " + history.size,
    );
  await check(
    "even the leader cannot rewrite old revisions",
    assertFails(updateDoc(history.docs[0].ref, { actorId: ids[2] })),
  );
  await check(
    "even the leader cannot delete old revisions",
    assertFails(deleteDoc(history.docs[0].ref)),
  );
  await check(
    "orphans cannot masquerade as committed history",
    assertFails(
      setDoc(doc(a, "projectTeams", "studio", "history", "forged"), {
        teamId: "studio",
        actorId: ids[0],
        snapshot: teamSnapshot(await current()),
        createdAt: serverTimestamp(),
      }),
    ),
  );
  old = await current();
  await check(
    "leader archives without deleting team or history",
    assertSucceeds(
      revision(
        a,
        "studio",
        {
          ...old,
          lifecycle: "archived",
          recruitment: "closed",
          version: old.version + 1,
        },
        ids[0],
      ),
    ),
  );
  await check(
    "archived team keeps member chat history readable",
    assertSucceeds(
      getDoc(doc(c, "conversations", "studio", "messages", "hello")),
    ),
  );
  await check(
    "archived team rejects new messages",
    assertFails(
      setDoc(doc(c, "conversations", "studio", "messages", "archived"), {
        senderId: ids[2],
        senderName: ids[2],
        text: "New message",
        createdAt: serverTimestamp(),
      }),
    ),
  );
  old = await current();
  const leftRoles = { ...old.roles };
  delete leftRoles[ids[2]];
  await check(
    "member may leave an archived team",
    assertSucceeds(
      revision(
        c,
        "studio",
        {
          ...old,
          members: [ids[0]],
          roles: leftRoles,
          version: old.version + 1,
        },
        ids[2],
      ),
    ),
  );
  await check(
    "leaving revokes chat access immediately",
    assertFails(getDoc(doc(c, "conversations", "studio", "messages", "hello"))),
  );
  await check(
    "team deletion is disallowed",
    assertFails(deleteDoc(doc(a, "projectTeams", "studio"))),
  );
  console.log(checks + " project team and discovery security checks passed.");
} finally {
  await env.cleanup();
}
