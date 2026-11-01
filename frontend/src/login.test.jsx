import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const state = vi.hoisted(() => ({
  session: null,
  auth: { currentUser: null },
  login: vi.fn(),
  google: vi.fn(),
  signup: vi.fn(),
}));
vi.mock("./firebase", () => ({
  configured: true,
  auth: state.auth,
  db: null,
  storage: null,
}));
vi.mock("./session", () => ({ useSession: () => state.session }));
vi.mock("./data", () => ({
  useOpportunities: () => ({ items: [], loading: false, error: null }),
  useOwned: () => ({ items: [], loading: false, error: null }),
  applyToOpportunity: vi.fn(),
  toggleSaved: vi.fn(),
}));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(function () {}),
  signInWithEmailAndPassword: state.login,
  createUserWithEmailAndPassword: state.signup,
  signInWithPopup: state.google,
  sendPasswordResetEmail: vi.fn(),
}));
import App from "./App";
vi.spyOn(window, "scrollTo").mockImplementation(() => {});
beforeEach(() => {
  state.auth.currentUser = null;
  state.login.mockReset();
  state.google.mockReset();
  state.signup.mockReset();
  state.session = {
    user: null,
    profile: null,
    admin: false,
    loading: false,
    sessionError: null,
    retrySession: vi.fn(),
    logout: vi.fn().mockResolvedValue(),
    createProfile: vi.fn().mockResolvedValue(),
  };
});
afterEach(cleanup);
function open(path = "/login") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
function credentials() {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "student@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "sixsix" },
  });
}
describe("login regressions", () => {
  it("routes a verified admin from the shared login to administration", async () => {
    state.session.user = { uid: "operator" };
    state.session.admin = true;
    open();
    expect(
      await screen.findByRole("heading", { name: "Platform administration" }),
    ).toBeInTheDocument();
  });
  it("does not admit a student to the administrator screen", () => {
    state.session.user = { uid: "student" };
    open("/admin");
    expect(
      screen.queryByRole("heading", { name: "Platform administration" }),
    ).not.toBeInTheDocument();
  });

  it("allows existing six-character passwords to reach Firebase", async () => {
    state.login.mockImplementation(async () => {
      const user = { uid: "student", email: "student@example.com" };
      state.auth.currentUser = user;
      state.session.user = user;
      return { user };
    });
    open();
    expect(screen.getByLabelText("Password")).not.toHaveAttribute("minlength");
    credentials();
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in", exact: true }),
    );
    await waitFor(() =>
      expect(state.login).toHaveBeenCalledWith(
        state.auth,
        "student@example.com",
        "sixsix",
      ),
    );
    expect(state.session.createProfile).toHaveBeenCalled();
  });
  it("keeps the stronger minimum on new registrations", () => {
    open("/signup");
    expect(screen.getByLabelText("Password")).toHaveAttribute("minlength", "8");
  });
  it("shows invalid credentials without redirecting or creating a profile", async () => {
    state.login.mockRejectedValue({ code: "auth/invalid-credential" });
    open();
    credentials();
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in", exact: true }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "email or password is incorrect",
    );
    expect(state.session.createProfile).not.toHaveBeenCalled();
  });
  it("identifies successful sign-in separately from denied profile setup", async () => {
    state.login.mockImplementation(async () => {
      const user = { uid: "student", email: "student@example.com" };
      state.auth.currentUser = user;
      state.session.user = user;
      return { user };
    });
    state.session.createProfile.mockImplementation(async () => {
      state.session.sessionError = {
        code: "permission-denied",
        source: "profile",
      };
      throw { code: "permission-denied" };
    });
    open();
    credentials();
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in", exact: true }),
    );
    expect(
      await screen.findByRole("heading", { name: "You’re signed in." }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(state.session.retrySession).toHaveBeenCalledOnce();
  });
  it("does not treat a failed credential attempt as success because another user is cached", async () => {
    state.auth.currentUser = { uid: "cached-other-user" };
    state.login.mockRejectedValue({ code: "auth/invalid-credential" });
    open();
    credentials();
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in", exact: true }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "email or password is incorrect",
    );
    expect(state.session.createProfile).not.toHaveBeenCalled();
  });
  it("explains a blocked Google popup", async () => {
    state.google.mockRejectedValue({ code: "auth/popup-blocked" });
    open();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "browser blocked Google sign-in",
    );
  });
});
