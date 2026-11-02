import { it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
const fake = vi.hoisted(() => ({
  callback: null,
  error: null,
  stop: vi.fn(),
  session: { admin: true, user: { uid: "operator" } },
}));
vi.mock("./session", () => ({ useSession: () => fake.session }));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((_, options, callback, error) => {
    fake.callback = callback;
    fake.error = error;
    return fake.stop;
  }),
}));
import { AdminUserDirectory } from "./AdminUserDirectory";
const emit = (rows) =>
  act(() =>
    fake.callback({
      docs: rows.map((r) => ({ id: r.uid, data: () => r })),
      metadata: { fromCache: false },
    }),
  );
beforeEach(() => {
  fake.session = { admin: true, user: { uid: "operator" } };
  fake.stop.mockClear();
  fake.callback = null;
});
afterEach(cleanup);
it("updates names and exact synced count from live snapshots and searches", () => {
  render(<AdminUserDirectory selectUser={() => {}} />);
  emit([
    { uid: "u1", fullName: "Alice Patil" },
    { uid: "u2", fullName: "Rohan Jadhav" },
  ]);
  expect(screen.getByText("2")).toBeTruthy();
  expect(screen.getByText("Alice Patil")).toBeTruthy();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "jadhav" },
  });
  expect(screen.queryByText("Alice Patil")).toBeNull();
  expect(screen.getByText("Rohan Jadhav")).toBeTruthy();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
  emit([{ uid: "u1", fullName: "Alice Updated" }]);
  expect(screen.getByText("Alice Updated")).toBeTruthy();
  expect(screen.queryByText("Rohan Jadhav")).toBeNull();
});
it("selects an exact UID for access tools", () => {
  const select = vi.fn();
  render(<AdminUserDirectory selectUser={select} />);
  emit([{ uid: "u1", fullName: "Alice" }]);
  fireEvent.click(screen.getByRole("link", { name: "Select account" }));
  expect(select).toHaveBeenCalledWith("u1");
});
it("clears names when listener access fails", () => {
  render(<AdminUserDirectory selectUser={() => {}} />);
  emit([{ uid: "u1", fullName: "Alice" }]);
  act(() => fake.error());
  expect(screen.queryByText("Alice")).toBeNull();
  expect(screen.getByRole("alert")).toBeTruthy();
});
it("disconnects the listener and clears rows when admin access is lost", () => {
  const r = render(<AdminUserDirectory selectUser={() => {}} />);
  emit([{ uid: "u1", fullName: "Alice" }]);
  fake.session = { admin: false, user: { uid: "other" } };
  r.rerender(<AdminUserDirectory selectUser={() => {}} />);
  expect(screen.queryByText("Alice")).toBeNull();
  expect(fake.stop).toHaveBeenCalled();
});
