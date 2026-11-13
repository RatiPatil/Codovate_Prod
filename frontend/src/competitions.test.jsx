import { it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import records from "./curatedOpportunities.json";
import { externalAvailable, externalOpportunity } from "./externalCatalog";
import { ExternalDetails } from "./ExternalDetails";
afterEach(cleanup);
it("contains ten reviewed competitions with official logos and direct organizer links", () => {
  const rows = records.filter((r) => r.type === "competition");
  expect(rows).toHaveLength(10);
  for (const row of rows) {
    expect(row.logo).toMatch(/^\/(company-logos|competition-logos)\//);
    expect(row.logoSource).toMatch(/^https:\/\//);
    expect(externalAvailable(row, Date.parse(row.reviewedAt) + 3600000)).toBe(
      true,
    );
  }
  expect(rows.filter((r) => r.competitionKind === "practice")).toHaveLength(5);
});
it("shows the real logo, entry notes and official destination on competition details", () => {
  const row = externalOpportunity(
    records.find((r) => r.id === "gemma4-developer-agent"),
  );
  render(
    <MemoryRouter>
      <ExternalDetails item={row} />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("img", { name: "Google / Kaggle logo" }),
  ).toHaveAttribute("src", row.logo);
  expect(
    screen.getByText(/Accept the rules by 25 November/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", {
      name: /Apply on official website|Check original listing/,
    }),
  ).toHaveAttribute("href", row.sourceUrl);
});
