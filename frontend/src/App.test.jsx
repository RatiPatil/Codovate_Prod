import { afterEach, describe, it, expect, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { SessionProvider } from "./session";
vi.mock("./firebase", () => ({
  configured: false,
  app: null,
  auth: null,
  db: null,
  storage: null,
}));
vi.spyOn(window, "scrollTo").mockImplementation(() => {});
afterEach(cleanup);
function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
}
describe("disconnected local preview", () => {
  it("keeps original logo and exposes four opportunity categories", () => {
    renderAt("/");
    expect(screen.getAllByAltText("Codovate")[0]).toHaveAttribute(
      "src",
      "/logo-light.png",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "big move.",
    );
    expect(document.querySelectorAll(".path-card")).toHaveLength(4);
    expect(screen.getByText(/Local preview/)).toBeInTheDocument();
  });
  it("switches homepage opportunity categories", async () => {
    renderAt("/");
    fireEvent.click(
      screen.getByRole("button", { name: "Competitions", exact: true }),
    );
    await waitFor(() =>
      expect(document.querySelectorAll(".opportunity-card")).toHaveLength(1),
    );
    expect(
      screen.getByRole("link", {
        name: "Design for a Better Campus",
        exact: true,
      }),
    ).toBeInTheDocument();
  });
  it("filters by URL type and search, then opens a listing detail", async () => {
    renderAt("/explore?type=internship");
    expect(document.querySelectorAll(".opportunity-card")).toHaveLength(3);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search by role, skill or company" }),
      { target: { value: "React" } },
    );
    await waitFor(() =>
      expect(document.querySelectorAll(".opportunity-card")).toHaveLength(1),
    );
    fireEvent.click(
      screen.getByRole("link", {
        name: "Frontend Development Intern",
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Frontend Development Intern",
      ),
    );
    expect(screen.getByRole("button", { name: "Preview only" })).toBeDisabled();
  });
  it("shows Google sign-in clearly while preventing unconfigured auth requests", () => {
    renderAt("/login");
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeDisabled();
  });
  it("shows precise Firebase status without claiming a live connection", () => {
    renderAt("/setup");
    expect(
      screen.getByRole("button", { name: "Check live Firestore" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Local configuration is not loaded/),
    ).toBeInTheDocument();
    expect(screen.getByText("npm run firebase:setup")).toBeInTheDocument();
  });
  it("protects disconnected student and admin workspaces", () => {
    renderAt("/admin");
    expect(
      screen.getByRole("heading", {
        name: "Connect your new Firebase project",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Publish opportunity" }),
    ).not.toBeInTheDocument();
  });
});
