import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prepareStudents,
  normalizeMobile,
  privateProfile,
  importStudent,
  importedUid,
  branchSkills,
} from "./student-import-core.mjs";
const header = ["Name", "mobile no", "email address", "Tal", "PROGRAM"];
const row = [
  "Example Full Name",
  "9000000001",
  "student@example.test",
  "Example Taluka",
  "CIVIL ENGINEERING",
];
const record = () => prepareStudents([header, row]).eligible[0];
test("preserves full name and distinct program/taluka without inferring graduation year", () => {
  const r = record();
  assert.equal(r.name, row[0]);
  const p = privateProfile(r, "SERVER");
  assert.equal(p.taluka, row[3]);
  assert.equal(p.program, row[4]);
  assert.equal(p.graduationYear, "");
  assert.equal(p.city, "");
});
test("normalizes Indian phones and rejects unsafe formats", () => {
  assert.equal(normalizeMobile(" +91 90000-00001 "), "+919000000001");
  assert.equal(normalizeMobile(9000000001), "+919000000001");
  assert.equal(normalizeMobile("1234"), null);
  assert.equal(normalizeMobile("9000000001 or 9000000002"), null);
});
test("requires complete contacts and mapped program", () => {
  for (const [col, value] of [
    [0, ""],
    [1, "123"],
    [2, "bad-email"],
    [4, "UNKNOWN"],
  ]) {
    const r = [...row];
    r[col] = value;
    assert.equal(prepareStudents([header, r]).eligible.length, 0);
  }
});
test("skips exact duplicates without creating twice", () => {
  const p = prepareStudents([header, row, row]);
  assert.equal(p.eligible.length, 1);
  assert.equal(p.summary.exactDuplicateRows, 1);
});
test("quarantines all conflicting contact holders including incomplete source rows", () => {
  const other = [...row];
  other[0] = "Different Student";
  other[2] = "";
  const p = prepareStudents([header, row, other]);
  assert.equal(p.eligible.length, 0);
  assert.equal(p.summary.contactConflictRows, 1);
  assert.equal(p.summary.validationRejected, 1);
});
test("email ownership conflicts are not guessed", () => {
  const other = [...row];
  other[1] = "9000000002";
  const p = prepareStudents([header, row, other]);
  assert.equal(p.eligible.length, 0);
  assert.equal(p.summary.contactConflictRows, 2);
});
test("branch defaults are suggestions and profiles stay private/invited", () => {
  for (const program of Object.keys(branchSkills)) {
    const p = privateProfile({ ...record(), program }, "SERVER");
    assert.ok(p.suggestedSkills.length);
    assert.deepEqual(p.skills, []);
    assert.equal(p.discoveryEnabled, false);
    assert.equal(p.mobileVerified, false);
    assert.equal(p.accountStatus, "invited");
    assert.equal("password" in p, false);
  }
  assert.equal(
    prepareStudents([
      header,
      [...row.slice(0, 4), "ELECTRONICS AND TELECOMMUNICATION ENGG"],
    ]).eligible[0].program,
    "ELECTRONICS AND TELECOMMUNICATION ENGINEERING",
  );
});
function fake({ existing, exists = false, phoneOwner, profileError } = {}) {
  const calls = { created: [], profiles: [] };
  const auth = {
    getUserByEmail: async () => {
      if (existing) return existing;
      throw { code: "auth/user-not-found" };
    },
    getUserByPhoneNumber: async () => {
      if (phoneOwner) return phoneOwner;
      throw { code: "auth/user-not-found" };
    },
    createUser: async (u) => {
      calls.created.push(u);
      return u;
    },
  };
  const db = {
    doc: () => ({
      get: async () => ({ exists }),
      create: async (p) => {
        if (profileError) throw new Error("write failed");
        calls.profiles.push(p);
      },
    }),
  };
  return { auth, db, timestamp: () => "SERVER", calls };
}
test("creates an unverified account with a unique hidden password and private profile", async () => {
  const f = fake(),
    r = record();
  assert.equal((await importStudent(r, f)).status, "created");
  assert.equal(f.calls.created[0].emailVerified, false);
  assert.equal(f.calls.created[0].phoneNumber, undefined);
  assert.ok(f.calls.created[0].password.length >= 32);
  assert.equal(f.calls.profiles[0].name, row[0]);
  assert.equal(f.calls.profiles[0].password, undefined);
  const g = fake();
  await importStudent(r, g);
  assert.notEqual(f.calls.created[0].password, g.calls.created[0].password);
});
test("existing accounts are preserved, never reset or claimed by email", async () => {
  const f = fake({ existing: { uid: "other-uid" } });
  assert.equal((await importStudent(record(), f)).status, "existing");
  assert.equal(f.calls.created.length, 0);
  assert.equal(f.calls.profiles.length, 0);
});
test("restarts can recover an Auth account whose profile write failed", async () => {
  const r = record(),
    f = fake({ existing: { uid: importedUid(r.email) } });
  assert.equal((await importStudent(r, f)).status, "recovered");
  assert.equal(f.calls.created.length, 0);
  assert.equal(f.calls.profiles.length, 1);
});
test("profile failures report partial results instead of silently counting complete users", async () => {
  const f = fake({ profileError: true });
  assert.equal((await importStudent(record(), f)).status, "partial");
  assert.equal(f.calls.created.length, 1);
});
test("already linked phone numbers are held for review", async () => {
  const f = fake({ phoneOwner: { uid: "other-user" } });
  assert.equal((await importStudent(record(), f)).status, "conflict");
  assert.equal(f.calls.created.length, 0);
});
import { verifyImportPrivacy } from "./student-import-privacy.mjs";
test("live preflight requires matching deployed privacy policy before writes", async () => {
  const credential = {
    getAccessToken: async () => ({ access_token: "test-token" }),
  };
  const local = "owner-only rules";
  const response = (data) => ({ ok: true, json: async () => data });
  const fakeFetch = async (url) =>
    response(
      url.endsWith("cloud.firestore")
        ? { rulesetName: "projects/codovate-dev/rulesets/abc" }
        : { source: { files: [{ name: "firestore.rules", content: local }] } },
    );
  await verifyImportPrivacy({
    project: "codovate-dev",
    credential,
    expected: local,
    fetcher: fakeFetch,
  });
  await assert.rejects(
    verifyImportPrivacy({
      project: "codovate-dev",
      credential,
      expected: "different policy",
      fetcher: fakeFetch,
    }),
    /mismatch/,
  );
  await assert.rejects(
    verifyImportPrivacy({
      project: "wrong-project",
      credential,
      expected: local,
      fetcher: fakeFetch,
    }),
    /Unexpected/,
  );
});
test("live preflight fails closed on missing authorization or unreadable policy", async () => {
  await assert.rejects(
    verifyImportPrivacy({
      project: "codovate-dev",
      credential: {
        getAccessToken: async () => {
          throw new Error("No credentials");
        },
      },
      expected: "",
    }),
    /credentials unavailable/,
  );
  await assert.rejects(
    verifyImportPrivacy({
      project: "codovate-dev",
      credential: { getAccessToken: async () => ({ access_token: "x" }) },
      expected: "",
      fetcher: async () => ({ ok: false, status: 403 }),
    }),
    /HTTP 403/,
  );
});
