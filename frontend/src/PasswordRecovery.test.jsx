import { it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const fake = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("./firebase", () => ({ auth: {}, configured: true }));
vi.mock("firebase/auth", () => ({ sendPasswordResetEmail: fake.send }));
import { PasswordRecovery, recoveryEmail } from "./PasswordRecovery";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("validates recovery email", () => {
  expect(recoveryEmail(" user@example.com ")).toBe("user@example.com");
  expect(() => recoveryEmail("no email")).toThrow();
});
it("requests a real Firebase link and applies resend cooldown", async () => {
  fake.send.mockResolvedValue();
  render(
    <MemoryRouter>
      <PasswordRecovery />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "user@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "one-time password reset link",
    ),
  );
  expect(fake.send).toHaveBeenCalledWith(
    {},
    "user@example.com",
    expect.objectContaining({ url: expect.stringContaining("/login") }),
  );
  expect(screen.getByRole("button", { name: /Resend in/ })).toBeDisabled();
});
it("reports delivery failure without claiming a link was sent", async () => {
  fake.send.mockRejectedValue({ code: "auth/network-request-failed" });
  render(
    <MemoryRouter>
      <PasswordRecovery />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "user@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "could not be confirmed",
    ),
  );
  expect(screen.queryByRole("status")).toBeNull();
});
