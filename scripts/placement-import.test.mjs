import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  preparePlacementPack,
  applyPlacementPack,
} from "./placement-import-core.mjs";
const starter = JSON.parse(
  await readFile(
    new URL("../frontend/src/aptitudeStarter.json", import.meta.url),
    "utf8",
  ),
);
const inventory = JSON.parse(
  await readFile(
    new URL("../database/aptitude/source-inventory.json", import.meta.url),
    "utf8",
  ),
);
test("starter has six folders and 33 valid readable lessons", () => {
  const rows = preparePlacementPack(starter);
  assert.equal(rows.filter((r) => r.kind === "folder").length, 6);
  assert.equal(rows.filter((r) => r.kind === "article").length, 33);
  assert(
    rows
      .filter((r) => r.kind === "article")
      .every((r) => r.body.includes("## ") && r.practice.length > 0),
  );
});
test("all 25 source files are accounted for separately from reviewed lessons", () => {
  assert.equal(inventory.sources.length, 25);
  assert.equal(
    inventory.sources.reduce((n, s) => n + s.pages, 0),
    2247,
  );
  assert.equal(inventory.sources.filter((s) => s.method === "ocr").length, 3);
  assert(
    inventory.sources.every(
      (s) => s.status === "needs_editorial_review" && s.sha256.length === 64,
    ),
  );
});
test("rejects duplicate IDs, cycles, unknown fields and unknown parents", () => {
  const one = structuredClone(starter.records[0]);
  assert.throws(() =>
    preparePlacementPack({ format: starter.format, records: [one, one] }),
  );
  assert.throws(() =>
    preparePlacementPack({
      format: starter.format,
      records: [{ ...one, parentId: one.id }],
    }),
  );
  assert.throws(() =>
    preparePlacementPack({
      format: starter.format,
      records: [{ ...one, gems: 1 }],
    }),
  );
  assert.throws(() =>
    preparePlacementPack({
      format: starter.format,
      records: [{ ...one, parentId: "missing" }],
    }),
  );
});
test("rejects malformed answers and another module", () => {
  const one = structuredClone(starter.records.find((r) => r.practice));
  one.practice[0].answerIndex = 9;
  assert.throws(() =>
    preparePlacementPack({ format: starter.format, records: [one] }),
  );
  assert.throws(() =>
    preparePlacementPack({
      format: starter.format,
      records: [{ ...starter.records[0], sectionId: "dbms" }],
    }),
  );
});
function fake(existing = {}, fail = false) {
  const data = new Map(Object.entries(existing));
  let writes = 0;
  return {
    data,
    get writes() {
      return writes;
    },
    db: {
      collection: () => ({
        doc: (id) => ({
          get: async () => ({ exists: data.has(id), data: () => data.get(id) }),
          create: async (d) => {
            if (fail) throw { code: "unavailable" };
            writes++;
            data.set(id, d);
          },
        }),
      }),
    },
  };
}
test("import creates once, skips existing and never replaces editorial changes", async () => {
  const rows = preparePlacementPack({
      format: starter.format,
      records: starter.records.slice(0, 1),
    }),
    f = fake();
  assert.deepEqual(
    await applyPlacementPack(rows, { db: f.db, timestamp: () => 1 }),
    { created: 1, existing: 0, failed: 0 },
  );
  f.data.get(rows[0].id).title = "My edit";
  assert.deepEqual(
    await applyPlacementPack(rows, { db: f.db, timestamp: () => 1 }),
    { created: 0, existing: 1, failed: 0 },
  );
  assert.equal(f.data.get(rows[0].id).title, "My edit");
});
test("checks incompatible existing hierarchy before any writes", async () => {
  const rows = preparePlacementPack({
      format: starter.format,
      records: starter.records.slice(0, 2),
    }),
    f = fake({ [rows[1].id]: { ...rows[1], kind: "article" } });
  await assert.rejects(() =>
    applyPlacementPack(rows, { db: f.db, timestamp: () => 1 }),
  );
  assert.equal(f.writes, 0);
});
test("failed writes remain failures for safe rerun", async () => {
  const rows = preparePlacementPack({
      format: starter.format,
      records: starter.records.slice(0, 1),
    }),
    f = fake({}, true);
  assert.deepEqual(
    await applyPlacementPack(rows, { db: f.db, timestamp: () => 1 }),
    { created: 0, existing: 0, failed: 1 },
  );
});

test("failed folder creation never leaves newly created orphan children", async () => {
  const folder = starter.records[0],
    article = starter.records.find((r) => r.parentId === folder.id);
  const rows = preparePlacementPack({
    format: starter.format,
    records: [folder, article],
  });
  const f = fake({}, true);
  const result = await applyPlacementPack(rows, {
    db: f.db,
    timestamp: () => 1,
  });
  assert.deepEqual(result, { created: 0, existing: 0, failed: 2 });
  assert.equal(f.writes, 0);
});
