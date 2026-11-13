import { beforeEach, afterEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const mock = vi.hoisted(() => ({
  user: { uid: "alice" },
  items: [],
  toggle: vi.fn(),
  loading: false,
}));
vi.mock("./session", () => ({ useSession: () => ({ user: mock.user }) }));
vi.mock("./data", () => ({
  useOwned: () => ({ items: mock.items, loading: mock.loading, error: null }),
  toggleSaved: mock.toggle,
}));
import {
  OpportunitySaveProvider,
  SaveOpportunityButton,
} from "./OpportunitySave";
const item = {
  id: "official-job",
  title: "Engineer",
  organization: "Employer",
  type: "job",
  external: true,
  sourceUrl: "https://example.com/job",
};
const ui = () => (
  <MemoryRouter initialEntries={["/opportunities/official-job"]}>
    <OpportunitySaveProvider>
      <SaveOpportunityButton item={item} />
    </OpportunitySaveProvider>
  </MemoryRouter>
);
beforeEach(() => {
  mock.user = { uid: "alice" };
  mock.items = [];
  mock.loading = false;
  mock.toggle.mockReset();
});
afterEach(cleanup);
it("saves an official-link opportunity and reflects its persisted bookmark", async () => {
  const { rerender } = render(ui());
  fireEvent.click(screen.getByRole("button", { name: "Save Engineer" }));
  await waitFor(() =>
    expect(mock.toggle).toHaveBeenCalledWith("alice", item, false),
  );
  mock.items = [{ opportunityId: item.id }];
  rerender(ui());
  expect(
    screen.getByRole("button", { name: "Unsave Engineer" }),
  ).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Unsave Engineer" }));
  await waitFor(() =>
    expect(mock.toggle).toHaveBeenLastCalledWith("alice", item, true),
  );
});
it("asks guests to sign in and never writes an anonymous bookmark", () => {
  mock.user = null;
  render(ui());
  expect(
    screen.getByRole("link", { name: "Sign in to save Engineer" }),
  ).toHaveAttribute("href", "/login");
  expect(mock.toggle).not.toHaveBeenCalled();
});
it("blocks repeat clicks while saving and preserves the failure for retry", async () => {
  let reject;
  mock.toggle.mockImplementationOnce(() => new Promise((_, r) => (reject = r)));
  render(ui());
  const button = screen.getByRole("button", { name: "Save Engineer" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(mock.toggle).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  reject({ code: "permission-denied" });
  await screen.findByRole("alert");
  expect(button).not.toBeDisabled();
});
it("does not offer a premature toggle while the account bookmarks are loading", () => {
  mock.loading = true;
  render(ui());
  expect(screen.getByRole("button", { name: "Save Engineer" })).toBeDisabled();
});
