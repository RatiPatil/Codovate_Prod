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
  it("filters mentoring bookings by owner and announcements by publication", async () => {
    fake.read.mockResolvedValue({ docs: [], size: 0 });
    const { result, unmount } = renderHook(() =>
      useCareerPage("mentorBookings", "alice", false, "mine"),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fake.query.mock.calls.at(-1)).toContainEqual([
      "where",
      "studentId",
      "==",
      "alice",
    ]);
    unmount();
    const news = renderHook(() => useCareerPage("announcements", null, false));
    await waitFor(() => expect(news.result.current.loading).toBe(false));
    expect(fake.query.mock.calls.at(-1)).toContainEqual([
      "where",
      "status",
      "==",
      "published",
    ]);
  });

  it("clears private rows immediately when the account changes", async () => {
    let finish;
    fake.read
      .mockResolvedValueOnce({ docs: [row(1)], size: 1 })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
    const { result, rerender } = renderHook(
      ({ uid }) => useCareerPage("projects", uid, false, "mine"),
      { initialProps: { uid: "alice" } },
    );
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    rerender({ uid: "bob" });
    expect(result.current.items).toEqual([]);
    await act(async () => finish({ docs: [], size: 0 }));
  });

  it("showcase query excludes private and hidden projects", async () => {
    fake.read.mockResolvedValue({ docs: [], size: 0 });
    const { result } = renderHook(() =>
      useCareerPage("projects", null, false, "public"),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fake.query.mock.calls[0]).toContainEqual([
      "where",
      "visibility",
      "==",
      "public",
    ]);
    expect(fake.query.mock.calls[0]).toContainEqual([
      "where",
      "moderation",
      "==",
      "visible",
    ]);
  });
  it("owner inbox constrains both team and owner", async () => {
    fake.read.mockResolvedValue({ docs: [], size: 0 });
    const { result } = renderHook(() =>
      useCareerPage("teamRequests", "alice", false, "incoming", "team-a"),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fake.query.mock.calls[0]).toContainEqual([
      "where",
      "teamId",
      "==",
      "team-a",
    ]);
    expect(fake.query.mock.calls[0]).toContainEqual([
      "where",
      "ownerId",
      "==",
      "alice",
    ]);
  });

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
