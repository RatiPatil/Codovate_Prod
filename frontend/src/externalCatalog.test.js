import { it, expect } from "vitest";
import records from "./curatedOpportunities.json";
import {
  mergeOpportunityCatalog,
  externalById,
  REVIEW_WINDOW_MS,
} from "./externalCatalog";
import { filterOpportunities, isOpen, deadlineMillis } from "./domain";
const checked = Math.max(...records.map((row) => Date.parse(row.reviewedAt))),
  now = checked + 3600000;
it("puts sourced jobs, internships and hackathons in the main catalog", () => {
  const rows = mergeOpportunityCatalog([], now);
  expect(rows).toHaveLength(40);
  expect(new Set(rows.map((o) => o.type))).toEqual(
    new Set(["internship", "job", "competition"]),
  );
  expect(rows.every((o) => o.external && o.status === "published")).toBe(true);
});
it("shares the same main-module filters for all records", () => {
  const rows = mergeOpportunityCatalog([], now);
  expect(
    filterOpportunities(rows, { type: "internship", openOnly: false }),
  ).toHaveLength(15);
  expect(
    filterOpportunities(rows, { type: "job", openOnly: false }),
  ).toHaveLength(15);
  expect(
    filterOpportunities(rows, { type: "hackathon", openOnly: false }),
  ).toHaveLength(0);
  expect(
    filterOpportunities(rows, { search: "Stripe", openOnly: false }),
  ).toHaveLength(1);
});
it("hides stale snapshots and known expired deadlines", () => {
  expect(
    mergeOpportunityCatalog(
      [],
      Math.max(...records.map((r) => Date.parse(r.reviewedAt))) +
        REVIEW_WINDOW_MS,
    ),
  ).toHaveLength(0);
  expect(
    mergeOpportunityCatalog(
      [],
      Math.min(...records.map((row) => Date.parse(row.reviewedAt))) - 1,
    ),
  ).toHaveLength(0);
  const old = externalById(records[0].id);
  expect(isOpen(old, now)).toBe(true);
  expect(isOpen(old, checked + REVIEW_WINDOW_MS)).toBe(false);
  expect(
    isOpen({ ...old, deadline: new Date(now - 1).toISOString() }, now),
  ).toBe(false);
});
it("does not invent job compensation or application deadlines", () => {
  const job = externalById("amazon-10580008");
  expect(job.stipend).toBeNull();
  expect(job.deadline).toBeNull();
  expect(deadlineMillis(job)).toBe(Infinity);
  expect(job.eligibility).toContain("1+ years");
  expect(externalById("missing")).toBeNull();
});
it("preserves managed records and avoids ID duplicates", () => {
  const managed = { id: records[0].id, title: "Managed", status: "published" };
  const rows = mergeOpportunityCatalog([managed], now);
  expect(rows).toHaveLength(40);
  expect(rows.find((r) => r.id === managed.id)).toBe(managed);
});
