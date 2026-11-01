import { afterEach, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("keeps the app usable when a child screen fails without exposing internal errors", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  function Broken() {
    throw new Error("internal implementation detail");
  }
  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  );
  expect(
    screen.getByRole("heading", { name: "This page needs a fresh start." }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Reload application" }),
  ).toBeEnabled();
  expect(screen.getByRole("link", { name: "Go to home" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(
    screen.queryByText("internal implementation detail"),
  ).not.toBeInTheDocument();
});
it("renders working screens without an extra layout wrapper", () => {
  const { container } = render(
    <ErrorBoundary>
      <h1>Working screen</h1>
    </ErrorBoundary>,
  );
  expect(container.firstChild.tagName).toBe("H1");
});
