import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  writeBatch,
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
    "admin cannot browse private profile directory",
    assertFails(getDocs(collection(admin.firestore(), "users"))),
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
  const ms = {
    title: "Interview practice",
    mentorName: "Mentor",
    topic: "Interview practice",
    description: "Practice a project introduction.",
    startsAt: Timestamp.fromDate(new Date("2099-01-01")),
    durationMinutes: 30,
    format: "Online",
    location: "Online — link shared after confirmation",
    status: "draft",
    createdBy: "operator",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const msRef = doc(admin.firestore(), "mentorSessions", "m1");
  await check(
    "admin creates mentor session draft",
    assertSucceeds(setDoc(msRef, ms)),
  );
  await check(
    "mentor session draft private to admin",
    assertFails(getDoc(doc(guest.firestore(), "mentorSessions", "m1"))),
  );
  await check(
    "student cannot publish a mentor session",
    assertFails(
      setDoc(doc(alice.firestore(), "mentorSessions", "m2"), {
        ...ms,
        createdBy: "alice",
      }),
    ),
  );
  await check(
    "admin publishes a mentor session",
    assertSucceeds(
      updateDoc(msRef, { status: "published", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "public can browse published mentor sessions",
    assertSucceeds(
      getDocs(
        query(
          collection(guest.firestore(), "mentorSessions"),
          where("status", "==", "published"),
        ),
      ),
    ),
  );
  await check(
    "public cannot browse unpublished mentor sessions",
    assertFails(getDocs(collection(guest.firestore(), "mentorSessions"))),
  );
  const booking = {
    studentId: "alice",
    studentName: "Alice",
    sessionId: "m1",
    sessionTitle: ms.title,
    mentorName: ms.mentorName,
    startsAt: ms.startsAt,
    durationMinutes: 30,
    format: "Online",
    location: ms.location,
    note: "Help me explain my project.",
    status: "pending",
    meetingUrl: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const bookRef = doc(alice.firestore(), "mentorBookings", "alice_m1"),
    adminBook = doc(admin.firestore(), "mentorBookings", "alice_m1");
  await check(
    "student requests published future session",
    assertSucceeds(setDoc(bookRef, booking)),
  );
  await check(
    "duplicate mentoring request rejected",
    assertFails(setDoc(bookRef, booking)),
  );
  await check(
    "other student cannot read private booking",
    assertFails(getDoc(doc(bob.firestore(), "mentorBookings", "alice_m1"))),
  );
  await check(
    "guest cannot read private booking",
    assertFails(getDoc(doc(guest.firestore(), "mentorBookings", "alice_m1"))),
  );
  await check(
    "owner can query own bookings",
    assertSucceeds(
      getDocs(
        query(
          collection(alice.firestore(), "mentorBookings"),
          where("studentId", "==", "alice"),
        ),
      ),
    ),
  );
  await check(
    "student cannot query all bookings",
    assertFails(getDocs(collection(alice.firestore(), "mentorBookings"))),
  );
  await check(
    "student cannot confirm their own booking",
    assertFails(
      updateDoc(bookRef, {
        status: "confirmed",
        meetingUrl: "https://example.com/meeting",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "online confirmation requires a private HTTPS link",
    assertFails(
      updateDoc(adminBook, {
        status: "confirmed",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "non HTTPS meeting link rejected",
    assertFails(
      updateDoc(adminBook, {
        status: "confirmed",
        meetingUrl: "javascript:alert(1)",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "admin confirms with private meeting link",
    assertSucceeds(
      updateDoc(adminBook, {
        status: "confirmed",
        meetingUrl: "https://example.com/meeting",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "early completion rejected by server time",
    assertFails(
      updateDoc(adminBook, {
        status: "completed",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "session cannot be rescheduled behind confirmed booking",
    assertFails(
      updateDoc(msRef, {
        startsAt: Timestamp.fromDate(new Date("2099-02-01")),
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "student cancels confirmed booking",
    assertSucceeds(
      updateDoc(bookRef, { status: "cancelled", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "stale admin cannot confirm cancelled booking",
    assertFails(
      updateDoc(adminBook, {
        status: "confirmed",
        meetingUrl: "https://example.com/meeting",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "mentor session closed to new requests",
    assertSucceeds(
      updateDoc(msRef, { status: "closed", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "closed mentor session rejects new student request",
    assertFails(
      setDoc(doc(bob.firestore(), "mentorBookings", "bob_m1"), {
        ...booking,
        studentId: "bob",
        studentName: "Bob",
      }),
    ),
  );
  await check(
    "mentoring history cannot be deleted",
    assertFails(deleteDoc(adminBook)),
  );
  const news = {
    title: "New learning resources",
    body: "Find new resources in the learning library.",
    category: "Learning",
    status: "draft",
    link: "https://example.com/learn",
    createdBy: "operator",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const newsRef = doc(admin.firestore(), "announcements", "n1");
  await check(
    "admin creates announcement draft",
    assertSucceeds(setDoc(newsRef, news)),
  );
  await check(
    "guest cannot read draft announcement",
    assertFails(getDoc(doc(guest.firestore(), "announcements", "n1"))),
  );
  await check(
    "student cannot publish announcements",
    assertFails(
      setDoc(doc(alice.firestore(), "announcements", "n2"), {
        ...news,
        createdBy: "alice",
      }),
    ),
  );
  await check(
    "admin publishes announcement",
    assertSucceeds(
      updateDoc(newsRef, { status: "published", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "public published announcement query accepted",
    assertSucceeds(
      getDocs(
        query(
          collection(guest.firestore(), "announcements"),
          where("status", "==", "published"),
        ),
      ),
    ),
  );
  await check(
    "announcement creator cannot be changed",
    assertFails(
      updateDoc(newsRef, { createdBy: "alice", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "admin can unpublish announcement",
    assertSucceeds(
      updateDoc(newsRef, { status: "draft", updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "unpublished announcement becomes private",
    assertFails(getDoc(doc(guest.firestore(), "announcements", "n1"))),
  );
  await check(
    "owner can use HTTPS resume link without Storage",
    assertSucceeds(
      updateDoc(doc(alice.firestore(), "users", "alice"), {
        resumePath: "",
        resumeUrl: "https://example.com/resume.pdf",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "unsafe resume link rejected",
    assertFails(
      updateDoc(doc(alice.firestore(), "users", "alice"), {
        resumeUrl: "http://example.com/resume.pdf",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "admin publishes listing for linked resume",
    assertSucceeds(
      setDoc(doc(admin.firestore(), "opportunities", "link-opp"), listing),
    ),
  );
  await check(
    "linked resume application accepted without uploaded file",
    assertSucceeds(
      setDoc(doc(alice.firestore(), "applications", "alice_link-opp"), {
        ...application,
        opportunityId: "link-opp",
        resumePath: "",
        resumeUrl: "https://example.com/resume.pdf",
      }),
    ),
  );
  await check(
    "admin publishes second listing for link tamper test",
    assertSucceeds(
      setDoc(doc(admin.firestore(), "opportunities", "link-tamper"), listing),
    ),
  );
  await check(
    "application cannot substitute a different resume link",
    assertFails(
      setDoc(doc(alice.firestore(), "applications", "alice_link-tamper"), {
        ...application,
        opportunityId: "link-tamper",
        resumePath: "",
        resumeUrl: "https://example.com/another-resume.pdf",
      }),
    ),
  );
  await env.withSecurityRulesDisabled(async (context) => {
    const past = Timestamp.fromDate(new Date("2020-01-01"));
    await setDoc(doc(context.firestore(), "mentorSessions", "m-past"), {
      ...ms,
      startsAt: past,
      status: "published",
    });
    await setDoc(doc(context.firestore(), "mentorBookings", "alice_m-ended"), {
      ...booking,
      sessionId: "m-ended",
      startsAt: past,
      status: "confirmed",
      meetingUrl: "https://example.com/meeting",
    });
  });
  await check(
    "expired session refuses new mentoring request",
    assertFails(
      setDoc(doc(alice.firestore(), "mentorBookings", "alice_m-past"), {
        ...booking,
        sessionId: "m-past",
        startsAt: Timestamp.fromDate(new Date("2020-01-01")),
      }),
    ),
  );
  await check(
    "admin can complete a confirmed session after its end time",
    assertSucceeds(
      updateDoc(doc(admin.firestore(), "mentorBookings", "alice_m-ended"), {
        status: "completed",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  const notification = {
    studentId: "alice",
    title: "Application update",
    body: "Please check your application.",
    link: "/applications",
    read: false,
    createdBy: "operator",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await check(
    "admin sends private notification",
    assertSucceeds(
      setDoc(doc(admin.firestore(), "notifications", "notice-1"), notification),
    ),
  );
  await check(
    "student reads own notification",
    assertSucceeds(getDoc(doc(alice.firestore(), "notifications", "notice-1"))),
  );
  await check(
    "other student cannot read notification",
    assertFails(getDoc(doc(bob.firestore(), "notifications", "notice-1"))),
  );
  await check(
    "anonymous cannot read notification",
    assertFails(getDoc(doc(guest.firestore(), "notifications", "notice-1"))),
  );
  await check(
    "student can query only own inbox",
    assertSucceeds(
      getDocs(
        query(
          collection(alice.firestore(), "notifications"),
          where("studentId", "==", "alice"),
        ),
      ),
    ),
  );
  await check(
    "unrestricted inbox query denied",
    assertFails(getDocs(collection(alice.firestore(), "notifications"))),
  );
  await check(
    "student cannot forge notification",
    assertFails(
      setDoc(doc(alice.firestore(), "notifications", "forged"), notification),
    ),
  );
  await check(
    "student marks own message read",
    assertSucceeds(
      updateDoc(doc(alice.firestore(), "notifications", "notice-1"), {
        read: true,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "student cannot edit message content",
    assertFails(
      updateDoc(doc(alice.firestore(), "notifications", "notice-1"), {
        body: "Rewritten",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "student cannot retarget message",
    assertFails(
      updateDoc(doc(alice.firestore(), "notifications", "notice-1"), {
        studentId: "bob",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "admin cannot rewrite sent message",
    assertFails(
      updateDoc(doc(admin.firestore(), "notifications", "notice-1"), {
        title: "Changed",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "notification links must be supported internal destinations",
    assertFails(
      setDoc(doc(admin.firestore(), "notifications", "bad-link"), {
        ...notification,
        link: "https://evil.example",
      }),
    ),
  );
  await check(
    "notification recipient must exist",
    assertFails(
      setDoc(doc(admin.firestore(), "notifications", "no-user"), {
        ...notification,
        studentId: "missing-student",
      }),
    ),
  );
  await check(
    "notification starts unread",
    assertFails(
      setDoc(doc(admin.firestore(), "notifications", "pre-read"), {
        ...notification,
        read: true,
      }),
    ),
  );
  await check(
    "notification cannot be deleted",
    assertFails(deleteDoc(doc(alice.firestore(), "notifications", "notice-1"))),
  );
  await check(
    "read flag must be boolean",
    assertFails(
      updateDoc(doc(alice.firestore(), "notifications", "notice-1"), {
        read: "yes",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "admin cannot fetch another private profile",
    assertFails(getDoc(doc(admin.firestore(), "users", "alice"))),
  );
  await check(
    "owner can store an unverified private mobile and program",
    assertSucceeds(
      updateDoc(doc(alice.firestore(), "users", "alice"), {
        mobile: "+919000000001",
        taluka: "Example Taluka",
        program: "CIVIL ENGINEERING",
        suggestedSkills: ["Surveying"],
        discoveryEnabled: false,
        mobileVerified: false,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "owner cannot claim mobile verification",
    assertFails(
      updateDoc(doc(alice.firestore(), "users", "alice"), {
        mobileVerified: true,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "discovery cannot be enabled without a consent workflow",
    assertFails(
      updateDoc(doc(alice.firestore(), "users", "alice"), {
        discoveryEnabled: true,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "unvalidated mobile is rejected",
    assertFails(
      updateDoc(doc(alice.firestore(), "users", "alice"), {
        mobile: "1234",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "browser cannot rewrite trusted import provenance",
    assertFails(
      updateDoc(doc(alice.firestore(), "users", "alice"), {
        importSource: "fake",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", "imported-private"), {
      ...profile,
      resumePath: "",
      email: "imported@example.test",
      mobile: "+919000000002",
      taluka: "Example Taluka",
      program: "CIVIL ENGINEERING",
      skills: [],
      suggestedSkills: ["Surveying"],
      skillSuggestionsSource: "program_defaults_v1",
      importSource: "student_workbook_v1",
      accountStatus: "invited",
      discoveryEnabled: false,
      mobileVerified: false,
    });
  });
  const importedOwner = env.authenticatedContext("imported-private", {
    email: "imported@example.test",
  });
  await check(
    "imported owner can update their private profile",
    assertSucceeds(
      updateDoc(doc(importedOwner.firestore(), "users", "imported-private"), {
        bio: "My own profile",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "admin cannot read imported contact details",
    assertFails(getDoc(doc(admin.firestore(), "users", "imported-private"))),
  );
  await check(
    "other students cannot read imported contact details",
    assertFails(getDoc(doc(bob.firestore(), "users", "imported-private"))),
  );
  const placement = {
    sectionId: "aptitude",
    parentId: "",
    kind: "folder",
    title: "Data Interpretation",
    summary: "Topic folder",
    body: "",
    sourceUrl: "",
    status: "draft",
    createdBy: "operator",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const placementRef = doc(admin.firestore(), "placementContent", "di-folder");
  await check(
    "admin creates placement folder",
    assertSucceeds(setDoc(placementRef, placement)),
  );
  await check(
    "guest cannot read draft placement folder",
    assertFails(
      getDoc(doc(guest.firestore(), "placementContent", "di-folder")),
    ),
  );
  await check(
    "student cannot publish placement content",
    assertFails(
      setDoc(doc(alice.firestore(), "placementContent", "student-created"), {
        ...placement,
        createdBy: "alice",
      }),
    ),
  );
  await check(
    "admin publishes placement folder",
    assertSucceeds(
      updateDoc(placementRef, {
        status: "published",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "guest cannot read published placement folder",
    assertFails(
      getDoc(doc(guest.firestore(), "placementContent", "di-folder")),
    ),
  );
  const lesson = {
    ...placement,
    parentId: "di-folder",
    kind: "article",
    title: "Charts",
    body: "Original worked example",
    status: "published",
  };
  await check(
    "admin adds nested readable article",
    assertSucceeds(
      setDoc(doc(admin.firestore(), "placementContent", "charts"), lesson),
    ),
  );
  await check(
    "guest cannot query published section",
    assertFails(
      getDocs(
        query(
          collection(guest.firestore(), "placementContent"),
          where("sectionId", "==", "aptitude"),
          where("status", "==", "published"),
        ),
      ),
    ),
  );
  await check(
    "guest cannot query drafts",
    assertFails(
      getDocs(
        query(
          collection(guest.firestore(), "placementContent"),
          where("sectionId", "==", "aptitude"),
        ),
      ),
    ),
  );
  await check(
    "parent must exist",
    assertFails(
      setDoc(doc(admin.firestore(), "placementContent", "orphan"), {
        ...lesson,
        parentId: "missing",
      }),
    ),
  );
  await check(
    "article cannot contain children",
    assertFails(
      setDoc(doc(admin.firestore(), "placementContent", "bad-parent"), {
        ...lesson,
        parentId: "charts",
      }),
    ),
  );
  await check(
    "parent section must match",
    assertFails(
      setDoc(doc(admin.firestore(), "placementContent", "cross-section"), {
        ...lesson,
        sectionId: "dbms",
      }),
    ),
  );
  await check(
    "cannot move content to create hierarchy cycles",
    assertFails(
      updateDoc(placementRef, {
        parentId: "di-folder",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "cannot publish empty article",
    assertFails(
      setDoc(doc(admin.firestore(), "placementContent", "empty-lesson"), {
        ...lesson,
        body: "",
      }),
    ),
  );
  await check(
    "cannot create unknown section",
    assertFails(
      setDoc(doc(admin.firestore(), "placementContent", "bad-section"), {
        ...placement,
        sectionId: "unknown",
      }),
    ),
  );
  await check(
    "cannot spoof creator",
    assertFails(
      setDoc(doc(admin.firestore(), "placementContent", "bad-author"), {
        ...placement,
        createdBy: "alice",
      }),
    ),
  );
  await check(
    "cannot store scripts as source links",
    assertFails(
      setDoc(doc(admin.firestore(), "placementContent", "bad-link"), {
        ...lesson,
        sourceUrl: "javascript:alert(1)",
      }),
    ),
  );
  await check(
    "cannot add reward fields to lesson",
    assertFails(
      updateDoc(doc(admin.firestore(), "placementContent", "charts"), {
        gems: 500,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "cannot delete placement folder",
    assertFails(deleteDoc(placementRef)),
  );
  const checkpoint = {
    prompt: "What is 25% of 80?",
    options: ["10", "20", "30", "40"],
    answerIndex: 1,
    explanation: "80/4 = 20.",
  };
  await check(
    "admin adds validated checkpoint metadata",
    assertSucceeds(
      updateDoc(doc(admin.firestore(), "placementContent", "charts"), {
        practice: [checkpoint],
        level: "Foundation",
        minutes: 5,
        sourceNote: "Checked teaching example.",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "invalid answer index is rejected",
    assertFails(
      updateDoc(doc(admin.firestore(), "placementContent", "charts"), {
        practice: [{ ...checkpoint, answerIndex: 4 }],
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "missing checkpoint explanation is rejected",
    assertFails(
      updateDoc(doc(admin.firestore(), "placementContent", "charts"), {
        practice: [{ ...checkpoint, explanation: "" }],
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "student cannot edit checkpoint answers",
    assertFails(
      updateDoc(doc(alice.firestore(), "placementContent", "charts"), {
        practice: [{ ...checkpoint, answerIndex: 0 }],
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "folder cannot contain checkpoint questions",
    assertFails(
      updateDoc(placementRef, {
        practice: [checkpoint],
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  const progress = {
    studentId: "alice",
    lessonId: "charts",
    completed: true,
    bookmarked: true,
    note: "My private working",
    practiceScore: 1,
    practiceTotal: 1,
    updatedAt: serverTimestamp(),
  };
  const progressRef = doc(
    alice.firestore(),
    "placementProgress",
    "alice_charts",
  );
  await check(
    "student saves private lesson progress",
    assertSucceeds(setDoc(progressRef, progress)),
  );
  await check(
    "student reads own progress",
    assertSucceeds(getDoc(progressRef)),
  );
  await check(
    "student queries own progress",
    assertSucceeds(
      getDocs(
        query(
          collection(alice.firestore(), "placementProgress"),
          where("studentId", "==", "alice"),
        ),
      ),
    ),
  );
  await check(
    "other student cannot read progress",
    assertFails(
      getDoc(doc(bob.firestore(), "placementProgress", "alice_charts")),
    ),
  );
  await check(
    "admin cannot read student notes",
    assertFails(
      getDoc(doc(admin.firestore(), "placementProgress", "alice_charts")),
    ),
  );
  await check(
    "guest cannot read progress",
    assertFails(
      getDoc(doc(guest.firestore(), "placementProgress", "alice_charts")),
    ),
  );
  await check(
    "student cannot query every learner",
    assertFails(getDocs(collection(alice.firestore(), "placementProgress"))),
  );
  await check(
    "student cannot write someone else progress",
    assertFails(
      setDoc(
        doc(bob.firestore(), "placementProgress", "alice_charts"),
        progress,
      ),
    ),
  );
  await check(
    "progress ID must match owner and lesson",
    assertFails(
      setDoc(
        doc(alice.firestore(), "placementProgress", "alice_other"),
        progress,
      ),
    ),
  );
  await check(
    "score cannot exceed total",
    assertFails(
      updateDoc(progressRef, {
        practiceScore: 2,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  await check(
    "client cannot mint gems in learning record",
    assertFails(
      updateDoc(progressRef, { gems: 100, updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "progress cannot be relabelled as another lesson",
    assertFails(
      updateDoc(progressRef, {
        lessonId: "other",
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  const aliceProfile = (
    await getDoc(doc(alice.firestore(), "users", "alice"))
  ).data();
  const directory = {
    uid: "alice",
    fullName: aliceProfile.name,
    joinedAt: aliceProfile.createdAt,
    updatedAt: serverTimestamp(),
  };
  const directoryRef = doc(alice.firestore(), "adminUsers", "alice");
  await check(
    "owner can sync name-only directory entry",
    assertSucceeds(setDoc(directoryRef, directory)),
  );
  await check(
    "administrator can read user names",
    assertSucceeds(getDoc(doc(admin.firestore(), "adminUsers", "alice"))),
  );
  await check(
    "administrator can list user names",
    assertSucceeds(getDocs(collection(admin.firestore(), "adminUsers"))),
  );
  await check(
    "student cannot enumerate user names",
    assertFails(getDocs(collection(alice.firestore(), "adminUsers"))),
  );
  await check(
    "student cannot read another name entry",
    assertFails(getDoc(doc(bob.firestore(), "adminUsers", "alice"))),
  );
  await check(
    "guest cannot enumerate user names",
    assertFails(getDocs(collection(guest.firestore(), "adminUsers"))),
  );
  await check(
    "directory rejects contact fields",
    assertFails(
      setDoc(directoryRef, { ...directory, email: "private@example.com" }),
    ),
  );
  await check(
    "directory rejects mobile fields",
    assertFails(
      setDoc(directoryRef, { ...directory, mobile: "+919876543210" }),
    ),
  );
  await check(
    "directory name must match owner profile",
    assertFails(
      setDoc(directoryRef, { ...directory, fullName: "Not my profile name" }),
    ),
  );
  await check(
    "directory identity cannot be spoofed",
    assertFails(setDoc(directoryRef, { ...directory, uid: "bob" })),
  );
  await check(
    "administrator cannot alter another student name",
    assertFails(
      setDoc(doc(admin.firestore(), "adminUsers", "alice"), directory),
    ),
  );
  const nameBatch = writeBatch(alice.firestore());
  nameBatch.update(doc(alice.firestore(), "users", "alice"), {
    name: "Alice Renamed",
    updatedAt: serverTimestamp(),
  });
  nameBatch.set(directoryRef, {
    ...directory,
    fullName: "Alice Renamed",
    updatedAt: serverTimestamp(),
  });
  await check(
    "profile and directory name update atomically",
    assertSucceeds(nameBatch.commit()),
  );
  await check(
    "directory rejects arbitrary role grants",
    assertFails(
      updateDoc(directoryRef, { admin: true, updatedAt: serverTimestamp() }),
    ),
  );
  await check(
    "client cannot delete directory records",
    assertFails(deleteDoc(directoryRef)),
  );
  const newcomer = env.authenticatedContext("directory-new", {
    email: "directory-new@example.com",
  });
  await env.withSecurityRulesDisabled(async c => {
    await setDoc(doc(c.firestore(), "publicStats", "community"), { registeredStudents: 1479, updatedAt: serverTimestamp() });
  });
  await check("guest can read aggregate only", assertSucceeds(getDoc(doc(guest.firestore(), "publicStats", "community"))));
  await check("guest cannot inflate aggregate", assertFails(updateDoc(doc(guest.firestore(), "publicStats", "community"), { registeredStudents: 9999, updatedAt: serverTimestamp() })));
  await check("existing student cannot increment again", assertFails(updateDoc(doc(alice.firestore(), "publicStats", "community"), { registeredStudents: 1480, updatedAt: serverTimestamp() })));
  const joinBatch = writeBatch(newcomer.firestore());
  joinBatch.update(doc(newcomer.firestore(), "publicStats", "community"), { registeredStudents: 1480, updatedAt: serverTimestamp() });
  joinBatch.set(doc(newcomer.firestore(), "users", "directory-new"), {
    ...profile,
    name: "New Student",
    email: "directory-new@example.com",
    resumePath: "",
    skills: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  joinBatch.set(doc(newcomer.firestore(), "adminUsers", "directory-new"), {
    uid: "directory-new",
    fullName: "New Student",
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await check(
    "new signup profile and directory creation succeed in one batch",
    assertSucceeds(joinBatch.commit()),
  );
  await check("repeat registration cannot inflate aggregate", assertFails(updateDoc(doc(newcomer.firestore(), "publicStats", "community"), { registeredStudents: 1481, updatedAt: serverTimestamp() })));
  await check("signed-in student reads placement content", assertSucceeds(getDoc(doc(alice.firestore(), "placementContent", "charts"))));
  console.log(`${checks} Firebase security checks passed.`);
} finally {
  await env.cleanup();
}
