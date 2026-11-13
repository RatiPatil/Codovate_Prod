import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDocument } from "./validate-schema.mjs";
const workspace = {
  bookingId: "alice_m1",
  studentId: "alice",
  preparation: { goal: "Review design", context: "", artifactUrl: "" },
  plan: { summary: "", actions: [] },
  completedActions: [],
  rating: 0,
  reflection: "",
  createdAt: "2026-11-13T00:00:00Z",
  updatedAt: "2026-11-13T00:00:00Z",
};
const check = (value, id = "alice_m1") =>
  validateDocument("mentorWorkspaces", id, value).valid;
test("workspace schema keeps private data bounded and rejects unknown fields", () => {
  assert.equal(check(workspace), true);
  assert.equal(check({ ...workspace, email: "private@example.com" }), false);
  assert.equal(
    check({
      ...workspace,
      preparation: { ...workspace.preparation, goal: "x".repeat(301) },
    }),
    false,
  );
  assert.equal(
    check({
      ...workspace,
      preparation: { ...workspace.preparation, artifactUrl: "javascript:bad" },
    }),
    false,
  );
  assert.equal(check(workspace, "other"), false);
});
test("schema requires progress and feedback to refer to real content", () => {
  assert.equal(check({ ...workspace, completedActions: [0] }), false);
  assert.equal(check({ ...workspace, rating: 5 }), false);
  assert.equal(
    check({ ...workspace, plan: { summary: "Advice", actions: [] } }),
    false,
  );
  assert.equal(
    check({
      ...workspace,
      plan: { summary: "Advice", actions: ["Build"] },
      completedActions: [0],
      rating: 4,
      reflection: "I will build",
    }),
    true,
  );
});
