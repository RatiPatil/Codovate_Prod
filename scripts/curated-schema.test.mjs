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
  assert.equal(records.filter((r) => r.type === "internship").length, 15);
  assert.equal(records.filter((r) => r.type === "job").length, 15);
  assert.equal(new Set(records.map((r) => r.sourceUrl)).size, records.length);
  assert.equal(records.filter((r) => r.type === "competition").length, 10);
  for (const r of records) {
    const u = new URL(r.sourceUrl);
    assert.equal(u.protocol, "https:");
    assert.equal(u.username + u.password, "");
    assert.ok(
      [
        "amazon.jobs",
        "www.amazon.jobs",
        "stripe.com",
        "jobs.lever.co",
        "imaginecup.microsoft.com",
        "brandstorm.loreal.com",
        "www.kaggle.com",
        "itch.io",
        "ucup.ac",
        "careers.arm.com",
        "www.alehar.com",
        "www.stivate.com",
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
test("hackathon references match their schema without fabricated event metadata", async () => {
  const schema = await read("../database/hackathon-directory.schema.json");
  const records = await read("../frontend/src/hackathonDirectory.json");
  const valid = ajv.compile(schema);
  assert.equal(valid(records), true, JSON.stringify(valid.errors));
  assert.equal(new Set(records.map((r) => r.id)).size, records.length);
  assert.equal(valid([{ ...records[0], deadline: "coming soon" }]), false);
  assert.equal(valid([{ ...records[0], prizeINR: -1 }]), false);
  assert.equal(
    valid([{ ...records[0], sourceUrl: "javascript:alert(1)" }]),
    false,
  );
});
