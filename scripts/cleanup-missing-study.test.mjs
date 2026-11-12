import { test } from "node:test";
import assert from "node:assert/strict";
import {
  missingEducation,
  protectedAccount,
} from "./cleanup-missing-study.mjs";
test("retains valid academic fields and recoverable degrees", () => {
  for (const p of [
    { program: "Mechanical Engineering" },
    { degree: "MCA" },
    { program: "", degree: "Master of Computer Applications" },
  ])
    assert.equal(missingEducation(p), false);
  for (const p of [
    {},
    { program: " ", degree: "" },
    { program: "Unknown", degree: "N/A" },
  ])
    assert.equal(missingEducation(p), true);
});
test("protects staff and administrator profiles", () => {
  for (const p of [
    { admin: true },
    { isAdmin: true },
    { role: "admin" },
    { role: "recruiter" },
  ])
    assert.equal(protectedAccount(p), true);
  assert.equal(!!protectedAccount({ role: "student" }), false);
});
