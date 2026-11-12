import { test } from "node:test";
import assert from "node:assert/strict";
import { deployOnboarding } from "./deploy-onboarding.mjs";
test("builds and publishes rules before Hosting", () => {
  const calls = [];
  deployOnboarding((command, args) => {
    calls.push([command, args]);
    return { status: 0 };
  });
  assert.deepEqual(
    calls.map(([, args]) => args.at(-1)),
    ["build", "firestore:rules", "hosting"],
  );
});
test("a rejected rules deployment prevents publishing Hosting", () => {
  let calls = 0;
  assert.throws(
    () => deployOnboarding(() => ({ status: ++calls === 2 ? 1 : 0 })),
    /Deployment stopped/,
  );
  assert.equal(calls, 2);
});
test("a failed build stops all publishing", () => {
  let calls = 0;
  assert.throws(
    () =>
      deployOnboarding(() => {
        calls++;
        return { status: 1 };
      }),
    /Deployment stopped/,
  );
  assert.equal(calls, 1);
});
