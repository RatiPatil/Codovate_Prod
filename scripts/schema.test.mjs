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

test("discovery schema excludes private contact fields", () => {
  const row = examples.memberProfiles[0];
  for (const field of ["email", "mobile", "resumePath", "bio"])
    assert.equal(
      validateDocument("memberProfiles", row.id, {
        ...row.data,
        [field]: "private",
      }).valid,
      false,
    );
});
test("malformed group membership returns validation errors without throwing", () => {
  const row = examples.conversations[0];
  for (const members of [{}, null, "invalid", []])
    assert.equal(
      validateDocument("conversations", row.id, { ...row.data, members }).valid,
      false,
    );
  assert.equal(
    validateDocument("conversations", row.id, {
      ...row.data,
      members: ["someone-else"],
    }).valid,
    false,
  );
});
test("connection and invitation identities cannot be substituted", () => {
  const c = examples.connections[0],
    i = examples.groupInvites[0];
  assert.equal(validateDocument("connections", "wrong", c.data).valid, false);
  assert.equal(
    validateDocument("connections", c.id, {
      ...c.data,
      status: "blocked",
      blockedBy: "outsider",
    }).valid,
    false,
  );
  assert.equal(validateDocument("groupInvites", "wrong", i.data).valid, false);
});

test("project team contracts reject inconsistent membership and history snapshots", () => {
  const t = examples.projectTeams[0];
  assert.equal(
    validateDocument("projectTeams", t.id, {
      ...t.data,
      roles: { "someone-else": "leader" },
    }).valid,
    false,
  );
  assert.equal(
    validateDocument("projectTeams", t.id, {
      ...t.data,
      members: ["example-student", "peer"],
      roles: { "example-student": "leader", peer: "leader" },
    }).valid,
    false,
  );
  assert.equal(
    validateDocument("projectTeams", t.id, {
      ...t.data,
      lifecycle: "archived",
      recruitment: "recruiting",
    }).valid,
    false,
  );
  const h = examples.projectTeamHistory[0];
  assert.equal(
    validateDocument("projectTeamHistory", h.id, {
      ...h.data,
      snapshot: { ...h.data.snapshot, email: "private@example.com" },
    }).valid,
    false,
  );
});
test("team chat contracts keep membership in the canonical team rather than duplicating it", () => {
  const c = examples.conversations.find((row) => row.data.kind === "team");
  assert.equal(validateDocument("conversations", c.id, c.data).valid, true);
  assert.equal(
    validateDocument("conversations", c.id, {
      ...c.data,
      members: ["example-student"],
    }).valid,
    false,
  );
  assert.equal(validateDocument("conversations", "wrong", c.data).valid, false);
});

test("phone-only profiles allow an empty email but reject malformed emails", () => {
  assert.equal(validateDocument("users", user.id, { ...user.data, email: "" }).valid, true);
  assert.equal(validateDocument("users", user.id, { ...user.data, email: "invalid" }).valid, false);
});
