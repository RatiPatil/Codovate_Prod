import { createHash } from "node:crypto";
export async function verifyImportPrivacy({
  project,
  credential,
  expected,
  fetcher = fetch,
}) {
  if (project !== "codovate-dev") throw new Error("Unexpected import project.");
  let token;
  try {
    token = await credential.getAccessToken();
  } catch {
    throw new Error(
      "Firebase Admin credentials unavailable. Use trusted application-default credentials.",
    );
  }
  async function get(resource) {
    const response = await fetcher(
      "https://firebaserules.googleapis.com/v1/" + resource,
      {
        headers: { Authorization: "Bearer " + token.access_token },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok)
      throw new Error(
        "Cannot verify deployed privacy rules: HTTP " + response.status,
      );
    return response.json();
  }
  const release = await get(
    "projects/" + project + "/releases/cloud.firestore",
  );
  if (!release.rulesetName?.startsWith("projects/" + project + "/rulesets/"))
    throw new Error("Unexpected deployed ruleset project.");
  const ruleset = await get(release.rulesetName);
  const deployed = ruleset.source?.files?.find((f) =>
    f.name.endsWith("firestore.rules"),
  )?.content;
  const hash = (s) =>
    createHash("sha256").update(s.replace(/\r\n/g, "\n").trim()).digest("hex");
  if (!deployed || hash(deployed) !== hash(expected))
    throw new Error(
      "Privacy policy mismatch. Deploy this checkout’s Firestore rules before importing. No users created.",
    );
}
