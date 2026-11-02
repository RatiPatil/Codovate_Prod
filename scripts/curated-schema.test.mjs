import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
const read = async (p) =>
  JSON.parse(await readFile(new URL(p, import.meta.url), "utf8"));
const schema = await read("../database/curated-opportunities.schema.json"),
  records = await read("../frontend/src/curatedOpportunities.json");
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);
test("curated snapshot matches its executable schema", () => {
  assert.equal(validate(records), true, JSON.stringify(validate.errors));
  assert.equal(new Set(records.map((r) => r.id)).size, records.length);
  for (const r of records) {
    const u = new URL(r.sourceUrl);
    assert.equal(u.protocol, "https:");
    assert.equal(u.username + u.password, "");
    assert.ok(
      [
        "amazon.jobs",
        "www.amazon.jobs",
        "stripe.com",
        "paypalaihackathon.devpost.com",
        "launchpad-hacks.devpost.com",
      ].includes(u.hostname),
    );
    if (r.deadline)
      assert.ok(Date.parse(r.deadline) > Date.parse(r.reviewedAt));
  }
});
test("curated schema rejects unsafe URLs and fabricated field types", () => {
  assert.equal(
    validate([{ ...records[0], sourceUrl: "javascript:alert(1)" }]),
    false,
  );
  assert.equal(validate([{ ...records[0], deadline: "rolling" }]), false);
  assert.equal(validate([{ ...records[0], salary: 999999 }]), false);
});
