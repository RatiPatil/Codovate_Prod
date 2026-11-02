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
  profileFailed: null,
  existing: false,
  stats: false,
  update: vi.fn(),
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
  onSnapshot: vi.fn((_, options, callback, failure) => {
    state.profileChanged = callback;
    state.profileFailed = failure;
    return () => {};
  }),
  runTransaction: vi.fn(async (_db, callback) =>
    callback({
      get: async (ref) => ({ exists: () => ref.col === "publicStats" ? state.stats : state.existing, data: () => ({ registeredStudents: 1479 }) }),
      update: state.update,
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
      <span data-testid="error">{s.sessionError?.code || ""}</span>
      <button onClick={s.retrySession}>Retry session</button>
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
  state.stats = false;
  state.update.mockClear();
  state.set.mockClear();
  state.authChanged = null;
  state.profileChanged = null;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
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
    await waitFor(() => expect(state.set).toHaveBeenCalledTimes(2));
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
  it("increments an initialized aggregate only with the first profile", async () => {
    state.stats = true;
    render(<SessionProvider><Probe /></SessionProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Create profile" }));
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
    expect(state.update.mock.calls[0][1].registeredStudents).toBe(1480);
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

describe("failed account connection recovery", () => {
  it("does not trust a missing cached profile as a successful server read", async () => {
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    await act(async () =>
      state.authChanged({
        uid: "student",
        getIdTokenResult: async () => ({ claims: {} }),
      }),
    );
    await act(async () =>
      state.profileChanged({
        metadata: { fromCache: true },
        exists: () => false,
      }),
    );
    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    await act(async () =>
      state.profileChanged({
        metadata: { fromCache: false },
        exists: () => false,
      }),
    );
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });
  it("surfaces denied profile reads and retries with a fresh subscription", async () => {
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    const user = {
      uid: "student",
      getIdTokenResult: async () => ({ claims: {} }),
    };
    await act(async () => state.authChanged(user));
    const oldFailure = state.profileFailed;
    await act(async () => state.profileFailed({ code: "permission-denied" }));
    expect(screen.getByTestId("error")).toHaveTextContent("permission-denied");
    fireEvent.click(screen.getByRole("button", { name: "Retry session" }));
    await act(async () => state.authChanged(user));
    await act(async () =>
      state.profileChanged({
        exists: () => true,
        data: () => ({ name: "Student" }),
      }),
    );
    await act(async () => oldFailure({ code: "permission-denied" }));
    expect(screen.getByTestId("error")).toBeEmptyDOMElement();
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });
  it("stops waiting when a profile listener never answers", async () => {
    vi.useFakeTimers();
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    await act(async () =>
      state.authChanged({
        uid: "student",
        getIdTokenResult: async () => ({ claims: {} }),
      }),
    );
    await act(async () => vi.advanceTimersByTime(12001));
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent(
      "app/profile-timeout",
    );
  });
  it("stops waiting when auth initialization never answers", async () => {
    vi.useFakeTimers();
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    await act(async () => vi.advanceTimersByTime(12001));
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("app/auth-timeout");
  });
});
