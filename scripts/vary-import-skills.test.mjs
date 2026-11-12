import { test } from "node:test";
import assert from "node:assert/strict";
import { reducedSuggestions } from "./vary-import-skills.mjs";
const p = {
  importSource: "student_workbook_v1",
  skills: [],
  suggestedSkills: ["A", "B", "C", "D"],
};
test("removes exactly one suggestion with varied repeatable selections", () => {
  const variants = new Set();
  for (let i = 0; i < 100; i++) {
    const result = reducedSuggestions(String(i), p);
    assert.equal(result.length, 3);
    assert.deepEqual(result, reducedSuggestions(String(i), p));
    assert.ok(result.every((v) => p.suggestedSkills.includes(v)));
    variants.add(result.join(","));
  }
  assert.equal(variants.size, 4);
});
test("preserves confirmed, completed, non-imported and previously processed profiles", () => {
  for (const extra of [
    { skills: ["A"] },
    { importSource: "" },
    { importSkillVariation: { version: "v1" } },
    { onboarding: { status: "completed" } },
    { suggestedSkills: ["A"] },
  ])
    assert.equal(reducedSuggestions("u", { ...p, ...extra }), null);
});
