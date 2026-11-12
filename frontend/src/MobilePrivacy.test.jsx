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
import {
  MobilePrivacyFields,
  mobileFormValues,
  PeerMobile,
} from "./MobilePrivacy";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  fake.next = null;
  fake.error = null;
});
it("embeds mobile and audience in the parent profile form without a separate form", () => {
  const view = render(
    <form aria-label="Profile">
      <MobilePrivacyFields
        user={{ uid: "alice" }}
        profile={{ mobile: "+919999999999" }}
      />
    </form>,
  );
  expect(view.container.querySelectorAll("form")).toHaveLength(1);
  expect(screen.getByLabelText("Who can see your mobile number?")).toHaveValue(
    "only_me",
  );
  fireEvent.change(screen.getByLabelText("Who can see your mobile number?"), {
    target: { value: "connections" },
  });
  const data = new FormData(screen.getByRole("form", { name: "Profile" }));
  expect(
    mobileFormValues(data.get("mobile"), data.get("mobileVisibility")),
  ).toEqual({ mobile: "+919999999999", visibility: "connections" });
  expect(
    screen.queryByRole("button", { name: "Save mobile privacy" }),
  ).toBeNull();
});
it("rejects incomplete mobile numbers and unloaded privacy choices", () => {
  expect(() => mobileFormValues("999", "only_me")).toThrow("10-digit");
  expect(() => mobileFormValues("9999999999", null)).toThrow("load");
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
