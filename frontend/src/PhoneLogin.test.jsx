import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const state = vi.hoisted(() => ({ send: vi.fn(), confirm: vi.fn(), clear: vi.fn(), createProfile: vi.fn() }));
vi.mock("./firebase", () => ({ auth: {}, configured: true }));
vi.mock("./session", () => ({ useSession: () => ({ user: null, loading: false, createProfile: state.createProfile }) }));
vi.mock("firebase/auth", () => ({
  RecaptchaVerifier: vi.fn(function () { this.clear = state.clear; }),
  signInWithPhoneNumber: state.send,
}));
import { PhoneLogin, phoneNumber } from "./PhoneLogin";
beforeEach(() => {
  vi.clearAllMocks();
  state.send.mockResolvedValue({ confirm: state.confirm });
  state.confirm.mockResolvedValue({ user: { uid: "phone-user", email: null } });
  state.createProfile.mockResolvedValue();
});
afterEach(cleanup);
function open() {
  render(<MemoryRouter><PhoneLogin /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Student" } });
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "+91 98765 43210" } });
}
it("requires a country code and normalizes phone formatting", () => {
  expect(phoneNumber("+91 98765 43210")).toBe("+919876543210");
  expect(() => phoneNumber("9876543210")).toThrow("country code");
});
it("verifies the SMS before creating the profile and limits resends", async () => {
  open();
  fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
  expect(await screen.findByText("Code sent to +919876543210.")).toBeInTheDocument();
  expect(state.send).toHaveBeenCalledWith({}, "+919876543210", expect.any(Object));
  expect(state.createProfile).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: /Resend in/ })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));
  await waitFor(() => expect(state.createProfile).toHaveBeenCalledWith({ uid: "phone-user", email: null }, "Student"));
});
it("keeps an incorrect code from creating a profile", async () => {
  state.confirm.mockRejectedValue({ code: "auth/invalid-verification-code" });
  open(); fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
  await screen.findByLabelText("Verification code");
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "000000" } });
  fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect code");
  expect(state.createProfile).not.toHaveBeenCalled();
});
it("reports disabled phone authentication and releases reCAPTCHA", async () => {
  state.send.mockRejectedValue({ code: "auth/operation-not-allowed" });
  open(); fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Phone login is not enabled");
  expect(state.clear).toHaveBeenCalled();
});
