import { test } from "node:test";
import assert from "node:assert/strict";
import { deployOnboarding, commandInvocation } from "./deploy-onboarding.mjs";
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

test("Windows runs npm and npx JavaScript entry points without a shell", () => {
  const options = {
    platform: "win32",
    npmExecPath:
      "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js",
    nodeExecPath: "C:\\Program Files\\nodejs\\node.exe",
  };
  const npm = commandInvocation("npm", ["run", "build"], options);
  assert.equal(npm.command, options.nodeExecPath);
  assert.deepEqual(npm.args, [options.npmExecPath, "run", "build"]);
  const npx = commandInvocation(
    "npx",
    ["--yes", "firebase-tools@15.34.2", "deploy"],
    options,
  );
  assert.equal(npx.command, options.nodeExecPath);
  assert.equal(
    npx.args[0],
    "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npx-cli.js",
  );
});
test("non-Windows commands retain separate executable and arguments", () => {
  assert.deepEqual(
    commandInvocation("npm", ["run", "build"], { platform: "linux" }),
    { command: "npm", args: ["run", "build"] },
  );
});
test("Windows direct invocation gives guidance when npm is not located", () => {
  assert.throws(
    () =>
      commandInvocation("npm", [], { platform: "win32", npmExecPath: null }),
    /npm run deploy:onboarding/,
  );
});
