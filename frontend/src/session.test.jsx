import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const state = vi.hoisted(() => ({
  authChanged: null,
  profileChanged: null,
  existing: false,
  set: vi.fn(),
}));
vi.mock("./firebase", () => ({ auth: {}, db: {}, configured: true }));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_, callback) => {
    state.authChanged = callback;
    return () => {};
  }),
  signOut: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db, col, id) => ({ col, id }),
  serverTimestamp: () => ({ serverTime: true }),
  onSnapshot: vi.fn((_, callback) => {
    state.profileChanged = callback;
    return () => {};
  }),
  runTransaction: vi.fn(async (_db, callback) =>
    callback({
      get: async () => ({ exists: () => state.existing }),
      set: state.set,
    }),
  ),
}));
import { SessionProvider, useSession } from "./session";
function Probe() {
  const s = useSession();
  return (
    <>
      <span data-testid="loading">{String(s.loading)}</span>
      <span data-testid="role">{s.admin ? "admin" : "student"}</span>
      <button
        onClick={() =>
          s.createProfile(
            { uid: "student-id", email: "student@example.com" },
            "Student",
          )
        }
      >
        Create profile
      </button>
    </>
  );
}
beforeEach(() => {
  state.existing = false;
  state.set.mockClear();
  state.authChanged = null;
  state.profileChanged = null;
});
afterEach(cleanup);
describe("session and profile integrity", () => {
  it("keeps role-dependent screens loading until token and profile are resolved", async () => {
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    await act(async () => state.authChanged(null));
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    await act(async () =>
      state.authChanged({
        uid: "operator",
        getIdTokenResult: async () => ({ claims: { admin: true } }),
      }),
    );
    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    expect(screen.getByTestId("role")).toHaveTextContent("admin");
    await act(async () => state.profileChanged({ exists: () => false }));
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });
  it("creates the first profile with its owner identity", async () => {
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create profile" }));
    await waitFor(() => expect(state.set).toHaveBeenCalledOnce());
    expect(state.set.mock.calls[0][0]).toEqual({
      col: "users",
      id: "student-id",
    });
    expect(state.set.mock.calls[0][1]).toMatchObject({
      name: "Student",
      email: "student@example.com",
      skills: [],
      resumePath: "",
    });
  });
  it("preserves an existing profile when sign-in setup runs again", async () => {
    state.existing = true;
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create profile" }));
    await act(async () => {});
    expect(state.set).not.toHaveBeenCalled();
  });
});
