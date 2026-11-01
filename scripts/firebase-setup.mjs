import { spawn } from "node:child_process";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyProjectConfig, saveLocalConfig } from "./firebase-setup-lib.mjs";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const project = JSON.parse(
  await readFile(join(root, "config/firebase.project.json"), "utf8"),
);
if (
  !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project.projectId) ||
  !/^1:\d+:web:[a-f0-9]+$/.test(project.appId) ||
  !/^\d+\.\d+\.\d+$/.test(project.cliVersion)
)
  throw new Error("Invalid project settings");
const configureOnly = process.argv.includes("--configure-only");
async function firebase(args, { capture = false } = {}) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli?.endsWith(".js"))
    throw new Error("Run this tool through npm run firebase:setup.");
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        npmCli,
        "exec",
        "--yes",
        "--package=firebase-tools@" + project.cliVersion,
        "--",
        "firebase",
        ...args,
      ],
      {
        cwd: root,
        stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
        env: { ...process.env, FIREBASE_CLI_DISABLE_UPDATE_CHECK: "true" },
      },
    );
    let output = "";
    if (capture) {
      child.stdout.on("data", (d) => (output += d));
      child.stderr.on("data", (d) => (output += d));
    }
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(output)
        : reject(
            new Error(
              "Firebase " +
                args[0] +
                " failed. Check that the signed-in account can access " +
                project.projectId +
                ".",
            ),
          ),
    );
  });
}
let temp;
try {
  console.log(
    "Connecting Codovate to " +
      project.projectId +
      ". No application data will be imported or deleted.",
  );
  // The user authorizes Firebase in their own browser; credentials never enter project files.
  await firebase(["login"]);
  temp = await mkdtemp(join(tmpdir(), "codovate-firebase-"));
  const configFile = join(temp, "web-config.json");
  await firebase(
    [
      "apps:sdkconfig",
      "WEB",
      project.appId,
      "--project",
      project.projectId,
      "--out",
      configFile,
      "--non-interactive",
    ],
    { capture: true },
  );
  const config = verifyProjectConfig(
    JSON.parse(await readFile(configFile, "utf8")),
    project,
  );
  await saveLocalConfig(root, config);
  console.log("Saved frontend/.env.local (ignored by Git).");
  if (!configureOnly) {
    console.log(
      "Deploying Firestore rules/indexes and Storage rules to " +
        project.projectId +
        " only. Hosting is not deployed.",
    );
    await firebase([
      "deploy",
      "--only",
      "firestore:rules,firestore:indexes",
      "--project",
      project.projectId,
      "--non-interactive",
    ]);
    console.log(
      "Firestore rules and indexes deployed. Deploying private Storage rules next.",
    );
    await firebase([
      "deploy",
      "--only",
      "storage",
      "--project",
      project.projectId,
      "--non-interactive",
    ]);
  }
  console.log(
    "Local configuration" +
      (configureOnly ? "" : " and rule/index deployment") +
      " complete.",
  );
  console.log(
    "Firebase Console: enable Google and Email/Password sign-in, authorize localhost and 127.0.0.1, and create Firestore/Storage if not yet provisioned.",
  );
  console.log(
    "Next: npm run dev. Open /setup to verify a live Firestore read.",
  );
} catch (e) {
  console.error(e.message);
  console.error(
    "No database content was seeded or deleted. A failed deployment may leave rules/indexes unchanged or partially deployed; correct the reported issue and rerun.",
  );
  process.exitCode = 1;
} finally {
  if (temp) await rm(temp, { recursive: true, force: true });
}
