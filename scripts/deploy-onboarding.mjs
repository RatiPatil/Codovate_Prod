import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, win32 } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
export const deploymentSteps = [
  ["npm", ["run", "build"]],
  [
    "npx",
    [
      "--yes",
      "firebase-tools@15.34.2",
      "deploy",
      "--project",
      "codovate-dev",
      "--only",
      "firestore:rules,firestore:indexes",
    ],
  ],
  [
    "npx",
    [
      "--yes",
      "firebase-tools@15.34.2",
      "deploy",
      "--project",
      "codovate-dev",
      "--only",
      "hosting",
    ],
  ],
];
export function commandInvocation(
  command,
  args,
  {
    platform = process.platform,
    npmExecPath = process.env.npm_execpath,
    nodeExecPath = process.execPath,
  } = {},
) {
  if (platform !== "win32") return { command, args };
  if (!npmExecPath)
    throw new Error(
      "Run this script with npm run deploy:onboarding so the npm installation can be located.",
    );
  // Invoke npm's JavaScript entry points directly; Windows .cmd wrappers need a shell.
  const cli =
    command === "npm"
      ? npmExecPath
      : win32.join(win32.dirname(npmExecPath), "npx-cli.js");
  return { command: nodeExecPath, args: [cli, ...args] };
}
function runCommand(command, args) {
  const invocation = commandInvocation(command, args);
  return spawnSync(invocation.command, invocation.args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
}
export function deployOnboarding(run = runCommand) {
  for (const [command, args] of deploymentSteps) {
    const result = run(command, args);
    if (result.error || result.status !== 0)
      throw new Error(
        "Deployment stopped. Fix the failed step before retrying; Hosting is released only after the rules and indexes deployment succeeds.",
      );
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    deployOnboarding();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
