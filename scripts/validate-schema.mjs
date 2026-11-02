import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
const schema = JSON.parse(
  await readFile(
    new URL("../database/firestore.schema.json", import.meta.url),
    "utf8",
  ),
);
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
ajv.addSchema(schema);
const validators = Object.fromEntries(
  Object.keys(schema.$defs).map((name) => [
    name,
    ajv.compile({ $ref: schema.$id + "#/$defs/" + name }),
  ]),
);
export function validateDocument(collection, id, data) {
  const validate = validators[collection];
  if (!validate) return { valid: false, errors: ["Unknown collection"] };
  const errors = [];
  if (collection === "memberProfiles" && id !== data.uid)
    errors.push("Discovery ID must match uid.");
  if (
    collection === "connections" &&
    (id !== data.fromId + "_" + data.toId ||
      data.fromId === data.toId ||
      (data.status === "blocked"
        ? ![data.fromId, data.toId].includes(data.blockedBy)
        : data.blockedBy !== ""))
  )
    errors.push("Connection identity or blocking state is invalid.");
  if (
    collection === "groupInvites" &&
    (id !== data.groupId + "_" + data.studentId ||
      data.ownerId === data.studentId)
  )
    errors.push("Invitation identity is invalid.");
  if (
    collection === "conversations" &&
    (data.kind === "direct"
      ? id !== "dm_" + data.connectionId
      : !Array.isArray(data.members) || !data.members.includes(data.ownerId))
  )
    errors.push("Conversation identity or owner membership is invalid.");
  if (collection === "publicStats" && id !== "community")
    errors.push("Public aggregate ID must be community.");
  if (collection === "adminUsers" && id !== data.uid)
    errors.push("Directory ID must match uid.");
  if (
    collection === "placementProgress" &&
    (id !== data.studentId + "_" + data.lessonId ||
      data.practiceScore > data.practiceTotal)
  )
    errors.push("Learning record identity or score is invalid.");
  if (!validate(data))
    errors.push(
      ...validate.errors.map((e) => (e.instancePath || "/") + " " + e.message),
    );
  if (
    collection === "opportunities" &&
    Date.parse(data.deadline) !== Date.parse(data.closesAt)
  )
    errors.push("deadline and closesAt must represent the same instant");
  if (
    ["applications", "bookmarks"].includes(collection) &&
    id !== data.studentId + "_" + data.opportunityId
  )
    errors.push("Document ID must match studentId_opportunityId");
  if (
    collection === "teamRequests" &&
    id !== data.studentId + "_" + data.teamId
  )
    errors.push("Document ID must match studentId_teamId");
  if (collection === "teamRequests" && data.studentId === data.ownerId)
    errors.push("A team owner cannot request their own team");
  if (
    collection === "mentorBookings" &&
    id !== data.studentId + "_" + data.sessionId
  )
    errors.push("Document ID must match studentId_sessionId");
  if (
    collection === "mentorBookings" &&
    data.status === "confirmed" &&
    data.format === "Online" &&
    !data.meetingUrl
  )
    errors.push("Online confirmations require a meeting URL");
  if (
    ["users", "applications"].includes(collection) &&
    data.resumePath &&
    data.resumePath !==
      "resumes/" +
        (collection === "users" ? id : data.studentId) +
        "/resume.pdf"
  )
    errors.push("Résumé path must belong to the document owner");
  return { valid: errors.length === 0, errors };
}
function normalize(value) {
  if (value?.toDate instanceof Function) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalize(v)]),
    );
  return value;
}
async function main() {
  const args = process.argv.slice(2);
  let input;
  if (args[0] === "--project" && args[1]) {
    const { initializeApp, applicationDefault } =
      await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    initializeApp({ projectId: args[1], credential: applicationDefault() });
    const db = getFirestore();
    input = {};
    for (const name of Object.keys(validators)) {
      const result = await db.collection(name).get();
      input[name] = result.docs.map((d) => ({
        id: d.id,
        data: normalize(d.data()),
      }));
    }
  } else if (args.length === 0 || args[0] === "--examples")
    input = JSON.parse(
      await readFile(
        new URL("../database/examples.json", import.meta.url),
        "utf8",
      ),
    );
  else if (args[0] === "--file" && args[1])
    input = JSON.parse(await readFile(args[1], "utf8"));
  else
    throw new Error(
      "Usage: node scripts/validate-schema.mjs [--examples | --file EXPORT.json | --project NEW_PROJECT_ID]",
    );
  let count = 0,
    failed = 0;
  for (const [collection, rows] of Object.entries(input)) {
    if (!Array.isArray(rows))
      throw new Error(
        "Each collection must contain an array of {id,data} records",
      );
    for (const { id, data } of rows) {
      count++;
      const result = validateDocument(collection, id, data);
      if (!result.valid) {
        failed++;
        console.error(collection + "/" + id + ": " + result.errors.join("; "));
      }
    }
  }
  console.log(
    `${count} documents checked; ${failed} invalid. Read-only validation; no data changed.`,
  );
  if (failed) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
