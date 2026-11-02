import { afterEach, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  CuratedOpportunities,
  curatedRows,
  REVIEW_WINDOW_MS,
} from "./CuratedOpportunities";
import records from "./curatedOpportunities.json";
afterEach(cleanup);
const checked = Date.parse(records[0].reviewedAt),
  now = checked + 3600000;
it("includes real internship, job and hackathon records", () => {
  expect(new Set(curatedRows({}, now).map((o) => o.type))).toEqual(
    new Set(["internship", "job", "hackathon"]),
  );
  expect(records.every((o) => o.sourceUrl.startsWith("https://"))).toBe(true);
  expect(new Set(records.map((o) => o.id)).size).toBe(records.length);
});
it("filters types, keywords, mode and category independently", () => {
  expect(curatedRows({ type: "internship" }, now)).toHaveLength(3);
  expect(curatedRows({ search: "stripe" }, now)).toHaveLength(1);
  expect(
    curatedRows({ mode: "Remote" }, now).every((o) => o.type === "hackathon"),
  ).toBe(true);
  expect(curatedRows({ category: "Design" }, now)).toHaveLength(0);
});
it("hides stale, expired and future-dated records", () => {
  expect(curatedRows({}, checked + REVIEW_WINDOW_MS)).toHaveLength(0);
  expect(curatedRows({}, checked - 1)).toHaveLength(0);
  expect(
    curatedRows({}, now, [
      { ...records[0], deadline: new Date(now - 1).toISOString() },
    ]),
  ).toHaveLength(0);
});
it("does not invent a deadline for rolling jobs", () => {
  expect(
    records
      .filter((o) => o.type !== "hackathon")
      .every((o) => o.deadline === null),
  ).toBe(true);
});
it("renders safe source links or an honest empty state", () => {
  render(<CuratedOpportunities />);
  for (const a of screen.queryAllByRole("link", {
    name: "View official listing",
  })) {
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
  }
  expect(screen.getByText(/curated links/)).toBeInTheDocument();
});
