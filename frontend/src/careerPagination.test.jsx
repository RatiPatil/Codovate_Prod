import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act, cleanup } from "@testing-library/react";
const fake = vi.hoisted(() => ({
  read: vi.fn(),
  query: vi.fn((...args) => args),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: (_, name) => name,
  query: fake.query,
  where: (...args) => ["where", ...args],
  orderBy: (...args) => ["order", ...args],
  limit: (n) => ["limit", n],
  startAfter: (doc) => ["after", doc],
  getDocs: fake.read,
  addDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));
import { useCareerPage } from "./careerData";
const row = (n) => ({ id: "r" + n, data: () => ({ title: "Row " + n }) });
beforeEach(() => {
  fake.read.mockReset();
  fake.query.mockClear();
});
afterEach(cleanup);
describe("Firestore cursor pages", () => {
  it("uses a lookahead and resumes after the last displayed snapshot, then resets on refresh", async () => {
    const docs = Array.from({ length: 25 }, (_, i) => row(i));
    fake.read
      .mockResolvedValueOnce({ docs, size: 25 })
      .mockResolvedValueOnce({ docs: [row(24)], size: 1 })
      .mockResolvedValueOnce({ docs: [row(0)], size: 1 });
    const { result } = renderHook(() =>
      useCareerPage("resources", null, false),
    );
    await waitFor(() => expect(result.current.items).toHaveLength(24));
    expect(result.current.more).toBe(true);
    expect(fake.query.mock.calls[0]).toContainEqual([
      "where",
      "status",
      "==",
      "published",
    ]);
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(25));
    expect(fake.query.mock.calls[1]).toContainEqual(["after", docs[23]]);
    expect(result.current.more).toBe(false);
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(
      fake.query.mock.calls[2].some(
        (x) => Array.isArray(x) && x[0] === "after",
      ),
    ).toBe(false);
  });
  it("uses owner filtering and ignores a stale response after the owner changes", async () => {
    let resolveFirst;
    fake.read
      .mockReturnValueOnce(
        new Promise((r) => {
          resolveFirst = r;
        }),
      )
      .mockResolvedValueOnce({ docs: [row(8)], size: 1 });
    const { result, rerender } = renderHook(
      ({ uid }) => useCareerPage("careerTasks", uid),
      { initialProps: { uid: "alice" } },
    );
    rerender({ uid: "bob" });
    await waitFor(() => expect(result.current.items[0]?.id).toBe("r8"));
    await act(async () => resolveFirst({ docs: [row(1)], size: 1 }));
    expect(result.current.items[0].id).toBe("r8");
    expect(fake.query.mock.calls[1]).toContainEqual([
      "where",
      "studentId",
      "==",
      "bob",
    ]);
  });
});
