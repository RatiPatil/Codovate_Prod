import { it, expect, vi, beforeEach } from "vitest";
const fake = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));
vi.mock("./firebase", () => ({
  db: {},
  auth: { currentUser: { uid: "alice" } },
}));
vi.mock("firebase/firestore", () => ({
  collection: (_db, ...path) => path.join("/"),
  doc: (_db, ...path) => path.join("/"),
  serverTimestamp: () => "SERVER",
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  runTransaction: async (_db, fn) =>
    fn({ get: fake.get, set: fake.set, update: fake.update }),
}));
import {
  validatedPublicProfile,
  connectMember,
  sendTeamMessage,
  answerInvite,
} from "./teamHubData";
beforeEach(() => {
  vi.clearAllMocks();
});
it("publishes only explicit name and confirmed skills", () => {
  const result = validatedPublicProfile(
    { uid: "alice" },
    {
      name: "Alice",
      skills: ["React"],
      suggestedSkills: ["AI"],
      email: "private@example.com",
      mobile: "9999999999",
      bio: "private",
    },
  );
  expect(Object.keys(result).sort()).toEqual([
    "name",
    "skills",
    "uid",
    "updatedAt",
  ]);
  expect(result.skills).toEqual(["React"]);
});
it("rejects duplicate connections and self connections", async () => {
  await expect(connectMember("alice", "alice")).rejects.toThrow();
  fake.get.mockResolvedValue({ exists: () => true });
  await expect(connectMember("alice", "bob")).rejects.toThrow(/already exists/);
  expect(fake.set).not.toHaveBeenCalled();
});
it("message retries reuse the existing record", async () => {
  fake.get.mockResolvedValue({ exists: () => true });
  await sendTeamMessage("room", "same-id", "alice", "Alice", "Hello");
  expect(fake.set).not.toHaveBeenCalled();
});
it("creates one validated message without private profile fields", async () => {
  fake.get.mockResolvedValue({ exists: () => false });
  await sendTeamMessage("room", "new-id", "alice", "Alice", " Hello ");
  expect(fake.set).toHaveBeenCalledWith("conversations/room/messages/new-id", {
    senderId: "alice",
    senderName: "Alice",
    text: "Hello",
    createdAt: "SERVER",
  });
  await expect(
    sendTeamMessage("room", "id", "alice", "Alice", " "),
  ).rejects.toThrow();
});
it("rejects full groups before joining", async () => {
  fake.get
    .mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ status: "pending" }),
    })
    .mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ status: "active", members: Array(12).fill("member") }),
    });
  await expect(
    answerInvite(
      { id: "invite", groupId: "group", studentId: "alice" },
      "accepted",
    ),
  ).rejects.toThrow(/12-member/);
  expect(fake.update).not.toHaveBeenCalled();
});
it("can decline a pending invitation without needing an active group", async () => {
  fake.get.mockResolvedValue({
    exists: () => true,
    data: () => ({ status: "pending" }),
  });
  await answerInvite(
    { id: "invite", groupId: "archived-group", studentId: "alice" },
    "declined",
  );
  expect(fake.get).toHaveBeenCalledTimes(1);
  expect(fake.update).toHaveBeenCalledWith("groupInvites/invite", {
    status: "declined",
    updatedAt: "SERVER",
  });
});
