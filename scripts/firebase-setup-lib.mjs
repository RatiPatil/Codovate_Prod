import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { join } from "node:path";
export const requiredConfig = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];
export function verifyProjectConfig(config, expected) {
  for (const key of requiredConfig)
    if (
      typeof config[key] !== "string" ||
      !config[key].trim() ||
      /[\r\n]/.test(config[key])
    )
      throw new Error("Firebase configuration is missing or invalid: " + key);
  if (
    config.projectId !== expected.projectId ||
    config.appId !== expected.appId
  )
    throw new Error(
      "Firebase returned a different project or app. No local configuration was changed.",
    );
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(config.projectId))
    throw new Error("Invalid Firebase project ID");
  return config;
}
export function environmentText(config, previous = "") {
  const fields = {
    VITE_FIREBASE_ENABLED: "true",
    ...Object.fromEntries(
      requiredConfig.map((key) => [
        "VITE_FIREBASE_" + key.replace(/[A-Z]/g, (c) => "_" + c).toUpperCase(),
        config[key],
      ]),
    ),
    VITE_USE_EMULATORS: "false",
  };
  const other = previous
    .split(/\r?\n/)
    .filter((line) => {
      const key = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/)?.[1];
      return !key || !Object.hasOwn(fields, key);
    })
    .join("\n")
    .trim();
  return (
    (other ? other + "\n" : "") +
    Object.entries(fields)
      .map(([k, v]) => k + "=" + v)
      .join("\n") +
    "\n"
  );
}
export async function saveLocalConfig(root, config) {
  const file = join(root, "frontend", ".env.local");
  let previous = "";
  try {
    previous = await readFile(file, "utf8");
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  await mkdir(join(root, "frontend"), { recursive: true });
  const temporary = file + ".tmp";
  await writeFile(temporary, environmentText(config, previous), {
    mode: 0o600,
  });
  await rename(temporary, file);
  return file;
}
