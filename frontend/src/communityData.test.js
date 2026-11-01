import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  get: vi.fn(),
  txSet: vi.fn(),
  txUpdate: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: (_, name) => name,
  doc: (...args) =>
    args.length === 1 ? args[0] + "/new" : args.slice(-2).join("/"),
  setDoc: mock.set,
  updateDoc: mock.update,
  deleteDoc: mock.remove,
  serverTimestamp: () => "SERVER_TIME",
  runTransaction: async (_, action) =>
    action({ get: mock.get, set: mock.txSet, update: mock.txUpdate }),
}));
import {
  communityInput,
  httpsLink,
  saveCommunity,
  requestTeam,
  reviewRequest,
} from "./communityData";
const draft = {
  title: " Campus app ",
  summary: " A project summary ",
  category: "Web & apps",
  skills: "React, Figma, React",
  visibility: "private",
  repoUrl: "",
  demoUrl: "",
};
const snap = (data) => ({ exists: () => !!data, data: () => data });
beforeEach(() => Object.values(mock).forEach((v) => v.mockReset()));
describe("community document validation and transactions", () => {
  it("normalizes content and deduplicates skills", () =>
    expect(communityInput(draft, "projects")).toEqual({
      title: "Campus app",
      summary: "A project summary",
      category: "Web & apps",
      skills: ["React", "Figma"],
      visibility: "private",
      repoUrl: "",
      demoUrl: "",
    }));
  it("rejects empty content, oversized skills and unsupported settings", () => {
    for (const patch of [
      { title: " " },
      { summary: "x".repeat(2001) },
      { skills: "x".repeat(61) },
      { visibility: "all" },
      { category: "Unknown" },
    ])
      expect(() =>
        communityInput({ ...draft, ...patch }, "projects"),
      ).toThrow();
    expect(() =>
      communityInput({ ...draft, status: "open", lookingFor: "" }, "teams"),
    ).toThrow();
  });
  it("blocks non HTTPS and credential-bearing project links", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://example.com",
      "https://name:password@example.com",
      "data:text/html,x",
    ])
      expect(() => httpsLink(url)).toThrow();
    expect(httpsLink(" https://example.com/project ")).toBe(
      "https://example.com/project",
    );
    expect(httpsLink("")).toBe("");
  });
  it("new projects use the authenticated ID, visible moderation and preserved profile name", async () => {
    await saveCommunity(
      "projects",
      { uid: "alice" },
      { name: " Alice " },
      draft,
    );
    expect(mock.set).toHaveBeenCalledWith(
      "projects/new",
      expect.objectContaining({
        studentId: "alice",
        studentName: " Alice ",
        moderation: "visible",
        visibility: "private",
        createdAt: "SERVER_TIME",
      }),
    );
  });
  it("editing never changes student identity or moderation fields", async () => {
    await saveCommunity(
      "projects",
      { uid: "alice" },
      { name: "Alice" },
      draft,
      { id: "p1" },
    );
    expect(mock.update).toHaveBeenCalledWith(
      "projects/p1",
      expect.objectContaining({ title: "Campus app" }),
    );
    const value = mock.update.mock.calls[0][1];
    expect(value).not.toHaveProperty("studentId");
    expect(value).not.toHaveProperty("moderation");
    expect(value).not.toHaveProperty("createdAt");
  });
  it("duplicate requests do not overwrite an earlier introduction", async () => {
    mock.get.mockImplementation((ref) =>
      Promise.resolve(
        snap(
          ref.startsWith("teamRequests")
            ? { status: "pending" }
            : { status: "open", studentId: "owner", title: "Build" },
        ),
      ),
    );
    await expect(
      requestTeam({ uid: "alice" }, { name: "Alice" }, "t1", "I can help."),
    ).rejects.toThrow("already requested");
    expect(mock.txSet).not.toHaveBeenCalled();
  });
  it("request transaction reads the latest team status and snapshots the owner", async () => {
    mock.get.mockImplementation((ref) =>
      Promise.resolve(
        snap(
          ref.startsWith("teamRequests")
            ? null
            : { status: "open", studentId: "owner", title: "Build" },
        ),
      ),
    );
    await requestTeam(
      { uid: "alice" },
      { name: "Alice" },
      "t1",
      " I can help. ",
    );
    expect(mock.txSet).toHaveBeenCalledWith(
      "teamRequests/alice_t1",
      expect.objectContaining({
        studentId: "alice",
        ownerId: "owner",
        teamTitle: "Build",
        note: "I can help.",
        status: "pending",
      }),
    );
  });
  it("closed teams cannot receive a new request", async () => {
    mock.get.mockImplementation((ref) =>
      Promise.resolve(
        snap(
          ref.startsWith("teamRequests")
            ? null
            : { status: "closed", studentId: "owner", title: "Build" },
        ),
      ),
    );
    await expect(
      requestTeam({ uid: "alice" }, { name: "Alice" }, "t1", "I can help."),
    ).rejects.toThrow("no longer recruiting");
    expect(mock.txSet).not.toHaveBeenCalled();
  });
  it("a stale reviewer cannot overwrite another decision", async () => {
    mock.get.mockResolvedValue(snap({ status: "accepted" }));
    await expect(reviewRequest("alice_t1", "declined")).rejects.toThrow(
      "already changed",
    );
    expect(mock.txUpdate).not.toHaveBeenCalled();
  });
  it("accepted requests can be withdrawn but withdrawn requests cannot be reopened", async () => {
    mock.get
      .mockResolvedValueOnce(snap({ status: "accepted" }))
      .mockResolvedValueOnce(snap({ status: "withdrawn" }));
    await reviewRequest("alice_t1", "withdrawn");
    expect(mock.txUpdate).toHaveBeenCalledWith("teamRequests/alice_t1", {
      status: "withdrawn",
      updatedAt: "SERVER_TIME",
    });
    await expect(reviewRequest("alice_t1", "accepted")).rejects.toThrow(
      "already changed",
    );
  });
});
