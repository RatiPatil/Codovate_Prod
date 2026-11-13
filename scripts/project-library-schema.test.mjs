import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateDocument } from "./validate-schema.mjs";
const read = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const rows = await read("../frontend/src/projectLibrary.json"),
  schema = await read("../database/project-library.schema.json");
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const valid = ajv.compile(schema);
test("all 90 source entries validate as seed and Firestore records", () => {
  assert.equal(valid(rows), true, JSON.stringify(valid.errors));
  for (const row of rows)
    assert.equal(validateDocument("projectLibrary", row.id, row).valid, true);
});
test("rejects fabricated source links, invalid types and unbounded fields", () => {
  for (const change of [
    { sourceUrl: "javascript:alert(1)" },
    { sourceKind: "idea", sourceUrl: "https://github.com/a/b" },
    { sourceKind: "repository", sourceUrl: null },
    { title: "x".repeat(181) },
    { studentId: "fake" },
    { status: "private" },
  ])
    assert.equal(valid([{ ...rows[0], ...change }, ...rows.slice(1)]), false);
});
