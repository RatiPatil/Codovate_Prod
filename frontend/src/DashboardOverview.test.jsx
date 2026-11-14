import { afterEach, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardOverview } from "./DashboardOverview";
afterEach(cleanup);
const empty = { items: [], loading: false, error: null };
const show = (props = {}) =>
  render(
    <MemoryRouter>
      <DashboardOverview
        profile={{ name: "STUDENT", skills: [] }}
        applications={empty}
        saved={empty}
        catalog={empty}
        renderOpportunity={(o) => <article key={o.id}>{o.title}</article>}
        {...props}
      />
    </MemoryRouter>,
  );
it("provides useful direct actions without obsolete planner and learning-library links", () => {
  show();
  expect(screen.getByRole("link", { name: /Project library/ })).toHaveAttribute(
    "href",
    "/projects?view=library",
  );
  expect(
    screen.getByRole("link", { name: /Placement preparation/ }),
  ).toHaveAttribute("href", "/placement");
  expect(screen.queryByText("Plan your next step")).not.toBeInTheDocument();
});
it("shows unknown counts while loading instead of reporting zero", () => {
  show({
    applications: { ...empty, loading: true },
    saved: { ...empty, error: new Error("offline") },
  });
  expect(screen.getByRole("link", { name: /Applications/ })).toHaveTextContent(
    "…",
  );
  expect(
    screen.getByRole("link", { name: /Saved opportunities/ }),
  ).toHaveTextContent("—");
});
it("does not show an empty recommendations section", () => {
  show();
  expect(
    screen.queryByRole("heading", { name: "Opportunities worth a look" }),
  ).not.toBeInTheDocument();
});
