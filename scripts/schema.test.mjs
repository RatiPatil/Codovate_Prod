import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateDocument } from "./validate-schema.mjs";
const examples = JSON.parse(
  await readFile(new URL("../database/examples.json", import.meta.url), "utf8"),
);
for (const [collection, [row]] of Object.entries(examples))
  test(collection + " example satisfies schema", () =>
    assert.equal(validateDocument(collection, row.id, row.data).valid, true),
  );
const user = examples.users[0],
  listing = examples.opportunities[0],
  app = examples.applications[0];
test("rejects profile privilege fields", () =>
  assert.equal(
    validateDocument("users", user.id, { ...user.data, admin: true }).valid,
    false,
  ));
test("rejects invalid graduation years and mixed skill values", () => {
  for (const patch of [
    { graduationYear: "abcd" },
    { graduationYear: "1999" },
    { skills: [5] },
    { skills: ["React", "React"] },
    { skills: ["x".repeat(61)] },
  ])
    assert.equal(
      validateDocument("users", user.id, { ...user.data, ...patch }).valid,
      false,
    );
});
test("rejects mismatched authoritative deadline", () =>
  assert.equal(
    validateDocument("opportunities", listing.id, {
      ...listing.data,
      closesAt: "2098-01-01T00:00:00.000Z",
    }).valid,
    false,
  ));
test("rejects wrong application ownership and status", () => {
  assert.equal(
    validateDocument("applications", "someone-else", app.data).valid,
    false,
  );
  assert.equal(
    validateDocument("applications", app.id, {
      ...app.data,
      resumePath: "resumes/someone-else/resume.pdf",
    }).valid,
    false,
  );
  assert.equal(
    validateDocument("applications", app.id, {
      ...app.data,
      status: "approved",
    }).valid,
    false,
  );
});

test("rejects invalid project visibility and unsafe project links", () => {
  const p = examples.projects[0];
  for (const patch of [
    { visibility: "everyone" },
    { demoUrl: "http://example.com" },
    { moderation: "approved" },
    { skills: [42] },
  ])
    assert.equal(
      validateDocument("projects", p.id, { ...p.data, ...patch }).valid,
      false,
    );
});
test("validates team request identity and blocks self-request", () => {
  const r = examples.teamRequests[0];
  assert.equal(
    validateDocument("teamRequests", "wrong-id", r.data).valid,
    false,
  );
  assert.equal(
    validateDocument("teamRequests", r.id, {
      ...r.data,
      ownerId: r.data.studentId,
    }).valid,
    false,
  );
  assert.equal(
    validateDocument("teamRequests", r.id, { ...r.data, status: "approved" })
      .valid,
    false,
  );
});

test("validates private mentoring identity and confirmation link", () => {
  const b = examples.mentorBookings[0];
  assert.equal(
    validateDocument("mentorBookings", "wrong", b.data).valid,
    false,
  );
  assert.equal(
    validateDocument("mentorBookings", b.id, { ...b.data, status: "confirmed" })
      .valid,
    false,
  );
  assert.equal(
    validateDocument("mentorBookings", b.id, {
      ...b.data,
      status: "confirmed",
      meetingUrl: "https://example.com/meeting",
    }).valid,
    true,
  );
});
test("resume links support applications without uploaded files", () => {
  const a = examples.applications[0];
  assert.equal(
    validateDocument("applications", a.id, {
      ...a.data,
      resumePath: "",
      resumeUrl: "https://example.com/resume",
    }).valid,
    true,
  );
  assert.equal(
    validateDocument("applications", a.id, {
      ...a.data,
      resumePath: "",
      resumeUrl: "",
    }).valid,
    false,
  );
  assert.equal(
    validateDocument("users", examples.users[0].id, {
      ...examples.users[0].data,
      resumeUrl: "javascript:alert(1)",
    }).valid,
    false,
  );
});
