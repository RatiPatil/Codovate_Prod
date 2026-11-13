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
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
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
  await env.clearFirestore();
  const alice = env.authenticatedContext("alice").firestore(),
    mentor = env.authenticatedContext("mentor").firestore(),
    bob = env.authenticatedContext("bob").firestore(),
    admin = env.authenticatedContext("admin", { admin: true }).firestore(),
    guest = env.unauthenticatedContext().firestore();
  await env.withSecurityRulesDisabled(async (c) => {
    for (const uid of ["alice", "mentor"])
      await setDoc(doc(c.firestore(), "users", uid), {
        name: uid === "alice" ? "ALICE STUDENT" : "REAL MENTOR",
      });
  });
  const session = {
    title: "Project clinic",
    mentorName: "Real Mentor",
    mentorUid: "mentor",
    mentorRole: "Project reviewer",
    expertise: ["Architecture"],
    outcome: "A clear next step",
    preparation: "Bring a diagram",
    mentorBio: "Example test fixture",
    topic: "Project feedback",
    description: "Review a real project",
    startsAt: Timestamp.fromMillis(Date.now() + 86400000),
    durationMinutes: 30,
    format: "Online",
    location: "Online",
    status: "published",
    createdBy: "admin",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await pass(setDoc(doc(admin, "mentorSessions", "chat-session"), session));
  await fail(
    setDoc(doc(admin, "mentorSessions", "bad-mentor"), {
      ...session,
      mentorUid: "missing",
    }),
  );
  const booking = {
    studentId: "alice",
    studentName: "ALICE STUDENT",
    sessionId: "chat-session",
    sessionTitle: session.title,
    mentorName: session.mentorName,
    mentorUid: "mentor",
    startsAt: session.startsAt,
    durationMinutes: 30,
    format: "Online",
    location: "Online",
    note: "Help with design",
    status: "pending",
    meetingUrl: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const book = (db) => doc(db, "mentorBookings", "alice_chat-session");
  const msg = (db, id) =>
    doc(db, "mentorBookings", "alice_chat-session", "messages", id);
  await fail(setDoc(book(alice), { ...booking, mentorUid: "alice" }));
  await pass(setDoc(book(alice), booking));
  await pass(getDoc(book(mentor)));
  await fail(getDoc(book(bob)));
  await pass(
    getDocs(
      query(
        collection(mentor, "mentorBookings"),
        where("mentorUid", "==", "mentor"),
        orderBy("createdAt", "desc"),
        limit(25),
      ),
    ),
  );
  await fail(getDocs(collection(mentor, "mentorBookings")));
  const message = {
    senderId: "alice",
    senderRole: "student",
    text: "Can we review my API?\nThe diagram is ready.",
    createdAt: serverTimestamp(),
  };
  await fail(setDoc(msg(alice, "pending"), message));
  await fail(
    updateDoc(book(mentor), {
      status: "confirmed",
      meetingUrl: "https://meet.example.com",
      updatedAt: serverTimestamp(),
    }),
  );
  await pass(
    updateDoc(book(admin), {
      status: "confirmed",
      meetingUrl: "https://meet.example.com",
      updatedAt: serverTimestamp(),
    }),
  );
  await pass(setDoc(msg(alice, "one"), message));
  await pass(
    setDoc(msg(mentor, "two"), {
      ...message,
      senderId: "mentor",
      senderRole: "mentor",
      text: "Yes. Let us start with your request flow.",
    }),
  );
  await pass(
    setDoc(msg(admin, "three"), {
      ...message,
      senderId: "admin",
      senderRole: "coordinator",
      text: "Your session is confirmed.",
    }),
  );
  await fail(
    setDoc(msg(alice, "fake-role"), { ...message, senderRole: "mentor" }),
  );
  await fail(setDoc(msg(bob, "stranger"), { ...message, senderId: "bob" }));
  await fail(setDoc(msg(alice, "blank"), { ...message, text: " \n\t " }));
  await fail(
    setDoc(msg(alice, "long"), { ...message, text: "x".repeat(2001) }),
  );
  await fail(setDoc(msg(alice, "extra"), { ...message, email: "not-allowed" }));
  await fail(getDoc(msg(bob, "one")));
  await fail(getDoc(msg(guest, "one")));
  await pass(
    getDocs(
      query(
        collection(mentor, "mentorBookings", "alice_chat-session", "messages"),
        orderBy("createdAt", "desc"),
        limit(50),
      ),
    ),
  );
  await fail(
    getDocs(
      query(
        collection(mentor, "mentorBookings", "alice_chat-session", "messages"),
        limit(201),
      ),
    ),
  );
  await fail(updateDoc(msg(alice, "one"), { text: "Rewrite" }));
  await fail(deleteDoc(msg(admin, "one")));
  const workspace = {
    bookingId: "alice_chat-session",
    studentId: "alice",
    preparation: { goal: "", context: "", artifactUrl: "" },
    plan: { summary: "Review boundaries", actions: ["Draw a diagram"] },
    completedActions: [],
    rating: 0,
    reflection: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await pass(
    setDoc(doc(mentor, "mentorWorkspaces", "alice_chat-session"), workspace),
  );
  await fail(
    updateDoc(doc(mentor, "mentorWorkspaces", "alice_chat-session"), {
      rating: 5,
      reflection: "Pretend student feedback",
      updatedAt: serverTimestamp(),
    }),
  );
  await pass(getDoc(doc(mentor, "mentorWorkspaces", "alice_chat-session")));
  await fail(
    updateDoc(book(alice), { mentorUid: "bob", updatedAt: serverTimestamp() }),
  );
  let stopLive, timer;
  try {
    const received = new Promise((resolve, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error("Mentor did not receive the student's live message"),
          ),
        5000,
      );
      stopLive = onSnapshot(
        query(
          collection(
            mentor,
            "mentorBookings",
            "alice_chat-session",
            "messages",
          ),
          orderBy("createdAt", "desc"),
          limit(50),
        ),
        (snapshot) => {
          if (snapshot.docs.some((d) => d.id === "live-message")) resolve();
        },
        reject,
      );
    });
    await pass(
      setDoc(msg(alice, "live-message"), {
        ...message,
        text: "This message should arrive live.",
      }),
    );
    await received;
    checks++;
  } finally {
    clearTimeout(timer);
    stopLive?.();
  }
  await pass(
    updateDoc(book(alice), {
      status: "cancelled",
      updatedAt: serverTimestamp(),
    }),
  );
  await fail(
    setDoc(msg(mentor, "closed"), {
      ...message,
      senderId: "mentor",
      senderRole: "mentor",
    }),
  );
  await pass(getDoc(msg(mentor, "one")));
  await pass(
    updateDoc(book(admin), { mentorUid: "", updatedAt: serverTimestamp() }),
  );
  await fail(getDoc(book(mentor)));
  await fail(getDoc(msg(mentor, "one")));
  await fail(getDoc(doc(mentor, "mentorWorkspaces", "alice_chat-session")));
  await fail(
    updateDoc(book(admin), { mentorUid: "bob", updatedAt: serverTimestamp() }),
  );
  console.log(
    `${checks} mentor assignment, live conversation and access checks passed`,
  );
} finally {
  await env.cleanup();
}
