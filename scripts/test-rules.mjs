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
  console.log(`${checks} Firebase security checks passed.`);
} finally {
  await env.cleanup();
}
