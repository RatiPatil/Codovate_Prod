import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultsFor, domainChoices } from "./import-profile-defaults.mjs";
const imported = {
  importSource: "student_workbook_v1",
  program: "Master of Computer Applications",
};
test("uses requested field-specific pools and distributes stable random defaults", () => {
  const experience = new Set(),
    domains = new Set();
  for (let i = 0; i < 200; i++) {
    const values = defaultsFor(String(i), imported);
    experience.add(values.experience);
    domains.add(values.domain);
    assert.deepEqual(values, defaultsFor(String(i), imported));
    assert.ok(domainChoices(imported.program).includes(values.domain));
  }
  assert.equal(experience.size, 3);
  assert.equal(domains.size, 5);
  for (const field of [
    "AI ML",
    "Computer Science and Engineering",
    "Data Science",
    "MCA",
    "Electronics and Telecommunication Engineering",
  ])
    assert.ok(domainChoices(field).includes("Cyber Security"));
  assert.deepEqual(domainChoices("Mechanical Engineering"), [
    "Startups",
    "Research",
    "Hackathons",
    "Web Development",
    "AI/ML",
  ]);
});
test("preserves user choices and excludes future, completed and staff accounts", () => {
  assert.deepEqual(defaultsFor("u", {}), {});
  assert.deepEqual(
    defaultsFor("u", { ...imported, onboarding: { status: "completed" } }),
    {},
  );
  assert.deepEqual(defaultsFor("u", { ...imported, role: "admin" }), {});
  assert.deepEqual(
    defaultsFor("u", {
      ...imported,
      careerPreferences: { domain: "Research", experience: "Beginner" },
    }),
    {},
  );
  assert.deepEqual(
    defaultsFor("u", imported, {
      details: { domain: "AI/ML", experience: "Advanced" },
    }),
    {},
  );
  assert.deepEqual(
    defaultsFor(
      "u",
      imported,
      {},
      { details: { domain: "Startups", experience: "Intermediate" } },
    ),
    {},
  );
});
