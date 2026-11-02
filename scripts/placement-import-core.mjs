import { validateDocument } from "./validate-schema.mjs";
const externalParents = new Set([
  "apt-quant",
  "apt-data",
  "apt-verbal",
  "apt-formulas",
  "apt-puzzles",
  "apt-guesstimates",
]);
export function preparePlacementPack(pack) {
  if (
    pack?.format !== "codovate-placement-v1" ||
    !Array.isArray(pack.records) ||
    !pack.records.length ||
    pack.records.length > 2000
  )
    throw new Error("Use a codovate-placement-v1 pack with 1–2,000 records.");
  const byId = new Map();
  for (const row of pack.records) {
    if (
      !row ||
      !/^apt-[a-zA-Z0-9_-]{1,124}$/.test(row.id || "") ||
      byId.has(row.id)
    )
      throw new Error("Content IDs must be unique aptitude IDs.");
    const { id, ...data } = row;
    if (data.sectionId !== "aptitude")
      throw new Error("This importer only accepts Aptitude content.");
    const check = validateDocument("placementContent", id, {
      ...data,
      createdBy: "operator-content-import",
      createdAt: "2026-11-02T00:00:00Z",
      updatedAt: "2026-11-02T00:00:00Z",
    });
    if (!check.valid)
      throw new Error(
        "Content schema validation failed for " +
          id +
          ": " +
          check.errors.join("; "),
      );
    byId.set(id, row);
  }
  for (const row of byId.values()) {
    if (row.parentId) {
      const parent = byId.get(row.parentId);
      if (!parent && !externalParents.has(row.parentId))
        throw new Error("Missing content parent.");
      if (
        parent &&
        (parent.kind !== "folder" || parent.sectionId !== row.sectionId)
      )
        throw new Error("Parent must be a same-section folder.");
    }
  }
  const ordered = [],
    visiting = new Set(),
    done = new Set();
  function visit(row) {
    if (done.has(row.id)) return;
    if (visiting.has(row.id))
      throw new Error("Content hierarchy contains a cycle.");
    visiting.add(row.id);
    if (byId.has(row.parentId)) visit(byId.get(row.parentId));
    visiting.delete(row.id);
    done.add(row.id);
    ordered.push(row);
  }
  for (const row of byId.values()) visit(row);
  return ordered;
}
export async function applyPlacementPack(
  rows,
  { db, timestamp, onProgress = () => {}, onCheck = () => {} },
) {
  const snapshots = new Map();
  let checked = 0;
  for (const row of rows) {
    snapshots.set(
      row.id,
      await db.collection("placementContent").doc(row.id).get(),
    );
    onCheck({ checked: ++checked, total: rows.length });
  }
  const external = new Set(
    rows.map((r) => r.parentId).filter((id) => id && !snapshots.has(id)),
  );
  for (const id of external) {
    const snap = await db.collection("placementContent").doc(id).get();
    if (
      !snap.exists ||
      snap.data().kind !== "folder" ||
      snap.data().sectionId !== "aptitude"
    )
      throw new Error(
        "Install the starter folders before the source-review pack.",
      );
  }
  const matches = (d, row) =>
    d.kind === row.kind &&
    d.parentId === row.parentId &&
    d.sectionId === row.sectionId;
  for (const row of rows) {
    const snap = snapshots.get(row.id);
    if (snap.exists && !matches(snap.data(), row))
      throw new Error(
        "An existing content ID has different hierarchy. Nothing was overwritten.",
      );
  }
  const available = new Set([
    ...external,
    ...rows.filter((r) => snapshots.get(r.id).exists).map((r) => r.id),
  ]);
  const result = { created: 0, existing: 0, failed: 0 };
  for (const row of rows) {
    const { id, ...data } = row;
    if (row.parentId && !available.has(row.parentId)) result.failed++;
    else if (snapshots.get(id).exists) result.existing++;
    else {
      try {
        await db
          .collection("placementContent")
          .doc(id)
          .create({
            ...data,
            createdBy: "operator-content-import",
            createdAt: timestamp(),
            updatedAt: timestamp(),
          });
        available.add(id);
        result.created++;
      } catch (e) {
        if (e.code === 6 || e.code === "already-exists") {
          const snap = await db.collection("placementContent").doc(id).get();
          if (snap.exists && matches(snap.data(), row)) {
            available.add(id);
            result.existing++;
          } else result.failed++;
        } else result.failed++;
      }
    }
    onProgress({ ...result, total: rows.length });
  }
  return result;
}
