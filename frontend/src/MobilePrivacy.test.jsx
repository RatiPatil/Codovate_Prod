import { vi, it, expect, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
const fake = vi.hoisted(() => ({
  next: null,
  error: null,
  set: vi.fn(),
  update: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...p) => p.join("/"),
  serverTimestamp: () => "SERVER",
  onSnapshot: (_ref, _opts, next, error) => {
    fake.next = next;
    fake.error = error;
    next({ exists: () => false, metadata: { fromCache: false } });
    return () => {};
  },
  runTransaction: (_db, fn) =>
    fn({
      get: async () => ({ exists: () => true }),
      set: fake.set,
      update: fake.update,
    }),
}));
import { MobilePrivacy, PeerMobile } from "./MobilePrivacy";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  fake.next = null;
  fake.error = null;
});
it("defaults to Only me and lets the owner save a connection-only number", async () => {
  render(
    <MobilePrivacy
      user={{ uid: "alice" }}
      profile={{ mobile: "+919999999999" }}
    />,
  );
  expect(screen.getByLabelText("Who can see your mobile number?")).toHaveValue(
    "only_me",
  );
  expect(screen.getByLabelText("Your mobile number (+91)")).toHaveValue(
    "9999999999",
  );
  fireEvent.change(screen.getByLabelText("Who can see your mobile number?"), {
    target: { value: "connections" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save mobile privacy" }));
  await waitFor(() =>
    expect(fake.set).toHaveBeenCalledWith("mobileSharing/alice", {
      uid: "alice",
      mobile: "+919999999999",
      visibility: "connections",
      updatedAt: "SERVER",
    }),
  );
});
it("reveals no number until requested and clears it on permission revocation", async () => {
  render(<PeerMobile uid="bob" />);
  expect(fake.next).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "View mobile number" }));
  const { act } = await import("@testing-library/react");
  act(() =>
    fake.next({
      exists: () => true,
      data: () => ({ mobile: "+919999999999" }),
      metadata: { fromCache: false },
    }),
  );
  expect(screen.getByRole("link")).toHaveAttribute("href", "tel:+919999999999");
  act(() => fake.error({ code: "permission-denied" }));
  expect(screen.queryByRole("link")).toBeNull();
  expect(
    screen.getByText("Mobile number is private or unavailable."),
  ).toBeInTheDocument();
});
