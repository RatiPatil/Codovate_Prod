import { it, expect, vi, beforeEach } from "vitest";
const fake = vi.hoisted(() => ({
  sequence: 0,
  set: vi.fn(),
  update: vi.fn(),
  commit: vi.fn(),
  get: vi.fn(),
}));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: (_db, ...p) => ({ path: p.join("/") }),
  doc: (ref, ...p) =>
    p.length
      ? { path: p.join("/"), id: p.at(-1) }
      : { path: ref.path + "/id" + ++fake.sequence, id: "id" + fake.sequence },
  serverTimestamp: () => "SERVER",
  writeBatch: () => ({ set: fake.set, commit: fake.commit }),
  runTransaction: async (_db, fn) =>
    fn({ get: fake.get, set: fake.set, update: fake.update }),
}));
import {
  createProjectTeam,
  reviseProjectTeam,
  changeProjectTeam,
  reviewProjectEntry,
} from "./projectTeamsData";
const team = {
  ownerId: "alice",
  title: "Studio",
  description: "A real student project",
  requiredSkills: ["React"],
  capacity: 2,
  recruitment: "recruiting",
  lifecycle: "active",
  members: ["alice", "bob"],
  roles: { alice: "leader", bob: "member" },
  version: 4,
  historyId: "earlier",
  createdAt: "ORIGINAL",
  updatedAt: "OLD",
};
beforeEach(() => {
  vi.clearAllMocks();
  fake.sequence = 0;
});
it("creates one canonical team, one history snapshot, one listing and its chat atomically", async () => {
  const id = await createProjectTeam("alice", {
    ...team,
    requiredSkills: "React",
  });
  expect(fake.set).toHaveBeenCalledTimes(4);
  expect(fake.commit).toHaveBeenCalledTimes(1);
  const root = fake.set.mock.calls.find(
      ([ref]) => ref.path === "projectTeams/" + id,
    )[1],
    history = fake.set.mock.calls.find(([ref]) =>
      ref.path.includes("/history/"),
    );
  expect(root.members).toEqual(["alice"]);
  expect(root.roles).toEqual({ alice: "leader" });
  expect(root.historyId).toBe(history[0].id);
  expect(history[1].snapshot.version).toBe(1);
  expect(
    fake.set.mock.calls.find(([ref]) => ref.path === "conversations/" + id)[1],
  ).toEqual({ kind: "team", teamId: id, createdAt: "SERVER" });
});
it("metadata edits preserve creation time and append the next revision", async () => {
  fake.get.mockResolvedValue({ exists: () => true, data: () => team });
  await reviseProjectTeam("studio", "alice", {
    ...team,
    title: "New studio",
    capacity: 3,
  });
  const root = fake.set.mock.calls[0][1],
    snapshot = fake.set.mock.calls[1][1];
  expect(root.version).toBe(5);
  expect(root.createdAt).toBe("ORIGINAL");
  expect(snapshot.snapshot.title).toBe("New studio");
  expect(snapshot.snapshot.members).toEqual(["alice", "bob"]);
  expect(fake.set.mock.calls[2][1]).not.toHaveProperty("roles");
});
it("member removal removes their role and retains an auditable new snapshot", async () => {
  fake.get.mockResolvedValue({ exists: () => true, data: () => team });
  await changeProjectTeam("studio", "alice", "remove", "bob");
  expect(fake.set.mock.calls[0][1].members).toEqual(["alice"]);
  expect(fake.set.mock.calls[1][1].snapshot.roles).toEqual({ alice: "leader" });
  expect(fake.set.mock.calls[1][1].snapshot.version).toBe(5);
});
it("closed recruitment blocks stale invitation acceptance before any writes", async () => {
  fake.get
    .mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ status: "pending" }),
    })
    .mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ...team, members: ["alice"], recruitment: "closed" }),
    });
  await expect(
    reviewProjectEntry(
      "projectTeamInvites",
      { id: "invite", teamId: "studio", studentId: "bob" },
      "bob",
      "accepted",
    ),
  ).rejects.toThrow(/closed or full/);
  expect(fake.set).not.toHaveBeenCalled();
  expect(fake.update).not.toHaveBeenCalled();
});
