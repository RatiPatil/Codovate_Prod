import { it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
const fake = vi.hoisted(() => ({ listeners: [] }));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: (_db, path) => path,
  query: (...parts) => parts,
  where: (...x) => ({ where: x }),
  orderBy: (...x) => ({ order: x }),
  limit: (n) => ({ limit: n }),
  startAfter: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: (q, _options, next, fail) => {
    const stop = vi.fn();
    fake.listeners.push({ q, next, fail, stop });
    return stop;
  },
  addDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));
import { useCareerPage } from "./careerData";
afterEach(() => {
  cleanup();
  fake.listeners = [];
  vi.useRealTimers();
});
const snapshot = (ids, cached = false) => ({
  docs: ids.map((id) => ({ id, data: () => ({ title: id, status: "open" }) })),
  size: ids.length,
  metadata: { fromCache: cached },
});
it("shows live team additions and removals", () => {
  const { result } = renderHook(() =>
    useCareerPage("teams", "alice", false, "open"),
  );
  act(() => fake.listeners[0].next(snapshot(["First team"])));
  expect(result.current.items[0].title).toBe("First team");
  act(() => fake.listeners[0].next(snapshot([])));
  expect(result.current.items).toHaveLength(0);
  expect(result.current.loading).toBe(false);
});
it("keeps the full loaded team prefix live when loading more", () => {
  const { result, unmount } = renderHook(() =>
    useCareerPage("teams", "alice", false, "open"),
  );
  act(() =>
    fake.listeners[0].next(
      snapshot(Array.from({ length: 25 }, (_, i) => "team-" + i)),
    ),
  );
  expect(result.current.more).toBe(true);
  act(() => result.current.loadMore());
  expect(fake.listeners[0].stop).toHaveBeenCalled();
  expect(fake.listeners[1].q).toContainEqual({ limit: 49 });
  act(() => fake.listeners[0].next(snapshot(["stale"])));
  act(() => fake.listeners[1].next(snapshot(["new team"])));
  expect(result.current.items.map((t) => t.title)).toEqual(["new team"]);
  unmount();
  expect(fake.listeners[1].stop).toHaveBeenCalled();
});
it("does not claim there are no teams from an empty cache and stops waiting", () => {
  vi.useFakeTimers();
  const { result } = renderHook(() =>
    useCareerPage("teams", "alice", false, "open"),
  );
  act(() => fake.listeners[0].next(snapshot([], true)));
  expect(result.current.loading).toBe(true);
  act(() => vi.advanceTimersByTime(12001));
  expect(result.current.loading).toBe(false);
  expect(result.current.error.code).toBe("app/data-timeout");
  act(() => fake.listeners[0].next(snapshot(["Recovered team"])));
  expect(result.current.error).toBeNull();
  expect(result.current.items).toHaveLength(1);
});
