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
