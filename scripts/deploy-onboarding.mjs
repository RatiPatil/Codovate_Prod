import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

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
      "firestore:rules",
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
export function deployOnboarding(
  run = (command, args) =>
    spawnSync(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    }),
) {
  for (const [command, args] of deploymentSteps) {
    const result = run(command, args);
    if (result.error || result.status !== 0)
      throw new Error(
        "Deployment stopped. Fix the failed step before retrying; Hosting is released only after the rules deployment succeeds.",
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
