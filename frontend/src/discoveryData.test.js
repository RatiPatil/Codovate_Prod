import { it, expect, vi, beforeEach } from "vitest";
const fake = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {}, auth: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...p) => p.join("/"),
  serverTimestamp: () => "SERVER",
  runTransaction: async (_db, fn) =>
    fn({ get: fake.get, set: fake.set, update: fake.update }),
  collection: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));
import {
  emptyDetails,
  discoveryDetails,
  discoverPeers,
  matchReasons,
  saveDiscovery,
  dismissPeer,
} from "./discoveryData";
beforeEach(() => {
  vi.clearAllMocks();
});
it("optional details discard private fields and validate explicit inputs", () => {
  const details = discoveryDetails({
    ...emptyDetails,
    email: "private@example.com",
    mobile: "9999999999",
    desiredRole: " Frontend Developer ",
    achievements: "Student project,Student project",
  });
  expect(details.desiredRole).toBe("Frontend Developer");
  expect(details.achievements).toEqual(["Student project"]);
  expect(details).not.toHaveProperty("email");
  expect(details).not.toHaveProperty("mobile");
  expect(() =>
    discoveryDetails({
      ...emptyDetails,
      photoUrl: "https://example.com/image",
    }),
  ).toThrow();
  expect(() =>
    discoveryDetails({ ...emptyDetails, experience: "Expert guess" }),
  ).toThrow();
});
it("combines filters, persistent dismissals and blocked connections", () => {
  const items = [
    { uid: "alice", name: "Alice", skills: ["React"] },
    {
      uid: "bob",
      name: "Bob",
      skills: ["React"],
      details: { domain: "Web Development", experience: "Beginner" },
    },
    {
      uid: "carol",
      name: "Carol",
      skills: ["Python"],
      details: { domain: "AI/ML", experience: "Advanced" },
    },
  ];
  expect(
    discoverPeers(items, {
      uid: "alice",
      skill: "react",
      domain: "Web Development",
      experience: "Beginner",
    }).map((p) => p.uid),
  ).toEqual(["bob"]);
  expect(
    discoverPeers(items, {
      uid: "alice",
      dismissed: ["bob"],
      blocked: ["carol"],
    }),
  ).toEqual([]);
});
it("suggestions explain matches without inventing percentages or interests", () => {
  const mine = {
      skills: ["React"],
      details: {
        domain: "Web Development",
        passions: ["Open Source"],
        college: "Example College",
      },
    },
    p = {
      uid: "bob",
      name: "Bob",
      skills: ["React"],
      details: {
        domain: "Web Development",
        passions: ["Open Source"],
        college: "example college",
      },
    };
  expect(matchReasons(mine, p)).toEqual([
    "1 shared skill",
    "Same domain",
    "Similar interests",
    "Same college",
  ]);
  expect(
    discoverPeers([p], { uid: "alice", suggested: true, mine }).length,
  ).toBe(1);
  expect(
    discoverPeers([p], { uid: "alice", suggested: true, mine: {} }),
  ).toEqual([]);
});
it("withdrawing extra-field consent preserves private preferences and strips public extras", async () => {
  fake.get.mockResolvedValue({ exists: () => true });
  await saveDiscovery(
    { uid: "alice" },
    { name: "Alice", skills: ["React"], email: "private@example.com" },
    { ...emptyDetails, college: "Private College" },
    false,
  );
  expect(fake.set.mock.calls[0][1].details.college).toBe("Private College");
  expect(fake.set.mock.calls[1][1]).not.toHaveProperty("details");
  expect(fake.set.mock.calls[1][1]).not.toHaveProperty("email");
});
it("restoring a dismissed profile updates state without replacing its original timestamp", async () => {
  fake.get.mockResolvedValue({ exists: () => true });
  await dismissPeer("alice", "bob", false);
  expect(fake.update).toHaveBeenCalledWith(
    "discoveryDismissals/alice/members/bob",
    { dismissed: false, updatedAt: "SERVER" },
  );
  expect(fake.set).not.toHaveBeenCalled();
});
