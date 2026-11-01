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
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getBytes } from "firebase/storage";
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
  storage: {
    host: "127.0.0.1",
    port: 9199,
    rules: await readFile(new URL("../storage.rules", import.meta.url), "utf8"),
  },
});
const alice = env.authenticatedContext("alice", { email: "alice@example.com" }),
  bob = env.authenticatedContext("bob", { email: "bob@example.com" }),
  admin = env.authenticatedContext("operator", {
    admin: true,
    email: "operator@example.com",
  }),
  guest = env.unauthenticatedContext();
let checks = 0;
async function check(name, promise) {
  await promise;
  checks++;
  console.log("PASS", name);
}
const profile = {
  name: "Alice",
  email: "alice@example.com",
  college: "Regional College",
  degree: "B.Tech",
  graduationYear: "2027",
  city: "Pune",
  bio: "Student",
  skills: ["React"],
  portfolio: "",
  resumePath: "resumes/alice/resume.pdf",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};
const listing = {
  title: "React intern",
  organization: "Test company",
  type: "internship",
  category: "Technology",
  mode: "Remote",
  location: "India",
  duration: "3 months",
  stipend: 10000,
  skills: ["React"],
  deadline: "2099-01-01T00:00:00.000Z",
  closesAt: Timestamp.fromDate(new Date("2099-01-01")),
  description: "Test listing",
  responsibilities: "Build",
  eligibility: "Students",
  status: "published",
  createdBy: "operator",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};
const application = {
  studentId: "alice",
  opportunityId: "op1",
  opportunityTitle: "React intern",
  organization: "Test company",
  studentName: "Alice",
  college: "Regional College",
  resumePath: "resumes/alice/resume.pdf",
  coverNote: "Interested",
  status: "submitted",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};
