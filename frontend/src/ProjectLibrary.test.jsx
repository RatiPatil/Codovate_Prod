import { it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
vi.mock("./firebase", () => ({ configured: false, db: null }));
import { ProjectLibrary } from "./ProjectLibrary";
import seed from "./projectLibrary.json";
import { libraryRows, filterLibrary } from "./projectLibraryData";
afterEach(cleanup);
it("contains all 90 project entries with accurate source types", () => {
  expect(seed).toHaveLength(90);
  expect(new Set(seed.map((r) => r.id)).size).toBe(90);
  expect(seed.filter((r) => r.sourceKind === "idea")).toHaveLength(16);
  expect(seed.filter((r) => r.sourceKind === "repository")).toHaveLength(69);
  expect(seed.filter((r) => r.sourceKind === "collection")).toHaveLength(4);
  expect(seed.filter((r) => r.sourceKind === "article")).toHaveLength(1);
  expect(
    seed.every((r) => (r.sourceKind === "idea") === (r.sourceUrl === null)),
  ).toBe(true);
});
it("searches case-insensitively and filters by technology and reference type", () => {
  render(<ProjectLibrary />);
  expect(screen.getByRole("status")).toHaveTextContent("90 projects");
  expect(screen.getAllByRole("article")).toHaveLength(12);
  fireEvent.change(screen.getByLabelText("Technology / domain"), {
    target: { value: "Core Java" },
  });
  expect(screen.getAllByRole("article")).toHaveLength(5);
  fireEvent.click(
    screen.getByRole("button", { name: "Clear library filters" }),
  );
  fireEvent.change(screen.getByLabelText("Reference type"), {
    target: { value: "idea" },
  });
  expect(screen.getByRole("status")).toHaveTextContent("16 projects");
  fireEvent.change(screen.getByLabelText("Search project library"), {
    target: { value: "SMART IRRIGATION" },
  });
  expect(
    screen.getByRole("heading", { name: "Smart Irrigation for Agriculture" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("link")).toBeNull();
});
it("applies admin hidden records over bundled references and pages results", () => {
  expect(libraryRows([{ ...seed[0], status: "hidden" }])).toHaveLength(89);
  expect(libraryRows([{ ...seed[0], status: "hidden" }], true)).toHaveLength(
    90,
  );
  render(<ProjectLibrary />);
  fireEvent.click(screen.getByRole("button", { name: "Show more projects" }));
  expect(screen.getAllByRole("article")).toHaveLength(24);
  expect(screen.getAllByRole("link")[0]).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
  expect(filterLibrary(seed, { search: "not-a-real-project" })).toHaveLength(0);
});
