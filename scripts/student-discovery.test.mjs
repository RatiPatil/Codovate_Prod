import { test } from "node:test";
import assert from "node:assert/strict";
import {
  publishStudent,
  studentCard,
} from "./student-discovery-core.mjs";
const profile = () => ({
  name: "Example Student",
  importSource: "student_workbook_v1",
  skills: ["React"],
  suggestedSkills: ["Java"],
  email: "private@example.test",
  mobile: "9000000001",
  resumeUrl: "private",
  college: "Example College",
  degree: "MCA",
  taluka: "Pune",
  careerPreferences: {
    desiredRole: "Frontend Developer",
    domain: "Web Development",
    yearOfStudy: "Final year",
    seeking: ["Project Collaborators"],
  },
  teammateCard: {
    achievements: ["Research Publication"],
    passions: ["Open Source"],
    photoUrl: "https://avatars.githubusercontent.com/u/123",
    email: "private",
  },
});
function database(p = profile(), extra = {}) {
  const records = new Map([
      ["users/import_example", p],
      ...Object.entries(extra),
    ]),
    writes = [];
  const db = {
    doc: (path) => path,
    runTransaction: async (fn) =>
      fn({
        get: async (path) => ({
          exists: records.has(path),
          data: () => records.get(path),
        }),
        set: (path, value) => {
          records.set(path, value);
          writes.push(path);
        },
        create: (path, value) => {
          if (records.has(path)) throw Error("Already exists");
          records.set(path, value);
          writes.push(path);
        },
      }),
  };
  return { db, records, writes };
}
test("projects only the requested saved student data, never private contacts or inferred skills", () => {
  const card = studentCard("import_example", profile());
  assert.deepEqual(Object.keys(card).sort(), [
    "details",
    "name",
    "skills",
    "uid",
  ]);
  assert.deepEqual(card.skills, ["React"]);
  assert.equal(card.details.location, "Pune");
  assert.equal(card.details.degree, "MCA");
  assert.equal(card.details.desiredRole, "Frontend Developer");
  assert.deepEqual(card.details.achievements, ["Research Publication"]);
  assert.ok(!JSON.stringify(card).includes("private"));
  assert.ok(!JSON.stringify(card).includes("Java"));
});
test("does not invent a role, college, achievements, interests or confirmed skills", () => {
  const card = studentCard("import_example", {
    name: "Student",
    importSource: "student_workbook_v1",
    skills: [],
    suggestedSkills: ["Java"],
  });
  assert.equal(card.details.desiredRole, "");
  assert.equal(card.details.college, "");
  assert.deepEqual(card.details.achievements, []);
  assert.deepEqual(card.details.seeking, []);
  assert.deepEqual(card.skills, []);
});
test("accepts existing students and refuses invalid public names", () => {
  assert.ok(studentCard("normal_user", profile()));
  assert.equal(
    studentCard("import_example", { ...profile(), name: "" }),
    null,
  );
});
test("dry runs make no writes and apply atomically creates only the two discovery records", async () => {
  const { db, records, writes } = database();
  assert.equal(
    await publishStudent({
      db,
      uid: "import_example",
      timestamp: () => "TIME",
    }),
    "eligible",
  );
  assert.equal(writes.length, 0);
  const original = structuredClone(records.get("users/import_example"));
  assert.equal(
    await publishStudent({
      db,
      uid: "import_example",
      apply: true,
      timestamp: () => "TIME",
    }),
    "published",
  );
  assert.deepEqual(writes, [
    "discoveryPreferences/import_example",
    "memberProfiles/import_example",
  ]);
  assert.deepEqual(records.get("users/import_example"), original);
  assert.equal(
    await publishStudent({
      db,
      uid: "import_example",
      apply: true,
      timestamp: () => "OTHER",
    }),
    "student_managed",
  );
  assert.equal(writes.length, 2);
});
test("never recreates hidden cards or overwrites student-managed profiles", async () => {
  for (const extra of [
    {
      "discoveryPreferences/import_example": {
        shareDetails: false,
        discoverable: false,
      },
    },
    { "memberProfiles/import_example": { name: "Existing" } },
  ]) {
    const { db, writes } = database(profile(), extra);
    assert.equal(
      await publishStudent({ db, uid: "import_example", apply: true }),
      "student_managed",
    );
    assert.equal(writes.length, 0);
  }
  const { db } = database({
    ...profile(),
    onboarding: { status: "completed" },
  });
  assert.equal(await publishStudent({ db, uid: "import_example" }), "eligible");
});
test("existing non-imported students also receive cards by default", async () => {
  assert.ok(
    studentCard("regular-student", { ...profile(), importSource: undefined }),
  );
});

test("keeps existing details-sharing restrictions while enabling default card visibility", async () => {
  const { db, records } = database(profile(), {
    "discoveryPreferences/import_example": {
      shareDetails: false,
      details: {
        desiredRole: "Frontend Developer",
        email: "private@example.test",
        mobile: "secret",
      },
    },
  });
  await publishStudent({
    db,
    uid: "import_example",
    apply: true,
    timestamp: () => "TIME",
  });
  const card = records.get("memberProfiles/import_example");
  assert.ok(!Object.hasOwn(card, "details"));
  const pref = records.get("discoveryPreferences/import_example");
  assert.equal(pref.discoverable, true);
  assert.ok(!JSON.stringify(pref).includes("private@example.test"));
  assert.ok(!JSON.stringify(pref).includes("secret"));
});