try {
  await env.clearFirestore();
  await check(
    "owner can read an absent profile before transactional creation",
    assertSucceeds(getDoc(doc(alice.firestore(), "users", "alice"))),
  );
  await check(
    "student creates own profile",
    assertSucceeds(setDoc(doc(alice.firestore(), "users", "alice"), profile)),
  );
  for (const patch of [
    { graduationYear: "abcd" },
    { graduationYear: "1999" },
    { skills: [7] },
    { skills: ["React", "React"] },
    { skills: ["x".repeat(61)] },
  ]) {
    await check(
      "invalid profile field denied: " + Object.keys(patch)[0],
      assertFails(
        updateDoc(doc(alice.firestore(), "users", "alice"), {
          ...patch,
          updatedAt: serverTimestamp(),
        }),
      ),
    );
  }
  await check(
    "student cannot grant admin through profile",
    assertFails(
      updateDoc(doc(alice.firestore(), "users", "alice"), {
        admin: true,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "cross-student profile read denied",
    assertFails(getDoc(doc(bob.firestore(), "users", "alice"))),
  );
  await check(
    "guest profile read denied",
    assertFails(getDoc(doc(guest.firestore(), "users", "alice"))),
  );
  await check(
    "student cannot publish",
    assertFails(
      setDoc(doc(alice.firestore(), "opportunities", "bad"), {
        ...listing,
        createdBy: "alice",
      }),
    ),
  );
  await check(
    "admin publishes",
    assertSucceeds(
      setDoc(doc(admin.firestore(), "opportunities", "op1"), listing),
    ),
  );
  await check(
    "guest can query published listings",
    assertSucceeds(
      getDocs(
        query(
          collection(guest.firestore(), "opportunities"),
          where("status", "==", "published"),
        ),
      ),
    ),
  );
  await check(
    "guest unrestricted listing query denied",
    assertFails(getDocs(collection(guest.firestore(), "opportunities"))),
  );
  await check(
    "owner can read absent application before transaction",
    assertSucceeds(getDoc(doc(alice.firestore(), "applications", "alice_op1"))),
  );
  await check(
    "valid application accepted",
    assertSucceeds(
      setDoc(doc(alice.firestore(), "applications", "alice_op1"), application),
    ),
  );
  await check(
    "duplicate application denied",
    assertFails(
      setDoc(doc(alice.firestore(), "applications", "alice_op1"), application),
    ),
  );
  await check(
    "student status change denied",
    assertFails(
      updateDoc(doc(alice.firestore(), "applications", "alice_op1"), {
        status: "selected",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "cross-student application read denied",
    assertFails(getDoc(doc(bob.firestore(), "applications", "alice_op1"))),
  );
  await check(
    "owner filtered query accepted",
    assertSucceeds(
      getDocs(
        query(
          collection(alice.firestore(), "applications"),
          where("studentId", "==", "alice"),
        ),
      ),
    ),
  );
  await check(
    "owner unrestricted application query denied",
    assertFails(getDocs(collection(alice.firestore(), "applications"))),
  );
  await check(
    "admin status change accepted",
    assertSucceeds(
      updateDoc(doc(admin.firestore(), "applications", "alice_op1"), {
        status: "shortlisted",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "admin cannot rewrite applicant",
    assertFails(
      updateDoc(doc(admin.firestore(), "applications", "alice_op1"), {
        studentId: "bob",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "bookmark accepted",
    assertSucceeds(
      setDoc(doc(alice.firestore(), "bookmarks", "alice_op1"), {
        studentId: "alice",
        opportunityId: "op1",
        title: listing.title,
        organization: listing.organization,
        type: listing.type,
        createdAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "cross-student bookmark denied",
    assertFails(getDoc(doc(bob.firestore(), "bookmarks", "alice_op1"))),
  );
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), "opportunities", "expired"), {
      ...listing,
      closesAt: Timestamp.fromDate(new Date("2020-01-01")),
    });
    await setDoc(doc(c.firestore(), "opportunities", "closed"), {
      ...listing,
      status: "closed",
    });
  });
  await check(
    "expired application denied",
    assertFails(
      setDoc(doc(alice.firestore(), "applications", "alice_expired"), {
        ...application,
        opportunityId: "expired",
      }),
    ),
  );
  await check(
    "closed application denied",
    assertFails(
      setDoc(doc(alice.firestore(), "applications", "alice_closed"), {
        ...application,
        opportunityId: "closed",
      }),
    ),
  );
  await check(
    "student PDF upload accepted",
    assertSucceeds(
      uploadBytes(
        ref(alice.storage(), "resumes/alice/resume.pdf"),
        new Uint8Array([37, 80, 68, 70]),
        { contentType: "application/pdf" },
      ),
    ),
  );
  await check(
    "student cannot upload another student résumé",
    assertFails(
      uploadBytes(
        ref(bob.storage(), "resumes/alice/resume.pdf"),
        new Uint8Array([1]),
        { contentType: "application/pdf" },
      ),
    ),
  );
  await check(
    "non-PDF upload denied",
    assertFails(
      uploadBytes(
        ref(alice.storage(), "resumes/alice/resume.pdf"),
        new Uint8Array([1]),
        { contentType: "text/plain" },
      ),
    ),
  );
  await check(
    "cross-student résumé read denied",
    assertFails(getBytes(ref(bob.storage(), "resumes/alice/resume.pdf"))),
  );
  await check(
    "admin résumé read accepted",
    assertSucceeds(getBytes(ref(admin.storage(), "resumes/alice/resume.pdf"))),
  );
  const task = {
    studentId: "alice",
    title: "Practice interview",
    note: "Explain one project",
    dueDate: "2027-01-01",
    status: "todo",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const taskRef = doc(alice.firestore(), "careerTasks", "task-a");
  await check(
    "owner can create a career task",
    assertSucceeds(setDoc(taskRef, task)),
  );
  await check(
    "other student cannot read private task",
    assertFails(getDoc(doc(bob.firestore(), "careerTasks", "task-a"))),
  );
  await check(
    "owner task query accepted",
    assertSucceeds(
      getDocs(
        query(
          collection(alice.firestore(), "careerTasks"),
          where("studentId", "==", "alice"),
        ),
      ),
    ),
  );
  await check(
    "unfiltered student task query denied",
    assertFails(getDocs(collection(alice.firestore(), "careerTasks"))),
  );
  await check(
    "student cannot transfer a task",
    assertFails(
      updateDoc(taskRef, { studentId: "bob", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "owner can complete a task",
    assertSucceeds(
      updateDoc(taskRef, { status: "done", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "task rejects unknown fields",
    assertFails(
      updateDoc(taskRef, { role: "admin", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "admin can inspect career task",
    assertSucceeds(getDoc(doc(admin.firestore(), "careerTasks", "task-a"))),
  );
  const learning = {
    title: "Interview practice",
    description: "Practice a focused response.",
    url: "https://example.com/interview",
    category: "Interview prep",
    status: "draft",
    createdBy: "operator",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const learningRef = doc(admin.firestore(), "resources", "learn-a");
  await check(
    "admin can create draft resource",
    assertSucceeds(setDoc(learningRef, learning)),
  );
  await check(
    "guest cannot read draft resource",
    assertFails(getDoc(doc(guest.firestore(), "resources", "learn-a"))),
  );
  await check(
    "student cannot publish resources",
    assertFails(
      setDoc(doc(alice.firestore(), "resources", "learn-b"), {
        ...learning,
        createdBy: "alice",
      }),
    ),
  );
  await check(
    "non HTTPS resource rejected",
    assertFails(
      updateDoc(learningRef, {
        url: "javascript:alert(1)",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "admin publishes resource",
    assertSucceeds(
      updateDoc(learningRef, {
        status: "published",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "guest can query published resources",
    assertSucceeds(
      getDocs(
        query(
          collection(guest.firestore(), "resources"),
          where("status", "==", "published"),
        ),
      ),
    ),
  );
  await check(
    "guest cannot query all resources",
    assertFails(getDocs(collection(guest.firestore(), "resources"))),
  );
  await check(
    "admin directory query accepted",
    assertSucceeds(getDocs(collection(admin.firestore(), "users"))),
  );
  await check(
    "other student cannot delete a task",
    assertFails(deleteDoc(doc(bob.firestore(), "careerTasks", "task-a"))),
  );
  await check("owner can delete a task", assertSucceeds(deleteDoc(taskRef)));
  await check(
    "admin cannot change a resource creator",
    assertFails(
      updateDoc(learningRef, {
        createdBy: "alice",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "student cannot delete a resource",
    assertFails(deleteDoc(doc(alice.firestore(), "resources", "learn-a"))),
  );
  await check(
    "admin can unpublish a resource",
    assertSucceeds(
      updateDoc(learningRef, { status: "draft", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "unpublished resource becomes private",
    assertFails(getDoc(doc(guest.firestore(), "resources", "learn-a"))),
  );
  await check(
    "admin can delete a resource",
    assertSucceeds(deleteDoc(learningRef)),
  );
  const project = {
    studentId: "alice",
    studentName: "Alice",
    title: "Campus dashboard",
    summary: "Measure our energy use.",
    category: "Web & apps",
    skills: ["React"],
    visibility: "private",
    moderation: "visible",
    repoUrl: "",
    demoUrl: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const projectRef = doc(alice.firestore(), "projects", "project-a");
  await check(
    "owner can create private project",
    assertSucceeds(setDoc(projectRef, project)),
  );
  await check(
    "guest cannot read private project",
    assertFails(getDoc(doc(guest.firestore(), "projects", "project-a"))),
  );
  await check(
    "other student cannot read private project",
    assertFails(getDoc(doc(bob.firestore(), "projects", "project-a"))),
  );
  await check(
    "owner can list own private projects",
    assertSucceeds(
      getDocs(
        query(
          collection(alice.firestore(), "projects"),
          where("studentId", "==", "alice"),
        ),
      ),
    ),
  );
  await check(
    "owner can publish project",
    assertSucceeds(
      updateDoc(projectRef, {
        visibility: "public",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "public moderated showcase query allowed",
    assertSucceeds(
      getDocs(
        query(
          collection(guest.firestore(), "projects"),
          where("visibility", "==", "public"),
          where("moderation", "==", "visible"),
        ),
      ),
    ),
  );
  await check(
    "public project query without moderation filter denied",
    assertFails(
      getDocs(
        query(
          collection(guest.firestore(), "projects"),
          where("visibility", "==", "public"),
        ),
      ),
    ),
  );
  await check(
    "other student cannot edit project",
    assertFails(
      updateDoc(doc(bob.firestore(), "projects", "project-a"), {
        title: "Stolen",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "owner cannot transfer project ownership",
    assertFails(
      updateDoc(projectRef, { studentId: "bob", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "non HTTPS project URL denied",
    assertFails(
      updateDoc(projectRef, {
        demoUrl: "javascript:alert(1)",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "project identity spoof denied",
    assertFails(
      setDoc(doc(alice.firestore(), "projects", "spoof"), {
        ...project,
        studentName: "Operator",
      }),
    ),
  );
  await check(
    "admin can hide project",
    assertSucceeds(
      updateDoc(doc(admin.firestore(), "projects", "project-a"), {
        moderation: "hidden",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "hidden public project not readable by guest",
    assertFails(getDoc(doc(guest.firestore(), "projects", "project-a"))),
  );
  await check(
    "owner cannot restore moderated project",
    assertFails(
      updateDoc(projectRef, {
        moderation: "visible",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "admin can restore project",
    assertSucceeds(
      updateDoc(doc(admin.firestore(), "projects", "project-a"), {
        moderation: "visible",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "owner can make published project private again",
    assertSucceeds(
      updateDoc(projectRef, {
        visibility: "private",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "private again project is protected",
    assertFails(getDoc(doc(guest.firestore(), "projects", "project-a"))),
  );
  await check(
    "owner can delete project",
    assertSucceeds(deleteDoc(projectRef)),
  );
  await check(
    "second student creates profile for team requests",
    assertSucceeds(
      setDoc(doc(bob.firestore(), "users", "bob"), {
        ...profile,
        name: "Bob",
        email: "bob@example.com",
        resumePath: "",
      }),
    ),
  );
  const team = {
    studentId: "alice",
    studentName: "Alice",
    title: "Campus builders",
    summary: "Build a greener campus.",
    category: "Social impact",
    skills: ["React"],
    lookingFor: "A designer",
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const teamRef = doc(alice.firestore(), "teams", "team-a");
  await check(
    "student can start a team",
    assertSucceeds(setDoc(teamRef, team)),
  );
  await check(
    "guest cannot browse team directory",
    assertFails(
      getDocs(
        query(
          collection(guest.firestore(), "teams"),
          where("status", "==", "open"),
        ),
      ),
    ),
  );
  await check(
    "signed in students can discover open teams",
    assertSucceeds(
      getDocs(
        query(
          collection(bob.firestore(), "teams"),
          where("status", "==", "open"),
        ),
      ),
    ),
  );
  await check(
    "other student cannot close team",
    assertFails(
      updateDoc(doc(bob.firestore(), "teams", "team-a"), {
        status: "closed",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  const joinRequest = {
    studentId: "bob",
    studentName: "Bob",
    ownerId: "alice",
    teamId: "team-a",
    teamTitle: "Campus builders",
    note: "I can help with design.",
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const requestRef = doc(bob.firestore(), "teamRequests", "bob_team-a");
  await check(
    "absent request can be read for duplicate transaction",
    assertSucceeds(getDoc(requestRef)),
  );
  await check(
    "student can request an open team",
    assertSucceeds(setDoc(requestRef, joinRequest)),
  );
  await check(
    "duplicate request cannot overwrite existing introduction",
    assertFails(setDoc(requestRef, joinRequest)),
  );
  await check(
    "guest cannot read team introduction",
    assertFails(getDoc(doc(guest.firestore(), "teamRequests", "bob_team-a"))),
  );
  await check(
    "unrelated student cannot read introduction",
    assertFails(
      getDoc(
        doc(
          env.authenticatedContext("outsider").firestore(),
          "teamRequests",
          "bob_team-a",
        ),
      ),
    ),
  );
  await check(
    "owner inbox query accepted",
    assertSucceeds(
      getDocs(
        query(
          collection(alice.firestore(), "teamRequests"),
          where("teamId", "==", "team-a"),
          where("ownerId", "==", "alice"),
        ),
      ),
    ),
  );
  await check(
    "teamId alone does not expose owner inbox to students",
    assertFails(
      getDocs(
        query(
          collection(alice.firestore(), "teamRequests"),
          where("teamId", "==", "team-a"),
        ),
      ),
    ),
  );
  await check(
    "student can query own requests",
    assertSucceeds(
      getDocs(
        query(
          collection(bob.firestore(), "teamRequests"),
          where("studentId", "==", "bob"),
        ),
      ),
    ),
  );
  await check(
    "applicant cannot accept own request",
    assertFails(
      updateDoc(requestRef, {
        status: "accepted",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "owner cannot rewrite applicant note",
    assertFails(
      updateDoc(doc(alice.firestore(), "teamRequests", "bob_team-a"), {
        note: "Changed",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "team owner can accept pending request",
    assertSucceeds(
      updateDoc(doc(alice.firestore(), "teamRequests", "bob_team-a"), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "decision cannot overwrite already accepted request",
    assertFails(
      updateDoc(doc(alice.firestore(), "teamRequests", "bob_team-a"), {
        status: "declined",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "applicant can withdraw accepted request",
    assertSucceeds(
      updateDoc(requestRef, {
        status: "withdrawn",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "withdrawn request cannot be accepted later",
    assertFails(
      updateDoc(doc(alice.firestore(), "teamRequests", "bob_team-a"), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "team owner cannot apply to own team",
    assertFails(
      setDoc(doc(alice.firestore(), "teamRequests", "alice_team-a"), {
        ...joinRequest,
        studentId: "alice",
        studentName: "Alice",
      }),
    ),
  );
  await check(
    "team owner can close recruitment",
    assertSucceeds(
      updateDoc(teamRef, { status: "closed", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "owner can create a closed team",
    assertSucceeds(
      setDoc(doc(alice.firestore(), "teams", "closed-team"), {
        ...team,
        status: "closed",
      }),
    ),
  );
  await check(
    "new request to closed team denied",
    assertFails(
      setDoc(doc(bob.firestore(), "teamRequests", "bob_closed-team"), {
        ...joinRequest,
        teamId: "closed-team",
      }),
    ),
  );
  await check(
    "teams cannot be deleted while requests reference them",
    assertFails(deleteDoc(teamRef)),
  );
  await check(
    "admin can hide team",
    assertSucceeds(
      updateDoc(doc(admin.firestore(), "teams", "team-a"), {
        status: "hidden",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "hidden team protected from other students",
    assertFails(getDoc(doc(bob.firestore(), "teams", "team-a"))),
  );
  await check(
    "owner cannot reopen a hidden team",
    assertFails(
      updateDoc(teamRef, { status: "open", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "admin can restore team as closed",
    assertSucceeds(
      updateDoc(doc(admin.firestore(), "teams", "team-a"), {
        status: "closed",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  console.log(`${checks} Firebase security checks passed.`);
} finally {
  await env.cleanup();
}
